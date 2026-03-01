-- ============================================================
-- Migration 00006: Response Time Tracking + Proposal Nudges
-- Adds response time columns to conversations, auto_nudge
-- settings to company_settings, and proposal_nudges table.
-- ============================================================

-- ---------------------------------------------------------------------------
-- 1. Add response time tracking to conversations
-- ---------------------------------------------------------------------------
ALTER TABLE conversations
  ADD COLUMN IF NOT EXISTS first_inbound_at  TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS first_response_at TIMESTAMPTZ;

CREATE INDEX idx_conversations_response ON conversations(account_id, first_inbound_at, first_response_at)
  WHERE first_inbound_at IS NOT NULL;

-- ---------------------------------------------------------------------------
-- 2. Add auto-nudge settings to company_settings
-- ---------------------------------------------------------------------------
ALTER TABLE company_settings
  ADD COLUMN IF NOT EXISTS auto_nudge_enabled    BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS nudge_delay_hours      INTEGER NOT NULL DEFAULT 48,
  ADD COLUMN IF NOT EXISTS nudge_max_count        INTEGER NOT NULL DEFAULT 2;

-- ---------------------------------------------------------------------------
-- 3. proposal_nudges — scheduled follow-up reminders
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS proposal_nudges (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id  UUID NOT NULL REFERENCES proposals(id) ON DELETE CASCADE,
  company_id   UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  nudge_number INTEGER NOT NULL DEFAULT 1,
  scheduled_at TIMESTAMPTZ NOT NULL,
  sent_at      TIMESTAMPTZ,
  status       TEXT NOT NULL DEFAULT 'pending', -- pending | sent | cancelled
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_proposal_nudges_pending ON proposal_nudges(status, scheduled_at)
  WHERE status = 'pending';
CREATE INDEX idx_proposal_nudges_proposal ON proposal_nudges(proposal_id);

-- ---------------------------------------------------------------------------
-- 4. RLS policies for proposal_nudges
-- ---------------------------------------------------------------------------
ALTER TABLE proposal_nudges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view company nudges"
  ON proposal_nudges FOR SELECT
  USING (company_id IN (SELECT user_company_ids()));

CREATE POLICY "Members can update company nudges"
  ON proposal_nudges FOR UPDATE
  USING (company_id IN (SELECT user_company_ids()));
