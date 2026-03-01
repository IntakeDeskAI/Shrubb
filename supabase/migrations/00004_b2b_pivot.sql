-- ============================================================
-- SHRUBB: B2B Pivot Migration (idempotent — safe to re-run)
-- Migrates from single-user homeowner model to B2B landscaper
-- workflow platform. Additive — no existing tables are dropped.
-- ============================================================

BEGIN;

-- ============================================================
-- 1. NEW TABLES (IF NOT EXISTS)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL,
  stripe_customer_id text,
  stripe_subscription_id text,
  trial_ends_at timestamptz,
  plan text NOT NULL DEFAULT 'trial',
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(slug)
);

CREATE TABLE IF NOT EXISTS public.company_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'member',
  created_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(company_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name text NOT NULL,
  email text,
  phone text,
  address text,
  notes text,
  status text NOT NULL DEFAULT 'lead',
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.proposals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'draft',
  sent_at timestamptz,
  viewed_at timestamptz,
  accepted_at timestamptz,
  message text,
  share_token text UNIQUE,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- ============================================================
-- 2. ALTER EXISTING TABLES — add company_id / client_id
-- ============================================================

ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES public.companies(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS client_id uuid REFERENCES public.clients(id) ON DELETE SET NULL;

ALTER TABLE public.entitlements
  ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS included_proposals integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS proposals_used integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS included_renders integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS renders_used integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS included_seats integer NOT NULL DEFAULT 1;

ALTER TABLE public.entitlements ALTER COLUMN user_id DROP NOT NULL;

ALTER TABLE public.entitlements DROP CONSTRAINT IF EXISTS entitlements_user_id_key;
DO $$ BEGIN
  ALTER TABLE public.entitlements ADD CONSTRAINT entitlements_company_id_key UNIQUE (company_id);
EXCEPTION WHEN duplicate_table THEN NULL;
END $$;

ALTER TABLE public.purchases
  ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES public.companies(id) ON DELETE SET NULL;

ALTER TABLE public.usage_ledger
  ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES public.companies(id) ON DELETE SET NULL;

ALTER TABLE public.jobs
  ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES public.companies(id) ON DELETE SET NULL;

-- ============================================================
-- 3. INDEXES (IF NOT EXISTS)
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_company_members_company_id ON public.company_members(company_id);
CREATE INDEX IF NOT EXISTS idx_company_members_user_id ON public.company_members(user_id);
CREATE INDEX IF NOT EXISTS idx_clients_company_id ON public.clients(company_id);
CREATE INDEX IF NOT EXISTS idx_clients_status ON public.clients(status);
CREATE INDEX IF NOT EXISTS idx_proposals_company_id ON public.proposals(company_id);
CREATE INDEX IF NOT EXISTS idx_proposals_project_id ON public.proposals(project_id);
CREATE INDEX IF NOT EXISTS idx_proposals_client_id ON public.proposals(client_id);
CREATE INDEX IF NOT EXISTS idx_proposals_share_token ON public.proposals(share_token);
CREATE INDEX IF NOT EXISTS idx_proposals_status ON public.proposals(status);
CREATE INDEX IF NOT EXISTS idx_projects_company_id ON public.projects(company_id);
CREATE INDEX IF NOT EXISTS idx_projects_client_id ON public.projects(client_id);
CREATE INDEX IF NOT EXISTS idx_entitlements_company_id ON public.entitlements(company_id);
CREATE INDEX IF NOT EXISTS idx_purchases_company_id ON public.purchases(company_id);
CREATE INDEX IF NOT EXISTS idx_usage_ledger_company_id ON public.usage_ledger(company_id);
CREATE INDEX IF NOT EXISTS idx_jobs_company_id ON public.jobs(company_id);

-- ============================================================
-- 4. HELPER FUNCTION: user_company_ids()
-- ============================================================

CREATE OR REPLACE FUNCTION public.user_company_ids()
RETURNS SETOF uuid AS $$
  SELECT company_id FROM public.company_members WHERE user_id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ============================================================
-- 5. RLS — NEW TABLES (drop-then-create for idempotency)
-- ============================================================

-- ---- COMPANIES ----
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "companies_select_member" ON public.companies;
CREATE POLICY "companies_select_member" ON public.companies FOR SELECT
  USING (
    id IN (SELECT public.user_company_ids())
    OR public.is_admin()
  );

DROP POLICY IF EXISTS "companies_service_all" ON public.companies;
CREATE POLICY "companies_service_all" ON public.companies FOR ALL
  USING (auth.role() = 'service_role');

-- ---- COMPANY MEMBERS ----
ALTER TABLE public.company_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "company_members_select" ON public.company_members;
CREATE POLICY "company_members_select" ON public.company_members FOR SELECT
  USING (
    company_id IN (SELECT public.user_company_ids())
    OR public.is_admin()
  );

DROP POLICY IF EXISTS "company_members_insert_admin" ON public.company_members;
CREATE POLICY "company_members_insert_admin" ON public.company_members FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.company_members cm
      WHERE cm.company_id = company_members.company_id
        AND cm.user_id = auth.uid()
        AND cm.role IN ('owner', 'admin')
    )
  );

DROP POLICY IF EXISTS "company_members_delete_admin" ON public.company_members;
CREATE POLICY "company_members_delete_admin" ON public.company_members FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.company_members cm
      WHERE cm.company_id = company_members.company_id
        AND cm.user_id = auth.uid()
        AND cm.role IN ('owner', 'admin')
    )
  );

DROP POLICY IF EXISTS "company_members_service_all" ON public.company_members;
CREATE POLICY "company_members_service_all" ON public.company_members FOR ALL
  USING (auth.role() = 'service_role');

-- ---- CLIENTS ----
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "clients_select" ON public.clients;
CREATE POLICY "clients_select" ON public.clients FOR SELECT
  USING (
    company_id IN (SELECT public.user_company_ids())
    OR public.is_admin()
  );

DROP POLICY IF EXISTS "clients_insert" ON public.clients;
CREATE POLICY "clients_insert" ON public.clients FOR INSERT
  WITH CHECK (company_id IN (SELECT public.user_company_ids()));

DROP POLICY IF EXISTS "clients_update" ON public.clients;
CREATE POLICY "clients_update" ON public.clients FOR UPDATE
  USING (company_id IN (SELECT public.user_company_ids()));

DROP POLICY IF EXISTS "clients_service_all" ON public.clients;
CREATE POLICY "clients_service_all" ON public.clients FOR ALL
  USING (auth.role() = 'service_role');

-- ---- PROPOSALS ----
ALTER TABLE public.proposals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "proposals_select" ON public.proposals;
CREATE POLICY "proposals_select" ON public.proposals FOR SELECT
  USING (
    company_id IN (SELECT public.user_company_ids())
    OR public.is_admin()
  );

DROP POLICY IF EXISTS "proposals_insert" ON public.proposals;
CREATE POLICY "proposals_insert" ON public.proposals FOR INSERT
  WITH CHECK (company_id IN (SELECT public.user_company_ids()));

DROP POLICY IF EXISTS "proposals_update" ON public.proposals;
CREATE POLICY "proposals_update" ON public.proposals FOR UPDATE
  USING (company_id IN (SELECT public.user_company_ids()));

DROP POLICY IF EXISTS "proposals_service_all" ON public.proposals;
CREATE POLICY "proposals_service_all" ON public.proposals FOR ALL
  USING (auth.role() = 'service_role');

-- ============================================================
-- 6. RLS — UPDATE EXISTING TABLE POLICIES
-- ============================================================

-- ---- PROJECTS ----
DROP POLICY IF EXISTS "projects_select_own" ON public.projects;
DROP POLICY IF EXISTS "projects_insert_own" ON public.projects;
DROP POLICY IF EXISTS "projects_update_own" ON public.projects;
DROP POLICY IF EXISTS "projects_delete_own" ON public.projects;
DROP POLICY IF EXISTS "projects_select_company" ON public.projects;
DROP POLICY IF EXISTS "projects_insert_company" ON public.projects;
DROP POLICY IF EXISTS "projects_update_company" ON public.projects;
DROP POLICY IF EXISTS "projects_delete_company" ON public.projects;
DROP POLICY IF EXISTS "projects_service_all" ON public.projects;

CREATE POLICY "projects_select_company" ON public.projects FOR SELECT
  USING (
    company_id IN (SELECT public.user_company_ids())
    OR public.is_admin()
  );

CREATE POLICY "projects_insert_company" ON public.projects FOR INSERT
  WITH CHECK (company_id IN (SELECT public.user_company_ids()));

CREATE POLICY "projects_update_company" ON public.projects FOR UPDATE
  USING (company_id IN (SELECT public.user_company_ids()));

CREATE POLICY "projects_delete_company" ON public.projects FOR DELETE
  USING (company_id IN (SELECT public.user_company_ids()));

CREATE POLICY "projects_service_all" ON public.projects FOR ALL
  USING (auth.role() = 'service_role');

-- ---- ENTITLEMENTS ----
DROP POLICY IF EXISTS "entitlements_select_own" ON public.entitlements;
DROP POLICY IF EXISTS "entitlements_select_company" ON public.entitlements;

CREATE POLICY "entitlements_select_company" ON public.entitlements FOR SELECT
  USING (
    company_id IN (SELECT public.user_company_ids())
    OR public.is_admin()
  );

-- ---- PURCHASES ----
DROP POLICY IF EXISTS "purchases_select_own" ON public.purchases;
DROP POLICY IF EXISTS "purchases_select_company" ON public.purchases;

CREATE POLICY "purchases_select_company" ON public.purchases FOR SELECT
  USING (
    company_id IN (SELECT public.user_company_ids())
    OR public.is_admin()
  );

-- ---- MESSAGES ----
DROP POLICY IF EXISTS "messages_select_own" ON public.messages;
DROP POLICY IF EXISTS "messages_insert_own" ON public.messages;
DROP POLICY IF EXISTS "messages_select_company" ON public.messages;
DROP POLICY IF EXISTS "messages_insert_company" ON public.messages;

CREATE POLICY "messages_select_company" ON public.messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = messages.project_id
        AND p.company_id IN (SELECT public.user_company_ids())
    )
    OR public.is_admin()
  );

CREATE POLICY "messages_insert_company" ON public.messages FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = messages.project_id
        AND p.company_id IN (SELECT public.user_company_ids())
    )
  );

-- ---- JOBS ----
DROP POLICY IF EXISTS "jobs_select_own" ON public.jobs;
DROP POLICY IF EXISTS "jobs_insert_own" ON public.jobs;
DROP POLICY IF EXISTS "jobs_select_company" ON public.jobs;
DROP POLICY IF EXISTS "jobs_insert_company" ON public.jobs;
DROP POLICY IF EXISTS "jobs_service_all" ON public.jobs;

CREATE POLICY "jobs_select_company" ON public.jobs FOR SELECT
  USING (
    company_id IN (SELECT public.user_company_ids())
    OR public.is_admin()
  );

CREATE POLICY "jobs_insert_company" ON public.jobs FOR INSERT
  WITH CHECK (company_id IN (SELECT public.user_company_ids()));

CREATE POLICY "jobs_service_all" ON public.jobs FOR ALL
  USING (auth.role() = 'service_role');

-- ---- STORAGE ----
DROP POLICY IF EXISTS "inputs_insert_auth" ON storage.objects;
DROP POLICY IF EXISTS "inputs_select_auth" ON storage.objects;
DROP POLICY IF EXISTS "inputs_select_company" ON storage.objects;

CREATE POLICY "inputs_select_company" ON storage.objects FOR SELECT
  USING (
    bucket_id = 'inputs'
    AND auth.role() = 'authenticated'
  );

-- ============================================================
-- 7. RPC FUNCTIONS — UPDATE TO COMPANY-BASED
-- ============================================================

DROP FUNCTION IF EXISTS public.check_spending_cap(uuid, integer);
DROP FUNCTION IF EXISTS public.increment_spending(uuid, integer);
DROP FUNCTION IF EXISTS public.increment_chat_usage(uuid);
DROP FUNCTION IF EXISTS public.increment_rerender_usage(uuid);
DROP FUNCTION IF EXISTS public.increment_project_usage(uuid);
DROP FUNCTION IF EXISTS public.increment_voice_usage(uuid, integer);
DROP FUNCTION IF EXISTS public.increment_entitlement_field(uuid, text, integer);
DROP FUNCTION IF EXISTS public.increment_render_usage(uuid);
DROP FUNCTION IF EXISTS public.increment_proposal_usage(uuid);

CREATE OR REPLACE FUNCTION public.check_spending_cap(p_company_id uuid, p_additional_cost_cents integer)
RETURNS boolean AS $$
DECLARE
  v_cap integer;
  v_used integer;
BEGIN
  SELECT spending_cap_cents, spending_used_cents INTO v_cap, v_used
  FROM public.entitlements WHERE company_id = p_company_id;
  IF NOT FOUND THEN RETURN false; END IF;
  RETURN (v_used + p_additional_cost_cents) <= v_cap;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.increment_spending(p_company_id uuid, p_amount integer)
RETURNS void AS $$
BEGIN
  UPDATE public.entitlements
  SET spending_used_cents = spending_used_cents + p_amount, updated_at = now()
  WHERE company_id = p_company_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.increment_chat_usage(p_company_id uuid)
RETURNS boolean AS $$
DECLARE
  v_row public.entitlements;
BEGIN
  SELECT * INTO v_row FROM public.entitlements WHERE company_id = p_company_id FOR UPDATE;
  IF NOT FOUND THEN RETURN false; END IF;
  IF v_row.chat_messages_used >= v_row.included_chat_messages THEN RETURN false; END IF;
  UPDATE public.entitlements SET chat_messages_used = chat_messages_used + 1, updated_at = now()
    WHERE company_id = p_company_id;
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.increment_render_usage(p_company_id uuid)
RETURNS boolean AS $$
DECLARE
  v_row public.entitlements;
BEGIN
  SELECT * INTO v_row FROM public.entitlements WHERE company_id = p_company_id FOR UPDATE;
  IF NOT FOUND THEN RETURN false; END IF;
  IF v_row.renders_used >= v_row.included_renders THEN RETURN false; END IF;
  UPDATE public.entitlements SET renders_used = renders_used + 1, updated_at = now()
    WHERE company_id = p_company_id;
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.increment_rerender_usage(p_company_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN public.increment_render_usage(p_company_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.increment_proposal_usage(p_company_id uuid)
RETURNS boolean AS $$
DECLARE
  v_row public.entitlements;
BEGIN
  SELECT * INTO v_row FROM public.entitlements WHERE company_id = p_company_id FOR UPDATE;
  IF NOT FOUND THEN RETURN false; END IF;
  IF v_row.proposals_used >= v_row.included_proposals THEN RETURN false; END IF;
  UPDATE public.entitlements SET proposals_used = proposals_used + 1, updated_at = now()
    WHERE company_id = p_company_id;
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.increment_project_usage(p_company_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN public.increment_proposal_usage(p_company_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.increment_voice_usage(p_company_id uuid, p_minutes integer)
RETURNS boolean AS $$
DECLARE
  v_row public.entitlements;
BEGIN
  SELECT * INTO v_row FROM public.entitlements WHERE company_id = p_company_id FOR UPDATE;
  IF NOT FOUND THEN RETURN false; END IF;
  IF (v_row.voice_minutes_used + p_minutes) > v_row.included_voice_minutes THEN RETURN false; END IF;
  UPDATE public.entitlements SET voice_minutes_used = voice_minutes_used + p_minutes, updated_at = now()
    WHERE company_id = p_company_id;
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.increment_entitlement_field(p_company_id uuid, p_field text, p_amount integer)
RETURNS void AS $$
BEGIN
  EXECUTE format(
    'UPDATE public.entitlements SET %I = %I + $1, updated_at = now() WHERE company_id = $2',
    p_field, p_field
  ) USING p_amount, p_company_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 8. NEW RPC: get_user_company
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_user_company(p_user_id uuid)
RETURNS TABLE(company_id uuid, role text, company_name text) AS $$
  SELECT cm.company_id, cm.role, c.name
  FROM public.company_members cm
  JOIN public.companies c ON c.id = cm.company_id
  WHERE cm.user_id = p_user_id
  ORDER BY cm.created_at ASC
  LIMIT 1
$$ LANGUAGE sql SECURITY DEFINER STABLE;

COMMIT;
