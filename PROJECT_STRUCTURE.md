# MedAssist RAG - Project Structure

## 📁 Complete Directory Structure

```
medassist-rag/
├── README.md                           # Project overview and setup instructions
├── .gitignore                          # Git ignore rules
├── PROJECT_STRUCTURE.md               # This file - detailed project structure
│
├── project/                           # 📱 FRONTEND (React Native + Expo)
│   ├── app/                          # App screens and routing
│   │   ├── (tabs)/                   # Tab-based navigation
│   │   │   ├── index.tsx            # Home/Dashboard screen
│   │   │   ├── chat.tsx             # Main chat interface
│   │   │   ├── monitor.tsx          # Health monitoring
│   │   │   ├── map.tsx              # Hospital map
│   │   │   ├── profile.tsx          # User profile
│   │   │   └── _layout.tsx          # Tab layout configuration
│   │   ├── auth/                    # Authentication screens
│   │   │   ├── callback.tsx         # Email confirmation handler
│   │   │   └── _layout.tsx          # Auth layout
│   │   ├── _layout.tsx              # Root app layout
│   │   ├── login.tsx                # Login screen
│   │   ├── signup.tsx               # Registration screen
│   │   ├── emergency.tsx            # Emergency guidance
│   │   └── +not-found.tsx           # 404 error page
│   │
│   ├── components/                   # 🧩 Reusable UI Components
│   │   ├── AnatomyViewer.tsx        # Interactive body map
│   │   ├── Button.tsx               # Custom button component
│   │   ├── Card.tsx                 # Card container component
│   │   ├── ChatBubble.tsx           # Chat message bubble
│   │   ├── ReminderCard.tsx         # Medicine reminder card
│   │   └── TypingIndicator.tsx      # Chat typing animation
│   │
│   ├── context/                     # 🔄 State Management
│   │   ├── AppContext.tsx           # Main app state (messages, reminders, etc.)
│   │   └── ThemeContext.tsx         # Theme and styling context
│   │
│   ├── lib/                         # 📚 Utility Libraries
│   │   ├── supabase.ts              # Supabase client configuration
│   │   ├── mockAI.ts                # AI response handling
│   │   ├── imageAnalysis.ts         # Image processing utilities
│   │   └── notifications.ts         # Push notification handling
│   │
│   ├── constants/                   # 🎨 Design System
│   │   ├── colors.ts                # Color palette
│   │   └── theme.ts                 # Typography, spacing, shadows
│   │
│   ├── hooks/                       # 🪝 Custom React Hooks
│   │   └── useFrameworkReady.ts     # Framework initialization hook
│   │
│   ├── assets/                      # 🖼️ Static Assets
│   │   └── images/                  # App icons and images
│   │       ├── logo.png
│   │       ├── icon.png
│   │       └── favicon.png
│   │
│   ├── DSP/                         # 📊 Medical Datasets
│   │   ├── dataset.csv              # Disease-symptom mappings
│   │   ├── symptom_Description.csv  # Symptom descriptions
│   │   ├── symptom_precaution.csv   # Medical precautions
│   │   └── Symptom-severity.csv     # Severity classifications
│   │
│   ├── MedQuAD-master/             # 📖 Medical Knowledge Base
│   │   ├── 1_CancerGov_QA/         # Cancer-related Q&A (1,866 files)
│   │   ├── 2_GARD_QA/              # Genetic diseases Q&A (4,341 files)
│   │   ├── 3_GHR_QA/               # Genetics home reference (3,668 files)
│   │   ├── 4_MPlus_Health_Topics_QA/ # Health topics (4,829 files)
│   │   ├── 5_NIDDK_QA/             # Digestive diseases (814 files)
│   │   ├── 6_NINDS_QA/             # Neurological disorders (1,067 files)
│   │   ├── 7_SeniorHealth_QA/      # Senior health (358 files)
│   │   ├── 8_NHLBI_QA_XML/         # Heart, lung, blood (147 files)
│   │   ├── 9_CDC_QA/               # CDC health info (341 files)
│   │   ├── 10_MPlus_ADAM_QA/       # Medical encyclopedia (4,366 files)
│   │   └── 11_MPlusDrugs_QA/       # Drug information (1,312 files)
│   │
│   ├── supabase-setup.sql          # 🗄️ Database schema and setup
│   ├── app.json                    # Expo configuration
│   ├── package.json                # Frontend dependencies
│   ├── tsconfig.json               # TypeScript configuration
│   ├── babel.config.js             # Babel configuration
│   ├── eas.json                    # Expo Application Services config
│   ├── firebase.json               # Firebase hosting config
│   └── .env                        # Environment variables (not in repo)
│
├── rag-backend/                    # 🖥️ BACKEND (Node.js + Express)
│   ├── src/                        # Source code
│   │   ├── server.js              # 🚀 Main Express server
│   │   ├── rag.js                 # 🧠 Core RAG pipeline (8-step process)
│   │   ├── embed.js               # 🔢 Text embedding generation
│   │   ├── ingest-rag.js          # 📥 Medical data ingestion
│   │   └── setupDb.js             # 🗄️ Database setup utilities
│   │
│   ├── data/                       # 📊 Medical datasets (processed)
│   │   └── (generated during ingestion)
│   │
│   ├── package.json                # Backend dependencies
│   └── .env                        # Environment variables (not in repo)
│
└── docs/                          # 📚 Documentation (optional)
    ├── API.md                     # API documentation
    ├── DEPLOYMENT.md              # Deployment guide
    └── ARCHITECTURE.md            # System architecture
```

## 🔑 Key Files for Project Report

### Core RAG Implementation Files:
1. **`rag-backend/src/rag.js`** - Main RAG pipeline with 8-step process
2. **`rag-backend/src/embed.js`** - Text embedding generation
3. **`rag-backend/src/server.js`** - Express API server
4. **`rag-backend/src/ingest-rag.js`** - Medical data ingestion

### Frontend Core Files:
1. **`project/app/(tabs)/chat.tsx`** - Main chat interface
2. **`project/context/AppContext.tsx`** - State management
3. **`project/lib/supabase.ts`** - Database client
4. **`project/lib/mockAI.ts`** - AI integration

### Database & Configuration:
1. **`project/supabase-setup.sql`** - Database schema
2. **`project/app.json`** - App configuration
3. **`rag-backend/package.json`** - Backend dependencies
4. **`project/package.json`** - Frontend dependencies

## 📊 File Statistics

- **Total Medical Q&A Pairs**: 47,457+ entries
- **Frontend Components**: 6 reusable components
- **App Screens**: 8 main screens
- **Backend API Endpoints**: 5+ endpoints
- **Database Tables**: 4 main tables
- **Medical Data Sources**: 11 different medical databases

## 🚀 Deployment Structure

```
Production Environment:
├── Frontend: Firebase Hosting (medassistrag.web.app)
├── Backend: Render.com (medassist-rag-backend.onrender.com)
├── Database: Supabase PostgreSQL
├── File Storage: Supabase Storage
└── Mobile Apps: Expo Application Services (EAS)
```