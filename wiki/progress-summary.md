# Project Progress Summary

_Last updated: 2025-10-31_

## 1. Vision & Scope

Build an AI-powered recruitment backend that ingests PDF resumes, converts them into chunked, vectorized data, and enables future semantic retrieval & ranking (RAG pipeline). Current focus: ingestion reliability and data readiness.

## 2. Implemented Components

| Area                            | Status      | Notes                                                                                                                                                                |
| ------------------------------- | ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Express Server                  | ✅          | `server.js` boots on port 3000, Swagger at `/api-docs`.                                                                                                              |
| Database (Postgres + pgvector)  | ✅          | Dockerized via `ankane/pgvector` image, automatic extension creation with `docker/initdb/01_create_vector_extension.sql`.                                            |
| Environment Setup               | ✅          | `.env` variables (`PG_HOST`, `PG_USER=rag_admin`, etc.) documented in README onboarding section.                                                                     |
| Resume Upload Endpoint          | ✅          | `POST /api/candidates/upload` stores candidate row, parses PDF, chunks text, creates dummy embedding vectors, persists in `candidate_chunks`. Returns `candidateId`. |
| PDF Parsing                     | ✅ (Stable) | Implemented dynamic import wrapper using `PDFParse` class from `pdf-parse` 2.4.5 after resolving pure ESM export issues.                                             |
| Chunking Strategy               | ✅          | Fixed-size ~200-word, no overlap; produced chunk count returned in response.                                                                                         |
| Dummy Embeddings                | ✅          | `fakeEmbed()` generates deterministic 64-d placeholders (not semantic).                                                                                              |
| Candidate Listing (with Chunks) | ✅          | `GET /api/candidates/with-chunks` returns candidates that have at least one chunk + `chunk_count`.                                                                   |
| Chunk Inspection                | ✅          | `GET /api/candidates/:id/chunks` returns chunk previews & embedding dimension (constant 64 for pgvector). Input validation added (numeric range).                    |
| DB Constraints                  | ✅          | `UNIQUE(email, jobid)` prevents duplicate application for the same job.                                                                                              |
| Error Handling Improvements     | ✅          | Graceful PDF parse failures, ID validation, fallback if pgvector missing (`USE_PGVECTOR` flag).                                                                      |
| Wiki Documentation              | ✅          | `next-steps-retrieval.md` plus this summary.                                                                                                                         |
| Readme Onboarding               | ✅          | Detailed clone/run instructions appended.                                                                                                                            |

## 3. Key Files

- `backend/server.js`: Express app, Swagger setup, mounts candidates routes.
- `backend/routes/candidates.js`: All ingestion logic, table creation helpers, PDF parsing wrapper, chunk listing, candidates-with-chunks route.
- `backend/db.js`: Connection pool (shared across routes).
- `docker-compose.yml`: Postgres service (pgvector image) + volume for persistence.
- `docker/initdb/01_create_vector_extension.sql`: Ensures `CREATE EXTENSION vector;` on initial DB init.
- `wiki/next-steps-retrieval.md`: Detailed plan for real embeddings and retrieval.
- `README.md`: Project overview + developer onboarding instructions.

## 4. Current Database Schema (Simplified)

```sql
CREATE TABLE candidates (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  jobid TEXT NOT NULL,
  resume_path TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(email, jobid)
);

-- Vector extension active; embedding column is vector(64)
CREATE TABLE candidate_chunks (
  id SERIAL PRIMARY KEY,
  candidate_id INTEGER REFERENCES candidates(id) ON DELETE CASCADE,
  chunk_index INTEGER NOT NULL,
  chunk_text TEXT NOT NULL,
  embedding vector(64),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

Index:

```sql
CREATE INDEX IF NOT EXISTS idx_candidate_chunks_candidate_id ON candidate_chunks(candidate_id);
```

## 5. Data Flow (Upload Endpoint)

1. Ensure tables exist (idempotent).
2. Validate required fields + PDF file.
3. Reject duplicate (email, jobid) combos.
4. Insert candidate row.
5. Read PDF and parse text using `PDFParse` wrapper.
6. Chunk text (≈200 words each).
7. Generate fake 64-d embedding per chunk.
8. Insert chunk rows with embeddings.
9. Return JSON containing `candidateId`, chunk count, filename.

## 6. Known Limitations / Technical Debt

| Category         | Limitation                 | Planned Resolution                                            |
| ---------------- | -------------------------- | ------------------------------------------------------------- |
| Embeddings       | Dummy vectors only         | Integrate real model (OpenAI / local transformer).            |
| Retrieval        | No search endpoint yet     | Implement `/api/candidates/search` using pgvector similarity. |
| Indexing         | No vector similarity index | Add HNSW or IVF index after real embeddings.                  |
| Chunk Quality    | Fixed-size, no overlap     | Evaluate semantic chunking / overlap for recall.              |
| Security         | No auth / rate limiting    | Add JWT or API key layer before external exposure.            |
| Large PDFs       | Potential many chunks      | Add max chunk cap & asynchronous embedding queue.             |
| Schema Evolution | Hard-coded dimension (64)  | Abstract dimension; migration path documented in wiki.        |

## 7. Decisions & Rationale

- **pgvector** chosen over generic vector DB to minimize infra complexity and keep transactional consistency.
- **Deterministic placeholder embeddings** to unblock ingestion flow quickly before committing to specific embedding provider cost/performance trade-offs.
- **Dynamic PDF parsing wrapper** due to pure ESM package + mixed CJS environment (Node executed via `node server.js`).
- **In-process chunking & embedding** (synchronous) because current scale is small; will shift to asynchronous background jobs for large batches.

## 8. Validation & Testing Performed

- Successful upload returns parsed chunks (confirmed >0 chunk count for sample resumes).
- Listing endpoints return correct candidate metadata and chunk previews.
- Handling of invalid candidate IDs (large or malformed) returns HTTP 400 instead of PostgreSQL error.
- pgvector extension presence confirmed via `SELECT extname FROM pg_extension WHERE extname='vector';`.

## 9. Next High-Impact Steps

1. Choose embedding model + dimension (e.g., 1536 for OpenAI small).
2. Add `embedding_real` column; backfill real embeddings; swap columns.
3. Implement `/api/candidates/search` endpoint: query text → embedding → similarity ranking.
4. Create HNSW/IVF index for scalable retrieval.
5. Add job description ingestion to enable candidate-job matching.
6. Introduce auth & rate limiting (Express middleware).
7. Add smoke test scripts (automated) for upload + search.

## 10. Suggested Endpoint Additions (Future)

- `GET /api/candidates/search?query=...&limit=...`
- `POST /api/embeddings/backfill` (admin-only) to populate missing real vectors.
- `POST /api/jobs/upload` to ingest job descriptions for matching.
- `GET /api/candidates/:id/match/:jobid` semantic match score.

## 11. Operational Tips

- To wipe data: `docker compose down -v && docker compose up -d db`.
- Add pgAdmin sidecar for GUI inspection (see README instructions).
- Monitor ingestion performance; consider streaming parse for very large PDFs.

## 12. Open Questions

| Question                                               | Notes                                                     |
| ------------------------------------------------------ | --------------------------------------------------------- |
| Which embedding model to adopt?                        | Balance cost vs quality; 384 vs 1536 vs >1000 dims.       |
| Need multi-language support?                           | Might influence model choice (e.g., multilingual MiniLM). |
| Will retrieval require hybrid filters (jobid, skills)? | Plan composite indexes early.                             |

## 13. Glossary

- **Chunk**: A segment of resume text (~200 words) used for fine-grained semantic retrieval.
- **Embedding**: Numeric vector representation capturing semantic meaning (dummy now, real later).
- **pgvector**: PostgreSQL extension adding vector datatype + similarity operators.
- **HNSW**: Graph-based nearest neighbor index for efficient high-dimensional similarity.

## 14. Credits / Authors

Project owner: @subraatakumar
Assistance: Guidance on architecture, parsing, vector setup, documentation.

## 15. How to Contribute

- Fork repository.
- Create feature branch (`feat/search-endpoint`).
- Submit PR with description, include any migration SQL if schema changes.
- Ensure endpoints have Swagger docs and minimal tests.

---

**Next Action:** Approve embedding model choice and begin implementing real embeddings + search endpoint.
