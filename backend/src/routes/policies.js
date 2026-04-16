/**
 * Policy Routes — GET/POST /api/policies
 */

const express = require('express');
const { v4: uuidv4 } = require('uuid');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const { generatePolicyNumber } = require('../utils/indianFormatter');
const { validatePolicyCreation, VALID_TIERS } = require('../utils/validators');

// In-memory store for demo
const demoPolicies = [
  {
    id: 'demo-policy-001',
    policy_number: 'GS-MUM-2026-00042',
    worker_id: 'demo-worker-001',
    plan_tier: 'Standard Shield',
    weekly_premium: 89,
    coverage_percent: 70,
    coverage_amount: 3500, // 70% of 5000 (demo worker income)
    status: 'ACTIVE',
    week_start_date: new Date().toISOString().split('T')[0],
    week_end_date: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
    ai_risk_reasoning: 'Risk: Medium (Score: 42)',
    auto_renew: true,
    created_at: new Date(Date.now() - 60 * 86400000).toISOString(),
    updated_at: new Date().toISOString(),
  }
];

const TIER_CONFIG = {
  'Basic Shield': { weeklyPremium: 49, coveragePercent: 60 },
  'Standard Shield': { weeklyPremium: 89, coveragePercent: 70 },
  'Premium Shield': { weeklyPremium: 149, coveragePercent: 80 },
};

let getDemoWorkers = () => [];
router.setDemoWorkers = (fn) => { getDemoWorkers = fn; };

// POST /api/policies — Create policy (buy coverage)
router.post('/', authMiddleware, (req, res, next) => {
  try {
    const { planTier } = req.body;
    const validation = validatePolicyCreation({ planTier });
    if (!validation.valid) {
      return res.status(400).json({ error: 'Validation failed', details: validation.errors });
    }

    const worker = getDemoWorkers().find(w => w.id === req.user.id);
    if (!worker) {
      return res.status(404).json({ error: 'Worker not found.' });
    }

    // Check for existing active policy
    const existingActive = demoPolicies.find(p => p.worker_id === worker.id && p.status === 'ACTIVE');
    if (existingActive) {
      return res.status(409).json({ error: 'You already have an active policy.', policy: existingActive });
    }

    const config = TIER_CONFIG[planTier];
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay() + 1); // Monday
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6); // Sunday

    const policy = {
      id: uuidv4(),
      policy_number: generatePolicyNumber(),
      worker_id: worker.id,
      plan_tier: planTier,
      weekly_premium: config.weeklyPremium,
      coverage_percent: config.coveragePercent,
      coverage_amount: Math.round(worker.declared_weekly_income * config.coveragePercent / 100),
      status: 'ACTIVE',
      week_start_date: weekStart.toISOString().split('T')[0],
      week_end_date: weekEnd.toISOString().split('T')[0],
      ai_risk_reasoning: worker.risk_label ? `Risk: ${worker.risk_label} (Score: ${worker.risk_score})` : null,
      auto_renew: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    demoPolicies.push(policy);

    res.status(201).json({ message: 'Policy created successfully', policy });
  } catch (err) {
    next(err);
  }
});

// GET /api/policies/active — Get worker's active policy
router.get('/active', authMiddleware, (req, res) => {
  const policy = demoPolicies.find(p => p.worker_id === req.user.id && p.status === 'ACTIVE');
  if (!policy) {
    return res.json({ policy: null, message: 'No active policy found.' });
  }

  const worker = getDemoWorkers().find(w => w.id === req.user.id);
  res.json({
    policy,
    worker: worker ? { name: worker.name, zone: worker.zone, platform: worker.platform, declared_weekly_income: worker.declared_weekly_income } : null,
  });
});

// GET /api/policies/:id — Policy details
router.get('/:id', authMiddleware, (req, res) => {
  const policy = demoPolicies.find(p => p.id === req.params.id);
  if (!policy) {
    return res.status(404).json({ error: 'Policy not found.' });
  }
  res.json({ policy });
});

// PUT /api/policies/upgrade — Change plan tier (upgrade/downgrade premium)
router.put('/upgrade', authMiddleware, (req, res, next) => {
  try {
    const { planTier } = req.body;
    if (!TIER_CONFIG[planTier]) {
      return res.status(400).json({ error: 'Invalid plan tier. Choose: Basic Shield, Standard Shield, or Premium Shield.' });
    }

    const policy = demoPolicies.find(p => p.worker_id === req.user.id && p.status === 'ACTIVE');
    if (!policy) {
      return res.status(404).json({ error: 'No active policy to upgrade.' });
    }

    if (policy.plan_tier === planTier) {
      return res.status(400).json({ error: `You are already on the ${planTier} plan.` });
    }

    const worker = getDemoWorkers().find(w => w.id === req.user.id);
    const config = TIER_CONFIG[planTier];
    const oldTier = policy.plan_tier;

    // Update policy
    policy.plan_tier = planTier;
    policy.weekly_premium = config.weeklyPremium;
    policy.coverage_percent = config.coveragePercent;
    policy.coverage_amount = Math.round((worker?.declared_weekly_income || 5000) * config.coveragePercent / 100);
    policy.updated_at = new Date().toISOString();

    res.json({
      message: `Plan upgraded from ${oldTier} to ${planTier}`,
      policy,
      change: {
        from: { tier: oldTier, premium: TIER_CONFIG[oldTier].weeklyPremium },
        to: { tier: planTier, premium: config.weeklyPremium },
        proratedRefund: null, // In production: calculate prorated amount
      },
    });
  } catch (err) {
    next(err);
  }
});

// Export for access by other routes
router.getDemoPolicies = () => demoPolicies;

module.exports = router;
