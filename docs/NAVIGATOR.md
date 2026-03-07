# 🚀 Niti Setu Reader's Navigator

Welcome to **Niti Setu** (नीति सेतु). This guide is designed to help you navigate our codebase and documentation without getting lost in the "RAG weeds."

---

## 🗺️ Where should I start?

Depending on your goal, follow these paths:

### 1. "I want to see how the RAG logic works."
Go to the **Krishi Mitra Engine**:
- 📍 **Core Script:** [`backend/src/services/llmService.js`](../backend/src/services/llmService.js)
- 📍 **Implementation Details:** [Developer Guide: MMR & RRF Implementation](../docs/DEVELOPER_GUIDE.md)
- *Key concepts:* Native MMR, Reciprocal Rank Fusion, Context Window Management.

### 2. "I want to understand the data privacy flow."
Check our **Zero-Storage Protocol**:
- 📍 **Architecture Diagram:** [Architecture.md: Ephemeral Data Flow](../docs/ARCHITECTURE.md#ephemeral-privacy-first-data-flow)
- 📍 **Privacy Policy:** [Privacy Policy](../docs/PRIVACY_POLICY.md)
- *Key concepts:* Memory Buffers, Base64 Streams, `fs.unlink` cleanup.

### 3. "I want to see the Conflict Detection system."
Look into the **Hybrid Reasoning Layer**:
- 📍 **Graph Logic:** [`backend/src/services/graphService.js`](../backend/src/services/graphService.js)
- 📍 **Integration:** [Architecture.md: Sequence Diagram](../docs/ARCHITECTURE.md#master-rag--intelligence-sequence)
- *Key concepts:* Neo4j `EXCLUSIVE_OF` rules, Semantic Duplicate Override.

### 4. "I want to setup the project locally."
Follow the **Quick Start**:
- 📍 **Main Instructions:** [Readme: Installation](../README.md#installation-and-setup)
- 📍 **Env Template:** [`backend/.env.example`](../backend/.env.example)

---

## 🛠️ Project Structure at a Glance

```text
niti-setu/
├── backend/                # Express server & AI core
│   ├── src/
│   │   ├── services/       # AI logic, Graph logic, Email, etc.
│   │   ├── routes/         # API endpoints
│   │   ├── middleware/     # Auth, Validators, OTP
│   │   └── models/         # Mongoose & Resource Schemas
├── frontend/               # React Dashboard & Assistant
│   ├── src/
│   │   ├── pages/          # Dashboard, Check, Settings
│   │   ├── components/     # UI Kits, AgriCard, FloatingBot
│   │   └── context/        # Auth & UI Context
└── docs/                   # Full Technical Stack Documentation
```

---

## 🗣️ Common Questions

**Q: Why not use LangChain?**  
A: To maintain sub-second performance and 100% data sovereignty. Native implementations allow for 3x faster execution and granular token control.

**Q: How does the multilingual TTS work?**  
A: We combine a high-performance LRU cache for translations with an ElevenLabs neural synthesis layer, allowing for consistent, low-latency regional speech.

**Q: Is my document data stored?**  
A: **No.** Documents are processed as transient memory buffers and deleted instantly after extraction.

---

> [!TIP]
> **Pro Tip:** Start by exploring the [Architecture Guide](../docs/ARCHITECTURE.md) to visualize how the parallel retrieval paths merge into a single, citation-backed verdict.
