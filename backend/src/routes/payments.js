/**
 * Payment Routes — POST /api/payments/*
 */

const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const paymentService = require('../services/paymentService');

let getDemoWorkers = () => [];
let getDemoPolicies = () => [];

router.setDemoWorkers = (fn) => { getDemoWorkers = fn; };
router.setDemoPolicies = (fn) => { getDemoPolicies = fn; };

// POST /api/payments/create-order — Razorpay order for premium
router.post('/create-order', authMiddleware, async (req, res, next) => {
  try {
    const { policyId, amount } = req.body;

    if (!amount || amount < 1) {
      return res.status(400).json({ error: 'Invalid amount.' });
    }

    const result = await paymentService.createPremiumOrder({
      workerId: req.user.id,
      amount: Number(amount),
      policyId: policyId || 'NEW',
    });

    res.json({
      success: true,
      order: result.order,
      keyId: paymentService.getKeyId(),
      demo: result.demo || false,
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/payments/verify — Verify payment signature
router.post('/verify', authMiddleware, (req, res) => {
  const { orderId, paymentId, signature } = req.body;

  const isValid = paymentService.verifyPaymentSignature({ orderId, paymentId, signature });

  if (isValid) {
    res.json({ success: true, message: 'Payment verified successfully.' });
  } else {
    res.status(400).json({ success: false, error: 'Payment verification failed.' });
  }
});

// POST /api/payments/simulate-payout — Simulate claim payout
router.post('/simulate-payout', authMiddleware, async (req, res, next) => {
  try {
    const { amount, claimId } = req.body;
    const worker = getDemoWorkers().find(w => w.id === req.user.id);

    const result = await paymentService.simulateClaimPayout({
      workerId: req.user.id,
      amount: Number(amount),
      claimId,
      upiId: worker?.upi_id || 'worker@upi',
    });

    res.json({ success: true, payment: result });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
