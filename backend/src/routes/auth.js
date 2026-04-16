/**
 * Auth Routes — POST /api/auth/register, /login, /me
 */

const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const router = express.Router();

const env = require('../config/env');
const { authMiddleware } = require('../middleware/auth');
const { validateRegistration } = require('../utils/validators');
const { generatePolicyNumber } = require('../utils/indianFormatter');
const claudeService = require('../services/claudeService');

// In-memory store for demo mode (when DB is unavailable)
const demoWorkers = [];

// ── Pre-seed a demo worker for instant login ────────────────
(async () => {
  const demoPassword = await bcrypt.hash('demo123', 12);
  demoWorkers.push({
    id: 'demo-worker-001',
    name: 'Rajesh Sharma',
    phone: '9876543210',
    aadhar_number: '123456789012',
    email: 'rajesh@allievo.in',
    password_hash: demoPassword,
    city: 'Mumbai',
    platform: 'Swiggy',
    zone: 'Bandra',
    declared_weekly_income: 5000,
    years_active: '3+',
    risk_score: 42,
    risk_label: 'Medium',
    upi_id: 'rajesh@upi',
    is_active: true,
    created_at: new Date(Date.now() - 120 * 24 * 3600000).toISOString(),
    updated_at: new Date().toISOString(),
  });
  console.log('✅ Demo worker pre-seeded (phone: 9876543210 / password: demo123)');
})();

// POST /api/auth/register — Create worker + AI risk scoring
router.post('/register', async (req, res, next) => {
  try {
    const { name, phone, aadharNumber, email, password, city, platform, zone, declaredWeeklyIncome, yearsActive, upiId } = req.body;

    // Validate input
    const validation = validateRegistration({ name, phone, aadharNumber, password, city, platform, zone, declaredWeeklyIncome, yearsActive });
    if (!validation.valid) {
      return res.status(400).json({ error: 'Validation failed', details: validation.errors });
    }

    // Check for existing worker — allow re-registering demo worker
    const existingIdx = demoWorkers.findIndex(w => w.phone === phone);
    if (existingIdx >= 0 && phone !== '9876543210') {
      return res.status(409).json({ error: 'A worker with this phone number already exists.' });
    }
    if (existingIdx >= 0) demoWorkers.splice(existingIdx, 1);

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Claude AI Call 1: Risk scoring
    const riskResult = await claudeService.scoreWorkerRisk({
      name, city, zone, platform,
      declaredWeeklyIncome: Number(declaredWeeklyIncome),
      yearsActive,
    });

    // Create worker object
    const worker = {
      id: uuidv4(),
      name: name.trim(),
      phone,
      aadhar_number: aadharNumber,
      email: email || null,
      password_hash: passwordHash,
      city,
      platform,
      zone,
      declared_weekly_income: Number(declaredWeeklyIncome),
      years_active: yearsActive,
      risk_score: riskResult.riskScore,
      risk_label: riskResult.riskLabel,
      upi_id: upiId || null,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    demoWorkers.push(worker);

    // Generate JWT
    const token = jwt.sign(
      { id: worker.id, name: worker.name, phone: worker.phone, city: worker.city },
      env.JWT_SECRET,
      { expiresIn: env.JWT_EXPIRY }
    );

    // Sanitize response (no password hash)
    const { password_hash, ...safeWorker } = worker;

    res.status(201).json({
      message: 'Registration successful',
      worker: safeWorker,
      token,
      riskProfile: {
        riskScore: riskResult.riskScore,
        riskLabel: riskResult.riskLabel,
        weeklyPremium: riskResult.weeklyPremium,
        coveragePercent: riskResult.coveragePercent,
        reasoning: riskResult.reasoning,
        regulatoryNote: riskResult.regulatoryNote,
        // ML model transparency
        mlModel: riskResult.mlModel,
        featureImportance: riskResult.featureImportance,
        confidence: riskResult.confidence,
      },
      aiDebug: riskResult.debug,
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/login — JWT login
router.post('/login', async (req, res, next) => {
  try {
    const { phone, password } = req.body;

    if (!phone || !password) {
      return res.status(400).json({ error: 'Phone and password are required.' });
    }

    const worker = demoWorkers.find(w => w.phone === phone);
    if (!worker) {
      return res.status(401).json({ error: 'Invalid phone number or password.' });
    }

    const isValid = await bcrypt.compare(password, worker.password_hash);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid phone number or password.' });
    }

    const token = jwt.sign(
      { id: worker.id, name: worker.name, phone: worker.phone, city: worker.city },
      env.JWT_SECRET,
      { expiresIn: env.JWT_EXPIRY }
    );

    const { password_hash, ...safeWorker } = worker;

    res.json({ message: 'Login successful', worker: safeWorker, token });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/reset-password — Reset via Aadhar
router.post('/reset-password', async (req, res, next) => {
  try {
    const { phone, aadharNumber, newPassword } = req.body;
    
    if (!phone || !aadharNumber || !newPassword) {
      return res.status(400).json({ error: 'Phone, Aadhar number, and new password are required.' });
    }
    
    if (newPassword.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });

    const worker = demoWorkers.find(w => w.phone === phone);
    if (!worker) {
      return res.status(404).json({ error: 'Worker not found.' });
    }

    if (worker.aadhar_number !== aadharNumber) {
      return res.status(401).json({ error: 'Identity verification failed. Incorrect Aadhar.' });
    }

    worker.password_hash = await bcrypt.hash(newPassword, 12);
    worker.updated_at = new Date().toISOString();

    res.json({ message: 'Password reset successful.' });
  } catch (err) {
    next(err);
  }
});

// GET /api/auth/me — Get current worker from token
router.get('/me', authMiddleware, (req, res) => {
  const worker = demoWorkers.find(w => w.id === req.user.id);
  if (!worker) {
    return res.status(404).json({ error: 'Worker not found.' });
  }
  const { password_hash, ...safeWorker } = worker;
  res.json({ worker: safeWorker });
});

// Export for access by other routes
router.getDemoWorkers = () => demoWorkers;

module.exports = router;
