# Ziwa CRM

Agriculture CRM for managing lands, plots, owners, geofencing, documents, stages and per-stage financials in EGP.

Stack: **Next.js 15 (App Router) · TypeScript · ShadCN UI · PostgreSQL · Drizzle ORM**

## Features

- Authenticated app with JWT cookie session
- **Lands** — buy in acres, track location, purchase date and price (EGP)
- **People** — owners, buyers, contacts
- **Plots** — carved out of lands, owned by people, with cost / selling / profit %
- **Geofencing** — click on Google Maps to draw a polygon for each plot, or enter lat/lng manually
- **Documents** per plot
- **Stages** per plot (planned / in progress / completed / on hold)
- **Financial entries** per stage (income / expense, with category & date)
- **Analytics** — dashboard overview + per-plot analytics (cashflow by month, expenses by category, per-stage finance, projected profit)

## Quick start

1. Install deps:
   ```bash
   npm install
   ```
2. Copy env and fill in:
   ```bash
   cp .env.example .env
   ```
   Required:
   - `DATABASE_URL` — Postgres connection string
   - `JWT_SECRET` — long random string
   - `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` — for the interactive geofencing map (optional; manual lat/lng entry works without it)

3. Create the schema (either via drizzle-kit or the provided SQL):
   ```bash
   # option A: using drizzle-kit
   npm run db:push

   # option B: plain SQL
   psql "$DATABASE_URL" -f src/db/bootstrap.sql
   ```

4. (Optional) seed admin user — the app will also auto-seed on first login if no users exist:
   ```bash
   npm run db:seed
   ```

5. Run the dev server:
   ```bash
   npm run dev
   ```

6. Sign in at http://localhost:3000/login with:
   - Email: `shady@ziwaland.com`
   - Password: `PasswordDefault@Ziwa`

## Project structure

```
src/
  app/
    (app)/                 authenticated app (dashboard, lands, plots, people)
    api/                   Node.js backend endpoints
    login/                 sign-in page
  components/
    ui/                    ShadCN primitives
    geofence-map.tsx       Google Maps polygon editor
    plot-stages.tsx        Stage list + per-stage financial ledger
    plot-analytics.tsx     Recharts analytics
    ...
  db/
    schema.ts              Drizzle schema
    bootstrap.sql          Plain SQL bootstrap
    seed.ts                Admin user seeder
  lib/
    auth.ts                JWT session helpers
    utils.ts               cn(), formatEgp(), etc.
  middleware.ts            route protection
```
