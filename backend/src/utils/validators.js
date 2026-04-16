/**
 * Input Validation Helpers
 */

const VALID_CITIES = ['Mumbai', 'Delhi', 'Bengaluru', 'Chennai', 'Hyderabad'];
const VALID_PLATFORMS = ['Swiggy', 'Zomato', 'Both'];
const VALID_INCOMES = [2000, 3500, 5000, 8000];
const VALID_YEARS = ['0-1', '1-3', '3+'];
const VALID_TIERS = ['Basic Shield', 'Standard Shield', 'Premium Shield'];
const VALID_DISRUPTION_TYPES = ['Heavy Rain', 'Extreme Heat', 'Severe AQI', 'Curfew/Strike', 'Platform Outage'];

const ZONE_MAP = {
  'Mumbai': ['Bandra', 'Andheri', 'Powai', 'Dadar', 'Lower Parel'],
  'Delhi': ['Connaught Place', 'Lajpat Nagar', 'Dwarka', 'Saket', 'Noida'],
  'Bengaluru': ['Koramangala', 'Indiranagar', 'Whitefield', 'Jayanagar', 'HSR Layout'],
  'Chennai': ['T. Nagar', 'Anna Nagar', 'Velachery', 'Adyar', 'Mylapore'],
  'Hyderabad': ['Kondapur', 'Gachibowli', 'Banjara Hills', 'Hitech City', 'Kukatpally'],
};

function validateRegistration(data) {
  const errors = [];

  if (!data.name || data.name.trim().length < 2) errors.push('Name must be at least 2 characters');
  if (!data.phone || !/^[6-9]\d{9}$/.test(data.phone)) errors.push('Valid 10-digit Indian phone number required');
  if (!data.aadharNumber || !/^\d{12}$/.test(data.aadharNumber)) errors.push('Valid 12-digit Aadhar number required');
  if (!data.password || data.password.length < 6) errors.push('Password must be at least 6 characters');
  if (!VALID_CITIES.includes(data.city)) errors.push(`City must be one of: ${VALID_CITIES.join(', ')}`);
  if (!VALID_PLATFORMS.includes(data.platform)) errors.push(`Platform must be one of: ${VALID_PLATFORMS.join(', ')}`);
  if (!data.zone || !ZONE_MAP[data.city]?.includes(data.zone)) errors.push(`Invalid zone for ${data.city}`);
  if (!VALID_INCOMES.includes(Number(data.declaredWeeklyIncome))) errors.push(`Income must be one of: ${VALID_INCOMES.join(', ')}`);
  if (!VALID_YEARS.includes(data.yearsActive)) errors.push(`Years active must be one of: ${VALID_YEARS.join(', ')}`);

  return { valid: errors.length === 0, errors };
}

function validatePolicyCreation(data) {
  const errors = [];
  if (!VALID_TIERS.includes(data.planTier)) errors.push(`Plan tier must be one of: ${VALID_TIERS.join(', ')}`);
  return { valid: errors.length === 0, errors };
}

function validateDisruptionType(type) {
  return VALID_DISRUPTION_TYPES.includes(type);
}

module.exports = {
  VALID_CITIES,
  VALID_PLATFORMS,
  VALID_INCOMES,
  VALID_YEARS,
  VALID_TIERS,
  VALID_DISRUPTION_TYPES,
  ZONE_MAP,
  validateRegistration,
  validatePolicyCreation,
  validateDisruptionType,
};
