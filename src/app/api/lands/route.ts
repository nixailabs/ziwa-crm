import { NextResponse } from "next/server";
import { z } from "zod";
import { desc, sql } from "drizzle-orm";
import { db, schema } from "@/db";

const landSchema = z.object({
  name: z.string().min(1),
  location: z.string().optional().nullable(),
  areaAcres: z.coerce.number().nonnegative(),
  purchasePriceEgp: z.coerce.number().nonnegative().default(0),
  purchaseDate: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export async function GET() {
  const rows = await db.execute<{
    id: number;
    name: string;
    location: string | null;
    area_acres: string;
    purchase_price_egp: string;
    purchase_date: string | null;
    notes: string | null;
    created_at: string;
    plot_count: number;
    plotted_acres: string | null;
  }>(sql`
    SELECT l.*,
      COUNT(p.id)::int as plot_count,
      COALESCE(SUM(p.area_acres), 0) as plotted_acres
    FROM lands l
    LEFT JOIN plots p ON p.land_id = l.id
    GROUP BY l.id
    ORDER BY l.created_at DESC
  `);
  return NextResponse.json(rows.rows);
}

export async function POST(req: Request) {
  const body = await req.json();
  const parsed = landSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const d = parsed.data;
  const [row] = await db
    .insert(schema.lands)
    .values({
      name: d.name,
      location: d.location || null,
      areaAcres: String(d.areaAcres),
      purchasePriceEgp: String(d.purchasePriceEgp),
      purchaseDate: d.purchaseDate || null,
      notes: d.notes || null,
    })
    .returning();
  return NextResponse.json(row, { status: 201 });
}
