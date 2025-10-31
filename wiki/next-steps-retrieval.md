# Next Steps: Retrieval & Real Embeddings

_Last updated: 2025-10-31_

## Current State Summary

- Ingestion endpoint `/api/candidates/upload` parses PDF resumes, chunks (~200 words), generates **dummy 64-d embeddings** via `fakeEmbed()`, and stores text + vectors in `candidate_chunks` (pgvector `vector(64)` column active).
- PDF parsing fixed using dynamic import of `pdf-parse` and manual wrapper around `PDFParse` class.
- Verification route `/api/candidates/:id/chunks` returns candidate metadata + chunk previews.
- DB user is `rag_admin`; containerized Postgres (pgvector) is healthy.

## Why Change Embeddings Now?

Dummy vectors don't encode semantic meaning, so similarity results will be noise. To enable ranking, semantic search, and smarter candidate-job matching, integrate a real embedding model.

## Target Features

1. **Real Embeddings** (OpenAI, Azure OpenAI, or local Sentence Transformer) with correct dimensionality.
2. **Search Endpoint** `/api/candidates/search` that:
   - Accepts a `query` string and optional filters (e.g., `jobid`, `candidate_id`).
   - Generates a query embedding.
   - Performs similarity search using pgvector (`embedding <=> query_embedding`) if available.
   - Falls back to in-memory cosine similarity if pgvector extension were absent (already detected via `USE_PGVECTOR`).
3. **Indexing** for speed using IVFFLAT or HNSW (pgvector >=0.5.0 supports HNSW). Example:
   ```sql
   -- IVF (requires ANALYZE after creation)
   CREATE INDEX IF NOT EXISTS idx_candidate_chunks_embedding_ivf
     ON candidate_chunks USING ivfflat (embedding vector_cosine_ops) WITH (lists=100);
   ANALYZE candidate_chunks;
   -- OR HNSW (fast, quality)
   CREATE INDEX IF NOT EXISTS idx_candidate_chunks_embedding_hnsw
     ON candidate_chunks USING hnsw (embedding vector_cosine_ops) WITH (m=16, ef_construction=200);
   ```
4. **Backfill / Migration** strategy that doesn't break current ingestion while upgrading vectors.
5. **Testing & Validation**: compare top chunk content with manual expectations for a known résumé.

## Embedding Model Options

| Option                                   | Dim    | Pros                      | Cons                             |
| ---------------------------------------- | ------ | ------------------------- | -------------------------------- |
| OpenAI `text-embedding-3-small`          | 1536   | High quality, simple API  | Paid, external latency           |
| OpenAI `text-embedding-3-large`          | 3072   | Highest quality           | More tokens, cost                |
| Sentence Transformers `all-MiniLM-L6-v2` | 384    | Fast, local               | Lower quality than larger models |
| BGE Large (`bge-large-en-v1.5`)          | 1024   | Strong retrieval accuracy | Heavier model                    |
| Instructor or domain fine-tuned          | Varies | Domain adaptation         | Setup complexity                 |

Pick one and set the column dimension accordingly.

## Safe Migration Path (Recommended)

1. Add new column:
   ```sql
   ALTER TABLE candidate_chunks ADD COLUMN embedding_real vector(1536); -- adjust dim
   ```
2. Add background script/endpoint to:
   - Fetch every chunk missing real embedding.
   - Call provider to embed text (batch chunks per request where API supports).
   - Update `embedding_real`.
3. After completion: swap columns:
   ```sql
   ALTER TABLE candidate_chunks DROP COLUMN embedding;
   ALTER TABLE candidate_chunks RENAME COLUMN embedding_real TO embedding;
   ```
4. Create index:
   ```sql
   CREATE INDEX IF NOT EXISTS idx_candidate_chunks_embedding_hnsw
     ON candidate_chunks USING hnsw (embedding vector_cosine_ops) WITH (m=16, ef_construction=200);
   ANALYZE candidate_chunks;
   ```

## Proposed API Contract: `/api/candidates/search`

Request (JSON or query params):

```json
{
  "query": "graphql microservices migration",
  "jobid": "ENG-001", // optional filter
  "limit": 10 // default 5
}
```

Response:

```json
{
  "query": "graphql microservices migration",
  "results": [
    {
      "candidate_id": 12,
      "chunk_index": 3,
      "score": 0.83, // cosine similarity (higher = closer) or distance inverted
      "chunk_text_preview": "Led migration from REST to GraphQL..."
    }
  ],
  "embedding_dim": 1536,
  "total_examined": 240
}
```

Error Modes:

- 400: missing query
- 500: embedding provider failure (include retry hint)

## Retrieval Implementation Outline

1. Ensure real embedding function (`getEmbedding(text) -> number[]`).
2. In route, get query embedding.
3. If `USE_PGVECTOR` and real vectors present:
   - Build vector literal `'[v1,v2,...]'`.
   - Run: `SELECT candidate_id, chunk_index, chunk_text, (1 - (embedding <=> query_vec)) AS score FROM candidate_chunks ORDER BY embedding <=> query_vec LIMIT $limit;`
   - Convert distance to similarity (1 - cosine distance) for readability.
4. Else fallback:
   - Fetch candidate_chunks in memory (limit scope or set a hard cap to avoid loading everything).
   - Compute cosine similarity in JS, sort, slice.
5. Return response.

## Performance & Scaling Considerations

- Batch embeddings to reduce API calls (OpenAI supports multiple inputs per request).
- Use HNSW index for large data volumes (>100K chunks).
- Periodically `ANALYZE candidate_chunks;` after bulk inserts.
- Add pagination to search results later (cursor or offset).
- Cache common query embeddings for repeated recruiter searches.

## Testing Plan

1. Upload several resumes with obvious differing skill sets (GraphQL, Azure, Data Engineering, Security).
2. Perform queries for each skill term.
3. Manually inspect top 3 chunk previews for relevance.
4. Track average true-positive rate in a small spreadsheet.

## Follow-Up Tasks (Actionable Checklist)

- [ ] Choose embedding model & dimension.
- [ ] Add `embedding_real` column (if migrating).
- [ ] Implement embedding client (OpenAI or local model wrapper).
- [ ] Backfill embeddings (script or endpoint).
- [ ] Swap columns & create HNSW index.
- [ ] Implement `/api/candidates/search` endpoint.
- [ ] Add Swagger doc for search route.
- [ ] Write smoke test for search: query + expect >0 results.

## Optional Enhancements

- Add job description ingestion and cross-compare candidate chunks vs job postings.
- Add re-ranking with LLM (pass top chunks + query into a prompt to refine).
- Add semantic deduplication to avoid storing near-identical chunks.
- Integrate usage metrics (which queries recruiters run most).

---

**Next Action:** Decide on embedding model & dimension. Once chosen, we’ll proceed to implement the migration + search endpoint.
