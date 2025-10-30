require("dotenv").config();
const express = require("express");
const pool = require("./db");
const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

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

// Candidate routes
const candidatesRouter = require("./routes/candidates");
app.use("/api/candidates", candidatesRouter);

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});

module.exports = { pool };
