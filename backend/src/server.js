/**
 * Allievo — Express Server Entry Point
 * Parametric Income Protection for Gig Workers
 */

const path = require('path');
const express = require('express');
const cors = require('cors');

// Load environment config first
const env = require('./config/env');

const errorHandler = require('./middleware/errorHandler');
const { apiLimiter, authLimiter, aiLimiter } = require('./middleware/rateLimiter');

// Route imports
const authRoutes = require('./routes/auth');
const workersRoutes = require('./routes/workers');
const policiesRoutes = require('./routes/policies');
const disruptionsRoutes = require('./routes/disruptions');
const claimsRoutes = require('./routes/claims');
const paymentsRoutes = require('./routes/payments');
const aiRoutes = require('./routes/ai');
const adminRoutes = require('./routes/admin');

// Services
const { startCronJobs } = require('./services/cronJobs');

const app = express();

// ── Middleware ──────────────────────────────────────────────
app.use(cors({
  origin: env.NODE_ENV === 'production' ? env.FRONTEND_URL : '*',
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ── Wire up shared demo stores ─────────────────────────────
const getDemoWorkers = authRoutes.getDemoWorkers;
const getDemoPolicies = policiesRoutes.getDemoPolicies;
const getDemoClaims = claimsRoutes.getDemoClaims;
const getDemoDisruptions = disruptionsRoutes.getDemoDisruptions;

workersRoutes.setDemoWorkers(getDemoWorkers);
policiesRoutes.setDemoWorkers(getDemoWorkers);
disruptionsRoutes.setDemoWorkers(getDemoWorkers);
claimsRoutes.setDemoWorkers(getDemoWorkers);
claimsRoutes.setDemoPolicies(getDemoPolicies);
claimsRoutes.setDemoDisruptions(getDemoDisruptions);
paymentsRoutes.setDemoWorkers(getDemoWorkers);
paymentsRoutes.setDemoPolicies(getDemoPolicies);
aiRoutes.setDemoWorkers(getDemoWorkers);
aiRoutes.setDemoClaims(getDemoClaims);
aiRoutes.setDemoPolicies(getDemoPolicies);
adminRoutes.setDemoWorkers(getDemoWorkers);
adminRoutes.setDemoPolicies(getDemoPolicies);
adminRoutes.setDemoClaims(getDemoClaims);

// ── Health check ────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'Allievo API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    demoMode: env.DEMO_MODE,
    uptime: process.uptime(),
  });
});

// ── API Routes ──────────────────────────────────────────────
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/workers', apiLimiter, workersRoutes);
app.use('/api/policies', apiLimiter, policiesRoutes);
app.use('/api/disruptions', apiLimiter, disruptionsRoutes);
app.use('/api/claims', apiLimiter, claimsRoutes);
app.use('/api/payments', apiLimiter, paymentsRoutes);
app.use('/api/ai', aiLimiter, aiRoutes);
app.use('/api/admin', apiLimiter, adminRoutes);

// ── Serve Frontend (production) ─────────────────────────────
const publicPath = path.join(__dirname, '../public');
app.use(express.static(publicPath));

// SPA fallback — serve index.html for non-API routes
app.get('{*path}', (req, res) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(publicPath, 'index.html'));
  }
});

// ── Error Handler ───────────────────────────────────────────
app.use(errorHandler);

// ── Start Server ────────────────────────────────────────────
async function startServer() {
  // Test database connection (optional)
  try {
    const db = require('./config/database');
    await db.testConnection();
  } catch (e) {
    console.warn('⚠ Database not available, running with in-memory data store');
  }

  // Test Redis (optional)
  try {
    const redis = require('./config/redis');
    await redis.testConnection();
  } catch (e) {
    console.warn('⚠ Redis not available, using in-memory cache');
  }

  // Start cron jobs
  try {
    startCronJobs();
  } catch (e) {
    console.warn('⚠ Cron jobs not started:', e.message);
  }

  app.listen(env.PORT, () => {
    console.log(`
╔══════════════════════════════════════════════╗
║           🛡️  Allievo API Server           ║
║──────────────────────────────────────────────║
║  Port:     ${String(env.PORT).padEnd(33)}║
║  Mode:     ${String(env.NODE_ENV).padEnd(33)}║
║  Demo:     ${String(env.DEMO_MODE).padEnd(33)}║
║  Claude:   ${String(env.ANTHROPIC_API_KEY ? '✅ Configured' : '⚠ Not set (demo fallback)').padEnd(33)}║
║  Razorpay: ${String(env.RAZORPAY_KEY_ID ? '✅ Configured' : '⚠ Not set (demo fallback)').padEnd(33)}║
╚══════════════════════════════════════════════╝
    `);
  });
}

startServer().catch(console.error);

module.exports = app;
