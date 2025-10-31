# AI-Powered Recruiter Backend

This backend service powers the AI-Powered Recruiter system, implementing a secure, scalable, and intelligent recruitment workflow. It leverages Hugging Face LLM APIs and a Retrieval-Augmented Generation (RAG) architecture to deliver advanced candidate matching and ranking.

## Key Features

### Admin Login & JWT Authentication

The backend provides an `/api/admin/login` endpoint for HR/admin login. It verifies predefined credentials (email and password) and, upon success, returns a JWT token. This token must be included in the `Authorization` header for all protected admin API calls.

**Login Flow:**

1. Admin sends email and password to `/api/admin/login`.
2. Backend verifies credentials against environment variables or a secure config.
3. If valid, backend returns a JWT token.
4. Admin uses this token for subsequent API requests.

**Example Request:**

```http
POST /api/admin/login
Content-Type: application/json

{
   "email": "admin@example.com",
   "password": "yourpassword"
}
```

**Example Response:**

```json
{
  "token": "<JWT_TOKEN>"
}
```

**Usage:**
Include the JWT token in the `Authorization` header as `Bearer <JWT_TOKEN>` for all protected endpoints.

## Architecture

- Node.js backend (Express/Serverless) as secure API gateway
- Hugging Face LLM API for embeddings, extraction, and synthesis
- PostgreSQL with pgvector for data and vector storage
- RESTful API endpoints for all major operations
- Secure authentication and authorization

### Main Pipelines

1. **RAG Indexing Flow:**
   - Upload PDF resumes, parse and chunk text, generate embeddings via LLM, store vectors in pgvector.
2. **Structured Data Extraction Flow:**
   - Extract clean candidate data using LLM and store as JSON in PostgreSQL.
3. **Local Intelligence Flow:**
   - Provide instant, offline candidate feedback using on-device models and backend summaries.
4. **Contextual Ranking Flow:**
   - Convert HR queries to vectors, retrieve relevant resume chunks, synthesize ranked candidate lists with rationales using LLM.

## Local Development with Docker (pgvector-enabled PostgreSQL)

We provide a `docker-compose.yml` to run PostgreSQL with the pgvector extension preinstalled so you can ingest resumes and store embeddings without manual extension compilation.

### Start Database

```bash
docker compose up -d
```

Healthcheck ensures the container is ready. Verify:

```bash
docker compose ps
```

### Environment Variables (`backend/.env`)

Update to match container credentials:

```
PG_HOST=localhost
PG_PORT=5432
PG_USER=rag_admin
PG_PASSWORD=secretpw
PG_DATABASE=recruiter_db
PORT=3000
NODE_ENV=development
```

### Apply Extension (First Run)

The ankane image already ships pgvector. Still, the app executes:

```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

If you want to check manually:

```bash
docker exec -it pgvector-db psql -U rag_admin -d recruiter_db -c "\dx"
```

### Common Commands

```bash
docker compose logs -f db        # tail database logs
docker compose stop              # stop container
docker compose down              # stop and remove
docker compose down -v           # remove data volume (DESTROYS DATA)
```

### pgAdmin Connection

Use GUI pgAdmin or TablePlus:

- Host: localhost
- Port: 5432
- User: rag_admin
- Password: secretpw
- Database: recruiter_db

### Data Persistence

Embeddings and candidate records persist in the named volume `pgdata`. Removing the volume resets all stored resumes/chunks.

### Migrating from Local Homebrew Postgres

1. Stop local service (`brew services stop postgresql@14`).
2. Bring containers up with compose.
3. Export old data if needed: `pg_dump -U rag_admin recruiter_db > backup.sql` then restore into container with `psql -U rag_admin -d recruiter_db -f backup.sql`.

### Future Enhancements

- Add a `pgadmin` service to compose for a browser UI.
- Introduce an IVFFLAT index: `CREATE INDEX ON candidate_chunks USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);`
- Configure automated backups (cron + `pg_dump`).
- Add a retrieval API endpoint using embedding similarity (`embedding <=> query_vector`).
