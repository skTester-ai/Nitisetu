# Niti Setu: Deployment Readiness Report

This document outlines the final checklist and strategic steps required to transition the Niti Setu platform from a development environment to a production-grade infrastructure.

## 1. Environment Variable Audit (Backend)

Ensure your production `.env` is fully populated. Sensitive keys should **never** be committed to Git.

| Variable | Requirement | Production Note |
| :--- | :--- | :--- |
| `NODE_ENV` | `production` | Enables performance optimizations and strict CORS. |
| `JWT_SECRET` | 64+ char random string | **Critical**: Do not use the development fallback. |
| `MONGODB_URI` | Atlas Cluster URI | Ensure your whitelist excludes dev IPs and includes your server IP. |
| `GROQ_API_KEY` | Groq Console Key | Use a dedicated production key to track tokens separately. |
| `SMTP_PASSWORD` | Gmail App Password | Must use a **Google App Password**, not your account password. |
| `FRONTEND_URL` | Production Domain | e.g., `https://nitisetu.vercel.app`. |

## 2. Infrastructure Build Protocol

### Frontend Optimization

```bash
cd frontend
npm install
npm run build
```

- **Verification**: Ensure the `dist/` folder contains minified assets and a clean `index.html`.
- **Hosting**: Recommended hosts: Vercel, Netlify, or AWS Amplify.

### Backend Orchestration

```bash
cd backend
npm install --production
npm start
```

- **Process Management**: Use **PM2** to ensure the backend auto-restarts on crash.

  ```bash
  pm2 start src/server.js --name "niti-setu-api"
  ```

- **Reverse Proxy**: Use **Nginx** or **Cloudflare** for SSL termination and to proxy port `3000` to `443`.

## 3. Database Synthesis (Post-Migration)

### MongoDB Atlas

1. **Vector Search Index**: Create a Search Index named `vector_index` on the `chunks` collection.
2. **Text Index**: Ensure a text index exists on the `schemes` collection for hybrid search.

### Neo4j Graph

1. **Initial Seed**: Run the graph seeding script to populate `EXCLUSIVE_OF` relationships.
2. **Bolt Trust**: Ensure the backend uses the `neo4j+s://` protocol for encrypted communication.

## 4. Security & Compliance Checklist

- [ ] **SSL/TLS**: Provision a production certificate via Let's Encrypt (Certbot). Local `mkcert` is for dev only.
- [ ] **Rate Limiting Check**: Verify IP headers are correctly forwarded by Nginx.
- [ ] **PII Memory Sweep**: Confirm that `fs.unlink()` in `scanRoutes.js` is wiping temporary documents within 500ms of analysis.
- [ ] **STT Denoising**: Verify the `llama-3.1-8b-instant` model is active in `llmService.js` to prevent Whisper hallucinations in noisy farming environments.
- [ ] **Admin Provisioning**: Manually create the first Super Admin (`admin@nitisetu.gov.in`) in the MongoDB `users` collection to unlock the Admin Dashboard.

## 5. Deployment Verification

1. **Health Check**: Access `https://your-api.com/api/health`.
2. **Voice Integrity**: Test the "Krishi Mitra" microphone on a mobile device over the production HTTPS link.
3. **OTP Delivery**: Perform a registration flow to verify Gmail SMTP reliability.
