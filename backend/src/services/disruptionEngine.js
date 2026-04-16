/**
 * Allievo Disruption Engine
 * Parametric trigger evaluation — defines thresholds and simulates sensor readings
 */

const env = require('../config/env');

const CITY_COORDS = {
  Mumbai: { lat: 19.0760, lon: 72.8777 },
  Delhi: { lat: 28.7041, lon: 77.1025 },
  Bengaluru: { lat: 12.9716, lon: 77.5946 },
  Chennai: { lat: 13.0827, lon: 80.2707 },
  Hyderabad: { lat: 17.3850, lon: 78.4867 }
};

const TRIGGER_THRESHOLDS = {
  'Heavy Rain': {
    unit: 'mm/hr',
    threshold: 35,
    generateValue: () => Math.floor(Math.random() * 27) + 38, // 38-64
    generateNormal: () => Math.floor(Math.random() * 25) + 5,  // 5-29
    icon: '🌧️',
    description: 'Rainfall exceeds 35mm/hr causing road flooding',
  },
  'Extreme Heat': {
    unit: '°C',
    threshold: 42,
    generateValue: () => Math.floor(Math.random() * 5) + 43,  // 43-47
    generateNormal: () => Math.floor(Math.random() * 10) + 30, // 30-39
    icon: '🌡️',
    description: 'Temperature exceeds 42°C making outdoor work dangerous',
  },
  'Severe AQI': {
    unit: 'AQI',
    threshold: 300,
    generateValue: () => Math.floor(Math.random() * 140) + 310, // 310-449
    generateNormal: () => Math.floor(Math.random() * 200) + 80, // 80-279
    icon: '💨',
    description: 'Air Quality Index exceeds 300 (Hazardous level)',
  },
  'Curfew/Strike': {
    unit: 'status',
    threshold: 'Active',
    generateValue: () => 'Section 144 imposed',
    generateNormal: () => 'All clear',
    icon: '🚫',
    description: 'Government-imposed restrictions on movement',
  },
  'Platform Outage': {
    unit: '% order drop',
    threshold: 40,
    generateValue: () => Math.floor(Math.random() * 30) + 45, // 45-74
    generateNormal: () => Math.floor(Math.random() * 20) + 2,  // 2-21
    icon: '📱',
    description: 'Platform order volume drops over 40%',
  },
};

/**
 * Evaluate if a sensor value breaches the parametric trigger threshold
 */
function evaluateTrigger(disruptionType, sensorValue) {
  const config = TRIGGER_THRESHOLDS[disruptionType];
  if (!config) return { triggered: false, reason: 'Unknown disruption type' };

  if (disruptionType === 'Curfew/Strike') {
    const triggered = sensorValue !== 'All clear' && sensorValue !== 'Normal';
    return {
      triggered,
      sensorValue,
      threshold: config.threshold,
      severity: triggered ? 'Severe' : 'Low',
    };
  }

  const numValue = parseFloat(sensorValue);
  const triggered = numValue >= config.threshold;

  let severity = 'Low';
  if (triggered) {
    const overshoot = (numValue - config.threshold) / config.threshold;
    severity = overshoot > 0.5 ? 'Severe' : overshoot > 0.2 ? 'High' : 'Moderate';
  }

  return {
    triggered,
    sensorValue: `${numValue}${config.unit}`,
    threshold: `${config.threshold}${config.unit}`,
    severity,
  };
}

/**
 * Simulate a disruption event for a given type and city
 */
function simulateDisruption(disruptionType, city, zone) {
  const config = TRIGGER_THRESHOLDS[disruptionType];
  if (!config) return null;

  const sensorValue = config.generateValue();
  const formatted = disruptionType === 'Curfew/Strike'
    ? sensorValue
    : `${sensorValue}${config.unit}`;

  const threshold = disruptionType === 'Curfew/Strike'
    ? config.threshold
    : `${config.threshold}${config.unit}`;

  return {
    disruptionType,
    city,
    zone,
    sensorValue: formatted,
    thresholdValue: threshold,
    severity: 'High',
    status: 'TRIGGERED',
    icon: config.icon,
    description: config.description,
  };
}

/**
 * Get current simulated sensor readings for all types (normal conditions)
 */
async function getCurrentReadings(city) {
  const readings = {};
  let realData = null;

  if (env.WEATHER_API_KEY && CITY_COORDS[city]) {
    try {
      const { lat, lon } = CITY_COORDS[city];
      const [weatherRes, aqiRes] = await Promise.all([
        fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${env.WEATHER_API_KEY}&units=metric`),
        fetch(`https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${env.WEATHER_API_KEY}`)
      ]);
      
      if (weatherRes.ok && aqiRes.ok) {
        const weather = await weatherRes.json();
        const aqiData = await aqiRes.json();
        
        realData = {
          'Heavy Rain': weather.rain ? (weather.rain['1h'] || 0) : 0,
          'Extreme Heat': weather.main.temp,
          'Severe AQI': aqiData.list[0]?.components?.pm2_5 * 5 || 50 // approximate AQI scale
        };
      }
    } catch (e) {
      console.warn("Weather API fetch failed, falling back to simulation.", e.message);
    }
  }

  for (const [type, config] of Object.entries(TRIGGER_THRESHOLDS)) {
    let value;
    let source = 'Simulated';
    if (realData && realData[type] !== undefined) {
      value = realData[type];
      source = 'Live API';
    } else {
      value = config.generateNormal();
    }
    
    // Evaluate if this specific generated/fetched value crosses threshold
    const numValue = typeof value === 'number' ? value : parseFloat(value);
    let isTriggered = false;
    
    if (type === 'Curfew/Strike') {
        isTriggered = value !== 'All clear' && value !== 'Normal';
    } else {
        isTriggered = numValue >= config.threshold;
    }

    const formatted = type === 'Curfew/Strike'
      ? value
      : `${typeof value === 'number' ? value.toFixed(1) : value}${config.unit}`;
      
    readings[type] = {
      status: isTriggered ? 'TRIGGERED' : 'NORMAL',
      currentValue: formatted,
      threshold: type === 'Curfew/Strike' ? config.threshold : `${config.threshold}${config.unit}`,
      icon: config.icon,
      lastUpdated: new Date().toISOString(),
      source: source,
    };
  }
  return readings;
}

module.exports = {
  TRIGGER_THRESHOLDS,
  evaluateTrigger,
  simulateDisruption,
  getCurrentReadings,
};
