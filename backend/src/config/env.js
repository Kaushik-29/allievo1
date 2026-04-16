require('dotenv').config();

const requiredVars = [
  'PORT',
  'JWT_SECRET',
];

const optionalVars = [
  'DATABASE_URL',
  'REDIS_URL',
  'GEMINI_API_KEY',
  'RAZORPAY_KEY_ID',
  'RAZORPAY_KEY_SECRET',
  'FRONTEND_URL',
  'DEMO_MODE',
  'WEATHER_API_KEY',
];

function validateEnv() {
  const missing = requiredVars.filter(v => !process.env[v]);
  if (missing.length > 0) {
    console.warn(`⚠ Missing required env vars: ${missing.join(', ')}. Using defaults.`);
  }
}

validateEnv();

module.exports = {
  PORT: parseInt(process.env.PORT || '3001', 10),
  NODE_ENV: process.env.NODE_ENV || 'development',
  FRONTEND_URL: process.env.FRONTEND_URL || 'https://allievo.netlify.app',
  DATABASE_URL: process.env.DATABASE_URL || 'postgresql://allievo_user:Xm9YruvU87RlrvfdA60mWKqw7DvS5wI1@dpg-d7gdlk647okc73fjkorg-a/allievo',
  REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6379',
  JWT_SECRET: process.env.JWT_SECRET || 'allievo-dev-secret-2026',
  JWT_EXPIRY: process.env.JWT_EXPIRY || '7d',
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || '',
  RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID || '',
  RAZORPAY_KEY_SECRET: process.env.RAZORPAY_KEY_SECRET || '',
  DEMO_MODE: process.env.DEMO_MODE === 'true',
  WEATHER_API_KEY: process.env.WEATHER_API_KEY || '',
};
