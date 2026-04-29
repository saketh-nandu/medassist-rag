-- ============================================================
-- MedAssist RAG — Complete Supabase Database Setup
-- Run this ONCE in Supabase SQL Editor
-- ============================================================

-- ─── 1. CHAT MESSAGES ────────────────────────────────────────

CREATE TABLE IF NOT EXISTS chat_messages (
  id            TEXT PRIMARY KEY,
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role          TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content       TEXT NOT NULL,
  severity      TEXT CHECK (severity IN ('low', 'medium', 'high')),
  conditions    TEXT[]   DEFAULT '{}',
  suggested_actions TEXT[] DEFAULT '{}',
  affected_areas    TEXT[] DEFAULT '{}',
  is_image      BOOLEAN  DEFAULT FALSE,
  session_id    TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Add session_id if table already exists without it
ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS session_id TEXT;

CREATE INDEX IF NOT EXISTS chat_messages_user_idx    ON chat_messages(user_id);
CREATE INDEX IF NOT EXISTS chat_messages_session_idx ON chat_messages(session_id);
CREATE INDEX IF NOT EXISTS chat_messages_created_idx ON chat_messages(created_at);

-- RLS
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own messages" ON chat_messages;
CREATE POLICY "Users can manage own messages" ON chat_messages
  FOR ALL USING (auth.uid() = user_id);

-- ─── 2. HEALTH REPORTS ───────────────────────────────────────

CREATE TABLE IF NOT EXISTS health_reports (
  id              BIGSERIAL PRIMARY KEY,
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title           TEXT NOT NULL,
  conditions      TEXT[]   DEFAULT '{}',
  severity        TEXT     DEFAULT 'low' CHECK (severity IN ('low', 'medium', 'high')),
  suggested_actions TEXT[] DEFAULT '{}',
  affected_areas  TEXT[]   DEFAULT '{}',
  chat_message_id TEXT,
  session_id      TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE health_reports ADD COLUMN IF NOT EXISTS session_id TEXT;
ALTER TABLE health_reports ADD COLUMN IF NOT EXISTS chat_message_id TEXT;

CREATE INDEX IF NOT EXISTS health_reports_user_idx    ON health_reports(user_id);
CREATE INDEX IF NOT EXISTS health_reports_session_idx ON health_reports(session_id);
CREATE INDEX IF NOT EXISTS health_reports_created_idx ON health_reports(created_at DESC);

ALTER TABLE health_reports ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own reports" ON health_reports;
CREATE POLICY "Users can manage own reports" ON health_reports
  FOR ALL USING (auth.uid() = user_id);

-- ─── 3. REMINDERS ────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS reminders (
  id               TEXT PRIMARY KEY,
  user_id          UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  medicine_name    TEXT NOT NULL,
  dosage           TEXT NOT NULL DEFAULT '1 tablet',
  frequency        TEXT NOT NULL DEFAULT 'Daily',
  time_slots       TEXT[]   DEFAULT '{"08:00 AM"}',
  status           TEXT     DEFAULT 'active' CHECK (status IN ('active', 'paused')),
  taken_today      BOOLEAN  DEFAULT FALSE,
  taken_date       DATE,
  total_doses      INT      DEFAULT 14,
  taken_doses      INT      DEFAULT 0,
  start_date       DATE     DEFAULT CURRENT_DATE,
  duration_days    INT      DEFAULT 7,
  notification_ids TEXT[]   DEFAULT '{}',
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- Add missing columns if table already exists
ALTER TABLE reminders ADD COLUMN IF NOT EXISTS total_doses      INT DEFAULT 14;
ALTER TABLE reminders ADD COLUMN IF NOT EXISTS taken_doses      INT DEFAULT 0;
ALTER TABLE reminders ADD COLUMN IF NOT EXISTS start_date       DATE DEFAULT CURRENT_DATE;
ALTER TABLE reminders ADD COLUMN IF NOT EXISTS duration_days    INT DEFAULT 7;
ALTER TABLE reminders ADD COLUMN IF NOT EXISTS notification_ids TEXT[] DEFAULT '{}';
ALTER TABLE reminders ADD COLUMN IF NOT EXISTS taken_date       DATE;

CREATE INDEX IF NOT EXISTS reminders_user_idx ON reminders(user_id);

ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own reminders" ON reminders;
CREATE POLICY "Users can manage own reminders" ON reminders
  FOR ALL USING (auth.uid() = user_id);

-- ─── 4. RESET TAKEN TODAY (RPC) ──────────────────────────────
-- Resets taken_today for all reminders where taken_date < today

CREATE OR REPLACE FUNCTION reset_taken_today()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE reminders
  SET taken_today = FALSE, taken_date = NULL
  WHERE taken_today = TRUE
    AND (taken_date IS NULL OR taken_date < CURRENT_DATE);
END;
$$;

-- ─── 5. BACKFILL EXISTING DATA ───────────────────────────────
-- Give existing messages/reports a legacy session so they're accessible

UPDATE chat_messages
SET session_id = 'legacy_session_' || user_id::text
WHERE session_id IS NULL;

UPDATE health_reports
SET session_id = 'legacy_session_' || user_id::text
WHERE session_id IS NULL;

-- ─── DONE ─────────────────────────────────────────────────────
-- Tables created:
--   chat_messages  — stores all chat history with session_id
--   health_reports — auto-generated from medium/high severity chats
--   reminders      — medicine reminders with adherence tracking
-- RLS enabled on all tables (users can only see their own data)
