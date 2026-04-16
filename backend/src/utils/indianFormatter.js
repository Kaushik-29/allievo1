/**
 * Indian Number Formatting Utilities
 * All amounts in ₹ (INR) with lakh/thousand notation
 */

function formatINR(amount) {
  if (amount === null || amount === undefined) return '₹0';
  const num = Number(amount);
  if (num >= 10000000) return `₹${(num / 10000000).toFixed(1)}Cr`;
  if (num >= 100000) return `₹${(num / 100000).toFixed(1)}L`;
  if (num >= 1000) return `₹${num.toLocaleString('en-IN')}`;
  return `₹${num}`;
}

function formatINRExact(amount) {
  if (amount === null || amount === undefined) return '₹0';
  return `₹${Number(amount).toLocaleString('en-IN')}`;
}

function formatWeeklyPremium(amount) {
  return `₹${amount}/week`;
}

function generatePolicyNumber() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = 'GS-';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function generateClaimNumber() {
  const chars = '0123456789';
  let result = 'CLM-';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

module.exports = {
  formatINR,
  formatINRExact,
  formatWeeklyPremium,
  generatePolicyNumber,
  generateClaimNumber,
};
