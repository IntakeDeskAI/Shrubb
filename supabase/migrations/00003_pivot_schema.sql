-- ============================================================
-- SHRUBB V1 PIVOT: Contest Marketplace → AI Yard Planner
-- This migration drops the old schema and creates the new one.
-- Safe to run pre-launch (no production user data to preserve).
-- ============================================================

-- Drop old triggers first
DROP TRIGGER IF EXISTS on_profile_created ON public.profiles;
DROP FUNCTION IF EXISTS public.handle_new_profile();

-- Drop old tables (cascade handles FK dependencies)
DROP TABLE IF EXISTS public.subscriptions CASCADE;
DROP TABLE IF EXISTS public.revisions CASCADE;
DROP TABLE IF EXISTS public.concept_images CASCADE;
DROP TABLE IF EXISTS public.concepts CASCADE;
DROP TABLE IF EXISTS public.design_briefs CASCADE;
DROP TABLE IF EXISTS public.area_photos CASCADE;
DROP TABLE IF EXISTS public.project_areas CASCADE;

-- Drop old storage policies (ignore errors if not present)
DROP POLICY IF EXISTS "originals_insert" ON storage.objects;
DROP POLICY IF EXISTS "originals_select" ON storage.objects;
DROP POLICY IF EXISTS "concepts_insert_service" ON storage.objects;
DROP POLICY IF EXISTS "concepts_select" ON storage.objects;
DROP POLICY IF EXISTS "exports_insert_service" ON storage.objects;
DROP POLICY IF EXISTS "exports_select" ON storage.objects;

-- ============================================================
-- MODIFY EXISTING TABLES
-- ============================================================

-- Projects: add new columns for AI yard planner
ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'setup',
  ADD COLUMN IF NOT EXISTS preferences jsonb DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS climate_zone text,
  ADD COLUMN IF NOT EXISTS lat double precision,
  ADD COLUMN IF NOT EXISTS lng double precision;

-- Profiles: add phone/channel fields
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS phone_verified boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS sms_opt_in boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS voice_opt_in boolean DEFAULT false;

-- Jobs: add project linkage
ALTER TABLE public.jobs
  ADD COLUMN IF NOT EXISTS project_id uuid REFERENCES public.projects(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_jobs_project_id ON public.jobs(project_id);

-- ============================================================
-- NEW TABLES
-- ============================================================

-- Entitlements: one row per user, tracks purchased capacity + usage
CREATE TABLE public.entitlements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  tier text NOT NULL DEFAULT 'none',
  -- Included amounts (set on purchase, incremented by add-ons)
  included_chat_messages integer NOT NULL DEFAULT 0,
  included_rerenders integer NOT NULL DEFAULT 0,
  included_projects integer NOT NULL DEFAULT 0,
  included_voice_minutes integer NOT NULL DEFAULT 0,
  -- Usage counters
  chat_messages_used integer NOT NULL DEFAULT 0,
  rerenders_used integer NOT NULL DEFAULT 0,
  projects_used integer NOT NULL DEFAULT 0,
  voice_minutes_used integer NOT NULL DEFAULT 0,
  -- Spending cap (internal cost control)
  spending_cap_cents integer NOT NULL DEFAULT 0,
  spending_used_cents integer NOT NULL DEFAULT 0,
  -- Metadata
  expires_at timestamptz,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(user_id)
);

-- Purchases: every Stripe transaction
CREATE TABLE public.purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  stripe_customer_id text,
  stripe_payment_intent_id text,
  product_type text NOT NULL,  -- 'tier' or 'addon'
  product_name text NOT NULL,  -- 'starter', 'standard', 'premium', 'chat_pack', 'rerender_pack', 'second_project', 'voice_pack_15', 'voice_pack_40'
  amount_cents integer NOT NULL,
  status text NOT NULL DEFAULT 'pending',  -- 'pending', 'succeeded', 'failed', 'refunded'
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Project Inputs: photos or satellite images per project
CREATE TABLE public.project_inputs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  input_type text NOT NULL,  -- 'photo', 'satellite'
  storage_path text NOT NULL,
  editable_area_polygon jsonb,  -- GeoJSON polygon for area selection
  lat double precision,
  lng double precision,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Design Runs: each AI generation pass
CREATE TABLE public.design_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  run_type text NOT NULL,  -- 'initial', 'rerender'
  status text NOT NULL DEFAULT 'pending',  -- 'pending', 'running', 'succeeded', 'failed'
  planner_json jsonb,  -- Structured planner output
  style_prompt text,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Design Assets: outputs from design runs (renders, layouts, PDFs)
CREATE TABLE public.design_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  design_run_id uuid NOT NULL REFERENCES public.design_runs(id) ON DELETE CASCADE,
  asset_type text NOT NULL,  -- 'render', 'layout', 'plant_list', 'pdf'
  storage_path text NOT NULL,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Messages: chat conversation per project (multichannel)
CREATE TABLE public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role text NOT NULL,  -- 'user', 'assistant', 'system'
  content text NOT NULL,
  channel text NOT NULL DEFAULT 'web',  -- 'web', 'sms', 'voice'
  external_id text,  -- Twilio SID or Bland call ID
  media_urls jsonb DEFAULT '[]',
  intent text,  -- 'text_only', 'rerender', 'setup' (set by classifier)
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Usage Ledger: records every AI API call with cost
CREATE TABLE public.usage_ledger (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  project_id uuid REFERENCES public.projects(id) ON DELETE SET NULL,
  message_id uuid REFERENCES public.messages(id) ON DELETE SET NULL,
  run_type text NOT NULL,  -- 'planner', 'render', 'classify', 'pdf', 'chat', 'satellite'
  tokens_in integer DEFAULT 0,
  tokens_out integer DEFAULT 0,
  image_count integer DEFAULT 0,
  estimated_cost_usd numeric(10,6) NOT NULL DEFAULT 0,
  provider text NOT NULL,  -- 'openai', 'google', etc.
  model text,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Plant Catalog: reference data for zone-aware plant suggestions
CREATE TABLE public.plant_catalog (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  common_name text NOT NULL,
  botanical_name text NOT NULL,
  category text,  -- 'shrub', 'perennial', 'ground_cover', 'tree', 'grass', 'annual'
  zone_min integer,
  zone_max integer,
  sun text,  -- 'full_sun', 'partial_shade', 'full_shade'
  water text,  -- 'low', 'moderate', 'high'
  pet_safe boolean DEFAULT false,
  native_region text,
  spacing_inches integer,
  mature_height_inches integer,
  image_url text,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX idx_entitlements_user_id ON public.entitlements(user_id);
CREATE INDEX idx_purchases_user_id ON public.purchases(user_id);
CREATE INDEX idx_purchases_stripe_pi ON public.purchases(stripe_payment_intent_id);
CREATE INDEX idx_purchases_status ON public.purchases(status);
CREATE INDEX idx_project_inputs_project_id ON public.project_inputs(project_id);
CREATE INDEX idx_design_runs_project_id ON public.design_runs(project_id);
CREATE INDEX idx_design_runs_status ON public.design_runs(status);
CREATE INDEX idx_design_assets_run_id ON public.design_assets(design_run_id);
CREATE INDEX idx_messages_project_id ON public.messages(project_id);
CREATE INDEX idx_messages_user_id ON public.messages(user_id);
CREATE INDEX idx_messages_created_at ON public.messages(created_at);
CREATE INDEX idx_usage_ledger_user_id ON public.usage_ledger(user_id);
CREATE INDEX idx_usage_ledger_project_id ON public.usage_ledger(project_id);
CREATE INDEX idx_usage_ledger_created_at ON public.usage_ledger(created_at);
CREATE INDEX idx_plant_catalog_zone ON public.plant_catalog(zone_min, zone_max);
CREATE INDEX idx_plant_catalog_sun ON public.plant_catalog(sun);
CREATE INDEX idx_profiles_phone ON public.profiles(phone) WHERE phone IS NOT NULL;

-- ============================================================
-- RLS POLICIES
-- ============================================================

-- Entitlements
ALTER TABLE public.entitlements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "entitlements_select_own" ON public.entitlements FOR SELECT
  USING (user_id = auth.uid() OR public.is_admin());
CREATE POLICY "entitlements_service_all" ON public.entitlements FOR ALL
  USING (auth.role() = 'service_role');

-- Purchases
ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;
CREATE POLICY "purchases_select_own" ON public.purchases FOR SELECT
  USING (user_id = auth.uid() OR public.is_admin());
CREATE POLICY "purchases_service_all" ON public.purchases FOR ALL
  USING (auth.role() = 'service_role');

-- Project Inputs
ALTER TABLE public.project_inputs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "project_inputs_select_own" ON public.project_inputs FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.projects WHERE projects.id = project_inputs.project_id AND projects.user_id = auth.uid()
  ) OR public.is_admin());
CREATE POLICY "project_inputs_insert_own" ON public.project_inputs FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.projects WHERE projects.id = project_inputs.project_id AND projects.user_id = auth.uid()
  ));
CREATE POLICY "project_inputs_service_all" ON public.project_inputs FOR ALL
  USING (auth.role() = 'service_role');

-- Design Runs
ALTER TABLE public.design_runs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "design_runs_select_own" ON public.design_runs FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.projects WHERE projects.id = design_runs.project_id AND projects.user_id = auth.uid()
  ) OR public.is_admin());
CREATE POLICY "design_runs_service_all" ON public.design_runs FOR ALL
  USING (auth.role() = 'service_role');

-- Design Assets
ALTER TABLE public.design_assets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "design_assets_select_own" ON public.design_assets FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.design_runs
    JOIN public.projects ON projects.id = design_runs.project_id
    WHERE design_runs.id = design_assets.design_run_id AND projects.user_id = auth.uid()
  ) OR public.is_admin());
CREATE POLICY "design_assets_service_all" ON public.design_assets FOR ALL
  USING (auth.role() = 'service_role');

-- Messages
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "messages_select_own" ON public.messages FOR SELECT
  USING (user_id = auth.uid() OR public.is_admin());
CREATE POLICY "messages_insert_own" ON public.messages FOR INSERT
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "messages_service_all" ON public.messages FOR ALL
  USING (auth.role() = 'service_role');

-- Usage Ledger (admin + service only for writes, user can read own)
ALTER TABLE public.usage_ledger ENABLE ROW LEVEL SECURITY;
CREATE POLICY "usage_ledger_select_admin" ON public.usage_ledger FOR SELECT
  USING (public.is_admin());
CREATE POLICY "usage_ledger_service_all" ON public.usage_ledger FOR ALL
  USING (auth.role() = 'service_role');

-- Plant Catalog (public read)
ALTER TABLE public.plant_catalog ENABLE ROW LEVEL SECURITY;
CREATE POLICY "plant_catalog_select_all" ON public.plant_catalog FOR SELECT
  USING (true);
CREATE POLICY "plant_catalog_service_all" ON public.plant_catalog FOR ALL
  USING (auth.role() = 'service_role');

-- ============================================================
-- STORAGE
-- ============================================================

-- New bucket for project inputs (photos and satellite images)
INSERT INTO storage.buckets (id, name, public) VALUES ('inputs', 'inputs', false)
  ON CONFLICT (id) DO NOTHING;

-- Storage policies for inputs bucket
CREATE POLICY "inputs_insert_auth" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'inputs' AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "inputs_select_auth" ON storage.objects FOR SELECT
  USING (bucket_id = 'inputs' AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "inputs_service" ON storage.objects FOR ALL
  USING (bucket_id = 'inputs' AND auth.role() = 'service_role');

-- Service role policies for concepts bucket (worker writes renders)
CREATE POLICY "concepts_service_write" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'concepts' AND auth.role() = 'service_role');
CREATE POLICY "concepts_auth_read" ON storage.objects FOR SELECT
  USING (bucket_id = 'concepts' AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text);

-- Service role policies for exports bucket (worker writes PDFs)
CREATE POLICY "exports_service_write" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'exports' AND auth.role() = 'service_role');
CREATE POLICY "exports_auth_read" ON storage.objects FOR SELECT
  USING (bucket_id = 'exports' AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text);

-- ============================================================
-- HELPER FUNCTIONS
-- ============================================================

-- Check if spending cap allows additional cost
CREATE OR REPLACE FUNCTION public.check_spending_cap(p_user_id uuid, p_additional_cost_cents integer)
RETURNS boolean AS $$
DECLARE
  v_cap integer;
  v_used integer;
BEGIN
  SELECT spending_cap_cents, spending_used_cents INTO v_cap, v_used
  FROM public.entitlements WHERE user_id = p_user_id;
  IF NOT FOUND THEN RETURN false; END IF;
  RETURN (v_used + p_additional_cost_cents) <= v_cap;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Increment spending atomically
CREATE OR REPLACE FUNCTION public.increment_spending(p_user_id uuid, p_amount integer)
RETURNS void AS $$
BEGIN
  UPDATE public.entitlements
  SET spending_used_cents = spending_used_cents + p_amount, updated_at = now()
  WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Increment chat usage, returns false if over limit
CREATE OR REPLACE FUNCTION public.increment_chat_usage(p_user_id uuid)
RETURNS boolean AS $$
DECLARE
  v_row public.entitlements;
BEGIN
  SELECT * INTO v_row FROM public.entitlements WHERE user_id = p_user_id FOR UPDATE;
  IF NOT FOUND THEN RETURN false; END IF;
  IF v_row.chat_messages_used >= v_row.included_chat_messages THEN RETURN false; END IF;
  UPDATE public.entitlements SET chat_messages_used = chat_messages_used + 1, updated_at = now()
    WHERE user_id = p_user_id;
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Increment rerender usage, returns false if over limit
CREATE OR REPLACE FUNCTION public.increment_rerender_usage(p_user_id uuid)
RETURNS boolean AS $$
DECLARE
  v_row public.entitlements;
BEGIN
  SELECT * INTO v_row FROM public.entitlements WHERE user_id = p_user_id FOR UPDATE;
  IF NOT FOUND THEN RETURN false; END IF;
  IF v_row.rerenders_used >= v_row.included_rerenders THEN RETURN false; END IF;
  UPDATE public.entitlements SET rerenders_used = rerenders_used + 1, updated_at = now()
    WHERE user_id = p_user_id;
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Increment project usage, returns false if over limit
CREATE OR REPLACE FUNCTION public.increment_project_usage(p_user_id uuid)
RETURNS boolean AS $$
DECLARE
  v_row public.entitlements;
BEGIN
  SELECT * INTO v_row FROM public.entitlements WHERE user_id = p_user_id FOR UPDATE;
  IF NOT FOUND THEN RETURN false; END IF;
  IF v_row.projects_used >= v_row.included_projects THEN RETURN false; END IF;
  UPDATE public.entitlements SET projects_used = projects_used + 1, updated_at = now()
    WHERE user_id = p_user_id;
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Increment voice minutes usage
CREATE OR REPLACE FUNCTION public.increment_voice_usage(p_user_id uuid, p_minutes integer)
RETURNS boolean AS $$
DECLARE
  v_row public.entitlements;
BEGIN
  SELECT * INTO v_row FROM public.entitlements WHERE user_id = p_user_id FOR UPDATE;
  IF NOT FOUND THEN RETURN false; END IF;
  IF (v_row.voice_minutes_used + p_minutes) > v_row.included_voice_minutes THEN RETURN false; END IF;
  UPDATE public.entitlements SET voice_minutes_used = voice_minutes_used + p_minutes, updated_at = now()
    WHERE user_id = p_user_id;
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Generic entitlement field incrementer (for add-on purchases)
CREATE OR REPLACE FUNCTION public.increment_entitlement_field(p_user_id uuid, p_field text, p_amount integer)
RETURNS void AS $$
BEGIN
  EXECUTE format('UPDATE public.entitlements SET %I = %I + $1, updated_at = now() WHERE user_id = $2', p_field, p_field)
    USING p_amount, p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
