/**
 * Claims Routes — GET/POST /api/claims
 */

const express = require('express');
const { v4: uuidv4 } = require('uuid');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const claudeService = require('../services/claudeService');
const { computeFraudScore, calculatePayout } = require('../services/fraudService');
const { simulateClaimPayout } = require('../services/paymentService');
const { generateClaimNumber } = require('../utils/indianFormatter');

// In-memory store
const demoClaims = [];

let getDemoWorkers = () => [];
let getDemoPolicies = () => [];
let getDemoDisruptions = () => [];

router.setDemoWorkers = (fn) => { getDemoWorkers = fn; };
router.setDemoPolicies = (fn) => { getDemoPolicies = fn; };
router.setDemoDisruptions = (fn) => { getDemoDisruptions = fn; };

// POST /api/claims/validate — AI validate + fraud check + payout
router.post('/validate', authMiddleware, async (req, res, next) => {
  try {
    const { disruptionEventId, disruptionType, sensorValue } = req.body;

    const worker = getDemoWorkers().find(w => w.id === req.user.id);
    if (!worker) {
      return res.status(404).json({ error: 'Worker not found.' });
    }

    const policy = getDemoPolicies().find(p => p.worker_id === worker.id && p.status === 'ACTIVE');
    if (!policy) {
      return res.status(400).json({ error: 'No active policy found. Please purchase a policy first.' });
    }

    // Step 1: Fraud scoring
    const recentClaims = demoClaims.filter(c => c.worker_id === worker.id);
    const fraudResult = computeFraudScore({
      worker,
      claimData: { disruptionType, sensorValue },
      recentClaims,
      disruptionType,
      currentMonth: new Date().getMonth() + 1,
    });

    // Step 2: Gemini AI + ML validation (Call 2)
    const currentMonth = new Date().toLocaleString('en-IN', { month: 'long' });
    const aiResult = await claudeService.validateClaim({
      disruptionType,
      sensorValue,
      city: worker.city,
      zone: worker.zone,
      platform: worker.platform,
      currentMonth,
      fraudSignals: fraudResult.fraudSignals,
      worker, // pass full worker for ML feature extraction
      recentClaims, // pass for duplicate detection model
    });

    // Step 3: Income-tied payout via ML regression model
    const payoutCalc = calculatePayout({
      coverageAmount: policy.coverage_amount,
      payoutPercent: aiResult.payoutPercent,
      fraudTier: fraudResult.tier,
      declaredWeeklyIncome: worker.declared_weekly_income, // income-tied
      fraudScore: fraudResult.fraudScore,
    });

    // Step 4: Create claim record
    const claim = {
      id: uuidv4(),
      claim_number: generateClaimNumber(),
      policy_id: policy.id,
      worker_id: worker.id,
      disruption_event_id: disruptionEventId || null,
      disruption_type: disruptionType,
      sensor_value: sensorValue,
      claim_approved: aiResult.claimApproved && fraudResult.tier !== 'FRAUD_BLOCK',
      fraud_risk: aiResult.fraudRisk,
      fraud_reasons: aiResult.fraudReasons,
      ai_payout_percent: aiResult.payoutPercent,
      ai_explanation: aiResult.explanation,
      fraud_score: fraudResult.fraudScore,
      gps_spoof_flag: fraudResult.fraudSignals.includes('gps_trajectory_anomaly'),
      weather_mismatch_flag: fraudResult.fraudSignals.includes('weather_season_mismatch'),
      duplicate_claim_flag: fraudResult.fraudSignals.includes('duplicate_claim_24h'),
      payout_amount: payoutCalc.immediateAmount,
      payout_status: payoutCalc.payoutStatus,
      processing_stage: 'COMPLETED',
      claim_timestamp: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Step 5: Simulate payout if approved
    let paymentResult = null;
    if (payoutCalc.immediateAmount > 0) {
      paymentResult = {
        transactionId: `TXN${Date.now()}`,
        upiRef: `UPI${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
        amount: payoutCalc.immediateAmount,
        creditedTo: worker.upi_id || 'worker@upi',
        timestamp: new Date().toISOString(),
      };
      claim.razorpay_payment_id = paymentResult.transactionId;
      claim.payment_timestamp = paymentResult.timestamp;
      claim.payout_status = 'PAID';
    }

    demoClaims.push(claim);

    res.json({
      message: claim.claim_approved ? 'Claim approved' : 'Claim flagged for review',
      claim,
      fraudAnalysis: {
        score: fraudResult.fraudScore,
        signals: fraudResult.fraudSignals,
        tier: fraudResult.tier,
        tierDescription: fraudResult.tierDescription,
        mlModel: fraudResult.mlModel, // ML model metadata
        featureContributions: fraudResult.featureContributions, // per-feature scores
      },
      payout: {
        immediateAmount: payoutCalc.immediateAmount,
        heldAmount: payoutCalc.heldAmount,
        totalPayout: payoutCalc.totalPayout,
        status: payoutCalc.payoutStatus,
        processingTime: payoutCalc.processingTime,
        heldReleaseHours: payoutCalc.heldReleaseHours,
        reviewMessage: payoutCalc.reviewMessage,
        mlPayout: payoutCalc.mlPayout, // income-tied payout regression
        declaredWeeklyIncome: worker.declared_weekly_income,
      },
      payment: paymentResult,
      aiDebug: aiResult.debug,
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/claims/manual — User submits a manual claim
router.post('/manual', authMiddleware, async (req, res, next) => {
  try {
    const { date_of_incident, disruptionType, description, proofData } = req.body;

    const worker = getDemoWorkers().find(w => w.id === req.user.id);
    if (!worker) return res.status(404).json({ error: 'Worker not found.' });

    const policy = getDemoPolicies().find(p => p.worker_id === worker.id && p.status === 'ACTIVE');
    if (!policy) return res.status(400).json({ error: 'No active policy found.' });

    const recentClaims = demoClaims.filter(c => c.worker_id === worker.id);
    
    // Step 1: Compute fraud score based on manual proof and ML profile
    const fraudResult = computeFraudScore({
      worker,
      claimData: { disruptionType, description, isManual: true },
      recentClaims,
      disruptionType,
      currentMonth: new Date().getMonth() + 1,
    });

    // Step 2: Gemini validation
    const currentMonth = new Date().toLocaleString('en-IN', { month: 'long' });
    const aiResult = await claudeService.validateClaim({
      disruptionType,
      sensorValue: "Manual Upload Evidence",
      city: worker.city,
      zone: worker.zone,
      platform: worker.platform,
      currentMonth,
      fraudSignals: fraudResult.fraudSignals,
      worker,
      recentClaims,
    });

    // Step 3: Determine outcome based on user threshold logic
    let payoutStatus = 'IN_PROGRESS';
    let isApproved = false;
    let finalAmount = 0;

    const payoutCalc = calculatePayout({
      coverageAmount: policy.coverage_amount,
      payoutPercent: aiResult.payoutPercent || 50,
      fraudTier: fraudResult.tier,
      declaredWeeklyIncome: worker.declared_weekly_income,
      fraudScore: fraudResult.fraudScore,
    });

    if (fraudResult.fraudScore >= 80) {
      payoutStatus = 'REJECTED';
      isApproved = false;
      finalAmount = 0;
    } else if (fraudResult.fraudScore <= 20 && aiResult.claimApproved) {
      payoutStatus = 'PAID';
      isApproved = true;
      finalAmount = payoutCalc.immediateAmount;
    } else {
      payoutStatus = 'IN_PROGRESS';
      isApproved = false; // Requires manual review
      finalAmount = payoutCalc.immediateAmount; // Precomputed expected amount
    }

    const claim = {
      id: uuidv4(),
      claim_number: generateClaimNumber(),
      policy_id: policy.id,
      worker_id: worker.id,
      disruption_event_id: 'MANUAL',
      disruption_type: disruptionType,
      sensor_value: 'Manual Form',
      claim_approved: isApproved,
      fraud_risk: aiResult.fraudRisk || (fraudResult.fraudScore >= 80 ? 'High' : 'Medium'),
      fraud_reasons: aiResult.fraudReasons,
      ai_explanation: aiResult.explanation + `\n\n[MANUAL REVIEW MODE] User Description: ${description}`,
      fraud_score: fraudResult.fraudScore,
      payout_amount: finalAmount,
      payout_status: payoutStatus,
      processing_stage: payoutStatus === 'IN_PROGRESS' ? 'PENDING_REVIEW' : 'COMPLETED',
      claim_timestamp: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      proof_attached: !!proofData,
    };

    let paymentResult = null;
    if (payoutStatus === 'PAID' && finalAmount > 0) {
      paymentResult = {
        transactionId: `TXN${Date.now()}`,
        upiRef: `UPI${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
        amount: finalAmount,
        creditedTo: worker.upi_id || 'worker@upi',
        timestamp: new Date().toISOString(),
      };
      claim.razorpay_payment_id = paymentResult.transactionId;
      claim.payment_timestamp = paymentResult.timestamp;
    }

    demoClaims.push(claim);

    res.json({
      message: payoutStatus === 'PAID' ? 'Claim automatically approved' : (payoutStatus === 'REJECTED' ? 'Claim rejected due to high fraud risk' : 'Claim submitted for manual review'),
      claim,
      payoutStatus
    });

  } catch (err) {
    next(err);
  }
});

// GET /api/claims — Worker's claim history
router.get('/', authMiddleware, (req, res) => {
  const claims = demoClaims
    .filter(c => c.worker_id === req.user.id)
    .sort((a, b) => new Date(b.claim_timestamp) - new Date(a.claim_timestamp));

  res.json({ claims, count: claims.length });
});

// GET /api/claims/:id — Claim detail
router.get('/:id', authMiddleware, (req, res) => {
  const claim = demoClaims.find(c => c.id === req.params.id);
  if (!claim) {
    return res.status(404).json({ error: 'Claim not found.' });
  }
  res.json({ claim });
});

// Export
router.getDemoClaims = () => demoClaims;

module.exports = router;
