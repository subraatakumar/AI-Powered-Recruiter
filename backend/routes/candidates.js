const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");

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

/**
 * @swagger
 * /api/candidates/upload:
 *   post:
 *     summary: Upload a candidate PDF resume
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: The PDF resume file to upload
 *     responses:
 *       200:
 *         description: Resume uploaded successfully
 *       400:
 *         description: Invalid file type
 */
router.post("/upload", upload.single("file"), async (req, res) => {
  if (!req.file) {
    return res
      .status(400)
      .json({ error: "No file uploaded or invalid file type." });
  }
  // TODO: Parse PDF, chunk text, generate embeddings, store vectors
  res.json({
    message: "Resume uploaded successfully",
    filename: req.file.filename,
  });
});

module.exports = router;
