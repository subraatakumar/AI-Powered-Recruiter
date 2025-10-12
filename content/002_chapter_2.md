# Chapter 2 — Scaling with RAG

In the previous chapter we built a simple two‑stage LLM pipeline to parse, score and rank candidates. That approach works well for experimenting with a few dozen resumes, but it is fundamentally not scalable. An LLM’s context window — its “desk” for holding the documents it reasons over — is finite. A popular app with thousands of applicants will quickly overwhelm that desk.

This chapter introduces Retrieval‑Augmented Generation (RAG), the architectural pattern that lets AI systems access and reason over massive external data stores without trying to cram everything into the LLM at once. We’ll explain the why, the how, and where RAG becomes mandatory for our AI‑Powered Recruiter.

---

## 2.1 Why RAG? The Haystack Analogy

Imagine a library with ten thousand books (each book is a resume). The LLM is the world’s fastest reader — it can read and summarize instantly — but it can only read the stack you hand it. If you hand it everything, it chokes or hallucinate.

RAG is the hyper‑efficient card catalog and librarian that instantly points you to the exact pages you need. Rather than sending the LLM the whole library, RAG retrieves the relevant pages and hands those to the LLM to reason over.

Key benefit: RAG filters and grounds the LLM’s input so the LLM can reason efficiently, accurately, and cost‑effectively.

---

## 2.2 What is Retrieval‑Augmented Generation (RAG)?

RAG is the marriage of a retrieval system (search) and a generative model (LLM). Instead of using brute force — passing all data to the LLM — RAG converts the corpus into searchable representations and retrieves only the most relevant snippets for the LLM to consume.

Analogy: RAG is a librarian who fetches the three pages you actually need from ten thousand books, and only then asks the LLM to synthesize and rank the findings.

---

## 2.3 The Four Pillars of a RAG Pipeline

A robust RAG implementation requires four components working together:

1. Chunking (Segmentation)
2. Embedding (Quantification)
3. Vector Database (Storage)
4. Similarity Search (Retrieval)

We’ll walk through each and explain why they matter for an HR application.

### 1) Chunking — Breaking Down the Walls

Definition:

- Breaking documents (e.g., multi‑page resumes or long job descriptions) into smaller pieces called chunks — typically 200–500 words each.

Why:

- A chunk fits more naturally into a single vector representation.
- When someone searches for “Python experience”, you don’t need the whole resume — just the relevant section (Technical Skills, Projects).

Application:

- In our Node.js backend we’ll parse PDFs into raw text, then chunk the text into manageable pieces before embedding.

Tips:

- [Preserve semantic boundaries when possible (skills block, job entry).](https://github.com/subraatakumar/AI-Powered-Recruiter/blob/main/content/explanations/preserving%20semantic%20boundaries.md)
- [Consider overlap between chunks (sliding window) to avoid cutting relevant context.](https://github.com/subraatakumar/AI-Powered-Recruiter/blob/main/content/explanations/overlaping_chunks.md)

### 2) Embedding — Giving Text a Numeric Fingerprint

Definition:

- An embedding model maps a chunk of text to a numeric vector: [0.12, −0.45, 0.99, …].

Why:

- LLMs and databases can do math; they can’t natively reason about raw text semantics.
- Embeddings place similar meanings close together in vector space, enabling semantic search.

Application:

- Use an embedding model (cloud or local) to convert every chunk into a vector.
- Store metadata with each vector: candidate ID, document position, chunk text, source file, timestamp.

### 3) Vector Database — Storing Millions of Fingerprints

Definition:

- A specialized database designed for storing and querying high‑dimensional vectors efficiently.

Why:

- Traditional relational or document databases aren’t optimized for nearest‑neighbor search at scale.
- Vector DBs make similarity search fast and cost‑efficient.

Application:

- We will use PostgreSQL with the pgvector extension to store vectors and basic metadata.
- For ultra‑large scale, consider dedicated vector stores (e.g., FAISS, Milvus, or cloud providers) — but pgvector is a pragmatic, simple start.

### 4) Similarity Search — Pulling the Needles from the Haystack

Definition:

- Convert the user’s query into a query vector and find stored vectors that are closest according to a similarity metric (e.g., cosine similarity).

Flow:

- HR query (text) -> embedding -> vector query
- Vector DB returns top K matching chunks (e.g., top 10–50)
- Attach candidate IDs and the original chunks, and pass them to the LLM for final synthesis and ranking

Why:

- This yields fast, relevant results without ever loading the full corpus into the LLM.

---

## 2.4 The RAG Ranking Flow in an HR App

When an HR admin asks the system to “rank candidates for Senior AWS DevOps”, a RAG pipeline typically follows these steps:

1. Convert the query to a vector using the same embedding model.
2. Run a similarity search in the vector DB to retrieve the top N chunks (e.g., 20–50).
3. Gather the text chunks and associated candidate metadata.
4. Pass only those retrieved chunks to the LLM with a prompt instructing it to:
   - Judge relevance
   - Rank candidates
   - Provide explanations and citations (the chunk and source)
5. Present ranked candidates with grounded evidence and source links.

This is the scalable ranking engine: the LLM only sees a tiny, highly relevant slice of the corpus.

---

## 2.5 When RAG Is Required — The Mandatory Use Cases

RAG is not optional when your application meets one or more of these conditions:

A. Massive Scale and Volume

- If you operate at thousands to millions of documents (resumes, manuals, legal docs), RAG is required. You cannot load this into an LLM.

B. Private or Sensitive Documents

- When data is proprietary, copyrighted, or sensitive, you usually can’t (and shouldn’t) train or fine‑tune the LLM on it. RAG allows you to keep the data in secure storage and retrieve it on demand without exposing it to wholesale training.

C. Guaranteeing Factual Accuracy (Grounding)

- If you must provide citations and stick to facts, RAG enforces the LLM to answer based on retrieved chunks and reduces hallucinations.

In practice, an HR product with 1,000+ candidates and the need for evidence‑backed decisions becomes a RAG application.

---

## 2.6 RAG vs. Our Current Small‑Scale Approach

Small‑scale approach (learning phase):

- We parse resume PDFs and convert them into structured JSON.
- We load all parsed candidate fields into the LLM context when asking it to rank.
- Works for dozens of candidates, but quickly becomes impractical.

Large‑scale RAG approach:

- Skip rigid structured JSON for every field; embed the raw text chunks directly.
- Store vectors and metadata in a vector DB.
- Use similarity search to retrieve only the top relevant chunks (e.g., 50).
- Instruct the LLM to synthesize answers only from retrieved facts and produce citations.

Tradeoffs:

- Small scale: simpler, easier to reason about, useful for learning.
- RAG scale: requires additional infra (embeddings, vector DB, search), but it's essential for performance, cost, and accuracy at scale.

---

## 2.7 Practical Considerations & Implementation Notes

Chunking strategy

- Chunk size affects recall and context. Typical chunk sizes: 200–500 words.
- Overlap chunks for context continuity where necessary.

Embedding model

- Use a single embedding model consistently for both documents and queries.
- Monitor for model drift; if you switch embedding models, re‑embed your corpus.

Vector DB choice

- Start with PostgreSQL + pgvector for simplicity and transactional features.
- For very large corpora or low‑latency needs, evaluate FAISS, Milvus, or managed vector stores.

Retrieval count (top K)

- Start with K between 10–50. Lower K reduces tokens and cost; higher K may increase accuracy but at higher cost.
- Use an LLM‑side reranker if needed: first retrieve coarse matches, then rerank with the LLM.

Grounding and hallucinations

- Always instruct the LLM to cite source chunks and avoid inventing facts.
- Log and verify LLM outputs against retrieved chunks during QA and user acceptance.

Security & privacy

- Protect vector metadata and the underlying documents.
- For sensitive personal data, consider encryption at rest and strict access controls.

Cost management

- Embedding every document once at ingestion keeps runtime costs low.
- Cache embeddings and reuse them across queries.

---

## 2.8 Benefits: Why RAG is the Scalable Choice

- Faster response time — the LLM reasons over a much smaller input.
- Lower cost — fewer LLM tokens per query.
- Scalable performance — handles thousands to millions of documents.
- Higher relevance — the LLM focuses on contextually pertinent facts.
- Grounded answers — easier to provide citations and comply with privacy constraints.

---

## 2.9 Summary

RAG turns an LLM into a scalable, evidence‑backed search and reasoning system by:

- Converting text into vectors,
- Storing them in a purpose-built vector database,
- Retrieving the best candidate chunks using similarity search,
- Passing only those chunks to the LLM for final ranking and synthesis.

For an AI‑Powered Recruiter, RAG is the architectural backbone that enables fast, accurate and auditable candidate search at production scale.

---

## 2.10 What’s Next

In Chapter 3 we’ll design the full tech stack and intelligence flow for the AI‑Powered Recruiter:

- Backend: Node.js — where parsing, chunking, and embedding happen
- Database: PostgreSQL + pgvector (or specialized vector stores for larger scale)
- AI Layer: local inference for instant UX feedback and cloud RAG for scalable ranking
- Orchestration: how local inference and cloud retrieval interact for a smooth user experience

We’ll provide sample data pipelines, code snippets, and an end‑to‑end diagram showing how candidate documents travel from upload → parsing → vector storage → retrieval → LLM ranking → results.

---

## FAQ

**Q1: Does converting candidate data to vectors require using LLMs?**

**A:** Yes, converting candidate data—such as resumes or job descriptions—into vectors typically involves using a Large Language Model (LLM) or a specialized embedding model. Here’s a beginner-friendly explanation:

When you want a computer to understand and compare the meaning of text (not just match keywords), you need to turn that text into a format it can process mathematically. This is done by creating a “vector”—a list of numbers that represents the meaning of the text. To generate these vectors, you use an embedding model, which is often a smaller, specialized version of an LLM. The model reads the text and produces a unique vector for each chunk of information (for example, a candidate’s skills section or a job requirement).

This process is called “embedding.” It’s important to note that embedding is a one-time operation for each piece of data. Once a candidate’s resume is embedded and stored in the vector database, you don’t need to re-embed it unless the data changes. This is much more efficient than sending the entire resume to an LLM every time you want to search or rank candidates. Embedding models are designed to be fast and cost-effective, so the cost per candidate is low compared to full LLM inference.

**Q2: If vector databases cost money, how does RAG reduce overall cost?**

**A:** It’s true that using a vector database (like pgvector, Pinecone, or FAISS) involves some cost for storing and searching vectors. However, the main advantage of RAG (Retrieval-Augmented Generation) is that it dramatically reduces the much higher costs associated with LLM usage.

Here’s why:

- **Vector databases are optimized for speed and efficiency.** They can quickly search through thousands or millions of vectors to find the most relevant matches for a query. The cost of storing and searching vectors is generally much lower than the cost of running LLM queries, especially as your data grows.

- **RAG minimizes LLM usage.** Instead of sending all candidate data to the LLM for every search or ranking operation, RAG uses the vector database to filter out only the most relevant candidates (for example, the top 10 or 20 matches). Only these selected candidates are sent to the LLM for deeper analysis and ranking. This means you pay LLM costs for a tiny fraction of your data, not the whole database.

- **Lower token usage means lower LLM bills.** LLMs charge based on the number of tokens (words or pieces of words) processed. By narrowing the input to just the best matches, RAG keeps token usage—and costs—low.

- **One-time embedding cost vs. repeated LLM cost.** Embedding each candidate is a one-time cost when they enter the system. In contrast, running LLM inference for every candidate, every time you search, would be extremely expensive and slow.

**In summary:** Vector databases do add a small cost, but they enable you to use LLMs in a much more targeted and efficient way. RAG makes large-scale, AI-powered recruitment affordable by combining fast, cheap retrieval with selective, high-value LLM analysis.
