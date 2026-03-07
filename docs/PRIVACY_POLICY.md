# Niti Setu: Data Privacy & Security Policy

Niti Setu is committed to the highest standards of data protection, aligning with the **Digital Personal Data Protection (DPDP) Act** of India.

## 1. Data Minimization & Collection

We only collect data strictly necessary for determining agricultural scheme eligibility.

* Aadhaar/IDs: We DO NOT store Aadhaar numbers or ID images.
* Agri-Data: We store land holding size, state, and crop types to improve accuracy.

## 2. Ephemeral Processing (Zero-Storage Policy)

Our scanning engine uses an ephemeral binary stream protocol:

1. User uploads a document.
2. System reads document into memory buffer.
3. Vision AI extracts non-PII attributes.
4. **File is immediately deleted** from server storage (`fs.unlink`).
5. No permanent copy of your identity document remains on our servers.

## 3. Security Measures

* Encryption: Data is encrypted in transit using Bank-grade TLS/SSL.
* JWT Authentication: All private data access is protected by JSON Web Tokens with 30-day expiration.
* Rate Limiting: Protects against automated scrapers and brute-force attacks.
* Audit Logging: Admin actions (like uploading or deleting schemes) are logged for accountability.

## 4. WhatsApp Bridge Protocol

Our WhatsApp integration adheres to strict transient processing:

* Media Processing: Voice notes are downloaded to a transient memory buffer, transcribed, and **instantly deleted**.
* Zero-Storage Voice: We DO NOT store raw audio files or voice recordings on our servers.
* Linked Data: We only utilize the WhatsApp contact number to sync your profile; no other chat metadata is harvested.

## 5. AI Ethics & Transparency

* No Hallucinations: Our RAG engine is restricted to official government documents only.
* Verifiable Proof: Every AI decision includes a direct quote and page reference from the official PDF.
* Human-in-the-Loop: AI helps you find schemes, but final applications are processed on official `gov.in` portals.

## 6. Your Rights

* Right to Erasure: You can delete your farmer profile and all associated eligibility history at any time.
* Right to Access: You can view all data stored about you in the "Settings" page.

---

*For privacy concerns, contact: [patil.abhay214@gmail.com](mailto:patil.abhay214@gmail.com)*
