-- ============================================================
-- 00009: Add Bland AI qualification fields to leads
-- Captures structured output from Bland inbound call script
-- ============================================================

ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS email TEXT,
  ADD COLUMN IF NOT EXISTS company_name TEXT,
  ADD COLUMN IF NOT EXISTS city_state TEXT,
  ADD COLUMN IF NOT EXISTS leads_per_week TEXT,
  ADD COLUMN IF NOT EXISTS current_tools TEXT,
  ADD COLUMN IF NOT EXISTS next_step TEXT,          -- book_demo | start_trial | redirected | unknown
  ADD COLUMN IF NOT EXISTS is_landscaping_company BOOLEAN,
  ADD COLUMN IF NOT EXISTS notes TEXT;
