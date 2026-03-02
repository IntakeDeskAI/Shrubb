-- ============================================================
-- 00008: Add verified address columns
-- ============================================================

-- Companies: add address columns (none exist today)
ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS address_place_id TEXT,
  ADD COLUMN IF NOT EXISTS address_formatted TEXT,
  ADD COLUMN IF NOT EXISTS address_lat DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS address_lng DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS address_raw TEXT;

-- Clients: add verified property address columns
ALTER TABLE public.clients
  ADD COLUMN IF NOT EXISTS property_place_id TEXT,
  ADD COLUMN IF NOT EXISTS property_formatted TEXT,
  ADD COLUMN IF NOT EXISTS property_lat DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS property_lng DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS property_address_raw TEXT;

-- Backfill existing raw addresses
UPDATE public.clients
SET property_address_raw = address
WHERE address IS NOT NULL
  AND address != ''
  AND property_address_raw IS NULL;

-- Projects: add place_id (lat/lng already exist)
ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS place_id TEXT;
