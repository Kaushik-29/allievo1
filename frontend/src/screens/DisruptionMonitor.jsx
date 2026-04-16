import React, { useState, useEffect, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { formatINR, formatDateTime } from '../utils/formatters';
import api from '../utils/api';
import AISpinner from '../components/AISpinner';
import PoweredByClaude from '../components/PoweredByClaude';

const DISRUPTION_CONFIG = {
  'Heavy Rain': { icon: '🌧️', threshold: '35mm/hr', unit: 'mm/hr', numThreshold: 35 },
  'Extreme Heat': { icon: '🌡️', threshold: '42°C', unit: '°C', numThreshold: 42 },
  'Severe AQI': { icon: '💨', threshold: 'AQI 300', unit: 'AQI', numThreshold: 300 },
  'Curfew/Strike': { icon: '🚫', threshold: 'Active', unit: 'status', numThreshold: 0 },
  'Platform Outage': { icon: '📱', threshold: '40% drop', unit: '% drop', numThreshold: 40 },
};

export default function DisruptionMonitor() {
  const { state, dispatch } = useApp();
  const [claimProcessing, setClaimProcessing] = useState(null);
  const [claimSteps, setClaimSteps] = useState([]);
  const [claimResult, setClaimResult] = useState(null);
  const [showDebug, setShowDebug] = useState(false);

  useEffect(() => {
    // Refresh readings periodically
    const fetchReadings = async () => {
      try {
        const res = await api.get('/disruptions/readings');
        const readings = res.data.readings;
        Object.entries(readings).forEach(([type, data]) => {
          dispatch({ type: 'SET_DISRUPTION_STATE', payload: { type, state: data } });
        });
      } catch (e) { /* ignore */ }
    };
    fetchReadings();
    const interval = setInterval(fetchReadings, 30000);
    return () => clearInterval(interval);
  }, []);

  const getNumericValue = (str) => {
    const match = String(str).match(/[\d.]+/);
    return match ? parseFloat(match[0]) : 0;
  };

  const getProgress = (type, value) => {
    const conf = DISRUPTION_CONFIG[type];
    if (type === 'Curfew/Strike') return value !== 'All clear' && value !== 'Normal' ? 100 : 10;
    const num = getNumericValue(value);
    return Math.min((num / conf.numThreshold) * 100, 150);
  };

  const getStatusColor = (status) => {
    if (status === 'TRIGGERED') return 'var(--danger-red)';
    if (status === 'ALERT') return 'var(--alert-orange)';
    return '#333';
  };

  const simulateDisruption = async (disruptionType) => {
    if (!state.activePolicy) {
      alert('Please purchase a policy first to simulate disruptions.');
      return;
    }

    setClaimProcessing(disruptionType);
    setClaimResult(null);
    setClaimSteps([]);

    // Stage 1: Disruption detection
    const steps = [
      { text: `Disruption detected in ${state.worker?.zone || 'your zone'}`, status: 'pending' },
      { text: 'AI validating claim...', status: 'pending' },
      { text: 'Checking fraud signals...', status: 'pending' },
      { text: 'Processing payout...', status: 'pending' },
    ];

    // Animate steps sequentially
    for (let i = 0; i < steps.length; i++) {
      await new Promise(r => setTimeout(r, 800));
      setClaimSteps(prev => {
        const updated = [...steps];
        for (let j = 0; j < i; j++) updated[j].status = 'done';
        updated[i].status = 'active';
        return updated;
      });
    }

    // Stage 2: API call
    try {
      // Simulate disruption first
      const disruptionRes = await api.post('/disruptions/simulate', { disruptionType });
      const event = disruptionRes.data.event;

      // Update disruption card state
      dispatch({ type: 'SET_DISRUPTION_STATE', payload: {
        type: disruptionType,
        state: { status: 'TRIGGERED', currentValue: event.sensor_value, lastUpdated: new Date().toISOString() },
      }});

      // Validate claim
      const claimRes = await api.post('/claims/validate', {
        disruptionEventId: event.id,
        disruptionType,
        sensorValue: event.sensor_value,
      });

      // Finalize steps
      setClaimSteps(prev => prev.map(s => ({ ...s, status: 'done' })));

      setClaimResult(claimRes.data);

      // Add to claim history
      dispatch({ type: 'ADD_CLAIM', payload: claimRes.data.claim });

      // Store AI debug data
      if (claimRes.data.aiDebug) {
        dispatch({ type: 'SET_AI_DEBUG', payload: { key: 'claimValidation', data: claimRes.data.aiDebug } });
      }
    } catch (err) {
      setClaimResult({ error: err.response?.data?.error || 'Claim processing failed.' });
    }
  };

  const closeOverlay = () => {
    setClaimProcessing(null);
    setClaimResult(null);
    setClaimSteps([]);
  };

  // Reset triggered cards after 10s
  useEffect(() => {
    if (claimResult && !claimResult.error) {
      const timer = setTimeout(() => {
        if (claimProcessing) {
          dispatch({ type: 'SET_DISRUPTION_STATE', payload: {
            type: claimProcessing,
            state: { ...state.disruptionStates[claimProcessing], status: 'NORMAL' },
          }});
        }
      }, 10000);
      return () => clearTimeout(timer);
    }
  }, [claimResult]);

  return (
    <>
      {/* Sensor Ticker */}
      <section className="marquee-section" style={{ marginTop: 70 }}>
        <div className="marquee-track">
          <div className="marquee-content">
            {['Mumbai', '•', 'Rain: 12mm/hr', '•', 'Delhi', '•', 'AQI: 245', '•', 'Bengaluru', '•', 'Temp: 38°C', '•', 'Chennai', '•', 'AQI: 198', '•', 'Hyderabad', '•', 'Rain: 8mm/hr', '•',
              'Mumbai', '•', 'Rain: 12mm/hr', '•', 'Delhi', '•', 'AQI: 245', '•', 'Bengaluru', '•', 'Temp: 38°C', '•', 'Chennai', '•', 'AQI: 198', '•', 'Hyderabad', '•', 'Rain: 8mm/hr', '•'].map((t, i) => (
              <span key={i} className={t === '•' ? 'marquee-dot' : ''}>{t}</span>
            ))}
          </div>
        </div>
      </section>

      <section className="section-dark">
        <div className="section-header">
          <h2>Live Disruption Monitor</h2>
          <p>Real-time sensor tracking for your zone. Click "Simulate" to trigger a disruption and see the AI-powered claim flow.</p>
        </div>

        <div className="disruption-grid">
          {Object.entries(state.disruptionStates).map(([type, data]) => {
            const conf = DISRUPTION_CONFIG[type];
            const progress = getProgress(type, data.currentValue);
            const isTriggered = data.status === 'TRIGGERED';
            const isAlert = data.status === 'ALERT';

            return (
              <div key={type} className={`disruption-card ${isTriggered ? 'triggered' : ''} ${isAlert ? 'alert-state' : ''}`}>
                <div className="disruption-header">
                  <span className="disruption-icon">{conf.icon}</span>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span className="disruption-name">{type}</span>
                    <span style={{ fontSize: '10px', color: 'var(--grey-mid)', marginTop: '2px', fontWeight: 600 }}>
                      {data.source === 'Live API' ? '🟢 Live API Data' : '🟡 Simulated Data'}
                    </span>
                  </div>
                  <span className={`pill ${isTriggered ? 'pill-red' : isAlert ? 'pill-orange' : 'pill-gray'}`} style={{ marginLeft: 'auto' }}>
                    <span className={`status-dot ${isTriggered ? 'status-dot-red' : isAlert ? 'status-dot-orange' : 'status-dot-gray'}`} />
                    {data.status}
                  </span>
                </div>

                <div className="disruption-value">{data.currentValue}</div>
                <div className="disruption-threshold">Threshold: {conf.threshold}</div>

                <div className="disruption-progress">
                  <div className="disruption-progress-fill" style={{
                    width: `${Math.min(progress, 100)}%`,
                    background: progress > 100 ? 'var(--danger-red)' : progress > 70 ? 'var(--alert-orange)' : 'var(--green)',
                  }} />
                </div>

                {data.source !== 'Live API' && (
                  <>
                    <button
                      className="gs-btn-primary gs-btn-sm"
                      style={{ width: '100%' }}
                      onClick={() => simulateDisruption(type)}
                      disabled={!state.activePolicy || claimProcessing}
                    >
                      {claimProcessing === type ? 'Processing...' : 'Simulate Disruption'}
                    </button>
                    {!state.activePolicy && (
                      <p style={{ fontSize: 11, color: 'var(--grey-mid)', marginTop: 8, textAlign: 'center' }}>Buy a policy to simulate</p>
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Claim Processing Overlay */}
      {claimProcessing && (
        <div className="claim-overlay" onClick={claimResult ? closeOverlay : undefined}>
          <div className="claim-modal" onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 24 }}>
              {DISRUPTION_CONFIG[claimProcessing]?.icon} {claimProcessing} — Claim Processing
            </h3>

            {/* Steps */}
            <div style={{ textAlign: 'left', marginBottom: 24 }}>
              {claimSteps.map((step, i) => (
                <div key={i} className={`claim-step ${step.status}`}>
                  <span className="claim-step-icon">
                    {step.status === 'done' ? '✓' : step.status === 'active' ? '⟳' : '○'}
                  </span>
                  <span>{step.text}</span>
                  {step.status === 'active' && <div className="ai-spinner" style={{ width: 16, height: 16, borderWidth: 2, marginLeft: 'auto' }} />}
                </div>
              ))}
            </div>

            {/* Result */}
            {claimResult && !claimResult.error && (
              <div className={`claim-result ${
                claimResult.claim?.claim_approved && claimResult.fraudAnalysis?.tier === 'AUTO_APPROVE' ? 'claim-approved' :
                claimResult.fraudAnalysis?.tier === 'SOFT_FLAG' ? 'claim-partial' : 'claim-flagged'
              }`}>
                {claimResult.claim?.claim_approved && claimResult.fraudAnalysis?.tier !== 'FRAUD_BLOCK' ? (
                  <>
                    <h4 style={{ color: claimResult.fraudAnalysis?.tier === 'SOFT_FLAG' ? 'var(--alert-orange)' : 'var(--green)', fontSize: 18, fontWeight: 700, marginBottom: 12 }}>
                      {claimResult.fraudAnalysis?.tier === 'SOFT_FLAG' ? '⚠️ PARTIAL PAYOUT' : '✅ CLAIM APPROVED'}
                    </h4>
                    <div className="payout-amount">{formatINR(claimResult.payout?.immediateAmount)}</div>
                    <p style={{ fontSize: 13, color: 'var(--grey-mid)', margin: '8px 0' }}>
                      = {formatINR(state.activePolicy?.coverage_amount)} × {claimResult.claim?.ai_payout_percent}%
                    </p>
                    {claimResult.payout?.heldAmount > 0 && (
                      <p style={{ fontSize: 13, color: 'var(--alert-orange)', margin: '8px 0' }}>
                        {formatINR(claimResult.payout.heldAmount)} under {claimResult.payout.heldReleaseHours}-hour review
                      </p>
                    )}
                    <div className="payout-bar"><div className="payout-bar-fill" /></div>
                    <p style={{ fontSize: 12, color: 'var(--grey-mid)' }}>
                      {formatINR(claimResult.payout?.immediateAmount)} credited to UPI in 4.2 seconds
                    </p>
                  </>
                ) : (
                  <>
                    <h4 style={{ color: 'var(--danger-red)', fontSize: 18, fontWeight: 700, marginBottom: 12 }}>🚫 CLAIM FLAGGED FOR REVIEW</h4>
                    {claimResult.claim?.fraud_reasons?.map((reason, i) => (
                      <span key={i} className="pill pill-red" style={{ margin: '4px 4px 4px 0' }}>{reason}</span>
                    ))}
                    <p style={{ fontSize: 13, color: 'var(--grey-mid)', marginTop: 12 }}>
                      {claimResult.payout?.reviewMessage || 'Our team will review within 48 hours.'}
                    </p>
                  </>
                )}

                <p style={{ fontSize: 13, marginTop: 12, color: 'var(--grey-light)' }}>{claimResult.claim?.ai_explanation}</p>
                <PoweredByClaude />

                {/* Fraud Analysis */}
                <div style={{ marginTop: 16, padding: 12, background: 'rgba(0,0,0,0.2)', borderRadius: 12 }}>
                  <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--grey-mid)', marginBottom: 6 }}>FRAUD ANALYSIS</p>
                  <p style={{ fontSize: 13 }}>Score: {claimResult.fraudAnalysis?.score?.toFixed(3)} — {claimResult.fraudAnalysis?.tierDescription}</p>
                  {claimResult.fraudAnalysis?.signals?.length > 0 && (
                    <div style={{ marginTop: 8 }}>
                      {claimResult.fraudAnalysis.signals.map((sig, i) => (
                        <span key={i} className="pill pill-orange" style={{ margin: '2px 4px 2px 0', fontSize: 10 }}>{sig}</span>
                      ))}
                    </div>
                  )}
                </div>

                {/* AI Debug */}
                {claimResult.aiDebug && (
                  <div className="ai-debug-panel">
                    <button className="ai-debug-toggle" onClick={() => setShowDebug(!showDebug)}>
                      <span>🔍 AI Debug Panel</span>
                      <span>{showDebug ? '▲' : '▼'}</span>
                    </button>
                    {showDebug && (
                      <div className="ai-debug-content">
                        <span className="ai-debug-label">System Prompt:</span>
                        {claimResult.aiDebug.prompt?.system}
                        <span className="ai-debug-label">User Message:</span>
                        {claimResult.aiDebug.prompt?.user}
                        <span className="ai-debug-label">Raw Response:</span>
                        {claimResult.aiDebug.rawResponse}
                        <span className="ai-debug-label">Response Time:</span>
                        {Math.round(claimResult.aiDebug.responseTime)}ms
                      </div>
                    )}
                  </div>
                )}

                <button className="gs-btn-secondary" style={{ marginTop: 16, width: '100%' }} onClick={closeOverlay}>Close</button>
              </div>
            )}

            {claimResult?.error && (
              <div className="claim-result claim-flagged">
                <p style={{ color: 'var(--danger-red)' }}>{claimResult.error}</p>
                <button className="gs-btn-secondary" style={{ marginTop: 16 }} onClick={closeOverlay}>Close</button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
