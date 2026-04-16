import React, { useEffect, useState } from 'react';
import { formatINR } from '../utils/formatters';
import api from '../utils/api';
import { HorizontalBarChart, DonutChart, MiniProgressBar } from '../components/InlineSVGChart';
import AISpinner from '../components/AISpinner';
import PoweredByClaude from '../components/PoweredByClaude';

// Demo data used when API is unavailable
const DEMO_STATS = {
  totalActivePolicies: 1247,
  totalPremiumsCollected: 124680,
  totalClaimsPaid: 68430,
  totalGrossPayouts: 92140,
  totalCappedPayouts: 68430,
  lossRatio: 54.8,
  avgClaimTime: 4.2,
  fraudBlockedAmount: 23710,
  claimsByType: { 'Heavy Rain': 234, 'Severe AQI': 189, 'Platform Outage': 156, 'Extreme Heat': 98, 'Curfew/Strike': 67 },
  riskDistribution: { Low: 42, Medium: 38, High: 20 },
  cityBreakdown: [
    { city: 'Mumbai', policies: 412, claims: 187, revenue: 41280 },
    { city: 'Delhi', policies: 298, claims: 156, revenue: 29420 },
    { city: 'Bengaluru', policies: 234, claims: 98, revenue: 23180 },
    { city: 'Chennai', policies: 178, claims: 134, revenue: 17600 },
    { city: 'Hyderabad', policies: 125, claims: 89, revenue: 13200 },
  ],
  recentPayouts: [
    { worker: 'Rajesh S.', city: 'Mumbai', type: 'Heavy Rain', amount: 2450, upi: 'rajesh@upi', time: '4.2s' },
    { worker: 'Priya D.', city: 'Delhi', type: 'Severe AQI', amount: 1800, upi: 'priya@paytm', time: '3.8s' },
    { worker: 'Amit K.', city: 'Chennai', type: 'Platform Outage', amount: 3200, upi: 'amit@upi', time: '5.1s' },
    { worker: 'Deepa M.', city: 'Bengaluru', type: 'Extreme Heat', amount: 1400, upi: 'deepa@gpay', time: '4.0s' },
  ],
};

const DEMO_FRAUD = { autoApproved: 623, softFlagged: 87, hardFlagged: 34, fraudBlocked: 12 };

const DEMO_PREDICTIONS = [
  { city: 'Mumbai', disruptionType: 'Heavy Rain', probability: 0.82, recommendation: 'Increase reserves by 15%. Monsoon surge expected in Andheri-Bandra corridor.' },
  { city: 'Delhi', disruptionType: 'Severe AQI', probability: 0.91, recommendation: 'AQI crossing 300 likely. Pre-approve claims for South Delhi zones.' },
  { city: 'Chennai', disruptionType: 'Platform Outage', probability: 0.45, recommendation: 'Monitor Swiggy infrastructure. No immediate action needed.' },
  { city: 'Bengaluru', disruptionType: 'Heavy Rain', probability: 0.67, recommendation: 'Moderate rain expected. Standard reserves sufficient.' },
  { city: 'Hyderabad', disruptionType: 'Extreme Heat', probability: 0.73, recommendation: 'Pre-summer temp spike. Consider dynamic premium adjustment.' },
  { city: 'Mumbai', disruptionType: 'Curfew/Strike', probability: 0.22, recommendation: 'Low probability. Monitor political climate in Western suburbs.' },
];

export default function InsurerDashboard() {
  const [stats, setStats] = useState(null);
  const [fraudSummary, setFraudSummary] = useState(null);
  const [predictions, setPredictions] = useState([]);
  const [predDebug, setPredDebug] = useState(null);
  const [predLoading, setPredLoading] = useState(true);
  const [showDebug, setShowDebug] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState('overview');

  // Specific state for the manual reviews tab
  const [pendingClaims, setPendingClaims] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);

  const fetchPendingReviews = async () => {
    setReviewsLoading(true);
    try {
      const res = await api.get('/admin/claims/pending', { headers: { 'x-admin-pin': 'GS2026' } });
      setPendingClaims(res.data.pending || []);
    } catch { } // ignore
    finally { setReviewsLoading(false); }
  };

  const handleResolveClaim = async (id, decision) => {
    try {
      await api.put(`/admin/claims/${id}/resolve`, { decision }, { headers: { 'x-admin-pin': 'GS2026' } });
      fetchPendingReviews(); // Refresh
      fetchData(); // Refresh the main dashboard stats
    } catch (e) {
      alert('Error updating claim: ' + e.message);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (activeSection === 'reviews') fetchPendingReviews();
  }, [activeSection]);

  const fetchData = async () => {
    const headers = { 'x-admin-pin': 'GS2026' };
    try {
      const [statsRes, fraudRes, predRes] = await Promise.all([
        api.get('/admin/stats', { headers }).catch(() => ({ data: DEMO_STATS })),
        api.get('/admin/fraud-summary', { headers }).catch(() => ({ data: DEMO_FRAUD })),
        api.get('/admin/predictions', { headers }).catch(() => ({ data: { predictions: DEMO_PREDICTIONS } })),
      ]);
      setStats(statsRes.data || DEMO_STATS);
      setFraudSummary(fraudRes.data || DEMO_FRAUD);
      setPredictions(predRes.data.predictions || DEMO_PREDICTIONS);
      setPredDebug(predRes.data.aiDebug);
    } catch (err) {
      setStats(DEMO_STATS);
      setFraudSummary(DEMO_FRAUD);
      setPredictions(DEMO_PREDICTIONS);
    } finally {
      setLoading(false);
      setPredLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="section-dark" style={{ textAlign: 'center', paddingTop: 120 }}>
        <div className="ai-spinner" style={{ margin: '0 auto 16px' }} />
        <p style={{ color: 'var(--grey-mid)' }}>Loading insurer dashboard...</p>
      </div>
    );
  }

  const s = stats || DEMO_STATS;
  const f = fraudSummary || DEMO_FRAUD;
  const lossColor = s.lossRatio < 60 ? 'var(--green)' : s.lossRatio < 80 ? 'var(--alert-orange)' : 'var(--danger-red)';

  const claimBars = [
    { label: 'Heavy Rain', value: s.claimsByType?.['Heavy Rain'] || 234, color: '#4A90D9' },
    { label: 'Severe AQI', value: s.claimsByType?.['Severe AQI'] || 189, color: '#E84040' },
    { label: 'Platform Outage', value: s.claimsByType?.['Platform Outage'] || 156, color: '#FF6B35' },
    { label: 'Extreme Heat', value: s.claimsByType?.['Extreme Heat'] || 98, color: '#F5A623' },
    { label: 'Curfew/Strike', value: s.claimsByType?.['Curfew/Strike'] || 67, color: '#7B5EA7' },
  ];

  const riskSegments = [
    { label: 'Low Risk', percent: s.riskDistribution?.Low || 42, color: '#2ee89b' },
    { label: 'Medium Risk', percent: s.riskDistribution?.Medium || 38, color: '#FF6B35' },
    { label: 'High Risk', percent: s.riskDistribution?.High || 20, color: '#E84040' },
  ];

  const navItems = [
    { id: 'overview', label: '📊 Overview' },
    { id: 'payouts', label: '💸 Payouts' },
    { id: 'fraud', label: '🔒 Fraud' },
    { id: 'reviews', label: '📋 Manual Reviews' },
    { id: 'predictions', label: '🔮 AI Predictions' },
    { id: 'cities', label: '🏙️ City Analytics' },
  ];

  return (
    <section className="section-dark" style={{ paddingTop: 100 }}>
      <div className="section-header">
        <div className="pill pill-green" style={{ marginBottom: 12 }}>Insurer Dashboard</div>
        <h2>Allievo Admin Console</h2>
        <p>Underwriting analytics, fraud detection, and AI-powered predictions for the insurer team.</p>
      </div>

      {/* Sub-navigation */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 32, flexWrap: 'wrap', justifyContent: 'center' }}>
        {navItems.map(item => (
          <button key={item.id}
            className={activeSection === item.id ? 'gs-btn-primary gs-btn-sm' : 'gs-btn-secondary gs-btn-sm'}
            onClick={() => setActiveSection(item.id)}>
            {item.label}
          </button>
        ))}
      </div>

      {/* ── Overview ── */}
      {activeSection === 'overview' && (
        <>
          {/* KPI Cards */}
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-card-label">Total Active Policies</div>
              <div className="stat-card-value">{s.totalActivePolicies.toLocaleString('en-IN')}</div>
              <div className="stat-card-sub">across 5 cities</div>
            </div>
            <div className="stat-card">
              <div className="stat-card-label">Premiums Collected (Week)</div>
              <div className="stat-card-value" style={{ color: 'var(--green)' }}>{formatINR(s.totalPremiumsCollected)}</div>
              <div className="stat-card-sub">₹{Math.round(s.totalPremiumsCollected / s.totalActivePolicies)}/policy avg</div>
            </div>
            <div className="stat-card">
              <div className="stat-card-label">Claims Paid (Week)</div>
              <div className="stat-card-value" style={{ color: 'var(--alert-orange)' }}>{formatINR(s.totalClaimsPaid)}</div>
              <div className="stat-card-sub">this week</div>
            </div>
            <div className="stat-card">
              <div className="stat-card-label">Loss Ratio</div>
              <div className="stat-card-value" style={{ color: lossColor }}>{s.lossRatio}%</div>
              <div className="stat-card-sub">{s.lossRatio < 60 ? 'Healthy ✓' : s.lossRatio < 80 ? 'Monitor ⚠' : 'Critical ❌'}</div>
            </div>
          </div>

          {/* Charts Row */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24, marginBottom: 32 }}>
            <div className="gs-card-static">
              <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20 }}>Claims by Disruption Type</h3>
              <HorizontalBarChart data={claimBars} />
            </div>
            <div className="gs-card-static">
              <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20 }}>Worker Risk Distribution</h3>
              <DonutChart segments={riskSegments} />
            </div>
          </div>
        </>
      )}

      {/* ── Payouts ── */}
      {activeSection === 'payouts' && (
        <>
          {/* Payout KPIs */}
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-card-label">Gross Payouts</div>
              <div className="stat-card-value" style={{ color: 'var(--alert-orange)' }}>{formatINR(s.totalGrossPayouts)}</div>
              <div className="stat-card-sub">before fraud caps</div>
            </div>
            <div className="stat-card">
              <div className="stat-card-label">Capped Payouts</div>
              <div className="stat-card-value" style={{ color: 'var(--green)' }}>{formatINR(s.totalCappedPayouts)}</div>
              <div className="stat-card-sub">after fraud deductions</div>
            </div>
            <div className="stat-card">
              <div className="stat-card-label">Fraud Savings</div>
              <div className="stat-card-value" style={{ color: 'var(--green)' }}>{formatINR(s.fraudBlockedAmount)}</div>
              <div className="stat-card-sub">blocked by AI</div>
            </div>
            <div className="stat-card">
              <div className="stat-card-label">Avg Payout Time</div>
              <div className="stat-card-value">{s.avgClaimTime}s</div>
              <div className="stat-card-sub">UPI credit speed</div>
            </div>
          </div>

          {/* Recent Payouts Table */}
          <div className="gs-card-static" style={{ marginBottom: 32 }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20 }}>💸 Recent Payouts</h3>
            <div style={{ overflowX: 'auto' }}>
              <table className="gs-table">
                <thead>
                  <tr>
                    <th>Worker</th>
                    <th>City</th>
                    <th>Type</th>
                    <th>Amount</th>
                    <th>UPI</th>
                    <th>Speed</th>
                  </tr>
                </thead>
                <tbody>
                  {(s.recentPayouts || DEMO_STATS.recentPayouts).map((p, i) => (
                    <tr key={i}>
                      <td style={{ fontWeight: 600 }}>{p.worker}</td>
                      <td>{p.city}</td>
                      <td>{p.type}</td>
                      <td style={{ fontWeight: 700, color: 'var(--green)' }}>{formatINR(p.amount)}</td>
                      <td style={{ fontFamily: 'monospace', fontSize: 12, color: '#888' }}>{p.upi}</td>
                      <td><span className="pill pill-green">{p.time}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* ── Fraud ── */}
      {activeSection === 'fraud' && (
        <>
          <div className="gs-card-static" style={{ marginBottom: 32 }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20 }}>🔒 Fraud Detection Summary</h3>
            <div className="fraud-grid">
              <div className="fraud-card">
                <div className="fraud-card-value" style={{ color: 'var(--green)' }}>{f.autoApproved}</div>
                <div className="fraud-card-label">Auto-Approved</div>
              </div>
              <div className="fraud-card">
                <div className="fraud-card-value" style={{ color: 'var(--alert-orange)' }}>{f.softFlagged}</div>
                <div className="fraud-card-label">Partial Payout (60/40)</div>
              </div>
              <div className="fraud-card">
                <div className="fraud-card-value" style={{ color: 'var(--danger-red)' }}>{f.hardFlagged}</div>
                <div className="fraud-card-label">Flagged for Review</div>
              </div>
              <div className="fraud-card">
                <div className="fraud-card-value" style={{ color: '#8B0000' }}>{f.fraudBlocked}</div>
                <div className="fraud-card-label">Fraud Blocked</div>
              </div>
            </div>
          </div>

          {/* Fraud Pipeline */}
          <div className="gs-card-static" style={{ marginBottom: 32 }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20 }}>Multi-Signal Fraud Pipeline</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
              {[
                { signal: '📍 GPS Anomaly', desc: 'Worker location vs. zone', weight: '25%' },
                { signal: '🌦️ Weather Cross-Check', desc: 'Claimed vs. actual conditions', weight: '20%' },
                { signal: '⏱️ Duplicate Detection', desc: 'Same worker in 6-hour window', weight: '20%' },
                { signal: '📲 Platform Verify', desc: 'Platform active order status', weight: '20%' },
                { signal: '📆 Account Age', desc: 'New accounts flagged higher', weight: '15%' },
              ].map(s => (
                <div key={s.signal} className="gs-card-static" style={{ padding: 16 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>{s.signal}</div>
                  <div style={{ fontSize: 12, color: '#888', marginBottom: 6 }}>{s.desc}</div>
                  <div className="pill pill-green">{s.weight}</div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* ── Manual Reviews ── */}
      {activeSection === 'reviews' && (
        <div className="gs-card-static" style={{ marginBottom: 32 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h3 style={{ fontSize: 18, fontWeight: 700 }}>📋 Pending Manual Reviews</h3>
            <button className="gs-btn-secondary gs-btn-sm" onClick={fetchPendingReviews}>⟳ Refresh</button>
          </div>

          {reviewsLoading ? (
            <AISpinner text="Fetching claims..." />
          ) : pendingClaims.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40, border: '1px dashed rgba(255,255,255,0.1)', borderRadius: 16, color: '#888' }}>
              No claims currently require human review.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {pendingClaims.map(c => (
                <div key={c.id} style={{ background: 'var(--surface-2)', padding: 20, borderRadius: 12, border: '1px solid rgba(255,77,77,0.1)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <div style={{ fontWeight: 600, fontSize: 16 }}>{c.worker_name} — {c.disruption_type}</div>
                    <div style={{ fontSize: 13, color: '#a0a0a0' }}>{new Date(c.claim_timestamp).toLocaleString('en-IN')}</div>
                  </div>
                  <div style={{ fontSize: 13, color: '#e0e0e0', marginBottom: 8, lineHeight: 1.5 }}>
                    <strong style={{ color: 'var(--alert-orange)' }}>AI Confidence/Fraud Score:</strong> {c.fraud_score}%
                    <br/>
                    <strong>User Notes:</strong> {(c.ai_explanation || '').split('[MANUAL REVIEW MODE] User Description: ')[1] || 'No notes provided'}
                    <br/>
                    <strong>Proof Attached:</strong> {c.proof_attached ? <span style={{ color: 'var(--green)' }}>Yes (File available to download)</span> : <span>No evidence provided</span>}
                  </div>
                  <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
                    <button className="gs-btn-primary" style={{ padding: '8px 16px', background: 'var(--green)', borderColor: 'var(--green)' }} onClick={() => handleResolveClaim(c.id, 'APPROVE')}>✓ Approve & Pay {formatINR(c.payout_amount)}</button>
                    <button className="gs-btn-secondary" style={{ padding: '8px 16px', color: '#ff4d4d', borderColor: 'rgba(255,77,77,0.3)' }} onClick={() => handleResolveClaim(c.id, 'REJECT')}>✕ Reject Claim</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── AI Predictions ── */}
      {activeSection === 'predictions' && (
        <div className="gs-card-static" style={{ marginBottom: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <h3 style={{ fontSize: 18, fontWeight: 700 }}>🔮 AI Predictive Analytics</h3>
            <PoweredByClaude />
          </div>

          {predLoading ? (
            <AISpinner text="Claude is analyzing disruption patterns..." />
          ) : (
            <>
              <div style={{ overflowX: 'auto' }}>
                <table className="gs-table">
                  <thead>
                    <tr>
                      <th>City</th>
                      <th>Disruption Type</th>
                      <th>Probability</th>
                      <th>Recommendation</th>
                    </tr>
                  </thead>
                  <tbody>
                    {predictions.map((pred, i) => (
                      <tr key={i}>
                        <td style={{ fontWeight: 600 }}>{pred.city}</td>
                        <td>{pred.disruptionType}</td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <MiniProgressBar
                              value={pred.probability}
                              color={pred.probability > 0.7 ? 'var(--danger-red)' : pred.probability > 0.4 ? 'var(--alert-orange)' : 'var(--green)'}
                            />
                            <span style={{ fontWeight: 600, fontSize: 13 }}>{(pred.probability * 100).toFixed(0)}%</span>
                          </div>
                        </td>
                        <td style={{ fontSize: 12, color: 'var(--grey-mid)', maxWidth: 300 }}>{pred.recommendation}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {predDebug && (
                <div className="ai-debug-panel" style={{ marginTop: 16 }}>
                  <button className="ai-debug-toggle" onClick={() => setShowDebug(!showDebug)}>
                    <span>🔍 AI Debug Panel</span>
                    <span>{showDebug ? '▲' : '▼'}</span>
                  </button>
                  {showDebug && (
                    <div className="ai-debug-content">
                      <span className="ai-debug-label">System Prompt:</span>
                      {predDebug.prompt?.system}
                      <span className="ai-debug-label">User Message:</span>
                      {predDebug.prompt?.user}
                      <span className="ai-debug-label">Raw Response:</span>
                      {predDebug.rawResponse}
                      <span className="ai-debug-label">Response Time:</span>
                      {Math.round(predDebug.responseTime)}ms
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ── City Analytics ── */}
      {activeSection === 'cities' && (
        <div className="gs-card-static" style={{ marginBottom: 32, overflowX: 'auto' }}>
          <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20 }}>🏙️ City Breakdown</h3>
          <table className="gs-table">
            <thead>
              <tr>
                <th>City</th>
                <th>Active Policies</th>
                <th>Claims This Week</th>
                <th>Revenue (Week)</th>
                <th>Loss Ratio</th>
              </tr>
            </thead>
            <tbody>
              {(s.cityBreakdown || DEMO_STATS.cityBreakdown).map(city => {
                const cityLoss = city.claims > 0 ? ((city.claims * 80) / city.revenue * 100).toFixed(1) : 0;
                return (
                  <tr key={city.city}>
                    <td style={{ fontWeight: 700 }}>{city.city}</td>
                    <td>{city.policies.toLocaleString('en-IN')}</td>
                    <td>{city.claims.toLocaleString('en-IN')}</td>
                    <td style={{ color: 'var(--green)', fontWeight: 700 }}>{formatINR(city.revenue)}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <MiniProgressBar value={cityLoss / 100} color={cityLoss > 60 ? 'var(--danger-red)' : cityLoss > 40 ? 'var(--alert-orange)' : 'var(--green)'} />
                        <span style={{ fontSize: 13, fontWeight: 600 }}>{cityLoss}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
