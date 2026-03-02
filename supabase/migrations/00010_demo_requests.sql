-- ============================================================
-- 00010: Demo requests table for "Call a live demo" flow
-- Stores homepage demo request submissions with rate limiting
-- ============================================================

CREATE TABLE IF NOT EXISTS public.demo_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  source TEXT NOT NULL DEFAULT 'homepage_modal',
  utm_source TEXT,
  utm_campaign TEXT,
  utm_medium TEXT,
  first_name TEXT NOT NULL,
  company_name TEXT NOT NULL,
  phone_e164 TEXT NOT NULL,
  email TEXT,
  ip_hash TEXT,
  user_agent TEXT,
  demo_number TEXT NOT NULL,
  sms_sent BOOLEAN NOT NULL DEFAULT false,
  status TEXT NOT NULL DEFAULT 'created',
  notes TEXT
);

ALTER TABLE public.demo_requests ENABLE ROW LEVEL SECURITY;

-- Service role full access (for API route inserts)
CREATE POLICY "service_role_all" ON public.demo_requests
  FOR ALL USING (auth.role() = 'service_role');

-- Admin read access
CREATE POLICY "admin_read" ON public.demo_requests
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND (
        auth.users.raw_app_meta_data->>'is_admin' = 'true'
        OR auth.users.raw_user_meta_data->>'role' = 'admin'
      )
    )
  );

-- Rate limiting indexes
CREATE INDEX idx_demo_requests_phone ON demo_requests(phone_e164, created_at);
CREATE INDEX idx_demo_requests_ip ON demo_requests(ip_hash, created_at);
CREATE INDEX idx_demo_requests_created ON demo_requests(created_at);
