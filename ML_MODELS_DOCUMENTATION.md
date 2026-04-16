# Allievo ML Models Documentation

The Allievo platform utilizes real machine learning implementations to process claims dynamically, moving away from hardcoded rule-based thresholds. 

The models are located in `backend/src/services/mlModels.js` and consist of three phases:

## 1. Risk Scoring Engine (Logistic Regression)
**Goal:** Assess external risk variables and determine how likely a worker is to file a disruption claim.
- **How It Works**: It uses a custom-built Logistic Regression algorithm trained via gradient descent on 5,000 synthetic Indian metro actuarial samples.
- **Features Used**: The model normalizes 7 distinct inputs such as `cityRisk` (an aggregate of historical AQI, heat, and flood numbers), `zoneFlood`, `platformVol`, normalized declared income, and current season metrics. 
- **Output**: After applying the dot-product weights and passing it through a sigmoid function, it generates a precise 1-100 `riskScore`, risk label (`Low`, `Medium`, `High`), and an array detailing precisely how much each feature contributed to the final score.

## 2. Fraud Detection Engine (Anomaly Detection)
**Goal:** Accurately flag, hold, or auto-approve claim requests to prevent abusive behaviour while maintaining payout velocity for valid cases.
- **How It Works**: It uses a **Mahalanobis-inspired distance model**. It calculates distance from a learned "normal" centroid of behaviour using inverse covariance variables calibrated from 10,000 claim patterns.
- **Features Used**: Duplicate claims density, seasonal mismatch (e.g. submitting a heavy rain claim during dry months), account age, query claim frequency in the past week, and simulated GPS anomalies.
- **Output**: Generates a `fraudScore` anomaly distance metric. Depending on how far it deviates from the "norm", it is bucketed into one of 4 threshold outcomes:
  - `< 1.8` → **`AUTO_APPROVE`** 
  - `< 3.2` → **`SOFT_FLAG`** (E.g. Pay 60% immediately, hold 40% for 24h)
  - `< 4.5` → **`HARD_FLAG`** (Requires reviewing)
  - `> 4.5` → **`FRAUD_BLOCK`** (Strict manual review)

## 3. Payout Prediction (Multiple Linear Regression)
**Goal:** Mathematically compute an equitable payout constraint relative strictly to a gig worker's financial profile.
- **How It Works**: A Linear Regression algorithm trained to `~0.94 R²` accuracy scales the payout securely and prevents overpaying vs coverage.
- **Features Used**: Features like declared weekly income, worker's exact coverage parameters, incoming disruption severity proxy, and subtracts deterministic penalties depending on what tier the secondary **Fraud Detection Model** decided on.
- **Output**: A raw adjusted `payoutAmount` directly tied cleanly to a fraction of the declared weekly income limits.

---

# Example Scenario

Imagine we have a **Swiggy delivery driver in Mumbai**, specifically in the **Bandra** zone (which is highly prone to flooding). They have a declared weekly income of ₹6,000 and they've been active for ~2 years. They submit a claim for **Heavy Rain** with a maximum coverage of ₹4,800.

**Input Data Map:**
```json
{
  "worker": {
    "city": "Mumbai",
    "zone": "Bandra",
    "platform": "Swiggy",
    "declaredWeeklyIncome": 6000,
    "yearsActive": "1-3"
  },
  "claimData": {
    "coverageAmount": 4800,
    "disruptionType": "Heavy Rain"
  }
}
```

### Phase 1: Risk Scoring Model Output
```json
{
  "riskScore": 41,
  "riskLabel": "Medium",
  "confidence": 0.182,
  "featureImportance": [
    {
      "feature": "Zone Flood",
      "weight": 0.631,
      "contribution": 1.009,
      "rawValue": 0.82
    },
    {
      "feature": "Season Risk",
      "weight": 0.756,
      "contribution": 0.302,
      "rawValue": 0.4
    }
  ]
}
```
*Because they are positioned in **Bandra**, the `Zone Flood` parameter heavily spiked the risk, contributing the lion's share of the model's decision making.*

### Phase 2: Fraud Detection Anomaly Output
```json
{
  "fraudScore": 1.586,
  "fraudSignals": [
    "gps_anomaly",
    "account_age"
  ],
  "tier": "AUTO_APPROVE",
  "tierDescription": "Clean — Full payout authorized",
  "featureContributions": [
    {
      "name": "GPS Anomaly",
      "contribution": 2.312,
      "isAnomalous": true
    },
    {
      "name": "Account Age",
      "contribution": 0.108,
      "isAnomalous": true
    }
  ]
}
```
*The fraud distance metric evaluates to `1.586`. Since this is lower than the strict threshold of `1.8`, the system grants an **`AUTO_APPROVE`** tier! It mildly detected a GPS Anomaly, but the distance stayed strictly within safe tolerances overall.*

### Phase 3: Payout Prediction Output
```json
{
  "payoutAmount": 2820,
  "payoutPercent": 47,
  "maxPayout": 4800,
  "declaredIncome": 6000,
  "incomeMultiplier": 0.47,
  "fraudAdjustment": "None"
}
```
*The linear regression resolves that this claimant deserves an exact **47%** severity severity-payout out of their weekly income, which resolves to **₹2,820**. Because the Phase 2 logic deemed them `AUTO_APPROVE`, the `fraudAdjustment` penalty remains purely at `"None"` (0%), meaning they get the mathematically derived ₹2,820 immediately with no artificial deductions!*
