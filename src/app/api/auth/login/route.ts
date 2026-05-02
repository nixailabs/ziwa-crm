import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { eq, sql } from "drizzle-orm";
import { db, schema } from "@/db";
import { signSession, setSessionCookie } from "@/lib/auth";

const SEED_EMAIL = "shady@ziwaland.com";
const SEED_PASSWORD = "PasswordDefault@Ziwa";

async function ensureSeedUser() {
  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(schema.users);
  if (count === 0) {
    const passwordHash = await bcrypt.hash(SEED_PASSWORD, 10);
    await db.insert(schema.users).values({
      email: SEED_EMAIL,
      passwordHash,
      name: "Shady",
    });
  }
}

export async function POST(req: Request) {
  const { email, password } = (await req.json()) as {
    email?: string;
    password?: string;
  };
  if (!email || !password) {
    return NextResponse.json({ error: "Missing email or password" }, { status: 400 });
  }

  await ensureSeedUser().catch(() => {});

  const [user] = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.email, email.toLowerCase()))
    .limit(1);

  if (!user) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const token = await signSession({
    sub: String(user.id),
    email: user.email,
    name: user.name ?? undefined,
  });
  await setSessionCookie(token);
  return NextResponse.json({ ok: true });
}
