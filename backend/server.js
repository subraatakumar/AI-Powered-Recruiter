require("dotenv").config();
const express = require("express");
const { Pool, Client } = require("pg");
const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

// PostgreSQL connection
const pool = new Pool({
  host: process.env.PG_HOST,
  port: process.env.PG_PORT,
  user: process.env.PG_USER,
  password: process.env.PG_PASSWORD,
  database: process.env.PG_DATABASE,
});

/**
 * Development-only: Ensure PostgreSQL user and database exist before starting the app.
 * DO NOT use this in production! In production, manage users and databases separately.
 */

// brew services start postgresql@14
// Start PostgreSQL service on macOS using Homebrew

const adminClient = new Client({
  host: process.env.PG_HOST,
  port: process.env.PG_PORT,
  user: "postgres", // superuser for admin tasks
  password: process.env.PG_PASSWORD,
  database: "postgres",
});

async function ensureDbAndUser() {
  await adminClient.connect();

  // Create user if not exists
  await adminClient.query(`
    DO $$
    BEGIN
      IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = '${process.env.PG_USER}') THEN
        CREATE ROLE ${process.env.PG_USER} LOGIN PASSWORD '${process.env.PG_PASSWORD}';
      END IF;
    END
    $$;
  `);

  // Create database if not exists
  await adminClient.query(`
    DO $$
    BEGIN
      IF NOT EXISTS (SELECT FROM pg_database WHERE datname = '${process.env.PG_DATABASE}') THEN
        CREATE DATABASE ${process.env.PG_DATABASE} OWNER ${process.env.PG_USER};
      END IF;
    END
    $$;
  `);

  await adminClient.end();
  console.log("Database and user setup complete.");
}

// Only run in development
if (process.env.NODE_ENV !== "production") {
  ensureDbAndUser().then(() => {
    // ...start your app as usual...
    // pool.connect() etc.
  });
}

pool
  .connect()
  .then(() => console.log("Connected to PostgreSQL"))
  .catch((err) => console.error("PostgreSQL connection error:", err));

// Swagger setup for API documentation and testing
const swaggerUi = require("swagger-ui-express");
const swaggerJsdoc = require("swagger-jsdoc");

const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "AI-Powered Recruiter API",
      version: "1.0.0",
      description: "API documentation for the AI-Powered Recruiter backend",
    },
  },
  apis: ["./routes/*.js", "./server.js"], // Path to your route files and server.js for JSDoc comments
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

console.log("Swagger UI available at http://localhost:" + port + "/api-docs");

app.get("/", (req, res) => {
  res.send("AI-Powered Recruiter Backend is running!");
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
