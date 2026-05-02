import { NextResponse } from "next/server";
import { z } from "zod";
import { desc, eq } from "drizzle-orm";
import { db, schema } from "@/db";

const finSchema = z.object({
  kind: z.enum(["expense", "income"]),
  category: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  amountEgp: z.coerce.number(),
  transactionDate: z.string().min(1),
});

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const rows = await db
    .select()
    .from(schema.stageFinancials)
    .where(eq(schema.stageFinancials.stageId, Number(id)))
    .orderBy(desc(schema.stageFinancials.transactionDate));
  return NextResponse.json(rows);
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const parsed = finSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const d = parsed.data;
  const [row] = await db
    .insert(schema.stageFinancials)
    .values({
      stageId: Number(id),
      kind: d.kind,
      category: d.category || null,
      description: d.description || null,
      amountEgp: String(d.amountEgp),
      transactionDate: d.transactionDate,
    })
    .returning();
  return NextResponse.json(row, { status: 201 });
}

export async function DELETE(req: Request) {
  const url = new URL(req.url);
  const finId = Number(url.searchParams.get("finId"));
  if (!finId) return NextResponse.json({ error: "missing finId" }, { status: 400 });
  await db
    .delete(schema.stageFinancials)
    .where(eq(schema.stageFinancials.id, finId));
  return NextResponse.json({ ok: true });
}
