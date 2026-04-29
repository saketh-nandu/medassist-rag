# MedAssist RAG - AI-Powered Medical Assistant

An intelligent medical assistant application that combines Retrieval-Augmented Generation (RAG) technology with a user-friendly mobile and web interface. The application helps users get evidence-based medical information by analyzing symptoms, providing health guidance, and offering personalized medical recommendations.

## 🚀 Features

- **AI-Powered Medical Chat**: Get intelligent responses based on medical literature
- **Image Analysis**: Upload photos of injuries or medicine labels for AI analysis
- **Medicine Reminders**: Smart medication tracking and reminder system
- **Health Reports**: Automatic generation of health reports based on conversations
- **Emergency Detection**: Automatic detection of emergency situations with immediate guidance
- **Body Map Visualization**: Interactive anatomy viewer showing affected areas

## 🏗️ Architecture

### Frontend (React Native + Expo)
- Cross-platform mobile and web application
- Built with React Native and Expo Router
- TypeScript for type safety
- Supabase for authentication and real-time data

### Backend (Node.js + Express)
- RESTful API with Express.js
- Advanced RAG pipeline with 8-step process
- Groq API integration for LLM responses
- Vector embeddings with Transformers.js

### Database (Supabase + PostgreSQL)
- PostgreSQL with pgvector extension
- Row Level Security (RLS) for data privacy
- Real-time subscriptions
- Medical knowledge base with 47,457+ entries

## 📁 Project Structure

```
medassist-rag/
├── project/                    # Frontend (React Native + Expo)
│   ├── app/                   # App screens and navigation
│   ├── components/            # Reusable UI components
│   ├── lib/                   # Utility libraries
│   ├── context/               # React Context providers
│   └── assets/                # Images and static files
├── rag-backend/               # Backend API server
│   ├── src/                   # Source code
│   │   ├── rag.js            # Main RAG pipeline
│   │   ├── embed.js          # Embedding generation
│   │   ├── server.js         # Express server
│   │   └── ingest-rag.js     # Data ingestion
│   └── data/                  # Medical datasets
└── docs/                      # Documentation
```

## 🛠️ Technology Stack

**Frontend:**
- React Native 0.81.5
- Expo SDK 54
- TypeScript
- Supabase Client
- Expo Router

**Backend:**
- Node.js + Express.js
- Groq SDK (Llama-3.3-70B)
- Transformers.js
- PostgreSQL + pgvector

**AI/ML:**
- Retrieval-Augmented Generation (RAG)
- Vector similarity search
- Medical knowledge base (MedQuAD dataset)
- Hybrid retrieval (vector + keyword)

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Expo CLI
- Supabase account
- Groq API key

### Frontend Setup
```bash
cd project
npm install
expo start
```

### Backend Setup
```bash
cd rag-backend
npm install
npm run dev
```

### Environment Variables
Create `.env` files in both `project/` and `rag-backend/` directories with the required API keys and database URLs.

## 📊 RAG Pipeline

The application uses an advanced 8-step RAG pipeline:

1. **Query Rewriting**: Expand queries with medical synonyms
2. **Embedding**: Convert to 384-dimensional vectors
3. **Vector Retrieval**: Cosine similarity search
4. **Keyword Retrieval**: BM25-style full-text search
5. **Reciprocal Rank Fusion**: Merge results
6. **Cross-Encoder Re-ranking**: Relevance scoring
7. **MMR Diversification**: Ensure diverse results
8. **LLM Generation**: Generate responses with Groq

## 🔒 Security & Privacy

- Row Level Security (RLS) policies
- JWT-based authentication
- HTTPS encryption
- Input validation and sanitization
- HIPAA-compliant data handling

## 📱 Deployment

- **Frontend**: Firebase Hosting (medassistrag.web.app)
- **Backend**: Render.com
- **Database**: Supabase managed PostgreSQL
- **Mobile**: Expo Application Services (EAS)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- MedQuAD dataset for medical knowledge base
- Groq for LLM inference
- Supabase for backend infrastructure
- Expo for cross-platform development

## 📞 Contact

For questions or support, please open an issue in this repository.