import { NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";

const updateSchema = z.object({
  landId: z.coerce.number().int().positive().optional(),
  ownerId: z.coerce.number().int().positive().optional().nullable(),
  name: z.string().min(1).optional(),
  areaAcres: z.coerce.number().nonnegative().optional(),
  costEgp: z.coerce.number().nonnegative().optional(),
  sellingPriceEgp: z.coerce.number().nonnegative().optional(),
  profitPercentage: z.coerce.number().optional().nullable(),
  status: z.enum(["available", "reserved", "sold", "in_development"]).optional(),
  notes: z.string().optional().nullable(),
});

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const [row] = await db
    .select()
    .from(schema.plots)
    .where(eq(schema.plots.id, Number(id)));
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
  if (d.landId !== undefined) update.landId = d.landId;
  if (d.ownerId !== undefined) update.ownerId = d.ownerId;
  if (d.name !== undefined) update.name = d.name;
  if (d.areaAcres !== undefined) update.areaAcres = String(d.areaAcres);
  if (d.costEgp !== undefined) update.costEgp = String(d.costEgp);
  if (d.sellingPriceEgp !== undefined)
    update.sellingPriceEgp = String(d.sellingPriceEgp);
  if (d.profitPercentage !== undefined)
    update.profitPercentage =
      d.profitPercentage === null ? null : String(d.profitPercentage);
  if (d.status !== undefined) update.status = d.status;
  if (d.notes !== undefined) update.notes = d.notes;

  const [row] = await db
    .update(schema.plots)
    .set(update)
    .where(eq(schema.plots.id, Number(id)))
    .returning();
  return NextResponse.json(row);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await db.delete(schema.plots).where(eq(schema.plots.id, Number(id)));
  return NextResponse.json({ ok: true });
}
