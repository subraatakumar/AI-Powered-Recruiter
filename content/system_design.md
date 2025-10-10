## System Design: The AI-Powered Recruiter (Hybrid RAG Architecture)

Our system employs a **Hybrid AI Architecture** designed for security, scalability, and mobile responsiveness. The complexity of Retrieval-Augmented Generation (RAG) is entirely abstracted to a dedicated server layer, ensuring the mobile app remains fast and lightweight.

![](https://github.com/subraatakumar/AI-Powered-Recruiter/blob/main/content/images/Gemini_Generated_Image_onys2zonys2zonys.png)

**Note on Visual Clarity:** Please refer to the detailed specification text for complete clarity, as the legibility of embedded labels in the generated diagram may vary due to the limitations of the AI rendering process.

### 1. High-Level Architecture (The Three Layers)

We operate on three distinct technological layers:

| Layer               | Technology                  | Primary Role                                                                                | AI Focus                                                                  |
| :------------------ | :-------------------------- | :------------------------------------------------------------------------------------------ | :------------------------------------------------------------------------ |
| **Client**          | **Expo / React Native**     | Data Capture, User Experience, Authentication.                                              | **Edge AI (Local LLM):** Instant classification and tagging.              |
| **API/RAG Service** | **Node.js (Express)**       | Securely hosts the RAG pipeline, manages security, and orchestrates calls to external LLMs. | **Cloud RAG Orchestration:** Embedding, Contextual Search, Final Ranking. |
| **Data Store**      | **PostgreSQL + `pgvector`** | Stores all relational data (jobs, users) and high-dimensional vectors (resume chunks).      | **Vector Database:** Performs the high-speed similarity search (KNN).     |

---

### II. Core Data Flows (RAG Pipeline)

#### A. Candidate Indexing (Asynchronous / Slow Path)

This process builds the searchable vector database and runs in the background.

1. **PDF Upload:** Mobile app sends resume PDF to Node.js API (secure, authenticated).
2. **Extraction & Chunking:** Node.js extracts text and splits it into meaningful chunks.
3. **Embedding:** Node.js sends chunks to a Cloud LLM to generate vector embeddings.
4. **Storage:** Node.js saves (chunk + vector) in PostgreSQL using `pgvector`.

#### B. Contextual Ranking (Synchronous / Fast Path)

This process must be fast (under 1 second) for a responsive user experience.

1. **Query:** HR Admin enters a search query (e.g., "Find Python candidates with AWS").
2. **Query Embedding:** Node.js converts the query to a vector using the Cloud LLM.
3. **Vector Search:** Node.js uses raw SQL and the `pgvector` operator (`<->`) to find top relevant resume chunks.
4. **Synthesis:** Node.js combines the query and retrieved chunks, sends them to the Cloud LLM for final ranking and rationale.
5. **Response:** Ranked results are returned to the mobile app.

---

### III. Key Design Decisions & Trade-Offs

| Decision Point      | Choice                  | Reasoning                                                                                            |
| :------------------ | :---------------------- | :--------------------------------------------------------------------------------------------------- |
| **Vector DB**       | PostgreSQL + `pgvector` | Simplifies infrastructure, sufficient for thousands of candidates, cheaper than dedicated vector DBs |
| **ORM vs. Raw SQL** | Raw SQL (`node-pg`)     | Direct access to high-performance vector search operators, avoids ORM overhead                       |
| **Edge AI**         | Local LLM on Mobile     | Used for instant, non-critical tasks (e.g., tagging), improves mobile UX latency                     |

---

### IV. Security & Scalability

- **Security:** API keys are stored securely on the server and never exposed to the client.
- **Performance Bottleneck:** Cloud LLM API latency is the main bottleneck; optimize with asynchronous queues (e.g., Redis) for slow tasks.
- **Scalability:** The architecture supports thousands of candidates and can be scaled further by upgrading database indexing or adding task queues.

---

This blueprint provides a clear, scalable, and beginner-friendly overview of the AI-Powered Recruiter system. It is ready for technical interviews and real-world implementation.

---
