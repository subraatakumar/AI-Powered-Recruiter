# AI-Powered Recruiter Backend

This folder contains the Node.js backend for the AI-Powered Recruiter system. It includes the Express server, PostgreSQL connection, and environment configuration.

## Getting Started

1. Install dependencies:
   ```bash
   npm install express pg dotenv
   ```
2. Set up your `.env` file with database and API credentials.
3. Start the server:
   ```bash
   node server.js
   ```

## Files

- `server.js`: Main Express server and PostgreSQL connection
- `.env`: Environment variables (never commit this file)
- `.gitignore`: Ensures secrets are not tracked
