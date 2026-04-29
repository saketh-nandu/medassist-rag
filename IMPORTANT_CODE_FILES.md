# Important Code Files for Project Report

## 🧠 Core RAG Implementation

### 1. `rag-backend/src/rag.js` - Main RAG Pipeline
**Purpose**: Implements the 8-step Retrieval-Augmented Generation pipeline
**Key Features**:
- Query rewriting with medical ontology
- Hybrid retrieval (vector + keyword search)
- Reciprocal Rank Fusion (RRF)
- Cross-encoder re-ranking
- Maximal Marginal Relevance (MMR)
- Groq LLM integration

**Code Highlights**:
```javascript
// 8-Step RAG Pipeline
export async function ragQuery(userMessage, history = []) {
  // 1. Query rewriting with medical synonyms
  // 2. Text embedding generation
  // 3. Vector + keyword retrieval
  // 4. Reciprocal Rank Fusion
  // 5. Cross-encoder re-ranking
  // 6. MMR diversification
  // 7. Context building
  // 8. LLM generation with Groq
}
```

### 2. `rag-backend/src/embed.js` - Embedding Generation
**Purpose**: Generates 384-dimensional text embeddings using Transformers.js
**Key Features**:
- all-MiniLM-L6-v2 model integration
- Batch processing for efficiency
- Caching mechanisms

### 3. `rag-backend/src/server.js` - Express API Server
**Purpose**: RESTful API server with CORS and error handling
**Endpoints**:
- `POST /api/chat` - Main chat endpoint
- `GET /api/health` - Health check
- Error handling and logging

### 4. `rag-backend/src/ingest-rag.js` - Data Ingestion
**Purpose**: Processes and ingests medical datasets into vector database
**Features**:
- XML parsing for MedQuAD dataset
- CSV processing for symptom data
- Chunk generation and embedding
- Batch database insertion

## 📱 Frontend Core Files

### 5. `project/app/(tabs)/chat.tsx` - Main Chat Interface
**Purpose**: Primary user interface for medical consultations
**Key Features**:
- Real-time messaging
- Image upload and analysis
- Emergency detection
- Confidence scoring display
- Message persistence

**Code Structure**:
```typescript
export default function ChatScreen() {
  // Message handling
  // Image analysis
  // Emergency detection
  // UI rendering with animations
}
```

### 6. `project/context/AppContext.tsx` - State Management
**Purpose**: Global state management for the entire application
**Manages**:
- Chat messages and sessions
- User authentication
- Health reminders
- Medical reports
- User profile data

**Key Functions**:
```typescript
// Message management
const addMessage = useCallback(async (msg: ChatMessage) => {
  // Save to Supabase with RLS
});

// Session management
const loadSession = useCallback(async (sessionId: string) => {
  // Load chat history
});
```

### 7. `project/lib/supabase.ts` - Database Client
**Purpose**: Supabase client configuration with authentication
**Features**:
- Cross-platform storage handling
- Authentication flow configuration
- Real-time subscriptions setup

### 8. `project/lib/mockAI.ts` - AI Integration
**Purpose**: Handles communication with RAG backend
**Functions**:
- API request handling
- Response parsing
- Error handling
- Retry mechanisms

## 🗄️ Database & Configuration

### 9. `project/supabase-setup.sql` - Database Schema
**Purpose**: Complete database setup with tables and policies
**Tables Created**:
- `chat_messages` - Conversation storage
- `health_reports` - Medical reports
- `reminders` - Medicine tracking
- `medical_chunks` - Vector embeddings

**Key Features**:
```sql
-- Row Level Security
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own messages" ON chat_messages
  FOR ALL USING (auth.uid() = user_id);

-- Vector similarity function
CREATE OR REPLACE FUNCTION match_chunks(
  query_embedding vector(384),
  match_count int DEFAULT 10
)
```

### 10. `project/app.json` - App Configuration
**Purpose**: Expo and app configuration
**Includes**:
- App metadata
- Platform-specific settings
- Plugin configurations
- Build settings

## 📊 Package Dependencies

### 11. `rag-backend/package.json` - Backend Dependencies
**Key Dependencies**:
```json
{
  "@supabase/supabase-js": "^2.39.0",
  "@xenova/transformers": "^2.17.2",
  "groq-sdk": "^0.3.3",
  "express": "^4.18.2"
}
```

### 12. `project/package.json` - Frontend Dependencies
**Key Dependencies**:
```json
{
  "expo": "~54.0.34",
  "react-native": "0.81.5",
  "@supabase/supabase-js": "^2.58.0",
  "lucide-react-native": "^0.544.0"
}
```

## 🔧 Configuration Files

### 13. `project/tsconfig.json` - TypeScript Configuration
**Purpose**: TypeScript compiler settings for the frontend

### 14. `rag-backend/.env` - Backend Environment Variables
**Contains**:
- Supabase URL and service key
- Groq API key
- Database connection strings

### 15. `project/.env` - Frontend Environment Variables
**Contains**:
- Supabase public URL and anon key
- RAG backend API URL

## 📈 Code Statistics

- **Total Lines of Code**: ~15,000+ lines
- **TypeScript Files**: 25+ files
- **JavaScript Files**: 10+ files
- **SQL Files**: 1 comprehensive schema
- **Configuration Files**: 8+ files
- **Medical Data Files**: 47,457+ Q&A pairs

## 🎯 Files to Highlight in Report

**For Technical Implementation Section**:
1. `rag-backend/src/rag.js` - Core AI pipeline
2. `project/context/AppContext.tsx` - State management
3. `project/supabase-setup.sql` - Database design

**For System Architecture Section**:
1. `rag-backend/src/server.js` - Backend architecture
2. `project/app/(tabs)/chat.tsx` - Frontend architecture
3. `project/lib/supabase.ts` - Database integration

**For Data Processing Section**:
1. `rag-backend/src/ingest-rag.js` - Data ingestion
2. `rag-backend/src/embed.js` - Embedding generation
3. Medical dataset files in `project/MedQuAD-master/`