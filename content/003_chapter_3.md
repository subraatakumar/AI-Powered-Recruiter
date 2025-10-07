# 🏗️ Chapter 3: The Full Tech Stack and Intelligence Flow

With a strong foundation and a clear understanding of **why RAG is essential**, it’s time to define our **technology stack** and **map out the complete data flow**.
Our architecture prioritizes **scalability**, **security**, and a **superior user experience**.

---

## ⚙️ 3.1 The Full Technology Stack

Our application follows a **modern, decoupled architecture**, separating the **client interface** from the **secure, scalable backend services**.

| **Layer**    | **Technology**                 | **Primary Role**             | **Justification**                                                                                                  |
| ------------ | ------------------------------ | ---------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| **Frontend** | Expo / React Native            | Mobile & Web Admin Interface | Enables *build once, deploy everywhere* — Android, iOS, and Web. HR admins can manage recruitment from any device. |
| **Backend**  | Node.js (Serverless / Express) | Secure API Gateway & Logic   | Protects the LLM API key, handles authentication, and orchestrates RAG and data extraction pipelines.              |
| **Database** | PostgreSQL with pgvector       | Persistence & Vector Storage | Stores traditional data (users, jobs) and vector embeddings, removing the need for a separate vector database.     |
| **Cloud AI** | Cloud LLM API                  | Heavy Reasoning & Synthesis  | Handles two intensive backend tasks: **Stage 1** (Data Extraction) and **Stage 2** (Final Ranking & Rationale).    |
| **Local AI** | On-Device Model (e.g., ONNX)   | Instant UX Feedback          | Runs directly in the app for quick, offline insights like tagging candidates as *Junior* or *Senior*.              |

---

## 🔐 3.2 The Secure and Scalable Data Flow

Our system runs **four distinct pipelines**, each optimized for a specific purpose within the AI-powered recruitment workflow.

---

### 🧱 **Pipeline A: The RAG Indexing Flow (Heavy Lift)**

This flow occurs **right after a resume is uploaded** and forms the **foundation of scalable search**.

1. **📤 PDF Upload:**
   The Admin App uploads the raw resume PDF to the Node.js backend.
2. **🧩 Parsing & Chunking:**
   The backend extracts text and splits it into smaller **chunks (~200 words each)**.
3. **🧠 Embedding:**
   Each chunk is transformed into a **vector** via a Cloud LLM API call.
4. **💾 Vector Storage:**
   The vectors and chunks are stored in the **PostgreSQL pgvector** table for fast similarity search.

---

### 🧼 **Pipeline B: The Structured Data Extraction Flow (Cleanse)**

This flow runs **concurrently with indexing** and produces **clean, structured data** for display and filtering.

1. **📄 Raw Text Input:**
   Node.js takes the extracted resume text.
2. **🤖 LLM Extraction:**
   The backend sends a strict **JSON Schema prompt** to the Cloud LLM API.
3. **📊 Data Persistence:**
   The clean, structured JSON (e.g., `years_experience`, `skills`) is stored in PostgreSQL for later access.

---

### ⚡ **Pipeline C: The Local Intelligence Flow (Instant UX)**

This pipeline runs **entirely on the mobile device** for **instant, offline feedback**.

1. **📥 Data Retrieval:**
   The app fetches structured candidate data (e.g., `parsed_summary`) from the backend.
2. **💡 Local Inference:**
   A small **on-device AI model (ONNX)** classifies candidates (e.g., *Junior*, *Mid-Level*).
3. **🎯 UX Update:**
   The classification is instantly displayed in the app — *no network delay required.*

---

### 🔎 **Pipeline D: The Contextual Ranking Flow (RAG Query)**

This is the **core of the intelligent recruiter** — where HR Admins perform **context-aware candidate searches**.

1. **🗣️ Query Vectorization:**
   The HR Admin’s query (e.g., “Find candidates ready for promotion”) is converted into a vector.
2. **🧭 Similarity Search:**
   PostgreSQL pgvector retrieves the **top 10–20 most relevant resume chunks**.
3. **🧩 Final Synthesis:**
   The backend sends the HR query, Job Description, and retrieved chunks to the Cloud LLM API.
4. **📲 Result to App:**
   The LLM returns a **ranked list** of candidates with **AI-generated rationales**, which are then displayed in the Admin App.

---

## ✅ Summary: Why This Architecture Works

* ⚙️ **High-Performance Search** → RAG-powered vector search ensures speed and scalability.
* 🔒 **Secure API Management** → Node.js backend protects keys and handles orchestration.
* 💨 **Smooth UX** → Local AI enables instant feedback even without connectivity.

This balance between **cloud intelligence** and **local inference** creates a **robust, hybrid AI system** optimized for recruitment workflows.

---

## 🚀 Next Chapter: Setting Up the Backend

In **Chapter 4: Setting Up the Node.js Server and PostgreSQL with pgvector**,
we’ll begin implementing the **core backend**, connecting all these layers into a **secure, scalable pipeline** ready for production.

---
