const dotenv = require("dotenv");
const path = require("path");

// Load .env from backend root
dotenv.config({ path: path.join(__dirname, "..", "..", ".env") });

const requiredVars = ["MONGODB_URI", "GROQ_API_KEY", "JWT_SECRET"];

for (const varName of requiredVars) {
  if (!process.env[varName]) {
    console.error(`FATAL: Missing required environment variable: ${varName}`);
    console.error("Copy .env.example to .env and fill in your values.");
    process.exit(1);
  }
}

module.exports = {
  port: parseInt(process.env.PORT, 10) || 3000,
  nodeEnv: process.env.NODE_ENV || "development",
  mongodbUri: process.env.MONGODB_URI,
  groqApiKey: process.env.GROQ_API_KEY,
  elevenlabsApiKey: process.env.ELEVENLABS_API_KEY,
  groqModel: process.env.GROQ_MODEL || "llama-3.3-70b-versatile",
  embeddingModel: process.env.EMBEDDING_MODEL || "Xenova/all-MiniLM-L6-v2",
  rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 900000,
  rateLimitMaxRequests:
    parseInt(process.env.RATE_LIMIT_MAX_REQUESTS, 10) || 100,
  logLevel: process.env.LOG_LEVEL || "info",
  neo4jUri: process.env.NEO4J_URI,
  neo4jUser: process.env.NEO4J_USER,
  neo4jPassword: process.env.NEO4J_PASSWORD,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpire: process.env.JWT_EXPIRE || "30d",
  googleClientId: process.env.GOOGLE_CLIENT_ID,
  neo4jDatabase: process.env.NEO4J_DATABASE || "neo4j",
  twilioAccountSid: process.env.TWILIO_ACCOUNT_SID,
  twilioAuthToken: process.env.TWILIO_AUTH_TOKEN,
  twilioWhatsappNumber: process.env.TWILIO_WHATSAPP_NUMBER || "whatsapp:+14155238886",
  frontendUrl: process.env.FRONTEND_URL || "http://localhost:5173",
};
