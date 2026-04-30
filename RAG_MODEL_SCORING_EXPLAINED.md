# RAG Model Scoring System Explained

## 🎯 Overview
The MedAssist RAG system uses a sophisticated multi-stage scoring approach to find the most relevant medical information for user queries. Here's how the scoring works:

---

## 📊 RAG Pipeline Scoring Stages

### **Stage 1: Vector Search Scoring** 🔍
**Method**: Cosine similarity between query embedding and document embeddings
**Range**: 0.0 to 1.0 (displayed as percentage)

**Example from "diabetes symptoms" query:**
```
🔍 TOP VECTOR SEARCH RESULTS:
  1. [51.5%] Diabetic Neuropathies: The Nerve Damage of Diabetes
  2. [50.3%] Diabetic Kidney Problems  
  3. [49.7%] Diabetic Kidney Disease
```

**How it works:**
- Query: "What are the symptoms of diabetes?"
- Expanded: "diabetes mellitus blood sugar insulin glucose hyperglycemia"
- Embedding model: `all-MiniLM-L6-v2` (384 dimensions)
- Cosine similarity calculated against 11,458 medical document chunks

---

### **Stage 2: Keyword Search Scoring** 🔤
**Method**: BM25-style full-text search with PostgreSQL
**Range**: 1.0 to 0.0 (normalized by rank position)

**Example:**
```
🔤 TOP KEYWORD SEARCH RESULTS:
  1. [100.0%] Type 2 Diabetes (exact keyword match)
  2. [96.7%] Diabetes (high keyword relevance)
  3. [93.3%] Pancreatic Cancer (related terms)
```

**How it works:**
- Extracts meaningful terms: ["diabetes", "symptoms"]
- PostgreSQL `websearch` query: `diabetes | symptoms`
- Scores based on term frequency and document relevance

---

### **Stage 3: Reciprocal Rank Fusion (RRF)** 🔄
**Method**: Combines vector and keyword rankings
**Formula**: `RRF_score = Σ 1/(k + rank_i)` where k=60

**Example:**
```
🔄 RECIPROCAL RANK FUSION SCORES:
  1. [RRF: 0.0164] Diabetic Neuropathies (high in both vector + keyword)
  2. [RRF: 0.0164] Type 2 Diabetes (perfect keyword match)
  3. [RRF: 0.0161] Diabetic Kidney Problems (strong vector match)
```

**How it works:**
- Takes top results from both vector and keyword search
- Merges rankings using reciprocal rank fusion
- Higher RRF score = better combined relevance

---

### **Stage 4: Cross-Encoder Re-ranking** 🎯
**Method**: Lexical overlap scoring with medical term boosting
**Range**: 0.0 to 5.0+ (can exceed 100% when displayed as percentage)

**Example:**
```
🎯 FINAL RE-RANKED RESULTS:
  1. Vector: 93.3% | RRF: 0.0159 | Rerank: 268.3%
  2. Vector: 83.3% | RRF: 0.0152 | Rerank: 480.6%
  3. Vector: 51.5% | RRF: 0.0164 | Rerank: 353.3%
```

**How it works:**
- Calculates term overlap between query and document content
- Medical terms get 2x weight boost: `symptom`, `disease`, `treatment`, etc.
- **Coverage**: `matches / total_query_terms`
- **Density**: `weighted_matches / total_document_terms`
- **Final Score**: `coverage * 0.7 + density * 0.3`

---

### **Stage 5: Final Blended Scoring** ⚖️
**Method**: Weighted combination of all scores
**Formula**: `Final = (Vector_sim * 0.6) + (Rerank_score * 0.4)`

**Example Analysis:**
```
Document: "Agenesis of the dorsal pancreas"
- Vector Similarity: 83.3% (good semantic match)
- RRF Score: 0.0152 (moderate combined ranking)  
- Rerank Score: 480.6% (excellent lexical overlap)
- Final Ranking: #2 (high rerank score boosted it up)
```

---

## 🏆 Scoring Interpretation

### **Vector Scores (Semantic Similarity)**
- **90-100%**: Excellent semantic match
- **70-89%**: Good conceptual relevance  
- **50-69%**: Moderate similarity
- **30-49%**: Weak but potentially relevant
- **<30%**: Poor match

### **RRF Scores (Combined Ranking)**
- **>0.016**: Top-tier results (rank 1-3 in both searches)
- **0.014-0.016**: High-quality results
- **0.012-0.014**: Good results
- **<0.012**: Lower priority results

### **Rerank Scores (Lexical Relevance)**
- **>400%**: Exceptional term overlap with medical boost
- **200-400%**: Strong lexical match
- **100-200%**: Good term coverage
- **50-100%**: Moderate relevance
- **<50%**: Weak lexical match

---

## 🧠 Model Information

### **Embedding Model**: `all-MiniLM-L6-v2`
- **Dimensions**: 384
- **Size**: ~25MB
- **Strengths**: Fast, good for medical domain
- **Performance**: ~50ms per query embedding

### **Generation Model**: `llama-3.3-70b-versatile` (Groq)
- **Parameters**: 70 billion
- **Context**: 32k tokens
- **Speed**: ~1500ms for medical responses
- **Temperature**: 0.2 (factual, less creative)

---

## 📈 Performance Metrics

### **From Latest Query:**
```
📊 Pipeline Stats: 15 vector + 15 keyword → 30 fused → 12 reranked → 6 final
⚡ Total Processing Time: 2491ms
📊 Estimated tokens used: 2117
📤 Response length: 2455 characters
```

### **Breakdown:**
- **Embedding**: ~100ms
- **Vector Search**: ~200ms  
- **Keyword Search**: ~150ms
- **RRF + Reranking**: ~50ms
- **LLM Generation**: ~1444ms
- **Total**: ~2491ms

---

## 🎯 Quality Indicators

### **High-Quality Results Show:**
1. **Balanced Scores**: Good performance across vector, RRF, and rerank
2. **Medical Relevance**: High rerank scores indicate medical term matches
3. **Semantic Understanding**: Strong vector scores show conceptual grasp
4. **Source Diversity**: Results from multiple knowledge bases (MedQuAD, DSP, BuiltinKnowledge)

### **Example of Excellent Result:**
```
"Diabetic Neuropathies: The Nerve Damage of Diabetes"
📈 Vector: 51.5% | RRF: 0.0164 | Rerank: 353.3%
📚 Source: MedQuAD | Category: qa
```
- **Vector**: Moderate semantic match (diabetes-related)
- **RRF**: Top combined ranking (0.0164)
- **Rerank**: Excellent lexical overlap (353.3%)
- **Result**: High-quality, relevant medical information

---

## 🔍 How to Interpret Your Results

When you see RAG scores, look for:

1. **Vector scores 40%+** = Semantically relevant
2. **RRF scores 0.014+** = High combined ranking  
3. **Rerank scores 200%+** = Strong medical term overlap
4. **Multiple high scores** = Most reliable results
5. **Source diversity** = Comprehensive coverage

The system automatically selects the top 6 results after all scoring stages to provide the most relevant medical information for generating responses.