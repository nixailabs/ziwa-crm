import { NextResponse } from "next/server";
import { z } from "zod";
import { desc, eq } from "drizzle-orm";
import { db, schema } from "@/db";

const docSchema = z.object({
  name: z.string().min(1),
  fileUrl: z.string().min(1),
  fileType: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const rows = await db
    .select()
    .from(schema.plotDocuments)
    .where(eq(schema.plotDocuments.plotId, Number(id)))
    .orderBy(desc(schema.plotDocuments.uploadedAt));
  return NextResponse.json(rows);
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const parsed = docSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const [row] = await db
    .insert(schema.plotDocuments)
    .values({
      plotId: Number(id),
      name: parsed.data.name,
      fileUrl: parsed.data.fileUrl,
      fileType: parsed.data.fileType || null,
      notes: parsed.data.notes || null,
    })
    .returning();
  return NextResponse.json(row, { status: 201 });
}

export async function DELETE(req: Request) {
  const url = new URL(req.url);
  const docId = Number(url.searchParams.get("docId"));
  if (!docId) return NextResponse.json({ error: "missing docId" }, { status: 400 });
  await db.delete(schema.plotDocuments).where(eq(schema.plotDocuments.id, docId));
  return NextResponse.json({ ok: true });
}
