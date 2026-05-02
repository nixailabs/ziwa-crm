import { NextResponse } from "next/server";
import { z } from "zod";
import { desc } from "drizzle-orm";
import { db, schema } from "@/db";

const personSchema = z.object({
  name: z.string().min(1),
  phone: z.string().optional().nullable(),
  email: z.string().email().optional().nullable().or(z.literal("")),
  nationalId: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export async function GET() {
  const rows = await db
    .select()
    .from(schema.people)
    .orderBy(desc(schema.people.createdAt));
  return NextResponse.json(rows);
}

export async function POST(req: Request) {
  const body = await req.json();
  const parsed = personSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const data = parsed.data;
  const [row] = await db
    .insert(schema.people)
    .values({
      name: data.name,
      phone: data.phone || null,
      email: data.email ? data.email : null,
      nationalId: data.nationalId || null,
      address: data.address || null,
      notes: data.notes || null,
    })
    .returning();
  return NextResponse.json(row, { status: 201 });
}
