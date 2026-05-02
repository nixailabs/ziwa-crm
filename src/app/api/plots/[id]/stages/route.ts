import { NextResponse } from "next/server";
import { z } from "zod";
import { asc, eq } from "drizzle-orm";
import { db, schema } from "@/db";

const stageSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional().nullable(),
  status: z.enum(["planned", "in_progress", "completed", "on_hold"]).default("planned"),
  startDate: z.string().optional().nullable(),
  endDate: z.string().optional().nullable(),
  sortOrder: z.coerce.number().int().default(0),
});

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const rows = await db
    .select()
    .from(schema.plotStages)
    .where(eq(schema.plotStages.plotId, Number(id)))
    .orderBy(asc(schema.plotStages.sortOrder), asc(schema.plotStages.id));
  return NextResponse.json(rows);
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const parsed = stageSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const [row] = await db
    .insert(schema.plotStages)
    .values({
      plotId: Number(id),
      name: parsed.data.name,
      description: parsed.data.description || null,
      status: parsed.data.status,
      startDate: parsed.data.startDate || null,
      endDate: parsed.data.endDate || null,
      sortOrder: parsed.data.sortOrder,
    })
    .returning();
  return NextResponse.json(row, { status: 201 });
}
