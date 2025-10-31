# 🤖 **The AI-Powered Recruiter**

### _A Developer’s Guide to Building AI-Powered Mobile Recruitment Apps_

---

## 📘 Overview

This guide takes you step-by-step through the journey of building a **scalable, intelligent recruitment system** that blends **LLMs**, **Retrieval-Augmented Generation (RAG)**, and **mobile-first architecture**.

You’ll learn how to transform messy, unstructured resume data into a structured, searchable knowledge base — and how to use modern AI tooling and agent-driven workflows to build it efficiently.

---

## 🧭 Table of Contents

| **Chapter**   | **Title**                                                                                                                                                                 | **Key Focus**                                                                                                                                                                                                                           |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Chapter 1** | [🧩 **Introduction: The Problem and The LLM Solution**](https://github.com/subraatakumar/AI-Powered-Recruiter/blob/main/content/1_chapter_1.md)                           | Defines the initial challenge of unstructured data, introduces the **two-stage LLM transformation process**, and highlights the **scalability limits** of a simple, single-model approach.                                              |
| **Chapter 2** | [⚙️ **Scaling with RAG**](https://github.com/subraatakumar/AI-Powered-Recruiter/blob/main/content/002_chapter_2.md)                                                       | A conceptual deep dive into **Retrieval-Augmented Generation (RAG)** — explaining its **four core components** (_Chunking, Embedding, Vector Database, Similarity Search_) and how they enable **high-volume recruitment scalability**. |
| **Chapter 3** | [🏗️ **The Full Tech Stack and Intelligence Flow**](https://github.com/subraatakumar/AI-Powered-Recruiter/blob/main/content/003_chapter_3.md)                              | Finalizes the comprehensive architecture: **Expo (Frontend)**, **Node.js (Backend)**, **PostgreSQL + pgvector (Database)**, and the **secure hybrid blend of Local AI (UX)** and **Cloud AI (Ranking)**.                                |
| **Chapter 4** | [💬 **Agent-Driven Development: Mastering GitHub Copilot Chat**](https://github.com/subraatakumar/AI-Powered-Recruiter/blob/main/content/004_chapter_4.md)                | A modern developer’s guide to using the **Copilot Agent** effectively — covering **prompt engineering**, **multi-step code generation**, and **best practices for API key security** in professional workflows.                         |
| **Chapter 5** | [**Backend Specification and Setup Blueprint**](https://github.com/subraatakumar/AI-Powered-Recruiter/blob/main/content/005_chapter_5.md)                                 | Node.js backend requirements, technology stack, functional and non-functional specs                                                                                                                                                     |
| **Chapter 6** | [**Implementing the Node.js RAG Backend (Part 1) – Server and Database Setup**](https://github.com/subraatakumar/AI-Powered-Recruiter/blob/main/content/006_chapter_6.md) | Secure backend setup, environment initialization, database schema                                                                                                                                                                       |

## Join Tech Craft Club on Discord

[Click here to join our Discord community!](https://discord.gg/QFGDrXC8)

---

## 🚀 Clone & Run: Local Developer Onboarding

Follow these steps to get the backend running with a pgvector-enabled PostgreSQL instance and optional pgAdmin.

### 1. Prerequisites

Install the following:

- **Git** (https://git-scm.com/downloads)
- **Docker Desktop** (https://www.docker.com/products/docker-desktop)
- **Node.js 18+** (https://nodejs.org/) – backend uses Express 5
- Optional: **pgAdmin 4** (GUI) OR rely on `psql` CLI

Verify installs:

```bash
git --version
node --version
npm --version
docker --version
```

### 2. Clone the Repository

```bash
git clone https://github.com/subraatakumar/AI-Powered-Recruiter.git
cd AI-Powered-Recruiter/backend
```

### 3. Environment Variables

Copy `.env.example` if provided (or create `.env`) and ensure at minimum:

```env
PG_HOST=localhost
PG_PORT=5432
PG_USER=rag_admin
PG_PASSWORD=secretpw
PG_DATABASE=recruiter_db
PORT=3000
LLM_API_KEY=YOUR_CLOUD_LLM_SECRET_KEY   # placeholder for future embedding / ranking
```

### 4. Start PostgreSQL with pgvector

Return to repo root (where `docker-compose.yml` lives):

```bash
cd ..
docker compose up -d db
```

This uses the `ankane/pgvector` image and auto-creates the `vector` extension at initialization via mounted SQL script.

Health check:

```bash
docker compose ps
docker compose logs db | grep -i ready
```

Confirm extension:

```bash
docker compose exec db psql -U rag_admin -d recruiter_db -c "SELECT extname, version FROM pg_extension WHERE extname='vector';"
```

### 5. (Optional) Add pgAdmin Container

Append to `docker-compose.yml` under `services:`:

```yaml
	pgadmin:
		image: dpage/pgadmin4:8
		restart: unless-stopped
		ports:
			- "5050:80"
		environment:
			PGADMIN_DEFAULT_EMAIL: admin@example.com
			PGADMIN_DEFAULT_PASSWORD: adminpw
		depends_on:
			- db
```

Start:

```bash
docker compose up -d pgadmin
```

Visit http://localhost:5050, register server:

- Host: db (if inside compose) or localhost (if local pgAdmin)
- Port: 5432
- User: rag_admin
- Password: secretpw

### 6. Install Backend Dependencies

```bash
cd backend
npm install
```

### 7. Run the Backend Server

```bash
node server.js
```

Swagger UI available at: http://localhost:3000/api-docs

### 8. Upload a Resume (Smoke Test)

```bash
curl -F "name=Jane Candidate" -F "email=jane@example.com" -F "jobid=ENG-001" -F "file=@/absolute/path/to/resume.pdf" http://localhost:3000/api/candidates/upload
```

Expected JSON:

```json
{
  "message": "Resume uploaded, parsed, chunked and embeddings stored.",
  "filename": "...pdf",
  "chunksStored": 6
}
```

### 9. Inspect Stored Chunks

API:

```bash
curl http://localhost:3000/api/candidates/1/chunks | jq
```

SQL:

```bash
docker compose exec db psql -U rag_admin -d recruiter_db -c "SELECT candidate_id, chunk_index, LEFT(chunk_text,100) AS preview FROM candidate_chunks WHERE candidate_id=1 ORDER BY chunk_index;"
```

### 10. Understanding Embeddings (Currently Dummy)

Vectors are generated by `fakeEmbed()` (placeholder). They do not represent semantic meaning yet.
Next steps documented in `wiki/next-steps-retrieval.md` for upgrading to real embeddings & search.

### 11. Common Troubleshooting

| Issue              | Resolution                                                                        |
| ------------------ | --------------------------------------------------------------------------------- |
| `pdf-parse` errors | Ensure Node 18+, delete `node_modules` and reinstall.                             |
| No rows in tables  | Confirm upload endpoint returned success; check logs for parse errors.            |
| pgvector missing   | Remove volume (`docker compose down -v`) and recreate; ensure init script mounts. |
| Port conflict 5432 | Stop local Postgres (Homebrew) or change host port mapping in compose.            |

### 12. Clean Reset

To wipe all data (including extension re-init):

```bash
docker compose down -v
docker compose up -d db
```

### 13. Next Feature Roadmap

- Integrate real embedding model (OpenAI, local transformer)
- Add `/api/candidates/search` semantic retrieval endpoint
- Create HNSW or IVF index for speed
- Add job description ingestion + matching
- Implement auth & role-based access
- Add background embedding backfill task

### 14. Security Notes

- Do not commit real API keys; use `.env` and optionally `.env.local` (gitignored).
- Consider creating a non-superuser DB role for production.
- Add rate limiting & file size limits before exposing publicly.

### 15. Contributing

PRs welcome. Please open an issue describing the change first for larger features.

---

Need help or ideas? Open an issue or ask in Discord.
