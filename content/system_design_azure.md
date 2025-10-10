## 💡 System Design Blueprint: AI-Powered Recruiter (Azure Implementation)

This architecture uses Azure cloud services to deliver a robust, scalable, and secure RAG-based recruiting platform.

---

### I. The Three Architectural Layers (Azure Edition)

| Layer                        | Component       | Technology / Azure Service          | Main Role                                                                         |
| :--------------------------- | :-------------- | :---------------------------------- | :-------------------------------------------------------------------------------- |
| **1. Client (Mobile)**       | HR Admin App    | Expo / React Native                 | User Experience, Authentication, File Upload, **Edge AI** (Local Classification)  |
| **2. Backend (RAG Service)** | AI Engine       | Azure App Service (Node.js/Express) | Security, RAG Orchestration, API Management, Performance Optimization             |
| **3. Data Store**            | Hybrid Database | Azure PostgreSQL + `pgvector`       | Stores relational data (jobs, users) and high-dimensional vectors (resume chunks) |

---

### II. Core Data Flows (RAG Pipeline on Azure)

#### A. Candidate Indexing (Asynchronous / Slow Path)

1. **PDF Upload:** Mobile app sends resume PDF to Azure App Service API (secure, authenticated).
2. **Extraction & Chunking:** Node.js (hosted on Azure) extracts text and splits it into meaningful chunks.
3. **Embedding:** Node.js calls Azure OpenAI Service (or Azure ML) to generate vector embeddings using inbuilt embedding models.
4. **Storage:** Node.js saves (chunk + vector) in Azure PostgreSQL using `pgvector`.

#### B. Contextual Ranking (Synchronous / Fast Path)

1. **Query:** HR Admin enters a search query.
2. **Query Embedding:** Node.js converts the query to a vector using Azure OpenAI Service embedding API.
3. **Vector Search:** Node.js uses raw SQL and the `pgvector` operator (`<->`) in Azure PostgreSQL to find top relevant resume chunks.
4. **Synthesis:** Node.js combines the query and retrieved chunks, sends them to Azure OpenAI for final ranking and rationale.
5. **Response:** Ranked results are returned to the mobile app.

---

### III. Key Azure-Specific Design Decisions

| Decision Point      | Choice                                   | Reasoning                                                               |
| :------------------ | :--------------------------------------- | :---------------------------------------------------------------------- |
| **Backend Hosting** | Azure App Service                        | Managed, scalable Node.js hosting with built-in security and monitoring |
| **AI Embeddings**   | Azure OpenAI Service / Azure ML          | Secure, scalable, and easy integration with Azure ecosystem             |
| **Database**        | Azure Database for PostgreSQL + pgvector | Managed, scalable, and supports vector search                           |
| **File Storage**    | Azure Blob Storage                       | Secure, scalable storage for uploaded PDFs                              |
| **Authentication**  | Azure AD B2C / MSAL                      | Enterprise-grade authentication and user management                     |

---

### IV. Security & Scalability (Azure Focus)

- **Security:** Use Azure Key Vault for secrets, managed identity for services, and secure API endpoints.
- **Performance:** Azure App Service auto-scales, and Azure OpenAI Service provides high-throughput AI APIs.
- **Scalability:** All components are managed and can scale independently; use Azure Functions or Logic Apps for async tasks if needed.

---

This Azure-based blueprint is beginner-friendly, scalable, and ready for enterprise deployment or technical interviews.

---

Ready to proceed with **Chapter 6: Implementing the Node.js RAG Backend on Azure (Part 1) – Server and Database Setup**?
