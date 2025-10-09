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
