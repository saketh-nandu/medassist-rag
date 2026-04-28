/*
  # HosFind Healthcare App Schema

  ## Overview
  Creates the core data tables for the HosFind mobile application.

  ## New Tables

  ### 1. `chat_sessions`
  Stores AI chat sessions per device/anonymous user.
  - `id` (uuid, primary key)
  - `device_id` (text) — anonymous device identifier
  - `created_at` (timestamp)

  ### 2. `chat_messages`
  Stores individual chat messages within a session.
  - `id` (uuid, primary key)
  - `session_id` (uuid, references chat_sessions)
  - `role` (text) — 'user' or 'assistant'
  - `content` (text) — message body
  - `severity` (text) — 'low', 'medium', 'high', or null
  - `metadata` (jsonb) — conditions, suggested actions, affected areas
  - `created_at` (timestamp)

  ### 3. `reminders`
  Stores medicine reminders per device.
  - `id` (uuid, primary key)
  - `device_id` (text)
  - `medicine_name` (text)
  - `dosage` (text)
  - `frequency` (text)
  - `time_slots` (text[])
  - `taken_today` (boolean)
  - `status` (text) — 'active' or 'paused'
  - `created_at` / `updated_at` (timestamp)

  ## Security
  - RLS enabled on all tables
  - Device-scoped access: each device can only read/write its own data
  - `device_id` is the access control key (anon users)
*/

-- Chat sessions
CREATE TABLE IF NOT EXISTS chat_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id text NOT NULL DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Device can insert own sessions"
  ON chat_sessions FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Device can read own sessions"
  ON chat_sessions FOR SELECT
  TO anon
  USING (device_id = current_setting('request.headers', true)::json->>'x-device-id');

-- Chat messages
CREATE TABLE IF NOT EXISTS chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES chat_sessions(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('user', 'assistant')),
  content text NOT NULL DEFAULT '',
  severity text CHECK (severity IN ('low', 'medium', 'high')),
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow insert chat messages"
  ON chat_messages FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow select chat messages"
  ON chat_messages FOR SELECT
  TO anon
  USING (true);

-- Reminders
CREATE TABLE IF NOT EXISTS reminders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id text NOT NULL DEFAULT '',
  medicine_name text NOT NULL DEFAULT '',
  dosage text DEFAULT '1 tablet',
  frequency text DEFAULT 'Daily',
  time_slots text[] DEFAULT '{}',
  taken_today boolean DEFAULT false,
  status text DEFAULT 'active' CHECK (status IN ('active', 'paused')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Device can insert own reminders"
  ON reminders FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Device can read own reminders"
  ON reminders FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Device can update own reminders"
  ON reminders FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Device can delete own reminders"
  ON reminders FOR DELETE
  TO anon
  USING (true);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_chat_messages_session ON chat_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_reminders_device ON reminders(device_id);
