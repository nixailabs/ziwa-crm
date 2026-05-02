import { NextResponse } from "next/server";
import { z } from "zod";
import { sql } from "drizzle-orm";
import { db, schema } from "@/db";

const plotSchema = z.object({
  landId: z.coerce.number().int().positive(),
  ownerId: z.coerce.number().int().positive().optional().nullable(),
  name: z.string().min(1),
  areaAcres: z.coerce.number().nonnegative(),
  costEgp: z.coerce.number().nonnegative().default(0),
  sellingPriceEgp: z.coerce.number().nonnegative().default(0),
  profitPercentage: z.coerce.number().optional().nullable(),
  status: z
    .enum(["available", "reserved", "sold", "in_development"])
    .default("available"),
  notes: z.string().optional().nullable(),
});

export async function GET() {
  const rows = await db.execute<{
    id: number;
    name: string;
    land_id: number;
    land_name: string;
    owner_id: number | null;
    owner_name: string | null;
    area_acres: string;
    cost_egp: string;
    selling_price_egp: string;
    profit_percentage: string | null;
    status: string;
    created_at: string;
  }>(sql`
    SELECT p.id, p.name, p.land_id, l.name as land_name,
      p.owner_id, pe.name as owner_name,
      p.area_acres, p.cost_egp, p.selling_price_egp, p.profit_percentage,
      p.status, p.created_at
    FROM plots p
    JOIN lands l ON l.id = p.land_id
    LEFT JOIN people pe ON pe.id = p.owner_id
    ORDER BY p.created_at DESC
  `);
  return NextResponse.json(rows.rows);
}

export async function POST(req: Request) {
  const body = await req.json();
  const parsed = plotSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const d = parsed.data;
  let profit = d.profitPercentage;
  if ((profit === null || profit === undefined) && d.costEgp > 0 && d.sellingPriceEgp > 0) {
    profit = ((d.sellingPriceEgp - d.costEgp) / d.costEgp) * 100;
  }
  const [row] = await db
    .insert(schema.plots)
    .values({
      landId: d.landId,
      ownerId: d.ownerId || null,
      name: d.name,
      areaAcres: String(d.areaAcres),
      costEgp: String(d.costEgp),
      sellingPriceEgp: String(d.sellingPriceEgp),
      profitPercentage: profit !== undefined && profit !== null ? String(profit) : null,
      status: d.status,
      notes: d.notes || null,
    })
    .returning();
  return NextResponse.json(row, { status: 201 });
}
