/**
 * Allievo Fraud Detection Service
 * Now powered by ML Anomaly Detection model (Mahalanobis distance)
 * Wraps mlModels.js for backward compatibility with existing route handlers
 */

const mlModels = require('./mlModels');

/**
 * Compute fraud score using ML anomaly detection
 * @returns {{ fraudScore: number, fraudSignals: string[], tier: string }}
 */
function computeFraudScore({ worker, claimData, recentClaims, disruptionType, currentMonth }) {
  return mlModels.computeFraudScore({ worker, claimData, recentClaims, disruptionType, currentMonth });
}

/**
 * Calculate income-tied payout using ML regression model
 */
function calculatePayout({ coverageAmount, payoutPercent, fraudTier, declaredWeeklyIncome, fraudScore }) {
  return mlModels.calculatePayout({ coverageAmount, payoutPercent, fraudTier, declaredWeeklyIncome, fraudScore });
}

function getTier(score) {
  if (score < 1.8) return 'AUTO_APPROVE';
  if (score < 3.2) return 'SOFT_FLAG';
  if (score < 4.5) return 'HARD_FLAG';
  return 'FRAUD_BLOCK';
}

function getTierDescription(tier) {
  return mlModels.getTierDescription(tier);
}

module.exports = {
  computeFraudScore,
  calculatePayout,
  getTier,
  getTierDescription,
};
