/**
 * Candidates Route Module
 * -----------------------
 * WHAT: Provides the /api/candidates/upload endpoint to ingest a candidate's resume PDF
 * along with basic metadata (name, email, jobid). It parses the PDF, chunks the text,
 * generates placeholder embeddings, and stores everything in PostgreSQL.
 * WHY: This forms the ingestion leg of the RAG pipeline—turning raw documents into
 * structured + vectorized data so later queries (semantic search / ranking) are fast.
 * HOW TO MODIFY: Replace fakeEmbed() with a real embedding model call. Adjust chunking
 * strategy (size/overlap) as needed. Extend schema for additional metadata.
 */
const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
// Import shared PostgreSQL pool (db.js exports the pool directly, not an object)
const pool = require("../db");
if (!pool) {
  console.error(
    "[Startup] Database pool is undefined. Check db.js export and environment variables."
  );
}

/**
 * Multer Configuration
 * WHAT: Handles incoming multipart/form-data containing the PDF resume.
 * WHY: We need a reliable way to accept file uploads; Multer stores the file so we
 * can parse it immediately.
 * CHANGE OPTIONS: To limit file size, add 'limits: { fileSize: ... }'. To support
 * multiple files, use upload.array().
 */
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, "../uploads"));
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  },
});
const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "application/pdf") {
      cb(null, true);
    } else {
      cb(new Error("Only PDF files are allowed!"));
    }
  },
});

/**
 * Chunking & Embedding Utilities
 * chunkText(raw): Splits resume text into roughly word-bound chunks for semantic indexing.
 * WHY CHUNK: Smaller pieces let similarity search focus and reduce prompt token usage.
 * TUNE: Adjust wordsPerChunk or introduce overlap for better recall.
 * fakeEmbed(text): Generates a deterministic 64-dim vector. Placeholder until a
 * real model (e.g. sentence-transformers) is integrated. Replace by calling an
 * embedding service and storing returned vector.
 */
function chunkText(raw, wordsPerChunk = 200) {
  const words = raw.split(/\s+/).filter(Boolean);
  const chunks = [];
  for (let i = 0; i < words.length; i += wordsPerChunk) {
    const slice = words.slice(i, i + wordsPerChunk).join(" ");
    if (slice.trim()) chunks.push(slice);
  }
  return chunks;
}

function fakeEmbed(text) {
  // Deterministic pseudo embedding of length 64 for experimentation
  const len = 64;
  const arr = new Array(len).fill(0);
  let h = 0;
  for (let i = 0; i < text.length; i++) {
    h = (h * 31 + text.charCodeAt(i)) >>> 0;
    arr[i % len] = arr[i % len] + (h % 1000) / 1000;
  }
  const norm = Math.sqrt(arr.reduce((s, v) => s + v * v, 0)) || 1;
  return arr.map((v) => v / norm);
}

/**
 * Attempt to resolve the pdf-parse library across its possible export styles.
 * Newer versions are pure ESM with conditional exports, older ones were CJS.
 * We try node-specific path first for clarity, then generic, then dynamic import variants.
 */
async function resolvePdfParse() {
  // New pdf-parse exposes a PDFParse class, not a direct function.
  // We'll attempt to load the ESM build then create a thin wrapper compatible with previous usage.
  const tried = [];
  // Attempt native ESM import first (works in Node >= 16 with type: module packages even from CJS context via dynamic import)
  try {
    const esm = await import("pdf-parse");
    const PDFParseClass =
      esm.PDFParse ||
      (esm.default && esm.default.PDFParse
        ? esm.default.PDFParse
        : esm.default?.PDFParse);
    if (esm.PDFParse) {
      return async function pdfParse(buffer) {
        const parser = new esm.PDFParse({ data: buffer });
        const textResult = await parser.getText();
        await parser.destroy();
        return { text: textResult.text };
      };
    } else if (PDFParseClass) {
      return async function pdfParse(buffer) {
        const parser = new PDFParseClass({ data: buffer });
        const textResult = await parser.getText();
        await parser.destroy();
        return { text: textResult.text };
      };
    }
    tried.push("dynamic pdf-parse: no PDFParse class found");
  } catch (e) {
    tried.push(`dynamic import pdf-parse failed: ${e.message}`);
  }
  // Fallback: directly import internal path of ESM distribution
  try {
    const internal = await import("pdf-parse/dist/pdf-parse/esm/index.js");
    if (internal.PDFParse) {
      return async function pdfParse(buffer) {
        const parser = new internal.PDFParse({ data: buffer });
        const textResult = await parser.getText();
        await parser.destroy();
        return { text: textResult.text };
      };
    }
    tried.push("internal esm index: PDFParse missing");
  } catch (e) {
    tried.push(`internal esm index failed: ${e.message}`);
  }
  // Fallback: Attempt CJS path (may only contain helper functions for node; likely not PDFParse)
  try {
    const cjs = require("pdf-parse/dist/pdf-parse/cjs/index.cjs");
    if (cjs && cjs.PDFParse) {
      return async function pdfParse(buffer) {
        const parser = new cjs.PDFParse({ data: buffer });
        const textResult = await parser.getText();
        await parser.destroy();
        return { text: textResult.text };
      };
    }
    tried.push("cjs index: PDFParse missing");
  } catch (e) {
    tried.push(`cjs index require failed: ${e.message}`);
  }
  console.error("[pdf-parse] Unable to construct parser.", tried);
  return null;
}

// Ensure candidates table exists
async function ensureCandidatesTable() {
  /**
   * candidates table
   * WHAT: Stores one row per candidate submission.
   * UNIQUE(email, jobid): Prevents duplicate applications for the same job.
   * EXTEND: Add columns (e.g. status, years_experience, parsed_json) when extraction layer is built.
   */
  await pool.query(`
    CREATE TABLE IF NOT EXISTS candidates (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      jobid TEXT NOT NULL,
      resume_path TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(email, jobid)
    );
  `);
}

// Flag that indicates whether pgvector extension is available
let USE_PGVECTOR = true;

async function ensureChunksTable() {
  /**
   * candidate_chunks table + pgvector
   * WHAT: Stores per-chunk text and its embedding. Embedding is currently vector(64)
   * matching fakeEmbed dimension.
   * WHY: Enables similarity search later (retrieve relevant chunks before LLM ranking).
   * CHANGE: When switching to a real model (e.g., 384-dim or 768-dim), alter column definition
   * and re-embed existing chunks.
   */
  try {
    await pool.query(`CREATE EXTENSION IF NOT EXISTS vector`);
    USE_PGVECTOR = true;
  } catch (err) {
    USE_PGVECTOR = false;
    console.warn(
      "[pgvector] Extension not available. Falling back to float8[] column for embeddings.",
      err.message
    );
  }
  if (USE_PGVECTOR) {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS candidate_chunks (
        id SERIAL PRIMARY KEY,
        candidate_id INTEGER REFERENCES candidates(id) ON DELETE CASCADE,
        chunk_index INTEGER NOT NULL,
        chunk_text TEXT NOT NULL,
        embedding vector(64),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
  } else {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS candidate_chunks (
        id SERIAL PRIMARY KEY,
        candidate_id INTEGER REFERENCES candidates(id) ON DELETE CASCADE,
        chunk_index INTEGER NOT NULL,
        chunk_text TEXT NOT NULL,
        embedding float8[],
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
  }
  await pool.query(
    `CREATE INDEX IF NOT EXISTS idx_candidate_chunks_candidate_id ON candidate_chunks(candidate_id)`
  );
}

/**
 * @swagger
 * /api/candidates/upload:
 *   post:
 *     summary: Upload a candidate PDF resume and details
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Candidate's name
 *               email:
 *                 type: string
 *                 description: Candidate's email
 *               jobid:
 *                 type: string
 *                 description: Job ID for which candidate is applying
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: The PDF resume file to upload
 *     responses:
 *       200:
 *         description: Resume uploaded and candidate details stored
 *       400:
 *         description: Invalid file type or duplicate application
 */
/**
 * POST /api/candidates/upload
 * FLOW: (see description above)
 */
router.post("/upload", upload.single("file"), async (req, res) => {
  await ensureCandidatesTable();
  await ensureChunksTable();
  const { name, email, jobid } = req.body;
  if (!name || !email || !jobid || !req.file) {
    return res.status(400).json({ error: "Missing required fields or file." });
  }
  // Check for duplicate application
  const existing = await pool.query(
    "SELECT 1 FROM candidates WHERE email = $1 AND jobid = $2",
    [email, jobid]
  );
  if (existing.rows.length > 0) {
    return res
      .status(400)
      .json({ error: "Candidate has already applied for this job." });
  }
  // Store candidate details
  // Insert candidate record
  const inserted = await pool.query(
    "INSERT INTO candidates (name, email, jobid, resume_path) VALUES ($1, $2, $3, $4) RETURNING id",
    [name, email, jobid, req.file.filename]
  );
  const candidateId = inserted.rows[0].id;

  // Parse PDF
  const fs = require("fs");
  const pdfParse = await resolvePdfParse();
  if (!pdfParse)
    console.error("pdf-parse module not resolved; proceeding with empty text");
  let rawText = "";
  try {
    const dataBuf = fs.readFileSync(
      path.join(__dirname, "../uploads", req.file.filename)
    );
    if (!pdfParse) {
      throw new Error("pdfParse function unavailable after import attempt");
    }
    const parsed = await pdfParse(dataBuf);
    rawText = parsed && parsed.text ? parsed.text : "";
  } catch (e) {
    console.error("PDF parsing failed", e);
  }

  const chunks = chunkText(rawText);
  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    const embedding = fakeEmbed(chunk);
    const embeddingLiteral = USE_PGVECTOR
      ? `'[${embedding.join(",")}]'`
      : `ARRAY[${embedding.join(",")}]`;
    await pool.query(
      `INSERT INTO candidate_chunks (candidate_id, chunk_index, chunk_text, embedding) VALUES ($1, $2, $3, ${embeddingLiteral})`,
      [candidateId, i, chunk]
    );
  }

  res.json({
    message: "Resume uploaded, parsed, chunked and embeddings stored.",
    filename: req.file.filename,
    chunksStored: chunks.length,
    candidateId: candidateId,
  });
});

/**
 * @swagger
 * /api/candidates/{id}/chunks:
 *   get:
 *     summary: List stored chunks and metadata for a candidate
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Candidate ID
 *     responses:
 *       200:
 *         description: Candidate metadata and chunk list
 *       404:
 *         description: Candidate not found
 */
router.get("/:id/chunks", async (req, res) => {
  const { id } = req.params;
  // Validate id: must be positive integer within 32-bit signed range
  if (!/^\d+$/.test(id)) {
    return res.status(400).json({ error: "Invalid candidate id format" });
  }
  const idNum = Number(id);
  if (idNum < 1 || idNum > 2147483647) {
    return res
      .status(400)
      .json({ error: "Candidate id out of acceptable range" });
  }
  // Basic candidate check
  const cand = await pool.query(
    "SELECT id, name, email, jobid, resume_path, created_at FROM candidates WHERE id = $1",
    [idNum]
  );
  if (cand.rows.length === 0) {
    return res.status(404).json({ error: "Candidate not found" });
  }
  // pgvector type does not support array_length(); we know dimension (64). If float8[] fallback, we can get array_length.
  const chunks = await pool.query(
    USE_PGVECTOR
      ? "SELECT chunk_index, LEFT(chunk_text, 300) AS preview, 64 AS emb_dim FROM candidate_chunks WHERE candidate_id = $1 ORDER BY chunk_index"
      : "SELECT chunk_index, LEFT(chunk_text, 300) AS preview, array_length(embedding,1) AS emb_dim FROM candidate_chunks WHERE candidate_id = $1 ORDER BY chunk_index",
    [idNum]
  );
  res.json({ candidate: cand.rows[0], chunks: chunks.rows });
});

module.exports = router;
