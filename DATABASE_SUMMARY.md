# Database Architecture Summary

## 📊 Complete Database Setup

**Yes, the `supabase-setup.sql` file contains the COMPLETE database setup** for the entire MedAssist RAG project. Here's what it includes:

## 🗄️ Database Tables Overview

### 1. Vector Database (RAG System)
```sql
-- Main vector storage for RAG
medical_chunks (
  id BIGSERIAL PRIMARY KEY,
  doc_id TEXT,
  source TEXT,
  category TEXT,
  title TEXT,
  chunk_index INTEGER,
  content TEXT,
  metadata JSONB,
  embedding vector(384),  -- 384-dimensional embeddings
  created_at TIMESTAMPTZ
)

-- Fallback full-text search
medical_knowledge (
  id BIGSERIAL PRIMARY KEY,
  source TEXT,
  category TEXT,
  title TEXT,
  content TEXT,
  symptoms TEXT[],
  precautions TEXT[],
  metadata JSONB,
  created_at TIMESTAMPTZ
)
```

### 2. User Data Tables
```sql
-- Chat conversations with session management
chat_messages (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  role TEXT CHECK (role IN ('user', 'assistant')),
  content TEXT,
  severity TEXT CHECK (severity IN ('low', 'medium', 'high')),
  conditions TEXT[],
  suggested_actions TEXT[],
  affected_areas TEXT[],
  is_image BOOLEAN,
  session_id TEXT,
  created_at TIMESTAMPTZ
)

-- Auto-generated health reports
health_reports (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  title TEXT,
  conditions TEXT[],
  severity TEXT,
  suggested_actions TEXT[],
  affected_areas TEXT[],
  chat_message_id TEXT,
  session_id TEXT,
  created_at TIMESTAMPTZ
)

-- Medicine reminders and tracking
reminders (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  medicine_name TEXT,
  dosage TEXT,
  frequency TEXT,
  time_slots TEXT[],
  status TEXT CHECK (status IN ('active', 'paused')),
  taken_today BOOLEAN,
  taken_date DATE,
  total_doses INT,
  taken_doses INT,
  start_date DATE,
  duration_days INT,
  notification_ids TEXT[],
  created_at TIMESTAMPTZ
)
```

## 🔍 Key Database Features

### Vector Search Function
```sql
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
```

### Security Policies (RLS)
```sql
-- Row Level Security for all user tables
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own messages" ON chat_messages
  FOR ALL USING (auth.uid() = user_id);

ALTER TABLE health_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own reports" ON health_reports
  FOR ALL USING (auth.uid() = user_id);

ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own reminders" ON reminders
  FOR ALL USING (auth.uid() = user_id);
```

### Performance Indexes
```sql
-- Vector similarity search (IVFFlat algorithm)
CREATE INDEX medical_chunks_embedding_idx 
  ON medical_chunks USING ivfflat (embedding vector_cosine_ops) 
  WITH (lists = 100);

-- Full-text search indexes
CREATE INDEX medical_chunks_content_fts_idx 
  ON medical_chunks USING gin(to_tsvector('english', content));

-- User data indexes
CREATE INDEX chat_messages_user_idx ON chat_messages(user_id);
CREATE INDEX chat_messages_session_idx ON chat_messages(session_id);
CREATE INDEX health_reports_user_idx ON health_reports(user_id);
CREATE INDEX reminders_user_idx ON reminders(user_id);
```

## 📈 Database Statistics

- **Total Tables**: 6 (4 user data + 2 knowledge base)
- **Vector Dimensions**: 384 (all-MiniLM-L6-v2 embeddings)
- **Medical Records**: 47,457+ Q&A pairs
- **Search Methods**: Vector similarity + Full-text + Hybrid RAG
- **Security**: Row Level Security on all user tables
- **Extensions**: pgvector, pg_trgm

## 🔧 Database Configuration

### Extensions Enabled
```sql
CREATE EXTENSION IF NOT EXISTS vector;      -- Vector similarity search
CREATE EXTENSION IF NOT EXISTS pg_trgm;     -- Trigram matching
```

### Utility Functions
```sql
-- Reset daily medication tracking
CREATE OR REPLACE FUNCTION reset_taken_today()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $
BEGIN
  UPDATE reminders
  SET taken_today = FALSE, taken_date = NULL
  WHERE taken_today = TRUE
    AND (taken_date IS NULL OR taken_date < CURRENT_DATE);
END;
$;
```

## 🎯 For Your Project Report

**Database Highlights to Mention**:

1. **Hybrid Architecture**: Combines traditional relational data with vector embeddings
2. **Vector Search**: 384-dimensional embeddings with cosine similarity
3. **Security**: Row Level Security (RLS) for data privacy
4. **Performance**: Optimized indexes for real-time queries
5. **Scalability**: Designed for 47,000+ medical documents
6. **Real-time**: Supabase real-time subscriptions for live updates

**File Location**: `project/supabase-setup.sql` (Complete database setup)
**Repository Link**: https://github.com/saketh-nandu/medassist-rag/blob/main/project/supabase-setup.sql