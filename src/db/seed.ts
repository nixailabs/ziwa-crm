import "dotenv/config";
import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import * as schema from "./schema";

async function main() {
  const pool = new Pool({
    connectionString:
      process.env.DATABASE_URL ||
      "postgres://postgres:postgres@localhost:5432/ziwa_crm",
  });
  const db = drizzle(pool, { schema });

  const email = "shady@ziwaland.com";
  const password = "PasswordDefault@Ziwa";

  const existing = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.email, email));

  if (existing.length === 0) {
    const passwordHash = await bcrypt.hash(password, 10);
    await db.insert(schema.users).values({
      email,
      passwordHash,
      name: "Shady",
    });
    console.log(`Seeded admin user ${email}`);
  } else {
    console.log(`User ${email} already exists`);
  }

  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
