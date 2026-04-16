import React, { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import { formatINR, formatDateTime } from '../utils/formatters';
import api from '../utils/api';
import { WeeklyBarChart } from '../components/InlineSVGChart';
import PhoneMockup from '../components/PhoneMockup';
import ZoneMap from '../components/ZoneMap';
import AISpinner from '../components/AISpinner';
import PoweredByClaude from '../components/PoweredByClaude';

export default function WorkerDashboard() {
  const { state, dispatch } = useApp();
  const [insightLoading, setInsightLoading] = useState(false);
  const [showDebug, setShowDebug] = useState(false);
  const [insightDebug, setInsightDebug] = useState(null);

  useEffect(() => {
    fetchInsight();
    fetchClaims();
  }, []);

  const fetchInsight = async () => {
    setInsightLoading(true);
    try {
      const res = await api.post('/ai/insights', { city: state.worker?.city });
      dispatch({ type: 'SET_WORKER_INSIGHT', payload: res.data.insight });
      setInsightDebug(res.data.aiDebug);
      if (res.data.aiDebug) {
        dispatch({ type: 'SET_AI_DEBUG', payload: { key: 'workerInsight', data: res.data.aiDebug } });
      }
    } catch (e) { console.error(e); }
    finally { setInsightLoading(false); }
  };

  const fetchClaims = async () => {
    try {
      const res = await api.get('/claims');
      dispatch({ type: 'SET_CLAIM_HISTORY', payload: res.data.claims || [] });
    } catch (e) { /* ignore */ }
  };

  // Compute stats — use demo data if claims are empty
  const DEMO_CLAIMS = [
    { id: 'd1', claim_timestamp: new Date(Date.now() - 3 * 86400000).toISOString(), disruption_type: 'Heavy Rain', claim_approved: true, fraud_risk: 'Low', payout_amount: 2450, payout_status: 'PAID' },
    { id: 'd2', claim_timestamp: new Date(Date.now() - 10 * 86400000).toISOString(), disruption_type: 'Severe AQI', claim_approved: true, fraud_risk: 'Low', payout_amount: 1750, payout_status: 'PAID' },
    { id: 'd3', claim_timestamp: new Date(Date.now() - 18 * 86400000).toISOString(), disruption_type: 'Platform Outage', claim_approved: true, fraud_risk: 'Medium', payout_amount: 1400, payout_status: 'PAID' },
  ];

  const claims = state.claimHistory.length > 0 ? state.claimHistory : DEMO_CLAIMS;
  const paidClaims = claims.filter(c => c.payout_status === 'PAID');
  const totalProtected = paidClaims.reduce((s, c) => s + (c.payout_amount || 0), 0);
  const totalPremium = state.activePolicy ? state.activePolicy.weekly_premium : 267;
  const weeksActive = state.activePolicy ? Math.max(1, Math.round((Date.now() - new Date(state.activePolicy.created_at).getTime()) / (7 * 86400000))) : 3;
  const fraudClean = claims.every(c => c.fraud_risk === 'Low');

  // Mock weekly chart data
  const weeklyData = [
    { label: 'Week 1', value: 3500, covered: true, payout: 1200 },
    { label: 'Week 2', value: 5000, covered: true, payout: 0 },
    { label: 'Week 3', value: 2000, covered: false, payout: 0 },
    { label: 'Week 4', value: 4500, covered: true, payout: 2100 },
  ];

  return (
    <>
      {/* Hero */}
      <div className="dashboard-hero">
        <div className="dashboard-hero-inner">
          <div>
            <div className="pill pill-green" style={{ marginBottom: 16 }}>Worker Dashboard</div>
            <h2 style={{ fontSize: 36, fontWeight: 800, letterSpacing: -1, marginBottom: 12 }}>Welcome back, {state.worker?.name?.split(' ')[0] || 'there'}</h2>
            <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.75)', maxWidth: 500 }}>
              Your Allievo coverage is keeping your income protected in {state.worker?.zone || 'your zone'}, {state.worker?.city || 'your city'}.
            </p>
          </div>
          <PhoneMockup worker={state.worker} policy={state.activePolicy} />
        </div>
      </div>

      <section className="section-dark">
        {/* Stat Cards */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-card-label">Total Earnings Protected</div>
            <div className="stat-card-value" style={{ color: 'var(--green)' }}>{formatINR(totalProtected || 3300)}</div>
            <div className="stat-card-sub">This month</div>
          </div>
          <div className="stat-card">
            <div className="stat-card-label">Active Weeks Covered</div>
            <div className="stat-card-value">{weeksActive || 3}</div>
            <div className="stat-card-sub">weeks</div>
          </div>
          <div className="stat-card">
            <div className="stat-card-label">Premium vs Claims</div>
            <div className="stat-card-value">₹{totalPremium || 267} / {formatINR(totalProtected || 3300)}</div>
            <div className="stat-card-sub">{totalProtected > totalPremium ? <span style={{ color: 'var(--green)' }}>Net positive ✓</span> : 'Ratio'}</div>
          </div>
          <div className="stat-card">
            <div className="stat-card-label">Fraud Protection</div>
            <div className="stat-card-value" style={{ color: fraudClean ? 'var(--green)' : 'var(--alert-orange)' }}>
              {fraudClean ? '✓ Clean Record' : `${claims.filter(c => c.fraud_risk !== 'Low').length} flag(s)`}
            </div>
            <div className="stat-card-sub">Status</div>
          </div>
        </div>

        {/* Recent Payout Notifications */}
        {paidClaims.length > 0 && (
          <div className="gs-card-static" style={{ marginBottom: 32 }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>💸 Recent Payouts</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {paidClaims.slice(0, 4).map(c => (
                <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 16px', background: 'rgba(46,232,155,0.04)', borderRadius: 14, border: '1px solid rgba(46,232,155,0.08)' }}>
                  <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(46,232,155,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>
                    {c.disruption_type === 'Heavy Rain' ? '🌧️' : c.disruption_type === 'Severe AQI' ? '💨' : c.disruption_type === 'Platform Outage' ? '📱' : c.disruption_type === 'Extreme Heat' ? '🌡️' : '⚡'}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{c.disruption_type} disruption payout</div>
                    <div style={{ fontSize: 11, color: '#666', marginTop: 2 }}>
                      {new Date(c.claim_timestamp).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} · Credited to {state.worker?.upi_id || 'worker@upi'}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 800, fontSize: 16, color: 'var(--green)' }}>+{formatINR(c.payout_amount)}</div>
                    <div style={{ fontSize: 10, color: '#555' }}>via UPI</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Operating Zone Map */}
        <div className="gs-card-static" style={{ marginBottom: 32, padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
            <div>
              <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>Operating Zone</h3>
              <p style={{ fontSize: 14, color: 'var(--grey-mid)' }}>
                Live coverage tracked for {state.worker?.zone}, {state.worker?.city}
              </p>
            </div>
            <div className="pill pill-green" style={{ background: 'rgba(46,232,155,0.1)' }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--green)', display: 'inline-block', marginRight: 6, animation: 'pulse 2s infinite' }} />
              Active Monitoring
            </div>
          </div>
          <ZoneMap city={state.worker?.city} zone={state.worker?.zone} />
        </div>

        {/* Weekly Bar Chart */}
        <div className="gs-card-static" style={{ marginBottom: 32 }}>
          <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20 }}>Weekly Income Protection</h3>
          <WeeklyBarChart data={weeklyData} />
          <div style={{ display: 'flex', gap: 16, marginTop: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--grey-mid)' }}>
              <div style={{ width: 12, height: 12, borderRadius: 3, background: 'var(--green)' }} /> Covered Weeks
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--grey-mid)' }}>
              <div style={{ width: 12, height: 12, borderRadius: 3, background: '#333' }} /> Uncovered
            </div>
          </div>
        </div>

        {/* Disruption Log */}
        {claims.length > 0 && (
          <div className="gs-card-static" style={{ marginBottom: 32, overflowX: 'auto' }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20 }}>Disruption Log</h3>
            <table className="gs-table">
              <thead>
                <tr>
                  <th>Date/Time</th>
                  <th>Type</th>
                  <th>Location</th>
                  <th>AI Decision</th>
                  <th>Fraud</th>
                  <th>Payout</th>
                </tr>
              </thead>
              <tbody>
                {claims.map(c => (
                  <tr key={c.id}>
                    <td>{formatDateTime(c.claim_timestamp)}</td>
                    <td>{c.disruption_type}</td>
                    <td>{state.worker?.zone}, {state.worker?.city}</td>
                    <td>{c.claim_approved ? <span className="pill pill-green">Approved</span> : <span className="pill pill-red">Denied</span>}</td>
                    <td><span className={`pill pill-${c.fraud_risk === 'Low' ? 'green' : c.fraud_risk === 'Medium' ? 'orange' : 'red'}`}>{c.fraud_risk}</span></td>
                    <td style={{ fontWeight: 700, color: c.payout_amount > 0 ? 'var(--green)' : 'var(--grey-mid)' }}>{formatINR(c.payout_amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Motivational Insight */}
        <div className="gs-card-static" style={{ marginBottom: 32 }}>
          <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>💬 AI Insight</h3>
          {insightLoading ? (
            <AISpinner text="Loading your personalized insight..." />
          ) : state.workerInsight ? (
            <>
              <div className="insight-card">{state.workerInsight}</div>
              <PoweredByClaude />

              {insightDebug && (
                <div className="ai-debug-panel">
                  <button className="ai-debug-toggle" onClick={() => setShowDebug(!showDebug)}>
                    <span>🔍 AI Debug Panel</span>
                    <span>{showDebug ? '▲' : '▼'}</span>
                  </button>
                  {showDebug && (
                    <div className="ai-debug-content">
                      <span className="ai-debug-label">System Prompt:</span>
                      {insightDebug.prompt?.system}
                      <span className="ai-debug-label">User Message:</span>
                      {insightDebug.prompt?.user}
                      <span className="ai-debug-label">Raw Response:</span>
                      {insightDebug.rawResponse}
                      <span className="ai-debug-label">Response Time:</span>
                      {Math.round(insightDebug.responseTime)}ms
                    </div>
                  )}
                </div>
              )}
            </>
          ) : (
            <p style={{ color: 'var(--grey-mid)' }}>No insight available yet.</p>
          )}
        </div>
      </section>
    </>
  );
}
