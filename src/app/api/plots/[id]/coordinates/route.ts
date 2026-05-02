import { NextResponse } from "next/server";
import { z } from "zod";
import { asc, eq } from "drizzle-orm";
import { db, schema } from "@/db";

const pointSchema = z.object({
  lat: z.coerce.number(),
  lng: z.coerce.number(),
});
const bodySchema = z.object({
  points: z.array(pointSchema),
});

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const rows = await db
    .select()
    .from(schema.plotCoordinates)
    .where(eq(schema.plotCoordinates.plotId, Number(id)))
    .orderBy(asc(schema.plotCoordinates.sortOrder));
  return NextResponse.json(rows);
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const plotId = Number(id);
  await db.delete(schema.plotCoordinates).where(eq(schema.plotCoordinates.plotId, plotId));
  if (parsed.data.points.length > 0) {
    await db.insert(schema.plotCoordinates).values(
      parsed.data.points.map((p, i) => ({
        plotId,
        lat: p.lat,
        lng: p.lng,
        sortOrder: i,
      }))
    );
  }
  return NextResponse.json({ ok: true });
}
