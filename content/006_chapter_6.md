# Chapter 6: Implementing the Node.js RAG Backend (Part 1) – Server and Database Setup

Our journey into implementation begins with the secure setup of the Node.js Express server and the PostgreSQL database. This step creates the foundation required for the entire RAG pipeline.

## 6.1 Environment Initialization and Dependencies

Before we use the Copilot Agent, initialize your project and install the core packages:

**Initialize Node.js:**
Run `npm init -y` in your backend directory.

**Install Dependencies:**
We need Express for the server, pg to connect to PostgreSQL, and dotenv to manage our secrets.

```bash
npm install express pg dotenv
```

## 6.2 Securing Your Secrets (.env)

As defined in N1 (Security Isolation), we must protect our credentials. Create a file named `.env` in your project root and populate it with your PostgreSQL connection details and a placeholder for our upcoming LLM key.

> Crucially, ensure `.env` is listed in your `.gitignore` file.

```
--- DATABASE CONFIGURATION (PostgreSQL) ---
PG_HOST=localhost
PG_PORT=5432
PG_USER=rag_admin
PG_PASSWORD=your_secure_password
PG_DATABASE=recruiter_db

--- CLOUD LLM CONFIGURATION (Will be used later) ---
LLM_API_KEY=YOUR_CLOUD_LLM_SECRET_KEY

```

## 6.3 Agent-Driven Backend Setup (`server.js`)

Our first task for the Copilot Agent is to generate the entire Express server setup and establish the database connection (F1 and N3).

**The Agent Prompt**
We instruct the Agent to handle the secure loading of variables, the connection logic, and the server start process in one go.

> "Write a complete Node.js Express server file named server.js. The server must connect to a PostgreSQL database using the pg package's Pool functionality. Use the dotenv package to load credentials from environment variables. Define the Express app and test the pool connection with a simple query (e.g., SELECT 1). Include a robust try/catch block for the database connection and log a success message if connected. Export the pool object, define a simple root route, and start the server on port 3000."

**Generated File:** `server.js`

```
const express = require('express');
const { Pool } = require('pg');
require('dotenv').config(); // Load environment variables from .env

const app = express();
const port = 3000;

// Middleware for parsing JSON requests
app.use(express.json());

// 1. Configure the PostgreSQL Pool using environment variables (N1)
const pool = new Pool({
    user: process.env.PG_USER,
    host: process.env.PG_HOST,
    database: process.env.PG_DATABASE,
    password: process.env.PG_PASSWORD,
    port: process.env.PG_PORT,
});

// 2. Test Database Connection (N3: Robustness Check)
const connectToDB = async () => {
    try {
        await pool.query('SELECT 1');
        console.log('✅ PostgreSQL database connected successfully.');
    } catch (error) {
        console.error('❌ Database connection failed:', error.message);
        // Exit the process if the database connection fails
        process.exit(1);
    }
};

// 3. Define a simple root route
app.get('/', (req, res) => {
    res.status(200).json({ message: 'AI Recruiter Backend Operational' });
});

// 4. Start the server and connect to the database
connectToDB().then(() => {
    app.listen(port, () => {
        console.log(`🚀 Server listening at http://localhost:${port}`);
    });
});

// Export the pool so other modules can use it for database interaction
module.exports = { pool };
```

## 6.4 Agent-Driven Database Schema (`database.sql`)

Next, we define the structure of our database, which includes both the relational data (`job_postings`) and the high-dimensional vector data (`candidate_vectors`). This fulfills requirements F2 and F6.

**The Agent Prompt**
We must explicitly command the Agent to enable the pgvector extension and use the specific `vector(768)` data type.

> "Write the complete PostgreSQL schema in a file named database.sql. This script must first include the command to CREATE EXTENSION IF NOT EXISTS pgvector;. Define two tables: 1. job_postings (id SERIAL PRIMARY KEY, title VARCHAR(255), description TEXT, created_at TIMESTAMP DEFAULT NOW()). 2. candidate_vectors. The candidate_vectors table must have columns for id (SERIAL PRIMARY KEY), job_id (INT REFERENCES job_postings(id)), candidate_id (VARCHAR(100) UNIQUE), text_chunk (TEXT), and a column named vector_embedding of type vector(768)."

**Generated File:** `database.sql`

```
-- Must be executed first to enable vector storage capabilities
CREATE EXTENSION IF NOT EXISTS pgvector;

-- 1. Table for Relational Data: Job Postings (F2)
-- This is where the HR admin defines the hiring goal.
CREATE TABLE job_postings (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
);

-- 2. Table for Vector Data: Candidate Resume Chunks (F6)
-- This table stores the high-dimensional vectors and the text chunks used for RAG search.
CREATE TABLE candidate_vectors (
    id SERIAL PRIMARY KEY,
    -- Links this chunk to a specific job posting
    job_id INT REFERENCES job_postings(id) ON DELETE CASCADE,
    -- A unique identifier for the candidate (we'll use a UUID from the mobile app)
    candidate_id VARCHAR(100) NOT NULL,
    -- The actual text that was used to create the vector
    text_chunk TEXT NOT NULL,
    -- The vector itself (768 is a common dimension for many modern embedding models)
    vector_embedding vector(768)
);

-- Note: In a production environment, we would also add a HNSW or IVFFLAT index
-- to the vector_embedding column for faster search performance (N2).
```

---

We have successfully set up the secure backend environment, established a database connection, and defined the schema necessary to handle both relational data and high-dimensional vectors.
