# Chapter 5: Backend Specification and Setup Blueprint

> The Node.js server is the engine of intelligence for The AI-Powered Recruiter. Its primary responsibility is to securely execute computationally expensive and sensitive tasks that cannot run on the mobile client. This blueprint breaks down the server’s requirements into **Functional** (what the server must do) and **Non-Functional** (how securely and efficiently the server must do it).

## 5.1 The Technology Foundation

| Stack Element      | Role in the Application     | Rationale                                                                 |
| ------------------ | --------------------------- | ------------------------------------------------------------------------- |
| Node.js/Express    | API Server & Business Logic | Fast, scalable, non-blocking environment for RAG ops & API key management |
| PostgreSQL         | Primary Data Storage        | Stores relational data (User/Job IDs, Application Dates, etc.)            |
| pgvector Extension | Vector Database             | Enables fast, native vector similarity search in PostgreSQL               |

## 5.2 Functional Requirements (What the Server Must Do)

The server must manage two distinct intelligence phases: **Indexing** (ingesting data) and **Querying** (retrieving intelligence).

### A. Data Management and Ingestion

| ID  | Requirement            | Description                                                                  | Technology Focus        |
| --- | ---------------------- | ---------------------------------------------------------------------------- | ----------------------- |
| F1  | Secure Authentication  | Implement a secure login mechanism for the HR Admin to protect all endpoints | JWT/Session Management  |
| F2  | Job Posting Management | Allow authenticated users to Create, Read, Update, Delete job postings       | PostgreSQL (Relational) |
| F3  | Resume File Storage    | Accept raw PDF resume file from mobile app and store reliably                | Cloud/Local Storage     |

### B. The Core Intelligence Pipeline (RAG)

| ID  | Requirement               | Description                                                                                             | RAG Stage         |
| --- | ------------------------- | ------------------------------------------------------------------------------------------------------- | ----------------- |
| F4  | Structured Extraction     | Process raw resume text, call Cloud LLM to convert to standardized JSON                                 | Stage 1: Indexing |
| F5  | Chunking & Indexing       | Divide standardized resume text into smaller, semantically distinct chunks for embedding                | Stage 1: Indexing |
| F6  | Vectorization & Storage   | Convert each chunk to vector using Embedding Model, store in pgvector table with candidate/job ID       | Stage 1: Indexing |
| F7  | Contextual Search         | Receive natural language query, search pgvector DB for top K relevant chunks                            | Stage 2: Querying |
| F8  | Final Synthesis & Ranking | Package HR query and retrieved chunks, send to Cloud LLM for final ranked list and actionable rationale | Stage 2: Querying |

## 5.3 Non-Functional Requirements (How the Server Must Perform)

These requirements focus on the quality and robustness of the application.

| ID  | Requirement           | Description                                                                                   | Impact          |
| --- | --------------------- | --------------------------------------------------------------------------------------------- | --------------- |
| N1  | Security Isolation    | All sensitive info (API keys, credentials) must be in `.env` and excluded from source control | Mandatory       |
| N2  | Low Latency Search    | Contextual Search (F7) must complete in under 1 second for responsive admin app               | Performance     |
| N3  | Robust Error Handling | Server must gracefully handle timeouts and API errors, return clear error messages            | Reliability     |
| N4  | Scalability           | RAG architecture must index/query thousands of candidates without degradation                 | Future-Proofing |

> With this precise blueprint, we are now fully prepared to begin the implementation chapters. The next logical step is to set up the necessary environment and create the database schema.
