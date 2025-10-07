# 📘 Chapter 2: Scaling with RAG

In the previous chapter, we established that our initial **two-stage LLM pipeline** is fundamentally **not scalable**.
When handling hundreds or thousands of candidates, the **volume of data** overwhelms the Large Language Model’s (LLM) **context window** — its maximum input limit.

To overcome this, we introduce **Retrieval-Augmented Generation (RAG)** — an advanced architectural pattern that performs **data retrieval and filtering** *before* the LLM even processes the query.

---

## 🧩 2.1 What is Retrieval-Augmented Generation (RAG)?

**RAG** combines a **traditional information retrieval system** (such as a vector or specialized database) with the **reasoning capabilities of an LLM**.

Instead of sending **all available data** to the LLM (a brute-force approach), RAG ensures that **only the most relevant snippets** are sent for reasoning.

> **Analogy:**
> Think of RAG as a *hyper-efficient librarian* who filters millions of books and hands the researcher **only the three pages they actually need**.

---

## ⚙️ 2.2 The Four Pillars of the RAG Pipeline

Implementing RAG requires four key technological components working together in harmony.

---

### 🧱 1. Chunking (Segmentation)

**Definition:**
Breaking large documents (e.g., 2-page resumes) into smaller, manageable pieces of text called **chunks** (typically around 200 words each).

**Necessity:**
Chunks are small enough to:

* Be represented accurately by a single vector.
* Fit efficiently within the LLM’s context window later.

**Application:**
Our **Node.js backend** will perform chunking on the raw resume text after parsing it from the uploaded PDF.

---

### 🔢 2. Embedding (Quantification)

**Definition:**
Converting each text chunk into a **mathematical vector** — a numerical list such as `[0.12, -0.45, 0.99, ...]`.

**Necessity:**
Computers can’t understand text directly, but they can work with numbers.
In this *vector space*, similar meanings appear close together — enabling **semantic search**.

**Application:**
Our **Node.js backend** will use an **Embedding Model** (e.g., OpenAI or local sentence-transformer) to convert every resume chunk into a vector.

---

### 🗄️ 3. Vector Database (Storage)

**Definition:**
A specialized database optimized for storing and searching high-dimensional vectors — enabling efficient similarity matching among millions of entries.

**Necessity:**
Traditional databases like MySQL or MongoDB excel at structured data (names, dates) but struggle with vector search.
A **Vector Database** is designed specifically for **semantic retrieval**.

**Application:**
We will use **PostgreSQL** enhanced with the **pgvector** extension to store all candidate resume vectors efficiently.

---

### 🔍 4. Similarity Search (Retrieval)

**Definition:**
When a query (e.g., “Find candidates with AWS and leadership experience”) is received, the query text is converted into a **query vector**.
This vector is compared against all stored resume vectors to find those **mathematically closest** — meaning **most semantically relevant**.

**Necessity:**
This process instantly identifies the relevant resume segments (“the needles”) that answer the HR team’s query.

**Application:**
The **retrieved text chunks** and their associated **candidate IDs** are packaged and passed to the LLM for final ranking and reasoning.

---

## 🧠 2.3 RAG: The Scalable Ranking Engine

With RAG in place, when the HR Admin asks the LLM to rank candidates, the LLM no longer processes every resume.
Instead, it receives only the **top 10–20 most relevant snippets**, already pre-filtered by **vector search**.

This provides multiple advantages:

* ⚡ **Faster Response Time** — Smaller input size → quicker reasoning.
* 💸 **Lower Cost** — Fewer tokens → cheaper LLM usage.
* 📈 **Scalable Performance** — Works smoothly even with **thousands of applicants**.
* 🧩 **Higher Relevance** — LLM focuses only on contextually relevant information.

---

## 🚀 Next Chapter: The Full Tech Stack and Intelligence Flow

In **Chapter 3**, we’ll define the complete **technology stack** for the AI-Powered Recruiter:

* 🖥️ **Backend:** Node.js
* 🗃️ **Database:** PostgreSQL + pgvector
* 🧠 **AI Layer:** Local AI (for instant UX feedback) + Cloud-based RAG (for scalable ranking)

We’ll also map how **local inference** and **cloud orchestration** blend to deliver a seamless, intelligent recruitment workflow.

---
