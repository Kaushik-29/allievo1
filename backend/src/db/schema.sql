-- Allievo Database Schema
-- Parametric Income Protection for Gig Workers

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- for fast text search

-- Workers table
CREATE TABLE workers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  phone VARCHAR(15) UNIQUE NOT NULL,
  aadhar_number VARCHAR(12) UNIQUE,
  email VARCHAR(150) UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  city VARCHAR(50) NOT NULL CHECK (city IN ('Mumbai','Delhi','Bengaluru','Chennai','Hyderabad')),
  platform VARCHAR(20) NOT NULL CHECK (platform IN ('Swiggy','Zomato','Both')),
  zone VARCHAR(80) NOT NULL,
  declared_weekly_income INTEGER NOT NULL CHECK (declared_weekly_income IN (2000,3500,5000,8000)),
  years_active VARCHAR(10) NOT NULL CHECK (years_active IN ('0-1','1-3','3+')),
  risk_score INTEGER CHECK (risk_score BETWEEN 1 AND 100),
  risk_label VARCHAR(10) CHECK (risk_label IN ('Low','Medium','High')),
  upi_id VARCHAR(100),
  device_fingerprint VARCHAR(255),
  registered_lat NUMERIC(10,7),
  registered_lon NUMERIC(10,7),
  geofence_radius_km NUMERIC(5,1) DEFAULT 15.0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Policies table
CREATE TABLE policies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  policy_number VARCHAR(20) UNIQUE NOT NULL, -- GS-XXXXXX format
  worker_id UUID NOT NULL REFERENCES workers(id) ON DELETE CASCADE,
  plan_tier VARCHAR(20) NOT NULL CHECK (plan_tier IN ('Basic Shield','Standard Shield','Premium Shield')),
  weekly_premium INTEGER NOT NULL,
  coverage_percent INTEGER NOT NULL CHECK (coverage_percent BETWEEN 60 AND 80),
  coverage_amount INTEGER NOT NULL, -- declared_income * coverage_percent / 100
  status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE','EXPIRED','CANCELLED','PENDING')),
  week_start_date DATE NOT NULL,
  week_end_date DATE NOT NULL,
  ai_risk_reasoning TEXT,
  auto_renew BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Disruption events table
CREATE TABLE disruption_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  disruption_type VARCHAR(50) NOT NULL CHECK (disruption_type IN ('Heavy Rain','Extreme Heat','Severe AQI','Curfew/Strike','Platform Outage')),
  city VARCHAR(50) NOT NULL,
  zone VARCHAR(80),
  sensor_value VARCHAR(100) NOT NULL, -- e.g. "47mm/hr", "44°C", "AQI 380"
  threshold_value VARCHAR(100) NOT NULL,
  severity VARCHAR(20) DEFAULT 'High' CHECK (severity IN ('Low','Moderate','High','Severe')),
  status VARCHAR(20) DEFAULT 'TRIGGERED' CHECK (status IN ('NORMAL','ALERT','TRIGGERED','RESOLVED')),
  event_start TIMESTAMPTZ DEFAULT NOW(),
  event_end TIMESTAMPTZ,
  verified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Claims table
CREATE TABLE claims (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  claim_number VARCHAR(20) UNIQUE NOT NULL,
  policy_id UUID NOT NULL REFERENCES policies(id) ON DELETE CASCADE,
  worker_id UUID NOT NULL REFERENCES workers(id) ON DELETE CASCADE,
  disruption_event_id UUID REFERENCES disruption_events(id),
  disruption_type VARCHAR(50) NOT NULL,
  sensor_value VARCHAR(100),
  
  -- AI validation results
  claim_approved BOOLEAN,
  fraud_risk VARCHAR(10) CHECK (fraud_risk IN ('Low','Medium','High')),
  fraud_reasons JSONB DEFAULT '[]',
  ai_payout_percent INTEGER CHECK (ai_payout_percent BETWEEN 40 AND 80),
  ai_explanation TEXT,
  
  -- Fraud detection scores
  fraud_score NUMERIC(4,3) DEFAULT 0,
  gps_spoof_flag BOOLEAN DEFAULT false,
  weather_mismatch_flag BOOLEAN DEFAULT false,
  duplicate_claim_flag BOOLEAN DEFAULT false,
  
  -- Payout details
  payout_amount INTEGER, -- in INR
  payout_status VARCHAR(20) DEFAULT 'PENDING' CHECK (payout_status IN ('PENDING','APPROVED','FLAGGED','PAID','REJECTED')),
  razorpay_payment_id VARCHAR(100),
  payment_timestamp TIMESTAMPTZ,
  
  -- Metadata
  processing_stage VARCHAR(50) DEFAULT 'AI_VALIDATING',
  claim_timestamp TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Premium payments table
CREATE TABLE premium_payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  worker_id UUID NOT NULL REFERENCES workers(id) ON DELETE CASCADE,
  policy_id UUID NOT NULL REFERENCES policies(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  razorpay_order_id VARCHAR(100),
  razorpay_payment_id VARCHAR(100),
  status VARCHAR(20) DEFAULT 'PENDING' CHECK (status IN ('PENDING','PAID','FAILED')),
  payment_method VARCHAR(50) DEFAULT 'UPI',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Admin audit log
CREATE TABLE audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50),
  entity_id UUID,
  performed_by UUID,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_policies_worker_id ON policies(worker_id);
CREATE INDEX idx_policies_status ON policies(status);
CREATE INDEX idx_claims_worker_id ON claims(worker_id);
CREATE INDEX idx_claims_policy_id ON claims(policy_id);
CREATE INDEX idx_claims_payout_status ON claims(payout_status);
CREATE INDEX idx_disruptions_city ON disruption_events(city);
CREATE INDEX idx_disruptions_type ON disruption_events(disruption_type);
CREATE INDEX idx_workers_city ON workers(city);
