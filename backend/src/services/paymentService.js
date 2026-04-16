/**
 * Allievo Payment Service
 * Razorpay sandbox integration + payout simulation
 */

const env = require('../config/env');

let razorpay = null;

try {
  if (env.RAZORPAY_KEY_ID && env.RAZORPAY_KEY_SECRET) {
    const Razorpay = require('razorpay');
    razorpay = new Razorpay({
      key_id: env.RAZORPAY_KEY_ID,
      key_secret: env.RAZORPAY_KEY_SECRET,
    });
    console.log('✅ Razorpay initialized (sandbox mode)');
  }
} catch (err) {
  console.warn('⚠ Razorpay not initialized:', err.message);
}

/**
 * Create Razorpay order for premium payment
 */
async function createPremiumOrder({ workerId, amount, policyId }) {
  if (razorpay) {
    try {
      const order = await razorpay.orders.create({
        amount: amount * 100, // Convert to paise
        currency: 'INR',
        receipt: `GS-PREM-${policyId}`.substring(0, 40),
        notes: { workerId, policyId, type: 'premium' },
      });
      return { success: true, order };
    } catch (err) {
      console.error('Razorpay order creation failed:', err.message);
    }
  }

  // Fallback: simulate order
  return {
    success: true,
    order: {
      id: `order_demo_${Date.now()}`,
      amount: amount * 100,
      currency: 'INR',
      receipt: `GS-PREM-${policyId}`,
      status: 'created',
      created_at: Date.now(),
    },
    demo: true,
  };
}

/**
 * Verify Razorpay payment signature
 */
function verifyPaymentSignature({ orderId, paymentId, signature }) {
  if (razorpay && env.RAZORPAY_KEY_SECRET) {
    const crypto = require('crypto');
    const expectedSignature = crypto
      .createHmac('sha256', env.RAZORPAY_KEY_SECRET)
      .update(`${orderId}|${paymentId}`)
      .digest('hex');
    return expectedSignature === signature;
  }
  // In demo mode, always verify
  return true;
}

/**
 * Simulate UPI claim payout
 * In production: use Razorpay Payouts API with X-Payout-Idempotency header
 * In sandbox: simulate with delay and generate mock transaction IDs
 */
async function simulateClaimPayout({ workerId, amount, claimId, upiId }) {
  // Simulate the 4.2 second processing time
  await new Promise(resolve => setTimeout(resolve, 4200));

  const transactionId = `TXN${Date.now()}`;
  const upiRef = `UPI${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

  return {
    success: true,
    transactionId,
    upiRef,
    amount,
    creditedTo: upiId || 'worker@upi',
    timestamp: new Date().toISOString(),
    method: 'UPI',
    bank: 'HDFC Bank',
  };
}

/**
 * Get Razorpay key ID for frontend checkout
 */
function getKeyId() {
  return env.RAZORPAY_KEY_ID || 'rzp_test_demo_key';
}

module.exports = {
  createPremiumOrder,
  verifyPaymentSignature,
  simulateClaimPayout,
  getKeyId,
};
