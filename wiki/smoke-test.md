# Backend Resume Ingestion Smoke Test

## Purpose

Validate that the candidate ingestion pipeline (upload -> parse -> chunk -> embed -> store) works end-to-end with a single PDF resume using the `/api/candidates/upload` endpoint.

## Scope

This smoke test covers:

- API availability & server start
- PDF file upload handling (Multer)
- Metadata capture (name, email, jobid)
- Unique constraint enforcement `(email, jobid)`
- PDF text extraction (pdf-parse)
- Chunking logic & placeholder embedding generation
- Persistence in `candidates` and `candidate_chunks` tables

It does NOT cover:

- Real embedding model integration
- Retrieval / semantic search endpoint
- Authentication / authorization
- Advanced validation (file size/type limits)

## Prerequisites

- Node.js dependencies installed (`npm install` inside `backend/`)
- PostgreSQL server running locally
- Database + role accessible (environment variables configured in `.env`)
- Permission to create extension `pgvector` (the code issues `CREATE EXTENSION IF NOT EXISTS vector`)
- Sample PDF resume (non-empty text content)

### Environment Variables Required (`backend/.env`)

```
PG_HOST=localhost
PG_PORT=5432
PG_USER=rag_admin
PG_PASSWORD=your_password_here
PG_DATABASE=recruiter_db
PORT=3000
NODE_ENV=development
```

## Start the Server

```bash
cd backend
node server.js
```

Expected console log (approximate):

- PostgreSQL connection success
- Swagger docs available at `/api-docs`

## Access Swagger UI

Navigate to: `http://localhost:3000/api-docs`

## Perform Upload Test

Use `POST /api/candidates/upload` form fields:

- `name`: Jane Doe
- `email`: jane@example.com
- `jobid`: SWE-001
- `file`: Attach `sample.pdf`

Click Execute.

### Expected Response (Example)

```json
{
  "message": "Resume uploaded, parsed, chunked and embeddings stored.",
  "filename": "1698771234567-sample.pdf",
  "chunksStored": 5
}
```

## Database Verification

Open psql or a GUI (e.g., pgAdmin):

```sql
SELECT * FROM candidates ORDER BY id DESC LIMIT 1;
SELECT candidate_id, chunk_index, LEFT(chunk_text, 100) AS preview
FROM candidate_chunks
WHERE candidate_id = <NEW_ID>
ORDER BY chunk_index;
```

Check that:

- Candidate row exists with correct metadata and `resume_path` file name
- Multiple chunk rows exist (>=1)
- `chunk_index` is zero-based and sequential

### Embedding Check

```sql
SELECT chunk_index, embedding
FROM candidate_chunks
WHERE candidate_id = <NEW_ID>
LIMIT 3;
```

Embedding should appear as a 64-d vector literal.

## Duplicate Submission Test

Submit the same PDF again with identical `email` + `jobid`.
Expected:

```json
{
  "error": "Candidate with this email and jobid already exists"
}
```

HTTP Status: 409

## Edge Case Checks

1. Missing file: Submit without attaching PDF → Expect 400 with error message.
2. Missing metadata: Omit `email` → Expect 400.
3. Tiny PDF (few words): Should still create 1 chunk, no failure.
4. Long PDF: Produces many chunks; ensure response still returns success.

## Troubleshooting

| Symptom                                    | Possible Cause                | Resolution                                                |
| ------------------------------------------ | ----------------------------- | --------------------------------------------------------- |
| `ECONNREFUSED`                             | Postgres not running          | Start Postgres (`brew services start postgresql@14`)      |
| `permission denied for extension "vector"` | Role lacks superuser rights   | Enable pgvector manually as superuser or grant privileges |
| `ENOENT uploads`                           | `uploads` directory missing   | Ensure directory exists (`backend/uploads/`)              |
| `chunksStored = 0`                         | PDF parse returned empty text | Try another PDF; confirm file has selectable text         |
| Duplicate error on first upload            | Stale row already in DB       | Remove row or change email/jobid                          |

## Logs to Inspect

Console output during upload for parsing errors:

- "PDF parsing failed" followed by stack trace if `pdf-parse` throws.
  Database logs if extension creation fails.

## Success Criteria

- HTTP 200 response with non-zero `chunksStored`
- Candidate row inserted
- At least one corresponding chunk row with embedding
- Duplicate prevention works

## Next Enhancement Candidates

1. Replace `fakeEmbed` with real model (OpenAI, HuggingFace, local transformer).
2. Add retrieval endpoint: semantic search across `candidate_chunks` using `embedding <=> query_vector`.
3. Sentence/paragraph-aware chunking and merge small trailing chunk.
4. Add validation: file type check (`application/pdf`), max size limit.
5. Async processing queue for large batch uploads.
6. Structured data extraction (skills, years, education) into new columns.
7. Authentication + rate limiting.
8. Observability: request logging + basic metrics (upload count, average chunk count).

## Versioning & Maintenance Notes

- If you change embedding dimension, migrate: create new column, backfill, then drop old.
- Keep this file updated when adding retrieval or altering schema.
- Link to real embedding service docs once integrated.

---

Document owner: Engineering
Last updated: <31 Oct 2025>
