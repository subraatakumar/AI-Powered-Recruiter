

## System Design: The AI-Powered Recruiter (Hybrid RAG Architecture)

Our system employs a **Hybrid AI Architecture** designed for security, scalability, and mobile responsiveness. The complexity of Retrieval-Augmented Generation (RAG) is entirely abstracted to a dedicated server layer, ensuring the mobile app remains fast and lightweight.

![](https://github.com/subraatakumar/AI-Powered-Recruiter/blob/main/content/images/Gemini_Generated_Image_onys2zonys2zonys.png)

**Note on Visual Clarity:** Please refer to the detailed specification text for complete clarity, as the legibility of embedded labels in the generated diagram may vary due to the limitations of the AI rendering process.

### 1. High-Level Architecture (The Three Layers)

We operate on three distinct technological layers:

| Layer | Technology | Primary Role | AI Focus |
| :--- | :--- | :--- | :--- |
| **Client** | **Expo / React Native** | Data Capture, User Experience, Authentication. | **Edge AI (Local LLM):** Instant classification and tagging. |
| **API/RAG Service** | **Node.js (Express)** | Securely hosts the RAG pipeline, manages security, and orchestrates calls to external LLMs. | **Cloud RAG Orchestration:** Embedding, Contextual Search, Final Ranking. |
| **Data Store** | **PostgreSQL + `pgvector`** | Stores all relational data (jobs, users) and high-dimensional vectors (resume chunks). | **Vector Database:** Performs the high-speed similarity search (KNN). |

---

### 2. Technology Rationale and Core Choices

#### A. Rationale for Node.js (API Layer)

Node.js is ideal because the RAG process is highly **I/O bound**. The server spends most of its time waiting for two things:

1.  The **Cloud LLM API** to return embedding vectors.
2.  The **Cloud LLM API** to return the final ranked synthesis.

Node.js's non-blocking nature allows it to efficiently handle hundreds of simultaneous requests without getting bogged down waiting for these external network calls.

#### B. The Critical Choice: PostgreSQL with `pgvector`

We deliberately chose a **hybrid database solution** over a dedicated Vector Database (like Pinecone or Weaviate) for architectural simplicity and cost-efficiency.

* **Single Source of Truth:** We store the candidate's name, application date (relational data), and the resume vector (vector data) in one place. This eliminates the complexity and latency of synchronizing two different data stores.
* **Performance:** `pgvector` is highly optimized. We can use advanced indexing techniques (**HNSW**) to ensure the K-Nearest Neighbor (KNN) search remains fast even with millions of vectors.
* **Performance Trade-Off:** We accept a minor theoretical performance hit compared to a dedicated service, but gain massive operational simplicity and reduce infrastructure costs.

#### C. Deliberate Use of Raw SQL

We avoid an ORM (like Sequelize or Prisma) for the RAG-critical functions to maintain **Performance Requirement N2 (Search < 1 second).** Using the native `node-pg` library allows us to write highly optimized, raw SQL queries that utilize the specific `<->` operator for vector distance calculation, bypassing the overhead of an ORM abstraction layer.

---

### 3. Critical System Flows

The system relies on two distinct processes: the slow, asynchronous Indexing pipeline and the fast, synchronous Query pipeline.

#### A. Critical Flow 1: Candidate Indexing (Asynchronous)

This flow is resource-intensive and is handled asynchronously:

1.  **Mobile Upload:** HR Admin uploads a PDF. The mobile app sends the file to the Node.js API.
2.  **Extraction & Chunking:** The Node.js service parses the PDF text and divides it into semantic **chunks** (e.g., separating "Experience" from "Education").
3.  **Embedding Call:** Node.js makes an external, blocking call to the **Embedding Model API** to convert each text chunk into a 768-dimensional vector.
4.  **Vector Storage (Write):** Node.js inserts the text chunk and its corresponding vector into the **`candidate_vectors`** table in PostgreSQL.

#### B. Critical Flow 2: Contextual Ranking (Synchronous)

This flow must be fast and secure:

1.  **User Query:** HR Admin submits a natural language query (e.g., "Find candidates with AWS").
2.  **Query Vectorization:** Node.js immediately sends this query to the **Embedding Model API** to convert it into a **Query Vector**.
3.  **Vector Search (Read Bottleneck):** Node.js executes the **raw SQL query** using the `<->` operator against the `pgvector` table. This step is the primary **performance optimization point** and must return the top 10 relevant resume chunks almost instantly.
4.  **Final Synthesis (RAG):** Node.js compiles the original query + the 10 relevant text chunks into one final prompt (the *context*) and sends it to the **Cloud LLM** for ranking and rationale generation.
5.  **Response:** The final ranked list is returned to the mobile client.

### 4. Security and Scalability

* **Security:** All LLM API keys are stored in the server's **`.env`** file and explicitly excluded from the Git context via **`.gitignore`** to ensure they are never exposed to the client or the Copilot development tool.
* **Performance Bottleneck:** The single greatest external bottleneck is the **latency of the Cloud LLM APIs** (Steps 3.A.3, 3.B.2, and 3.B.4).
* **Mitigation:** If the application requires a higher throughput than the LLM API can provide, the next scaling step would be to implement an **asynchronous task queue (e.g., Redis or RabbitMQ)** for the **Indexing flow (3.A)** so the client never waits for the slow embedding process.

This robust, multi-layered approach ensures the application meets high standards for security, performance, and scalability, ready for real-world adoption. 
