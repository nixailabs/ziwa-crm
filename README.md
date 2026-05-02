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

## Docker / production deploy

The repo ships with a multi-stage `Dockerfile` (Next.js standalone output) and a
`docker-compose.yml` that brings up Postgres + the app + a one-shot seeder.

### Run anywhere with Docker

```bash
cp .env.example .env   # then edit values
docker compose build
docker compose up -d
# seed the admin user (idempotent)
docker compose run --rm seed
# app will be on http://localhost
```

Required env vars (see `docker-compose.yml`):

- `POSTGRES_PASSWORD` — Postgres password used by both the DB and the app.
- `JWT_SECRET` — long random string for session signing.
- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` — optional, enables the interactive
  Google Maps geofencing editor. Manual lat/lng entry works without it.

### One-shot deploy to a fresh Linux server

From your laptop (with `ssh` + `rsync` installed), point at the box and run:

```bash
SERVER_IP=176.58.124.214 SERVER_USER=root ./scripts/deploy.sh
```

The script will:

1. Install Docker + the compose plugin (idempotent).
2. Rsync the project to `/opt/ziwa-crm`.
3. Generate `.env` with random secrets if one doesn't exist yet.
4. `docker compose build && up -d` and run the seeder.
5. Print the URL and the seeded login.

### Adding a long-lived SSH key (for Claude / CI)

Generate a dedicated keypair on your machine, then push the public half:

```bash
ssh-keygen -t ed25519 -f ~/.ssh/ziwa_claude -C "claude@ziwa"
SERVER_IP=176.58.124.214 SERVER_USER=root \
  ./scripts/install-claude-key.sh ~/.ssh/ziwa_claude.pub
```

After that, `ssh -i ~/.ssh/ziwa_claude root@176.58.124.214` works without a
password. Hand the *private* key to whatever automation needs persistent
access — never paste it into chat.

> Security note: rotate the root password and the seeded admin password as
> soon as the deploy succeeds, since both were transmitted in plaintext.

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
