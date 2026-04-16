import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { formatDateTime, formatINR } from '../utils/formatters';
import api from '../utils/api';
import AISpinner from '../components/AISpinner';

export default function ManualClaim() {
  const { state, dispatch } = useApp();
  const [loading, setLoading] = useState(false);
  const [submitMsg, setSubmitMsg] = useState(null);

  // Form State
  const [form, setForm] = useState({
    date_of_incident: '',
    disruptionType: '',
    description: '',
    proofData: null,
  });

  const disruptions = ['Heavy Rain', 'Extreme Heat', 'Severe AQI', 'Curfew/Strike', 'Platform Outage'];

  // Claims state
  const claims = state.claimHistory || [];
  const manualClaims = claims.filter(c => c.disruption_event_id === 'MANUAL').sort((a, b) => new Date(b.claim_timestamp) - new Date(a.claim_timestamp));

  const fetchClaims = async () => {
    try {
      const res = await api.get('/claims');
      dispatch({ type: 'SET_CLAIM_HISTORY', payload: res.data.claims || [] });
    } catch (e) { /* ignore */ }
  };

  useEffect(() => {
    fetchClaims();
  }, []);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setForm({ ...form, proofData: e.target.files[0].name });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSubmitMsg(null);
    try {
      const res = await api.post('/claims/manual', form);
      setSubmitMsg({ type: 'success', text: res.data.message });
      setForm({ date_of_incident: '', disruptionType: '', description: '', proofData: null });
      fetchClaims(); 
    } catch (err) {
      setSubmitMsg({ type: 'error', text: err.response?.data?.error || 'Failed to submit claim' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '0 20px' }}>
      <div style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 32, fontWeight: 800, letterSpacing: -1, marginBottom: 8 }}>File Manual Claim</h2>
        <p style={{ color: 'var(--grey-mid)', fontSize: 16 }}>
          If our sensors missed a disruption in your zone, supply evidence here. 
          AI will score the proof. Submissions might be auto-approved, rejected, or flagged for human review.
        </p>
      </div>

      <div className="gs-card-static" style={{ marginBottom: 32 }}>
        {submitMsg && (
          <div className={`gs-alert ${submitMsg.type === 'success' ? 'gs-alert-success' : 'gs-alert-error'}`} style={{ marginBottom: 24, padding: 16, borderRadius: 8, background: submitMsg.type === 'success' ? 'rgba(46,232,155,0.1)' : 'rgba(255,77,77,0.1)', color: submitMsg.type === 'success' ? 'var(--green)' : '#ff4d4d', border: `1px solid ${submitMsg.type === 'success' ? 'var(--green)' : '#ff4d4d'}` }}>
            {submitMsg.text}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="form-row">
            <div className="form-group" style={{ flex: 1 }}>
              <label className="gs-label">Date of Incident</label>
              <input type="date" required className="gs-input" value={form.date_of_incident} onChange={e => setForm({...form, date_of_incident: e.target.value})} />
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="gs-label">Disruption Type</label>
              <select required className="gs-input" value={form.disruptionType} onChange={e => setForm({...form, disruptionType: e.target.value})}>
                <option value="">Select Reason</option>
                {disruptions.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="gs-label">Description / Notes</label>
            <textarea required className="gs-input" rows={4} placeholder="Describe the disruption and how it affected your income..." value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
          </div>

          <div className="form-group">
            <label className="gs-label">Upload Proof</label>
            <div style={{ border: '2px dashed rgba(255,255,255,0.1)', borderRadius: 12, padding: 24, textAlign: 'center', background: 'rgba(255,255,255,0.02)' }}>
              <input type="file" id="proofUpload" style={{ display: 'none' }} onChange={handleFileChange} accept="image/*,.pdf" />
              <label htmlFor="proofUpload" style={{ cursor: 'pointer', color: 'var(--green)', fontWeight: 600 }}>
                {form.proofData ? `✓ Attached: ${form.proofData}` : '+ Click to browse or drag file here (Screenshots/Photos)'}
              </label>
            </div>
          </div>

          <button type="submit" disabled={loading} className="gs-btn-primary" style={{ padding: '16px', fontSize: 16, marginTop: 8 }}>
            {loading ? <span style={{ display: 'flex', gap: 8, justifyContent: 'center' }}><AISpinner/> Processing...</span> : 'Submit Claim'}
          </button>
        </form>
      </div>

      <h3 style={{ fontSize: 24, fontWeight: 700, marginBottom: 20 }}>Manual Claim Tracker</h3>
      {manualClaims.length === 0 ? (
        <div style={{ textAlign: 'center', color: 'var(--grey-mid)', padding: 40, border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16 }}>
          You have not filed any manual claims yet.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {manualClaims.map(c => (
            <div key={c.id} className="gs-card-static" style={{ padding: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ fontWeight: 700 }}>{c.disruption_type}</span>
                  <span style={{ fontSize: 12, color: 'var(--grey-mid)' }}>{formatDateTime(c.claim_timestamp)}</span>
                </div>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>
                  Fraud Risk: <strong style={{ color: c.fraud_risk === 'Low' ? 'var(--green)' : c.fraud_risk === 'High' ? '#ff4d4d' : 'orange' }}>{c.fraud_risk}</strong>
                  {c.payout_amount > 0 && ` · Expected Payout: `} 
                  {c.payout_amount > 0 && <strong style={{ color: 'var(--green)' }}>{formatINR(c.payout_amount)}</strong>}
                </div>
              </div>

              {/* Status Tracker */}
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <span className={`pill ${
                  c.payout_status === 'PAID' ? 'pill-green' : 
                  c.payout_status === 'REJECTED' ? 'pill-red' : 
                  'pill-orange'
                }`} style={{ fontSize: 13, fontWeight: 700, padding: '6px 12px' }}>
                  {c.payout_status === 'PAID' ? '✓ Accepted & Paid' : 
                   c.payout_status === 'REJECTED' ? '✕ Rejected' : 
                   '⟳ In Progress (Reviewing)'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
