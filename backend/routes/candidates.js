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

// Configure multer for PDF uploads
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

// Ensure candidates table exists
async function ensureCandidatesTable() {
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
router.post("/upload", upload.single("file"), async (req, res) => {
  await ensureCandidatesTable();
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
  await pool.query(
    "INSERT INTO candidates (name, email, jobid, resume_path) VALUES ($1, $2, $3, $4)",
    [name, email, jobid, req.file.filename]
  );
  res.json({
    message: "Resume uploaded and candidate details stored.",
    filename: req.file.filename,
  });
});

module.exports = router;
