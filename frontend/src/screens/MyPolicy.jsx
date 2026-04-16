import React, { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import { formatINR, formatDate, formatWeekRange } from '../utils/formatters';
import api from '../utils/api';
import PaymentModal from '../components/PaymentModal';

const COVERED_DISRUPTIONS = [
  { icon: '🌧️', name: 'Heavy Rain', threshold: '>35mm/hr' },
  { icon: '🌡️', name: 'Extreme Heat', threshold: '>42°C' },
  { icon: '💨', name: 'Severe AQI', threshold: '>300' },
  { icon: '🚫', name: 'Curfew/Strike', threshold: 'Section 144' },
  { icon: '📱', name: 'Platform Outage', threshold: '>40% order drop' },
];

const PLANS = [
  { tier: 'Basic Shield', premium: 49, coverage: 60, bestFor: 'Part-time workers' },
  { tier: 'Standard Shield', premium: 89, coverage: 70, bestFor: 'Full-time workers' },
  { tier: 'Premium Shield', premium: 149, coverage: 80, bestFor: 'High earners' },
];

// Demo fallback policy for when backend has no data
const DEMO_POLICY = {
  policy_number: 'GS-MUM-2026-00042',
  plan_tier: 'Standard Shield',
  weekly_premium: 89,
  coverage_percent: 70,
  coverage_amount: 3500,
  status: 'active',
  week_start_date: new Date().toISOString(),
  week_end_date: new Date(Date.now() + 7 * 86400000).toISOString(),
  created_at: new Date(Date.now() - 60 * 86400000).toISOString(),
};

const DEMO_CLAIMS = [
  { id: 'c1', claim_timestamp: new Date(Date.now() - 3 * 86400000).toISOString(), disruption_type: 'Heavy Rain', claim_approved: true, fraud_risk: 'Low', payout_amount: 2450, payout_status: 'PAID', ai_payout_percent: 70 },
  { id: 'c2', claim_timestamp: new Date(Date.now() - 10 * 86400000).toISOString(), disruption_type: 'Severe AQI', claim_approved: true, fraud_risk: 'Low', payout_amount: 1750, payout_status: 'PAID', ai_payout_percent: 50 },
  { id: 'c3', claim_timestamp: new Date(Date.now() - 18 * 86400000).toISOString(), disruption_type: 'Platform Outage', claim_approved: true, fraud_risk: 'Medium', payout_amount: 1400, payout_status: 'PAID', ai_payout_percent: 40 },
];

export default function MyPolicy() {
  const { state, dispatch } = useApp();
  const [loading, setLoading] = useState(true);
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [upgradeMsg, setUpgradeMsg] = useState(null);
  
  // Payment / Upgrade states
  const [showConfirmPopup, setShowConfirmPopup] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPlanObj, setSelectedPlanObj] = useState(null);

  useEffect(() => {
    fetchPolicy();
  }, []);

  const fetchPolicy = async () => {
    try {
      const res = await api.get('/policies/active');
      if (res.data.policy) {
        dispatch({ type: 'SET_ACTIVE_POLICY', payload: res.data.policy });
      }
      const claimsRes = await api.get('/claims');
      if (claimsRes.data.claims?.length > 0) {
        dispatch({ type: 'SET_CLAIM_HISTORY', payload: claimsRes.data.claims });
      }
    } catch (err) {
      // Use demo data if API fails
      if (!state.activePolicy) {
        dispatch({ type: 'SET_ACTIVE_POLICY', payload: DEMO_POLICY });
      }
      if (!state.claimHistory.length) {
        dispatch({ type: 'SET_CLAIM_HISTORY', payload: DEMO_CLAIMS });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleUpgradeClick = (plan) => {
    setSelectedPlanObj(plan);
    setShowConfirmPopup(true);
  };

  const proceedToPayment = () => {
    setShowConfirmPopup(false);
    setShowPaymentModal(true);
  };

  const handlePaymentSuccess = async () => {
    setShowPaymentModal(false);
    setIsUpgrading(true);
    setUpgradeMsg(null);
    try {
      const res = await api.put('/policies/upgrade', { planTier: selectedPlanObj.tier });
      setUpgradeMsg({ type: 'success', text: res.data.message });
      dispatch({ type: 'SET_ACTIVE_POLICY', payload: res.data.policy });
    } catch (err) {
      setUpgradeMsg({ type: 'error', text: err.response?.data?.error || 'Upgrade failed' });
    } finally {
      setIsUpgrading(false);
      setSelectedPlanObj(null);
    }
  };

  // Always show something — use demo data as fallback
  const policy = state.activePolicy || DEMO_POLICY;
  const claims = state.claimHistory.length > 0 ? state.claimHistory : DEMO_CLAIMS;
  const totalPaid = claims.filter(c => c.payout_status === 'PAID').reduce((s, c) => s + (c.payout_amount || 0), 0);

  if (loading) {
    return (
      <div className="section-dark" style={{ textAlign: 'center', paddingTop: 120 }}>
        <div className="ai-spinner" style={{ margin: '0 auto 16px' }} />
        <p style={{ color: 'var(--grey-mid)' }}>Loading your policy...</p>
      </div>
    );
  }

  return (
    <>
      {/* Hero with Policy Card */}
      <section className="hero-section" style={{ minHeight: 'auto', paddingBottom: 80 }}>
        <div className="hero-grid-bg" />
        <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 1200 }}>
          <h2 style={{ fontSize: 28, fontWeight: 800, textAlign: 'center', marginBottom: 32 }}>My Active Policy</h2>

          {/* Policy Card (White) */}
          <div className="policy-card-hero">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
              <div>
                <div className="policy-number">{policy.policy_number}</div>
                <p style={{ fontSize: 14, color: '#666' }}>
                  {state.worker?.name} · {state.worker?.zone || 'Bandra'}, {state.worker?.city || 'Mumbai'}
                </p>
                <p style={{ fontSize: 13, color: '#888' }}>{state.worker?.platform || 'Swiggy'}</p>
              </div>
              <div className="pill pill-green" style={{ background: 'rgba(46,232,155,0.15)', color: '#10b981' }}>
                <span className="status-dot status-dot-green" /> ACTIVE
              </div>
            </div>

            {/* Coverage info */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 20 }}>
              <div>
                <div style={{ fontSize: 11, color: '#888', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Weekly Premium</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: '#10b981' }}>₹{policy.weekly_premium}/week</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: '#888', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Coverage Amount</div>
                <div style={{ fontSize: 20, fontWeight: 700 }}>{formatINR(policy.coverage_amount)}</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: '#888', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Payouts</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: '#10b981' }}>{formatINR(totalPaid)}</div>
              </div>
            </div>

            <div className="pill" style={{ background: 'rgba(46,232,155,0.1)', color: '#10b981', marginBottom: 16 }}>{policy.plan_tier} · {policy.coverage_percent}% Coverage</div>

            {/* 3D Card Stack */}
            <div className="card-stack-3d">
              <div className="stack-card stack-card-1"><span className="stack-card-label">🌧️ Rain</span></div>
              <div className="stack-card stack-card-2"><span className="stack-card-label">🌡️ Heat</span></div>
              <div className="stack-card stack-card-3"><span className="stack-card-label">💨 AQI</span></div>
            </div>
          </div>
        </div>
      </section>

      {/* Recent Payouts */}
      {claims.filter(c => c.payout_status === 'PAID').length > 0 && (
        <section className="section-dark" style={{ paddingBottom: 0 }}>
          <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 20 }}>💸 Recent Payouts</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 12 }}>
            {claims.filter(c => c.payout_status === 'PAID').slice(0, 3).map(c => (
              <div key={c.id} className="gs-card-static" style={{ display: 'flex', alignItems: 'center', gap: 16, padding: 20 }}>
                <div style={{ width: 48, height: 48, borderRadius: 14, background: 'rgba(46,232,155,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>
                  {c.disruption_type === 'Heavy Rain' ? '🌧️' : c.disruption_type === 'Severe AQI' ? '💨' : c.disruption_type === 'Platform Outage' ? '📱' : '⚡'}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{c.disruption_type}</div>
                  <div style={{ fontSize: 12, color: '#666', marginTop: 2 }}>{formatDate(c.claim_timestamp)} · {state.worker?.zone || 'Bandra'}, {state.worker?.city || 'Mumbai'}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 800, fontSize: 18, color: 'var(--green)' }}>{formatINR(c.payout_amount)}</div>
                  <div style={{ fontSize: 11, color: '#555' }}>→ {state.worker?.upi_id || 'worker@upi'}</div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Covered Disruptions */}
      <section className="section-dark">
        <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 20 }}>Covered Disruptions</h3>
        <div className="gs-card-static" style={{ padding: 0 }}>
          <ul className="covered-list" style={{ padding: '8px 24px' }}>
            {COVERED_DISRUPTIONS.map(d => (
              <li key={d.name} className="covered-item" style={{ color: 'var(--white)' }}>
                <span className="covered-icon">{d.icon}</span>
                <div className="covered-text">
                  <strong style={{ color: 'var(--white)' }}>{d.name}</strong>
                  <span>Threshold: {d.threshold}</span>
                </div>
                <span className="pill pill-green" style={{ marginLeft: 'auto' }}>Covered</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Pricing Table */}
        <h3 style={{ fontSize: 20, fontWeight: 700, margin: '40px 0 20px' }}>Plan Comparison</h3>
        {upgradeMsg && (
          <div style={{ padding: '12px 16px', background: upgradeMsg.type === 'success' ? 'rgba(46,232,155,0.1)' : 'rgba(255,107,107,0.1)', color: upgradeMsg.type === 'success' ? 'var(--green)' : 'var(--red)', borderRadius: 12, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
            {upgradeMsg.type === 'success' ? '✅' : '❌'} {upgradeMsg.text}
          </div>
        )}
        <div className="gs-card-static" style={{ overflowX: 'auto' }}>
          <table className="gs-table">
            <thead>
              <tr>
                <th>Plan</th>
                <th>Weekly Premium</th>
                <th>Coverage</th>
                <th>Best For</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {PLANS.map(plan => (
                <tr key={plan.tier} style={policy.plan_tier === plan.tier ? { background: 'rgba(46,232,155,0.05)' } : {}}>
                  <td style={{ fontWeight: 600 }}>{plan.tier} {policy.plan_tier === plan.tier && <span className="pill pill-green" style={{ marginLeft: 8 }}>Current</span>}</td>
                  <td style={{ color: 'var(--green)', fontWeight: 700 }}>₹{plan.premium}/week</td>
                  <td>{plan.coverage}% income</td>
                  <td style={{ color: 'var(--grey-mid)' }}>{plan.bestFor}</td>
                  <td>
                    {policy.plan_tier !== plan.tier && (
                      <button 
                        className="gs-btn gs-btn-primary" 
                        style={{ padding: '6px 12px', fontSize: 12 }}
                        disabled={isUpgrading}
                        onClick={() => handleUpgradeClick(plan)}
                      >
                        Upgrade
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Claim History */}
        <h3 style={{ fontSize: 20, fontWeight: 700, margin: '40px 0 20px' }}>Claim History</h3>
        <div className="gs-card-static" style={{ overflowX: 'auto' }}>
          <table className="gs-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Type</th>
                <th>AI Decision</th>
                <th>Fraud Risk</th>
                <th>Payout</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {claims.map(claim => (
                <tr key={claim.id}>
                  <td>{formatDate(claim.claim_timestamp)}</td>
                  <td>{claim.disruption_type}</td>
                  <td>{claim.claim_approved ? <span className="pill pill-green">Approved</span> : <span className="pill pill-red">Denied</span>}</td>
                  <td><span className={`pill pill-${claim.fraud_risk === 'Low' ? 'green' : claim.fraud_risk === 'Medium' ? 'orange' : 'red'}`}>{claim.fraud_risk}</span></td>
                  <td style={{ fontWeight: 700, color: claim.payout_amount > 0 ? 'var(--green)' : 'var(--grey-mid)' }}>{formatINR(claim.payout_amount)}</td>
                  <td><span className={`pill pill-${claim.payout_status === 'PAID' ? 'green' : claim.payout_status === 'FLAGGED' ? 'orange' : 'gray'}`}>{claim.payout_status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Confirm Popup Modal */}
      {showConfirmPopup && selectedPlanObj && (
        <div className="modal-overlay" onClick={() => setShowConfirmPopup(false)}>
          <div className="payment-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 400, padding: 24 }}>
            <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12 }}>Change Plan?</h3>
            <p style={{ color: 'var(--grey-mid)', fontSize: 14, lineHeight: 1.6, marginBottom: 24 }}>
              You are about to change your tier to <strong>{selectedPlanObj.tier}</strong>.
              <br/><br/>
              Please note that your new plan, along with the <strong>₹{selectedPlanObj.premium} weekly premium</strong> and {selectedPlanObj.coverage}% coverage, will take effect starting from the <strong>next week Monday</strong> (Monday to Sunday billing cycle).
            </p>
            <div style={{ display: 'flex', gap: 12 }}>
              <button className="gs-btn" style={{ flex: 1, padding: '12px', background: 'rgba(255,255,255,0.1)' }} onClick={() => setShowConfirmPopup(false)}>Cancel</button>
              <button className="gs-btn-primary" style={{ flex: 1, padding: '12px' }} onClick={proceedToPayment}>Proceed to Pay</button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && selectedPlanObj && (
        <PaymentModal
          plan={selectedPlanObj}
          onClose={() => setShowPaymentModal(false)}
          onSuccess={handlePaymentSuccess}
        />
      )}
    </>
  );
}
