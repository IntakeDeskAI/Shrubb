-- ============================================================
-- Migration 00005: AI Phone Number (SMS + Inbound Calls)
-- Adds phone_numbers, leads, conversations, calls tables
-- and company settings for business hours / forwarding.
-- ============================================================

-- ---------------------------------------------------------------------------
-- 1. phone_numbers — one dedicated Twilio number per account
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS phone_numbers (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id  UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  provider    TEXT NOT NULL DEFAULT 'twilio',
  phone_e164  TEXT NOT NULL UNIQUE,
  area_code   TEXT,
  status      TEXT NOT NULL DEFAULT 'active',  -- active | released
  purchased_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_phone_numbers_account ON phone_numbers(account_id);
CREATE INDEX idx_phone_numbers_e164   ON phone_numbers(phone_e164);

-- ---------------------------------------------------------------------------
-- 2. leads — inbound contacts identified by phone
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS leads (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id      UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name            TEXT,
  phone           TEXT NOT NULL,
  do_not_contact  BOOLEAN NOT NULL DEFAULT false,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_leads_account       ON leads(account_id);
CREATE UNIQUE INDEX idx_leads_account_phone ON leads(account_id, phone);

-- ---------------------------------------------------------------------------
-- 3. conversations — thread per lead per phone number
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS conversations (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id      UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  lead_id         UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  phone_number_id UUID NOT NULL REFERENCES phone_numbers(id) ON DELETE CASCADE,
  channel         TEXT NOT NULL DEFAULT 'sms',  -- sms | voice
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_conversations_account ON conversations(account_id);
CREATE INDEX idx_conversations_lead    ON conversations(lead_id);

-- ---------------------------------------------------------------------------
-- 4. sms_messages — individual SMS messages in a conversation
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS sms_messages (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  direction       TEXT NOT NULL,  -- inbound | outbound
  body            TEXT NOT NULL,
  provider_id     TEXT,           -- Twilio MessageSid
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_sms_messages_conversation ON sms_messages(conversation_id);

-- ---------------------------------------------------------------------------
-- 5. calls — inbound call records with transcripts
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS calls (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id   UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  direction         TEXT NOT NULL DEFAULT 'inbound',
  provider_call_id  TEXT,
  status            TEXT NOT NULL DEFAULT 'in-progress',  -- in-progress | completed | no-answer | failed
  recording_url     TEXT,
  transcript_text   TEXT,
  summary_text      TEXT,
  started_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at          TIMESTAMPTZ
);

CREATE INDEX idx_calls_conversation ON calls(conversation_id);

-- ---------------------------------------------------------------------------
-- 6. company_settings — business hours, forwarding, AI toggles
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS company_settings (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id              UUID NOT NULL UNIQUE REFERENCES companies(id) ON DELETE CASCADE,
  ai_sms_enabled          BOOLEAN NOT NULL DEFAULT true,
  ai_calls_enabled        BOOLEAN NOT NULL DEFAULT true,
  call_forwarding_enabled BOOLEAN NOT NULL DEFAULT false,
  forward_phone_e164      TEXT,
  business_hours_start    TEXT NOT NULL DEFAULT '08:00',   -- HH:MM 24h local
  business_hours_end      TEXT NOT NULL DEFAULT '18:00',
  business_hours_timezone TEXT NOT NULL DEFAULT 'America/New_York',
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- 7. RLS policies
-- ---------------------------------------------------------------------------

ALTER TABLE phone_numbers ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE sms_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_settings ENABLE ROW LEVEL SECURITY;

-- phone_numbers: company members can read their numbers
CREATE POLICY "Members can view company phone numbers"
  ON phone_numbers FOR SELECT
  USING (account_id IN (SELECT user_company_ids()));

-- leads: company members CRUD
CREATE POLICY "Members can view company leads"
  ON leads FOR SELECT
  USING (account_id IN (SELECT user_company_ids()));

CREATE POLICY "Members can insert company leads"
  ON leads FOR INSERT
  WITH CHECK (account_id IN (SELECT user_company_ids()));

CREATE POLICY "Members can update company leads"
  ON leads FOR UPDATE
  USING (account_id IN (SELECT user_company_ids()));

-- conversations: company members can read
CREATE POLICY "Members can view company conversations"
  ON conversations FOR SELECT
  USING (account_id IN (SELECT user_company_ids()));

-- sms_messages: via conversation -> account
CREATE POLICY "Members can view conversation messages"
  ON sms_messages FOR SELECT
  USING (conversation_id IN (
    SELECT id FROM conversations
    WHERE account_id IN (SELECT user_company_ids())
  ));

-- calls: via conversation -> account
CREATE POLICY "Members can view conversation calls"
  ON calls FOR SELECT
  USING (conversation_id IN (
    SELECT id FROM conversations
    WHERE account_id IN (SELECT user_company_ids())
  ));

-- company_settings: company members can read and update
CREATE POLICY "Members can view company settings"
  ON company_settings FOR SELECT
  USING (company_id IN (SELECT user_company_ids()));

CREATE POLICY "Members can update company settings"
  ON company_settings FOR UPDATE
  USING (company_id IN (SELECT user_company_ids()));
