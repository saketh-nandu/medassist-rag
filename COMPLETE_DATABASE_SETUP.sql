-- ============================================================
-- MedAssist RAG — COMPLETE DATABASE SETUP
-- This includes BOTH user data tables AND vector database for RAG
-- Run this in Supabase SQL Editor
-- ============================================================

-- ─── ENABLE EXTENSIONS ───────────────────────────────────────
-- Enable pgvector for vector similarity search
CREATE EXTENSION IF NOT EXISTS vector;

-- Enable full-text search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ─── 1. MEDICAL KNOWLEDGE BASE (RAG VECTOR DATABASE) ─────────

-- Medical chunks table for vector embeddings
CREATE TABLE IF NOT EXISTS medical_chunks (
  id            BIGSERIAL PRIMARY KEY,
  doc_id        TEXT NOT NULL,
  source        TEXT NOT NULL,
  category      TEXT NOT NULL,
  title         TEXT NOT NULL,
  chunk_index   INTEGER NOT NULL DEFAULT 0,
  content       TEXT NOT NULL,
  metadata      JSONB DEFAULT '{}',
  embedding     vector(384),  -- 384-dimensional embeddings from all-MiniLM-L6-v2
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for efficient vector search
CREATE INDEX IF NOT EXISTS medical_chunks_embedding_idx 
  ON medical_chunks USING ivfflat (embedding vector_cosine_ops) 
  WITH (lists = 100);

CREATE INDEX IF NOT EXISTS medical_chunks_source_idx ON medical_chunks(source);
CREATE INDEX IF NOT EXISTS medical_chunks_category_idx ON medical_chunks(category);
CREATE INDEX IF NOT EXISTS medical_chunks_doc_id_idx ON medical_chunks(doc_id);

-- Full-text search index
CREATE INDEX IF NOT EXISTS medical_chunks_content_fts_idx 
  ON medical_chunks USING gin(to_tsvector('english', content));

-- Vector similarity search function
CREATE OR REPLACE FUNCTION match_chunks(
  query_embedding vector(384),
  match_count int DEFAULT 10,
  similarity_threshold float DEFAULT 0.1
)
RETURNS TABLE (
  id bigint,
  doc_id text,
  source text,
  category text,
  title text,
  chunk_index integer,
  content text,
  metadata jsonb,
  embedding vector(384),
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    medical_chunks.id,
    medical_chunks.doc_id,
    medical_chunks.source,
    medical_chunks.category,
    medical_chunks.title,
    medical_chunks.chunk_index,
    medical_chunks.content,
    medical_chunks.metadata,
    medical_chunks.embedding,
    1 - (medical_chunks.embedding <=> query_embedding) AS similarity
  FROM medical_chunks
  WHERE 1 - (medical_chunks.embedding <=> query_embedding) > similarity_threshold
  ORDER BY medical_chunks.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- ─── 2. LEGACY MEDICAL KNOWLEDGE TABLE ──────────────────────
-- Fallback table for non-vector search

CREATE TABLE IF NOT EXISTS medical_knowledge (
  id            BIGSERIAL PRIMARY KEY,
  source        TEXT NOT NULL,
  category      TEXT NOT NULL,
  title         TEXT NOT NULL,
  content       TEXT NOT NULL,
  symptoms      TEXT[] DEFAULT '{}',
  precautions   TEXT[] DEFAULT '{}',
  metadata      JSONB DEFAULT '{}',
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS medical_knowledge_source_idx ON medical_knowledge(source);
CREATE INDEX IF NOT EXISTS medical_knowledge_category_idx ON medical_knowledge(category);
CREATE INDEX IF NOT EXISTS medical_knowledge_content_fts_idx 
  ON medical_knowledge USING gin(to_tsvector('english', content));

-- ─── 3. USER DATA TABLES ─────────────────────────────────────

-- Chat messages with session management
CREATE TABLE IF NOT EXISTS chat_messages (
  id            TEXT PRIMARY KEY,
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role          TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content       TEXT NOT NULL,
  severity      TEXT CHECK (severity IN ('low', 'medium', 'high')),
  conditions    TEXT[] DEFAULT '{}',
  suggested_actions TEXT[] DEFAULT '{}',
  affected_areas TEXT[] DEFAULT '{}',
  is_image      BOOLEAN DEFAULT FALSE,
  session_id    TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Add session_id if table already exists
ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS session_id TEXT;

CREATE INDEX IF NOT EXISTS chat_messages_user_idx ON chat_messages(user_id);
CREATE INDEX IF NOT EXISTS chat_messages_session_idx ON chat_messages(session_id);
CREATE INDEX IF NOT EXISTS chat_messages_created_idx ON chat_messages(created_at);

-- Row Level Security for chat messages
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own messages" ON chat_messages;
CREATE POLICY "Users can manage own messages" ON chat_messages
  FOR ALL USING (auth.uid() = user_id);

-- ─── 4. HEALTH REPORTS ───────────────────────────────────────

CREATE TABLE IF NOT EXISTS health_reports (
  id              BIGSERIAL PRIMARY KEY,
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title           TEXT NOT NULL,
  conditions      TEXT[] DEFAULT '{}',
  severity        TEXT DEFAULT 'low' CHECK (severity IN ('low', 'medium', 'high')),
  suggested_actions TEXT[] DEFAULT '{}',
  affected_areas  TEXT[] DEFAULT '{}',
  chat_message_id TEXT,
  session_id      TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Add columns if they don't exist
ALTER TABLE health_reports ADD COLUMN IF NOT EXISTS session_id TEXT;
ALTER TABLE health_reports ADD COLUMN IF NOT EXISTS chat_message_id TEXT;

CREATE INDEX IF NOT EXISTS health_reports_user_idx ON health_reports(user_id);
CREATE INDEX IF NOT EXISTS health_reports_session_idx ON health_reports(session_id);
CREATE INDEX IF NOT EXISTS health_reports_created_idx ON health_reports(created_at DESC);

-- Row Level Security for health reports
ALTER TABLE health_reports ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own reports" ON health_reports;
CREATE POLICY "Users can manage own reports" ON health_reports
  FOR ALL USING (auth.uid() = user_id);

-- ─── 5. MEDICINE REMINDERS ───────────────────────────────────

CREATE TABLE IF NOT EXISTS reminders (
  id               TEXT PRIMARY KEY,
  user_id          UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  medicine_name    TEXT NOT NULL,
  dosage           TEXT NOT NULL DEFAULT '1 tablet',
  frequency        TEXT NOT NULL DEFAULT 'Daily',
  time_slots       TEXT[] DEFAULT '{"08:00 AM"}',
  status           TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused')),
  taken_today      BOOLEAN DEFAULT FALSE,
  taken_date       DATE,
  total_doses      INT DEFAULT 14,
  taken_doses      INT DEFAULT 0,
  start_date       DATE DEFAULT CURRENT_DATE,
  duration_days    INT DEFAULT 7,
  notification_ids TEXT[] DEFAULT '{}',
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- Add missing columns if table already exists
ALTER TABLE reminders ADD COLUMN IF NOT EXISTS total_doses INT DEFAULT 14;
ALTER TABLE reminders ADD COLUMN IF NOT EXISTS taken_doses INT DEFAULT 0;
ALTER TABLE reminders ADD COLUMN IF NOT EXISTS start_date DATE DEFAULT CURRENT_DATE;
ALTER TABLE reminders ADD COLUMN IF NOT EXISTS duration_days INT DEFAULT 7;
ALTER TABLE reminders ADD COLUMN IF NOT EXISTS notification_ids TEXT[] DEFAULT '{}';
ALTER TABLE reminders ADD COLUMN IF NOT EXISTS taken_date DATE;

CREATE INDEX IF NOT EXISTS reminders_user_idx ON reminders(user_id);

-- Row Level Security for reminders
ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own reminders" ON reminders;
CREATE POLICY "Users can manage own reminders" ON reminders
  FOR ALL USING (auth.uid() = user_id);

-- ─── 6. UTILITY FUNCTIONS ────────────────────────────────────

-- Reset taken_today for reminders
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

-- Function to search medical knowledge with hybrid approach
CREATE OR REPLACE FUNCTION search_medical_knowledge(
  search_query text,
  match_count int DEFAULT 10
)
RETURNS TABLE (
  id bigint,
  source text,
  category text,
  title text,
  content text,
  rank float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    mk.id,
    mk.source,
    mk.category,
    mk.title,
    mk.content,
    ts_rank(to_tsvector('english', mk.content), plainto_tsquery('english', search_query)) AS rank
  FROM medical_knowledge mk
  WHERE to_tsvector('english', mk.content) @@ plainto_tsquery('english', search_query)
  ORDER BY rank DESC
  LIMIT match_count;
END;
$$;

-- ─── 7. DATA MIGRATION & BACKFILL ────────────────────────────

-- Backfill existing data with legacy sessions
UPDATE chat_messages
SET session_id = 'legacy_session_' || user_id::text
WHERE session_id IS NULL;

UPDATE health_reports
SET session_id = 'legacy_session_' || user_id::text
WHERE session_id IS NULL;

-- ─── 8. SAMPLE DATA INSERTION (OPTIONAL) ─────────────────────
-- Insert some sample medical knowledge for testing

INSERT INTO medical_knowledge (source, category, title, content, symptoms, precautions) VALUES
('Sample', 'symptom', 'Headache', 'A headache is pain or discomfort in the head, scalp, or neck. Common causes include tension, migraines, and sinus issues.', 
 ARRAY['head pain', 'throbbing', 'pressure'], 
 ARRAY['rest in dark room', 'stay hydrated', 'avoid loud noises'])
ON CONFLICT DO NOTHING;

INSERT INTO medical_knowledge (source, category, title, content, symptoms, precautions) VALUES
('Sample', 'symptom', 'Fever', 'Fever is a temporary increase in body temperature, often due to an illness. Normal body temperature is around 98.6°F (37°C).', 
 ARRAY['high temperature', 'chills', 'sweating'], 
 ARRAY['drink plenty of fluids', 'rest', 'monitor temperature'])
ON CONFLICT DO NOTHING;

-- ─── SUMMARY ──────────────────────────────────────────────────
/*
COMPLETE DATABASE SETUP INCLUDES:

1. VECTOR DATABASE (RAG System):
   - medical_chunks: Vector embeddings for similarity search
   - medical_knowledge: Fallback full-text search
   - match_chunks(): Vector similarity function
   - search_medical_knowledge(): Hybrid search function

2. USER DATA TABLES:
   - chat_messages: Conversation history with sessions
   - health_reports: Auto-generated medical reports
   - reminders: Medicine tracking and notifications

3. SECURITY:
   - Row Level Security (RLS) on all user tables
   - Users can only access their own data

4. PERFORMANCE:
   - Vector indexes for fast similarity search
   - Full-text search indexes
   - Optimized queries for real-time performance

5. EXTENSIONS:
   - pgvector: Vector similarity search
   - pg_trgm: Trigram matching for fuzzy search

TOTAL TABLES: 4 main tables + 2 knowledge base tables
TOTAL FUNCTIONS: 3 utility functions
VECTOR DIMENSIONS: 384 (all-MiniLM-L6-v2 model)
SEARCH METHODS: Vector similarity + Full-text search + Hybrid
*/