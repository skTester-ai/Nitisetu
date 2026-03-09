const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');

const config = require('./config/env');
const { connectDB, disconnectDB } = require('./config/database');
const { closeDriver: closeNeo4j } = require('./config/neo4j');
const logger = require('./config/logger');
const embeddingService = require('./services/embeddingService');

const { errorHandler } = require('./middleware/errorHandler');
const { generalLimiter } = require('./middleware/rateLimiter');

const schemeRoutes = require('./routes/schemeRoutes');
const profileRoutes = require('./routes/profileRoutes');
const eligibilityRoutes = require('./routes/eligibilityRoutes');
const voiceRoutes = require('./routes/voiceRoutes');
const path = require('path');
const authRoutes = require('./routes/authRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const graphRoutes = require('./routes/graphRoutes');
const chatRoutes = require('./routes/chatRoutes');
const scanRoutes = require('./routes/scanRoutes');
const whatsappRoutes = require('./routes/whatsappRoutes');

const app = express();
app.set("trust proxy", 1);

// ── Security & Parsing Middleware ─────────────────────────
app.use(compression());
app.use(cors({
  origin: config.nodeEnv === 'production'
    ? [config.frontendUrl]
    : ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:5173', 'https://nitisetu.onrender.com', 'http://192.168.29.117:5173'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true,
}));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// ── Logging ───────────────────────────────────────────────
app.use(morgan('dev', {
  stream: { write: (message) => logger.info(message.trim()) },
}));

// ── Rate Limiting ─────────────────────────────────────────
app.use(generalLimiter);

// ── Helmet (FIX: explicitly set COOP to unsafe-none for Google Sign-In popup) ──
app.use(helmet());

// ── Static Files ──────────────────────────────────────────
app.use('/api/schemes/docs', express.static(path.join(__dirname, '..', 'data', 'schemes')));
app.use(express.static(path.join(__dirname, "../../frontend/dist")));

// ── Health Check ──────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    status: 'ok',
    service: 'Niti-Setu Backend',
    timestamp: new Date().toISOString(),
    embeddingModelReady: embeddingService.isReady(),
    uptime: Math.round(process.uptime()),
  });
});

// ── API Routes (MUST come before the wildcard catch-all) ──  ✅ Fixed order
app.use('/api/schemes', schemeRoutes);
app.use('/api/profiles', profileRoutes);
app.use('/api/eligibility', eligibilityRoutes);
app.use('/api/voice', voiceRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/graph', graphRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/scan', scanRoutes);
app.use('/api/whatsapp', whatsappRoutes);

// ── React SPA Fallback (MUST come after API routes) ───────  ✅ Moved to end
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../../frontend/dist/index.html"));
});

// ── 404 Handler ───────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: `Route ${req.method} ${req.originalUrl} not found`,
  });
});

// ── Global Error Handler ──────────────────────────────────
app.use(errorHandler);

// ── Server Startup ────────────────────────────────────────
async function startServer() {
  try {
    logger.info('Connecting to MongoDB Atlas...');
    await connectDB(config.mongodbUri);

    logger.info('Initializing embedding model (first run downloads ~80MB)...');
    await embeddingService.initialize();

    const server = app.listen(config.port, () => {
      logger.info(`╔══════════════════════════════════════════╗`);
      logger.info(`║  Niti-Setu Backend v1.0.0                ║`);
      logger.info(`║  Port: ${config.port}                            ║`);
      logger.info(`║  Env:  ${config.nodeEnv.padEnd(25)}      ║`);
      logger.info(`║  Embedding model: Ready                  ║`);
      logger.info(`║  MongoDB: Connected                      ║`);
      logger.info(`╚══════════════════════════════════════════╝`);
    });

    const shutdown = async (signal) => {
      logger.info(`${signal} received. Shutting down gracefully...`);
      server.close(async () => {
        await disconnectDB();
        await closeNeo4j();
        logger.info('Server shut down complete');
        process.exit(0);
      });
      setTimeout(() => {
        logger.error('Forced shutdown after timeout');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

  } catch (error) {
    logger.error('Failed to start server:', error.message);
    process.exit(1);
  }
}

startServer();

module.exports = app;
