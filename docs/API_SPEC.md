# Niti Setu: API Documentation (v1.0)

This document provides a comprehensive guide to the Niti Setu REST API.

## 🔐 Authentication

Most endpoints require a JWT Bearer token.
Header: `Authorization: Bearer <token>`

### Auth Endpoints

- `POST /api/auth/send-otp` - Unified bridge for Registration & Password Reset verification.
- `POST /api/auth/register` - Create account (Requires 8-digit **Complex Password** & **OTP**).
- `POST /api/auth/login` - Authenticate and receive JWT.
- `POST /api/auth/google` - Seamless Google OAuth login.
- `GET /api/auth/me` - Get current user profile.
- `PUT /api/auth/resetpassword` - Reset password (Requires **Identity Verification**, **OTP**, and **New Complex Password**).
- `GET /api/auth/users` (**Admin Only**) - List all registered accounts.
- `DELETE /api/auth/users/:id` (**Admin Only**) - Permanently delete a user account with data protection warnings.
- `DELETE /api/profiles/:id` (**Admin Only Notification**) - Deletion of a farmer profile by an admin triggers an automated **Security Notification Email** citing **IT Act 2000** compliance.

### 🛡️ Security & Compliance

- **Identity Violation Check:** Password resets are gated by a mandatory account existence check. Non-existent emails receive a high-visibility security alert.
- **Password Complexity Rules:** Enforced for all users:
  - Minimum 8 characters.
  - Compulsory: 1 Uppercase | 1 Lowercase | 1 Number | 1 Special Character (`@$!%*?&`).
- **Administrative Safeguards:** Explicit warning modals for data removal pursuant to **IT Act 2000**.

---

## 🌾 Eligibility Engine (RAG)

The core of Niti Setu. Uses semantic search and LLM reasoning.

### Check Eligibility (Authenticated)

`POST /api/eligibility/check`

- **Body:** `{ "profileId": "...", "schemeName": "...", "language": "hi" }`
- **Result:** Detailed JSON with `eligible` (boolean), `reason`, `citation`, `benefitAmount`, and `requiredDocuments`.

### Public Check (Freemium)

`POST /api/eligibility/public-check`

- **Body:** `{ "profileData": { "name": "...", "state": "...", ... }, "schemeName": "..." }`
- **Note:** Does not save history to the database.

---

## 5. Security Architecture

Specialized endpoints for high-accessibility feature extraction.

### Document Scan (Vision AI)

`POST /api/scan/document`

- **Body:** `Multipart/form-data` with `document` (Image), `documentType` (e.g., '7-12'), and `landUnit` (optional: 'Acres' or 'Hectares').
- **Privacy:** Binary stream only. Zero permanent storage.
- **Unit Logic:** Auto-converts Hectares to Acres (2.47x) for standardizing land eligibility checks.

### Voice Transcription & Extraction

`POST /api/voice/transcribe`

- **Body:** `Multipart/form-data` with `audio` (WebM/WAV) and `language`.
- **Result:** Transcribed text + automatically extracted profile fields.

### Text-to-Speech (Multilingual)

`POST /api/voice/tts`

- **Body:** `{ "text": "...", "language": "hi" }`
- **Response:** MP3 Audio stream from ElevenLabs.

---

## 📁 Scheme Management

- `GET /api/schemes` - List all active agricultural schemes.
- `GET /api/schemes/:id` - Get deep details and chunk count for a scheme.
- `POST /api/schemes/upload` (Admin Only) - Upload PDF and trigger RAG ingestion.

---

## 📊 Analytics & Health

- `GET /api/analytics` - Dashboard statistics (Total checks, Success rates, Demographic splits).
- `GET /api/analytics/system-health` - Cache hit rates and AI response latency.
- `GET /api/analytics/resources` (**Admin Only**) - Detailed breakdown of external API usage (LLM, TTS, Voice, Vision) split by Registered and Public categories.
- `GET /api/graph/explorer` - Full Neo4j graph data for taxonomic visualization.

---

## 🗺️ Chat (Krishi Mitra)

The assistant supports persistent, multi-session conversation history.

### AI Interaction

- `POST /api/chat` - Chat with the agricultural assistant.
- **Body:** `{ "query": "...", "history": [...], "language": "mr", "sessionId": "..." }`

### Session Management

- `GET /api/chat/sessions` - List all chat sessions for the current user.
- `POST /api/chat/sessions` - Create a new chat session (returns `sessionId`).
- `GET /api/chat/sessions/:id/messages` - Retrieve full message history for a specific session.
- `DELETE /api/chat/sessions/:id` - Delete a specific chat session and all its messages.

---

## 📱 WhatsApp Bridge (Setu)

An industry-grade asynchronous integration for voice-driven agricultural support.

### WhatsApp Webhook

`POST /api/whatsapp/webhook`

- **Source:** Twilio Cloud (Secure Webhook routed via Cloudflare Tunnel).
- **Function:** Real-time processing of incoming Farmer queries.
- **Workflow:** 
  1. **Transcription:** Audio notes downloaded via secure stream and transcribed using Groq Whisper-v3.
  2. **Identity Governance:** Automated lookup of the sender's phone number against the `FarmerProfile` database.
  3. **Unique User Check:** Enforcement of a 1:1 mapping between WhatsApp accounts and Niti Setu records.
  4. **Dialect-Tuned Reasoning:** Llama 3 assisted generation of eligibility results with regional formatting.
- **Payload:** 
  - `From`: The sender's unique WhatsApp ID (e.g., `whatsapp:+91...`).
  - `Body`: Text query if provided.
  - `MediaUrl0`: URL to the hosted voice note (ephemeral).
- **Security:** Logic handles **Guest vs. Registered** states dynamically, ensuring limited access for unverified public queries.
