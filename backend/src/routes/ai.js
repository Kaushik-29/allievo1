/**
 * AI Routes — POST /api/ai/insights, /predict
 */

const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const claudeService = require('../services/claudeService');

let getDemoWorkers = () => [];
let getDemoClaims = () => [];
let getDemoPolicies = () => [];

router.setDemoWorkers = (fn) => { getDemoWorkers = fn; };
router.setDemoClaims = (fn) => { getDemoClaims = fn; };
router.setDemoPolicies = (fn) => { getDemoPolicies = fn; };

// POST /api/ai/insights — Worker motivational insight (Claude Call 3)
router.post('/insights', authMiddleware, async (req, res, next) => {
  try {
    const worker = getDemoWorkers().find(w => w.id === req.user.id);
    const city = worker?.city || req.body.city || 'Mumbai';

    const claims = getDemoClaims().filter(c => c.worker_id === req.user.id && c.payout_status === 'PAID');
    const totalPayouts = claims.reduce((sum, c) => sum + (c.payout_amount || 0), 0);
    const policies = getDemoPolicies().filter(p => p.worker_id === req.user.id);
    const weeksCovered = policies.length;

    const result = await claudeService.generateWorkerInsight({
      city,
      totalPayouts: totalPayouts || 2400,
      weeksCovered: weeksCovered || 4,
    });

    res.json({
      insight: result.insight,
      aiDebug: result.debug,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
