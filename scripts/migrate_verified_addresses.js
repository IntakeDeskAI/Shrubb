/**
 * Migrate verified address columns using Supabase REST API.
 * Since we can't run raw SQL via REST, we use a "test insert" approach:
 * - Try inserting with the new columns. If it works, columns exist.
 * - If not, we need to run the migration via Supabase Dashboard SQL editor.
 *
 * Alternative: This script creates an exec_sql function first, then uses it.
 */

const SUPABASE_URL = "https://jiwxcagshggfwnimyzou.supabase.co";
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SERVICE_KEY) {
  console.error("Set SUPABASE_SERVICE_ROLE_KEY env var");
  process.exit(1);
}

async function supabaseRpc(fn, params) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${fn}`, {
    method: "POST",
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(params),
  });
  const text = await res.text();
  return { ok: res.ok, status: res.status, body: text };
}

async function supabaseQuery(table, select, params = "") {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?select=${select}${params}&limit=1`, {
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
    },
  });
  return { ok: res.ok, status: res.status, body: await res.text() };
}

async function run() {
  console.log("Checking if migration is needed...\n");

  // Test if columns already exist by querying them
  const companyCheck = await supabaseQuery("companies", "address_place_id");
  const clientCheck = await supabaseQuery("clients", "property_place_id");
  const projectCheck = await supabaseQuery("projects", "place_id");

  if (companyCheck.ok && clientCheck.ok && projectCheck.ok) {
    console.log("All columns already exist! Migration not needed.");
    return;
  }

  console.log("Columns missing. Checking which ones...");
  if (!companyCheck.ok) console.log("  - companies.address_place_id: MISSING");
  if (!clientCheck.ok) console.log("  - clients.property_place_id: MISSING");
  if (!projectCheck.ok) console.log("  - projects.place_id: MISSING");

  console.log("\n=== MIGRATION SQL ===");
  console.log("Run this in Supabase Dashboard > SQL Editor:\n");
  console.log(`-- Companies: add address columns
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
  ADD COLUMN IF NOT EXISTS place_id TEXT;`);

  console.log("\n=== END SQL ===\n");
  console.log("After running, re-run this script to verify.");
}

run().catch(e => console.error("Error:", e.message));
