/**
 * Admin Routes — GET /api/admin/* (Insurer Dashboard data)
 */

const express = require('express');
const router = express.Router();
const claudeService = require('../services/claudeService');

let getDemoWorkers = () => [];
let getDemoPolicies = () => [];
let getDemoClaims = () => [];

router.setDemoWorkers = (fn) => { getDemoWorkers = fn; };
router.setDemoPolicies = (fn) => { getDemoPolicies = fn; };
router.setDemoClaims = (fn) => { getDemoClaims = fn; };

// Admin PIN verification middleware
function adminAuth(req, res, next) {
  const pin = req.headers['x-admin-pin'] || req.query.pin;
  if (pin === 'GS2026') {
    return next();
  }
  return res.status(403).json({ error: 'Admin access required. Provide admin PIN.' });
}

// GET /api/admin/stats — Insurer dashboard aggregates
router.get('/stats', adminAuth, (req, res) => {
  const workers = getDemoWorkers();
  const policies = getDemoPolicies();
  const claims = getDemoClaims();

  const activePolicies = policies.filter(p => p.status === 'ACTIVE');
  const totalPremiums = activePolicies.reduce((sum, p) => sum + p.weekly_premium, 0);
  const paidClaims = claims.filter(c => c.payout_status === 'PAID');
  const totalClaimsPaid = paidClaims.reduce((sum, c) => sum + (c.payout_amount || 0), 0);
  const lossRatio = totalPremiums > 0 ? ((totalClaimsPaid / totalPremiums) * 100).toFixed(1) : 0;

  // Use realistic demo numbers if no data
  const stats = {
    totalActivePolicies: activePolicies.length || 1247,
    totalPremiumsCollected: totalPremiums || 124680,
    totalClaimsPaid: totalClaimsPaid || 68430,
    lossRatio: parseFloat(lossRatio) || 54.8,
    totalWorkers: workers.length || 1450,
    claimsByType: {
      'Heavy Rain': claims.filter(c => c.disruption_type === 'Heavy Rain').length || 234,
      'Severe AQI': claims.filter(c => c.disruption_type === 'Severe AQI').length || 189,
      'Platform Outage': claims.filter(c => c.disruption_type === 'Platform Outage').length || 156,
      'Extreme Heat': claims.filter(c => c.disruption_type === 'Extreme Heat').length || 98,
      'Curfew/Strike': claims.filter(c => c.disruption_type === 'Curfew/Strike').length || 67,
    },
    riskDistribution: {
      Low: workers.filter(w => w.risk_label === 'Low').length || 42,
      Medium: workers.filter(w => w.risk_label === 'Medium').length || 38,
      High: workers.filter(w => w.risk_label === 'High').length || 20,
    },
  };

  res.json(stats);
});

// GET /api/admin/predictions — Claude predictive analytics (Call 4)
router.get('/predictions', adminAuth, async (req, res, next) => {
  try {
    const currentMonth = new Date().toLocaleString('en-IN', { month: 'long' });
    const result = await claudeService.predictDisruptions({ currentMonth });

    res.json({
      predictions: result.predictions,
      month: currentMonth,
      aiDebug: result.debug,
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/admin/fraud-summary — Fraud detection summary
router.get('/fraud-summary', adminAuth, (req, res) => {
  const claims = getDemoClaims();

  const summary = {
    autoApproved: claims.filter(c => c.payout_status === 'PAID' && c.fraud_score < 0.3).length || 623,
    softFlagged: claims.filter(c => c.fraud_score >= 0.3 && c.fraud_score < 0.55).length || 87,
    hardFlagged: claims.filter(c => c.fraud_score >= 0.55 && c.fraud_score < 0.7).length || 34,
    fraudBlocked: claims.filter(c => c.fraud_score >= 0.7).length || 12,
    totalClaims: claims.length || 756,
  };

  res.json(summary);
});

// GET /api/admin/workers — All workers with policy status  
router.get('/workers', adminAuth, (req, res) => {
  const workers = getDemoWorkers();
  const policies = getDemoPolicies();

  const workersWithPolicies = workers.map(w => {
    const { password_hash, ...safe } = w;
    const activePolicy = policies.find(p => p.worker_id === w.id && p.status === 'ACTIVE');
    return { ...safe, hasActivePolicy: !!activePolicy, policyTier: activePolicy?.plan_tier || null };
  });

  res.json({ workers: workersWithPolicies, count: workersWithPolicies.length });
});

// GET /api/admin/claims/pending
router.get('/claims/pending', adminAuth, (req, res) => {
  const claims = getDemoClaims();
  const workers = getDemoWorkers();
  
  const pendingClaims = claims
    .filter(c => c.payout_status === 'IN_PROGRESS' || c.payout_status === 'FLAGGED')
    .map(c => {
      const w = workers.find(w => w.id === c.worker_id);
      return { ...c, worker_name: w ? w.name : 'Unknown User' };
    })
    .sort((a,b) => new Date(b.claim_timestamp) - new Date(a.claim_timestamp));

  res.json({ pending: pendingClaims });
});

// PUT /api/admin/claims/:id/resolve
router.put('/claims/:id/resolve', adminAuth, (req, res) => {
  const claims = getDemoClaims();
  const claimIndex = claims.findIndex(c => c.id === req.params.id);
  
  if (claimIndex === -1) {
    return res.status(404).json({ error: 'Claim not found' });
  }

  const { decision } = req.body; // 'APPROVE' or 'REJECT'
  
  if (decision === 'APPROVE') {
    claims[claimIndex].payout_status = 'PAID';
    claims[claimIndex].claim_approved = true;
    claims[claimIndex].processing_stage = 'COMPLETED';
    
    // Assign mock transaction ID
    claims[claimIndex].razorpay_payment_id = `TXN${Date.now()}`;
    claims[claimIndex].payment_timestamp = new Date().toISOString();
  } else {
    claims[claimIndex].payout_status = 'REJECTED';
    claims[claimIndex].claim_approved = false;
    claims[claimIndex].processing_stage = 'COMPLETED';
  }

  res.json({ message: `Claim successfully ${decision === 'APPROVE' ? 'approved' : 'rejected'}`, claim: claims[claimIndex] });
});

module.exports = router;
