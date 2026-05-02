import { NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  location: z.string().optional().nullable(),
  areaAcres: z.coerce.number().nonnegative().optional(),
  purchasePriceEgp: z.coerce.number().nonnegative().optional(),
  purchaseDate: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const [row] = await db
    .select()
    .from(schema.lands)
    .where(eq(schema.lands.id, Number(id)));
  if (!row) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json(row);
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const d = parsed.data;
  const update: Record<string, unknown> = {};
  if (d.name !== undefined) update.name = d.name;
  if (d.location !== undefined) update.location = d.location;
  if (d.areaAcres !== undefined) update.areaAcres = String(d.areaAcres);
  if (d.purchasePriceEgp !== undefined)
    update.purchasePriceEgp = String(d.purchasePriceEgp);
  if (d.purchaseDate !== undefined) update.purchaseDate = d.purchaseDate;
  if (d.notes !== undefined) update.notes = d.notes;
  const [row] = await db
    .update(schema.lands)
    .set(update)
    .where(eq(schema.lands.id, Number(id)))
    .returning();
  return NextResponse.json(row);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await db.delete(schema.lands).where(eq(schema.lands.id, Number(id)));
  return NextResponse.json({ ok: true });
}
