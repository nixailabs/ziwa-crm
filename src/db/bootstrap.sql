-- Ziwa CRM database bootstrap
-- Run with: psql $DATABASE_URL -f src/db/bootstrap.sql

DO $$ BEGIN
  CREATE TYPE stage_status AS ENUM ('planned','in_progress','completed','on_hold');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE plot_status AS ENUM ('available','reserved','sold','in_development');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE financial_kind AS ENUM ('expense','income');
EXCEPTION WHEN duplicate_object THEN null; END $$;

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  password_hash TEXT NOT NULL,
  name VARCHAR(255),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS users_email_unique ON users(email);

CREATE TABLE IF NOT EXISTS people (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(64),
  email VARCHAR(255),
  national_id VARCHAR(64),
  address TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS lands (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  location VARCHAR(512),
  area_acres NUMERIC(14,4) NOT NULL,
  purchase_price_egp NUMERIC(16,2) NOT NULL DEFAULT 0,
  purchase_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS plots (
  id SERIAL PRIMARY KEY,
  land_id INTEGER NOT NULL REFERENCES lands(id) ON DELETE CASCADE,
  owner_id INTEGER REFERENCES people(id) ON DELETE SET NULL,
  name VARCHAR(255) NOT NULL,
  area_acres NUMERIC(14,4) NOT NULL,
  cost_egp NUMERIC(16,2) NOT NULL DEFAULT 0,
  selling_price_egp NUMERIC(16,2) NOT NULL DEFAULT 0,
  profit_percentage NUMERIC(7,4),
  status plot_status NOT NULL DEFAULT 'available',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS plot_coordinates (
  id SERIAL PRIMARY KEY,
  plot_id INTEGER NOT NULL REFERENCES plots(id) ON DELETE CASCADE,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS plot_documents (
  id SERIAL PRIMARY KEY,
  plot_id INTEGER NOT NULL REFERENCES plots(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  file_url TEXT NOT NULL,
  file_type VARCHAR(64),
  notes TEXT,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS plot_stages (
  id SERIAL PRIMARY KEY,
  plot_id INTEGER NOT NULL REFERENCES plots(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  status stage_status NOT NULL DEFAULT 'planned',
  start_date DATE,
  end_date DATE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS stage_financials (
  id SERIAL PRIMARY KEY,
  stage_id INTEGER NOT NULL REFERENCES plot_stages(id) ON DELETE CASCADE,
  kind financial_kind NOT NULL,
  category VARCHAR(128),
  description TEXT,
  amount_egp NUMERIC(16,2) NOT NULL,
  transaction_date DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
