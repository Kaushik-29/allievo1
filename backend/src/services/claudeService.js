/**
 * Allievo Gemini AI Service
 * All 4 Gemini API calls with error handling, retry logic, and response parsing
 * Model: gemini-2.0-flash
 * 
 * Replaces the previous Claude (Anthropic) integration.
 */

const env = require('../config/env');
const mlModels = require('./mlModels');

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models';
const GEMINI_MODEL = 'gemini-2.0-flash';
const MAX_RETRIES = 2;

/**
 * Core fetch wrapper for Gemini API with retry logic
 */
async function callGemini(systemPrompt, userMessage, maxTokens = 500) {
  const startTime = Date.now();
  let lastError = null;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const url = `${GEMINI_API_URL}/${GEMINI_MODEL}:generateContent?key=${env.GEMINI_API_KEY}`;

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: systemPrompt }] },
          contents: [{ parts: [{ text: userMessage }] }],
          generationConfig: {
            maxOutputTokens: maxTokens,
            temperature: 0.3,
          },
        }),
      });

      if (response.status === 429 && attempt < MAX_RETRIES) {
        console.warn(`Gemini API rate-limited (429). Retry ${attempt + 1}/${MAX_RETRIES}...`);
        await new Promise(r => setTimeout(r, 2000 * (attempt + 1)));
        continue;
      }

      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`Gemini API error ${response.status}: ${errorBody}`);
      }

      const data = await response.json();
      const responseTime = Date.now() - startTime;
      const content = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

      return {
        content,
        responseTime,
        model: GEMINI_MODEL,
        usage: data.usageMetadata,
        prompt: { system: systemPrompt, user: userMessage },
      };
    } catch (err) {
      lastError = err;
      if (attempt < MAX_RETRIES) {
        await new Promise(r => setTimeout(r, 2000 * (attempt + 1)));
        continue;
      }
    }
  }

  throw lastError || new Error('Gemini API call failed after retries');
}

/**
 * Parse JSON from Gemini response, handling potential markdown wrapping
 */
function parseGeminiJSON(content) {
  let cleaned = content.trim();
  // Remove markdown code fences if present
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*\n?/, '').replace(/\n?\s*```$/, '');
  }
  return JSON.parse(cleaned);
}

// ============================================================
// CALL 1: Actuarial Risk Scoring (ML + Gemini hybrid)
// ============================================================
async function scoreWorkerRisk({ name, city, zone, platform, declaredWeeklyIncome, yearsActive }) {
  // STEP 1: Run the ML logistic regression model
  const mlResult = mlModels.predictRiskScore({
    city, zone, platform,
    declaredWeeklyIncome: Number(declaredWeeklyIncome),
    yearsActive,
  });

  // STEP 2: Use Gemini to generate human-readable reasoning
  const systemPrompt = `You are an actuarial AI for Allievo parametric insurance. You have been given the output of a logistic regression ML model that scored a worker's risk. Generate a JSON object with these fields:
{
  "reasoning": "<2 sentences explaining WHY the model scored this way, referencing specific city/zone/income factors>",
  "regulatoryNote": "<1 sentence about IRDAI parametric insurance compliance for this risk tier>"
}
The ML model gave: risk score ${mlResult.riskScore}/100 (${mlResult.riskLabel}). Top contributing features: ${mlResult.featureImportance.slice(0, 3).map(f => `${f.feature} (${f.rawValue.toFixed(2)})`).join(', ')}. Return ONLY valid JSON.`;

  const userMessage = `Worker profile:
- Name: ${name}
- City: ${city}
- Zone: ${zone}
- Platform: ${platform}
- Declared Weekly Income: ₹${declaredWeeklyIncome}
- Years active: ${yearsActive} years
- ML Risk Score: ${mlResult.riskScore}/100
- ML Risk Label: ${mlResult.riskLabel}
- ML Confidence: ${mlResult.confidence}`;

  // Determine premium and coverage from ML score
  const premium = mlResult.riskScore < 40 ? 49 : mlResult.riskScore < 65 ? 89 : 149;
  const coverage = mlResult.riskScore < 40 ? 80 : mlResult.riskScore < 65 ? 70 : 60;

  // If no Gemini API key, use demo reasoning
  if (!env.GEMINI_API_KEY) {
    return getDemoRiskScore({ city, zone, declaredWeeklyIncome, yearsActive, mlResult, premium, coverage });
  }

  try {
    const result = await callGemini(systemPrompt, userMessage, 300);
    const parsed = parseGeminiJSON(result.content);

    return {
      riskScore: mlResult.riskScore,
      riskLabel: mlResult.riskLabel,
      weeklyPremium: premium,
      coveragePercent: coverage,
      reasoning: String(parsed.reasoning || `${city}-${zone} risk assessed by ML model.`),
      regulatoryNote: String(parsed.regulatoryNote || 'Compliant with IRDAI sandbox guidelines for parametric products.'),
      mlModel: mlResult.modelInfo,
      featureImportance: mlResult.featureImportance,
      confidence: mlResult.confidence,
      debug: {
        prompt: result.prompt,
        rawResponse: result.content,
        responseTime: result.responseTime,
        model: result.model,
        mlModelUsed: true,
      },
    };
  } catch (err) {
    console.error('Gemini risk reasoning failed, using ML-only result:', err.message);
    return getDemoRiskScore({ city, zone, declaredWeeklyIncome, yearsActive, mlResult, premium, coverage });
  }
}

// ============================================================
// CALL 2: Claim Validation + Fraud Detection (ML + Gemini hybrid)
// ============================================================
async function validateClaim({ disruptionType, sensorValue, city, zone, platform, currentMonth, fraudSignals, worker, recentClaims }) {
  // STEP 1: Run ML fraud detection model
  const fraudResult = mlModels.detectFraud({
    worker: worker || { city, zone, created_at: new Date(Date.now() - 90 * 86400000).toISOString() },
    claimData: { disruptionType, sensorValue },
    recentClaims: recentClaims || [],
    disruptionType,
    currentMonth,
  });

  // STEP 2: Run income-tied payout regression
  const declaredWeeklyIncome = worker?.declared_weekly_income || 5000;
  const coveragePercent = 70;
  const payoutResult = mlModels.predictPayout({
    declaredWeeklyIncome,
    coveragePercent,
    disruptionSeverity: 0.7,
    fraudTier: fraudResult.tier,
    fraudScore: fraudResult.fraudScore,
  });

  // STEP 3: Use Gemini for human-readable explanation
  const systemPrompt = `You are a claim validator for Allievo parametric insurance. An ML anomaly detection model has scored this claim. Return a JSON object:
{
  "claimApproved": ${fraudResult.tier !== 'FRAUD_BLOCK'},
  "explanation": "<2 sentences explaining the ML fraud decision and payout calculation>",
  "incomeImpact": "<1 sentence about how the payout relates to the worker's declared ₹${declaredWeeklyIncome}/week income>"
}
ML Fraud Score: ${fraudResult.fraudScore.toFixed(3)} (Tier: ${fraudResult.tier}). Signals: ${fraudResult.fraudSignals.join(', ') || 'none'}. Payout: ₹${payoutResult.payoutAmount} (${payoutResult.payoutPercent}% of income). Return ONLY valid JSON.`;

  const userMessage = `Disruption: ${disruptionType} in ${city}-${zone}. Sensor: ${sensorValue}. Month: ${currentMonth}.`;

  const baseResult = {
    claimApproved: fraudResult.tier !== 'FRAUD_BLOCK',
    fraudRisk: fraudResult.fraudScore < 1.8 ? 'Low' : fraudResult.fraudScore < 3.2 ? 'Medium' : 'High',
    fraudReasons: fraudResult.fraudSignals,
    payoutPercent: payoutResult.payoutPercent,
    payoutAmount: payoutResult.payoutAmount,
    declaredWeeklyIncome,
    incomeMultiplier: payoutResult.incomeMultiplier,
    mlFraud: fraudResult.modelInfo,
    mlPayout: payoutResult.modelInfo,
    featureContributions: fraudResult.featureContributions,
  };

  if (!env.GEMINI_API_KEY) {
    return {
      ...baseResult,
      explanation: `Disruption verified for ${disruptionType}. ML anomaly score: ${fraudResult.fraudScore.toFixed(2)} (${fraudResult.tier}). Payout of ₹${payoutResult.payoutAmount} represents ${payoutResult.payoutPercent}% of declared ₹${declaredWeeklyIncome}/week income.`,
      debug: {
        prompt: { system: '[Demo mode - Gemini API key not configured]', user: 'ML fraud detection + payout regression' },
        rawResponse: JSON.stringify({ fraudScore: fraudResult.fraudScore, tier: fraudResult.tier }),
        responseTime: 180 + Math.random() * 200,
        model: 'demo-ml-mode',
        mlModelUsed: true,
      },
    };
  }

  try {
    const result = await callGemini(systemPrompt, userMessage, 300);
    const parsed = parseGeminiJSON(result.content);
    return {
      ...baseResult,
      explanation: String(parsed.explanation || baseResult.explanation),
      debug: { prompt: result.prompt, rawResponse: result.content, responseTime: result.responseTime, model: result.model, mlModelUsed: true },
    };
  } catch (err) {
    return {
      ...baseResult,
      explanation: `ML model validated ${disruptionType} disruption. Anomaly score: ${fraudResult.fraudScore.toFixed(2)}.`,
      debug: { rawResponse: err.message, responseTime: 0, model: 'fallback', mlModelUsed: true },
    };
  }
}

// ============================================================
// CALL 3: Worker Motivational Insight (Gemini)
// ============================================================
async function generateWorkerInsight({ city, totalPayouts, weeksCovered }) {
  const systemPrompt = `You are a supportive insurance companion for Allievo. Generate exactly 1 sentence of encouragement for a food delivery worker in India. Reference real data about how parametric insurance helped gig workers during disruptions. Be specific, warm, and motivating. Return plain text only.`;

  const userMessage = `Worker: Based in ${city}. Has received ₹${totalPayouts} in protection payouts so far. Covered for ${weeksCovered} weeks. Current month: ${new Date().toLocaleString('en-IN', { month: 'long', year: 'numeric' })}.`;

  if (!env.GEMINI_API_KEY) {
    return getDemoInsight({ city, totalPayouts });
  }

  try {
    const result = await callGemini(systemPrompt, userMessage, 200);
    return {
      insight: result.content.trim(),
      debug: { prompt: result.prompt, rawResponse: result.content, responseTime: result.responseTime, model: result.model },
    };
  } catch (err) {
    return getDemoInsight({ city, totalPayouts });
  }
}

// ============================================================
// CALL 4: Predictive Analytics (Gemini)
// ============================================================
async function predictDisruptions({ currentMonth }) {
  const systemPrompt = `You are an insurance analytics AI for Allievo. Analyze disruption risk for Indian metro cities and return a JSON array of exactly 6 prediction objects:
[
  {
    "city": "<Mumbai|Delhi|Bengaluru|Chennai|Hyderabad>",
    "disruptionType": "<Heavy Rain|Extreme Heat|Severe AQI|Curfew/Strike|Platform Outage>",
    "probability": <number 0.0-1.0>,
    "recommendation": "<1 sentence action recommendation for the insurer>"
  }
]
Base predictions on Indian climate patterns (IMD data), historical AQI data (CPCB), and seasonal context. Return ONLY valid JSON array.`;

  const userMessage = `Current month: ${currentMonth}. Year: ${new Date().getFullYear()}. Predict disruptions for next week across Mumbai, Delhi, Bengaluru, Chennai, and Hyderabad. Consider monsoon patterns, AQI trends, and platform stability.`;

  if (!env.GEMINI_API_KEY) {
    return getDemoPredictions({ currentMonth });
  }

  try {
    const result = await callGemini(systemPrompt, userMessage, 800);
    const parsed = parseGeminiJSON(result.content);

    const validated = Array.isArray(parsed) ? parsed.map(p => ({
      city: String(p.city),
      disruptionType: String(p.disruptionType),
      probability: Math.max(0, Math.min(1, Number(p.probability) || 0.5)),
      recommendation: String(p.recommendation),
    })) : [];

    return {
      predictions: validated,
      debug: { prompt: result.prompt, rawResponse: result.content, responseTime: result.responseTime, model: result.model },
    };
  } catch (err) {
    return getDemoPredictions({ currentMonth });
  }
}

// ============================================================
// DEMO FALLBACK DATA (when no API key)
// ============================================================
function getDemoRiskScore({ city, zone, declaredWeeklyIncome, yearsActive, mlResult, premium, coverage }) {
  const topFeatures = mlResult.featureImportance.slice(0, 2);
  return {
    riskScore: mlResult.riskScore,
    riskLabel: mlResult.riskLabel,
    weeklyPremium: premium,
    coveragePercent: coverage,
    reasoning: `${city}-${zone} scored ${mlResult.riskScore}/100 by our logistic regression model. Primary risk drivers: ${topFeatures.map(f => f.feature).join(' and ')} (combined contribution: ${topFeatures.reduce((s, f) => s + f.contribution, 0).toFixed(2)}).`,
    regulatoryNote: 'Compliant with IRDAI sandbox guidelines for parametric insurance products (2024 framework).',
    mlModel: mlResult.modelInfo,
    featureImportance: mlResult.featureImportance,
    confidence: mlResult.confidence,
    debug: {
      prompt: { system: '[Demo mode - Gemini API key not configured. ML model ran successfully.]', user: 'Logistic Regression risk scoring' },
      rawResponse: JSON.stringify({ riskScore: mlResult.riskScore, features: mlResult.featureImportance.length }),
      responseTime: 45 + Math.random() * 30, // ML inference is fast
      model: 'LogisticRegression + demo-gemini',
      mlModelUsed: true,
    },
  };
}

function getDemoInsight({ city, totalPayouts }) {
  const insights = [
    `Your Allievo coverage in ${city} has already protected ₹${totalPayouts || '2,400'} of your earnings — during last month's heavy rains alone, over 12,000 delivery partners across India received instant payouts without filing a single claim.`,
    `Stay strong on the roads of ${city}! With your parametric coverage active, you're part of a growing network of 50,000+ protected delivery partners who earned ₹${totalPayouts || '1,800'} in automated disruption payouts this quarter.`,
    `Great work keeping your coverage active in ${city}! Last monsoon season, Allievo's parametric triggers helped delivery partners recover ₹4.2 crore in lost income across all metro cities.`,
  ];
  return {
    insight: insights[Math.floor(Math.random() * insights.length)],
    debug: {
      prompt: { system: '[Demo mode - Gemini API key not configured]', user: 'Demo insight generation' },
      rawResponse: 'Demo motivational insight',
      responseTime: 120 + Math.random() * 150,
      model: 'demo-mode',
    },
  };
}

function getDemoPredictions({ currentMonth }) {
  return {
    predictions: [
      { city: 'Mumbai', disruptionType: 'Heavy Rain', probability: 0.78, recommendation: 'Increase reserve pool by 25% for Mumbai coastal zones ahead of monsoon intensification.' },
      { city: 'Mumbai', disruptionType: 'Platform Outage', probability: 0.35, recommendation: 'Monitor Swiggy/Zomato server uptime metrics; preauthorize partial payouts for brief outages.' },
      { city: 'Delhi', disruptionType: 'Severe AQI', probability: 0.82, recommendation: 'Pre-trigger AQI alerts for workers in Connaught Place and Lajpat Nagar zones.' },
      { city: 'Delhi', disruptionType: 'Extreme Heat', probability: 0.61, recommendation: 'Consider offering midday coverage breaks and heat advisory notifications.' },
      { city: 'Bengaluru', disruptionType: 'Heavy Rain', probability: 0.45, recommendation: 'Standard coverage sufficient; monitor Koramangala and Whitefield drainage systems.' },
      { city: 'Chennai', disruptionType: 'Heavy Rain', probability: 0.72, recommendation: 'NE monsoon risk elevated — pre-allocate reserves for Velachery and Tambaram zones.' },
    ],
    debug: {
      prompt: { system: '[Demo mode]', user: `Demo predictions for ${currentMonth}` },
      rawResponse: JSON.stringify([{ city: 'Mumbai', probability: 0.78 }]),
      responseTime: 450 + Math.random() * 300,
      model: 'demo-mode',
    },
  };
}

module.exports = {
  scoreWorkerRisk,
  validateClaim,
  generateWorkerInsight,
  predictDisruptions,
};
