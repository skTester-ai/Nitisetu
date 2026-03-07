# Niti Setu: Developer Guide

This guide provides deep technical insights into the core algorithms and service-layer implementations of Niti Setu.

## 1. Maximal Marginal Relevance (MMR) Diversity Filter

The MMR algorithm is used to ensure that the context sent to the LLM is not redundant. It balances relevance with information diversity.

**Implementation:** `backend/src/services/vectorSearchService.js`

### The Formula

The system calculates a score for each candidate chunk using:
`MMR = λ * (Sim1(c, q)) - (1-λ) * (max(Sim2(c, s)))`

* **λ (Lambda):** Set to `0.5` for an even balance.
* **Sim1:** Similarity to the user query.
* **Sim2:** Maximum similarity to chunks already selected for the context.

### Why it matters

Without MMR, a vector search might return 5 chunks that all say "Age must be above 18" because they are semantically similar. With MMR, the system picks the first "Age" chunk, then looks for chunks that are *different* from it, such as land requirements or income limits.

---

## 2. Recursive Character Chunking

To preserve the complex structure of government policy PDFs, we use a recursive splitting strategy.

**Implementation:** `backend/src/services/embeddingService.js` (Ingestion)

* **Recursion Levels:** Paragraphs (`\n\n`) -> Sentences (`.`) -> Spaces (` `).
* **Chunk Size:** 1000 characters.
* **Overlap:** 200 characters.
* **Semantic Cohesion:** Overlap ensures that a sentence split between two chunks can still be understood by the LLM in either context.

---

## 3. Hybrid Search & Fusion (RRF)

We combine semantic search (vector) with exact matching (keyword) using Reciprocal Rank Fusion.

* **Vector Search:** `all-MiniLM-L6-v2` handles conceptual queries.
* **Keyword Search:** MongoDB Atlas Text Index handles specific IDs or technical terms.
* **RRF Scoring:** Chunks appearing in both search results are significantly boosted, ensuring "Safe Bets" are always presented to the LLM.

---

## 4. Graph Conflict Detection

The service uses Neo4j to enforce high-level logical constraints that standard RAG might miss.

**Implementation:** `backend/src/services/graphService.js`

* **Cypher Logic:** Traverses the `EXCLUSIVE_OF` relationship.
* **Constraint:** If `Scheme A` is mutual-exclusive with `Scheme B`, the system will flag it even if the LLM thinks the user is eligible for both.

---

## 5. Ephemeral Document Scan

The vision pipeline follows a strict memory-only protocol.

* **Buffers:** Files are read into a `Buffer` or `base64` string.
* **Cleanup:** The `fs.unlink()` command is wrapped in a `finally` block to ensure document deletion even if the AI analysis fails.

---

## 6. Secure Local Development (SSL/HTTPS)

To support hardware-level features like the **Web Speech API (Microphone)** on mobile devices, the development environment is configured to run over HTTPS.

### Local HTTPS (mkcert)

We use `vite-plugin-mkcert` to generate locally trusted SSL certificates.

* **Vite Config:** `frontend/vite.config.js` uses the `mkcert()` plugin.
* **Trusting the CA:** On first run, you will see a Windows prompt to install the "Root CA". Clicking **Yes** will provide a "Green Lock" in your desktop browser.

### Mobile Testing (Localtunnel)

Mobile browsers block microphone access on insecure local IPs. We use Localtunnel to provide a secure, trusted public URL.

* **Command:** `npm run tunnel` (from the `frontend` directory).
* **Access:** This provides a `https://*.loca.lt` link which is globally trusted by Android/iOS, allowing full microphone functionality with zero browser warnings.
