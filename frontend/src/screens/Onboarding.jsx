import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { ZONE_MAP, formatINR } from '../utils/formatters';
import AISpinner from '../components/AISpinner';
import PoweredByClaude from '../components/PoweredByClaude';
import PaymentModal from '../components/PaymentModal';

const CITIES = ['Mumbai', 'Delhi', 'Bengaluru', 'Chennai', 'Hyderabad'];
const PLATFORMS = ['Swiggy', 'Zomato', 'Both'];
const INCOMES = [2000, 3500, 5000, 8000];
const YEARS = ['0-1', '1-3', '3+'];

const PLANS = [
  { tier: 'Basic Shield', premium: 49, coverage: 60, bestFor: 'Part-time workers', features: ['2 disruption triggers', '60% income coverage', 'Manual claim option'] },
  { tier: 'Standard Shield', premium: 89, coverage: 70, bestFor: 'Full-time workers', features: ['All 5 disruption triggers', '70% income coverage', 'Automatic payouts'] },
  { tier: 'Premium Shield', premium: 149, coverage: 80, bestFor: 'High earners', features: ['Priority fraud review', '80% income coverage', 'Automatic payouts'] },
];

export default function Onboarding() {
  const { state, register, login, dispatch } = useApp();
  const [step, setStep] = useState(1);
  const [isLogin, setIsLogin] = useState(false);
  const [isForgot, setIsForgot] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [showDebug, setShowDebug] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [form, setForm] = useState({
    name: '', phone: '', password: '', email: '',
    city: '', platform: '', zone: '',
    declaredWeeklyIncome: '', yearsActive: '', upiId: '',
    planTier: 'Standard Shield', aadharNumber: '',
  });
  const [loginForm, setLoginForm] = useState({ phone: '', password: '' });
  const [forgotForm, setForgotForm] = useState({ phone: '', aadharNumber: '', newPassword: '' });
  const [error, setError] = useState('');

  const updateForm = (key, val) => setForm(prev => ({ ...prev, [key]: val }));

  const handleStep1Next = () => {
    if (!form.name || !form.phone || !form.aadharNumber || !form.password || !form.city || !form.platform || !form.zone) {
      setError('Please fill all required fields.'); return;
    }
    if (!/^\d{12}$/.test(form.aadharNumber)) {
      setError('Aadhar number must be exactly 12 digits.'); return;
    }
    if (!/^[6-9]\d{9}$/.test(form.phone)) {
      setError('Valid 10-digit phone number required.'); return;
    }
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters.'); return;
    }
    setError(''); setStep(2);
  };

  const handleStep2Submit = async () => {
    if (!form.declaredWeeklyIncome || !form.yearsActive) {
      setError('Please select income and experience.'); return;
    }
    setError(''); setAiLoading(true);
    try {
      await register(form);
      setAiLoading(false);
      setStep(3);
    } catch (err) {
      setAiLoading(false);
      setError(err.response?.data?.error || err.response?.data?.details?.join(', ') || 'Registration failed.');
    }
  };

  const handleBuyPolicy = () => {
    setShowPaymentModal(true);
  };

  const handlePaymentSuccess = async () => {
    setShowPaymentModal(false);
    try {
      const api = (await import('../utils/api')).default;
      await api.post('/policies', { planTier: form.planTier });
      const policyRes = await api.get('/policies/active');
      dispatch({ type: 'SET_ACTIVE_POLICY', payload: policyRes.data.policy });
      dispatch({ type: 'SET_TAB', payload: 'policy' });
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create policy.');
    }
  };

  const handleLogin = async () => {
    if (!loginForm.phone || !loginForm.password) { setError('Enter phone and password.'); return; }
    try {
      await login(loginForm.phone, loginForm.password);
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed.');
    }
  };

  const handleForgot = async () => {
    if (!forgotForm.phone || !forgotForm.aadharNumber || !forgotForm.newPassword) { setError('All fields required.'); return; }
    try {
      const api = (await import('../utils/api')).default;
      const res = await api.post('/auth/reset-password', forgotForm);
      alert(res.data.message);
      setIsForgot(false);
      setIsLogin(true);
      setError('');
    } catch (err) {
      setError(err.response?.data?.error || 'Reset failed.');
    }
  };

  const rp = state.riskProfile;
  const selectedPlan = PLANS.find(p => p.tier === form.planTier) || PLANS[1];

  return (
    <>
      {/* Hero */}
      <section className="hero-section">
        <div className="hero-grid-bg" />
        <div className="hero-content">
          <h1 className="hero-headline">
            <span className="hero-line1">Income protection</span>
            <span className="hero-line2">made instant</span>
          </h1>
          <p className="hero-sub">
            Parametric insurance for Swiggy & Zomato delivery partners. When disruptions hit your zone, get paid instantly — no claims needed. Coverage from just ₹49/week.
          </p>

          {/* Demo Login Quick Access */}
          <div style={{ marginTop: 16, display: 'flex', justifyContent: 'center', gap: 8 }}>
            <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: 12, padding: '8px 16px', fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>
              Demo Login: <strong style={{ color: '#fff' }}>9876543210</strong> / <strong style={{ color: '#fff' }}>demo123</strong>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="onboarding-form-area">
          {/* Login/Register tab toggle */}
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 20 }}>
            <button className={!isLogin && !isForgot ? 'gs-btn-primary gs-btn-sm' : 'gs-btn-secondary gs-btn-sm'} onClick={() => { setIsForgot(false); setIsLogin(false); setError(''); }}>Register</button>
            <button className={isLogin && !isForgot ? 'gs-btn-primary gs-btn-sm' : 'gs-btn-secondary gs-btn-sm'} onClick={() => { setIsForgot(false); setIsLogin(true); setError(''); }}>Sign In</button>
          </div>

          {isForgot ? (
            <div className="gs-card-static" style={{ animation: 'fadeSlideUp 0.5s ease both' }}>
              <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 20 }}>Reset Password</h2>
              <div className="form-group">
                <label className="gs-label">Phone Number</label>
                <input className="gs-input" placeholder="10-digit number" value={forgotForm.phone} onChange={e => setForgotForm(p => ({ ...p, phone: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="gs-label">Aadhar Number</label>
                <input className="gs-input" placeholder="12-digit number" value={forgotForm.aadharNumber} onChange={e => setForgotForm(p => ({ ...p, aadharNumber: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="gs-label">New Password</label>
                <input className="gs-input" type="password" placeholder="New MIN 6 chars" value={forgotForm.newPassword} onChange={e => setForgotForm(p => ({ ...p, newPassword: e.target.value }))} />
              </div>
              {error && <p style={{ color: 'var(--danger-red)', fontSize: 13, marginBottom: 12 }}>{error}</p>}
              <button className="gs-btn-primary" style={{ width: '100%', marginBottom: 12 }} onClick={handleForgot}>Reset Password</button>
              <div style={{ textAlign: 'center' }}>
                <a href="#" style={{ fontSize: 13, color: 'var(--green)' }} onClick={(e) => { e.preventDefault(); setIsForgot(false); setIsLogin(true); }}>← Back to Login</a>
              </div>
            </div>
          ) : isLogin ? (
            <div className="gs-card-static" style={{ animation: 'fadeSlideUp 0.5s ease both' }}>
              <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 20 }}>Welcome back</h2>
              <div className="form-group">
                <label className="gs-label">Phone Number</label>
                <input className="gs-input" placeholder="10-digit number" value={loginForm.phone} onChange={e => setLoginForm(p => ({ ...p, phone: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="gs-label">Password</label>
                <input className="gs-input" type="password" placeholder="Your password" value={loginForm.password} onChange={e => setLoginForm(p => ({ ...p, password: e.target.value }))} onKeyDown={e => e.key === 'Enter' && handleLogin()} />
              </div>
              {error && <p style={{ color: 'var(--danger-red)', fontSize: 13, marginBottom: 12 }}>{error}</p>}
              <button className="gs-btn-primary" style={{ width: '100%', marginBottom: 12 }} onClick={handleLogin} disabled={state.isLoading}>{state.isLoading ? 'Signing in...' : 'Sign In'}</button>
              <div style={{ textAlign: 'center' }}>
                <a href="#" style={{ fontSize: 13, color: 'var(--green)' }} onClick={(e) => { e.preventDefault(); setIsForgot(true); setIsLogin(false); }}>Forgot Password?</a>
              </div>
            </div>
          ) : (
            <>
              {/* Step Progress */}
              <div className="step-progress">
                {[1, 2, 3].map(s => (
                  <div key={s} className={`step-dot ${step === s ? 'step-active' : step > s ? 'step-done' : ''}`} />
                ))}
              </div>

              {/* Step 1: Personal Details */}
              {step === 1 && (
                <div className="gs-card-static" style={{ animation: 'fadeSlideUp 0.5s ease both' }}>
                  <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 20 }}>Personal Details</h2>

                  <div className="form-group">
                    <label className="gs-label">Full Name</label>
                    <input className="gs-input" placeholder="Your full name" value={form.name} onChange={e => updateForm('name', e.target.value)} />
                  </div>

                  <div className="form-group">
                    <label className="gs-label">Aadhar Number</label>
                    <input className="gs-input" placeholder="12-digit number" value={form.aadharNumber || ''} onChange={e => updateForm('aadharNumber', e.target.value)} />
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label className="gs-label">Phone Number</label>
                      <input className="gs-input" placeholder="10-digit number" value={form.phone} onChange={e => updateForm('phone', e.target.value)} />
                    </div>
                    <div className="form-group">
                      <label className="gs-label">Password</label>
                      <input className="gs-input" type="password" placeholder="Min 6 characters" value={form.password} onChange={e => updateForm('password', e.target.value)} />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label className="gs-label">City</label>
                      <select className="gs-select" value={form.city} onChange={e => { updateForm('city', e.target.value); updateForm('zone', ''); }}>
                        <option value="">Select city</option>
                        {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="gs-label">Platform</label>
                      <select className="gs-select" value={form.platform} onChange={e => updateForm('platform', e.target.value)}>
                        <option value="">Select platform</option>
                        {PLATFORMS.map(p => <option key={p} value={p}>{p}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="gs-label">Operating Zone</label>
                    <select className="gs-select" value={form.zone} onChange={e => updateForm('zone', e.target.value)} disabled={!form.city}>
                      <option value="">{form.city ? 'Select zone' : 'Select city first'}</option>
                      {(ZONE_MAP[form.city] || []).map(z => <option key={z} value={z}>{z}</option>)}
                    </select>
                  </div>

                  {error && <p style={{ color: 'var(--danger-red)', fontSize: 13, marginBottom: 12 }}>{error}</p>}
                  <button className="gs-btn-primary" style={{ width: '100%' }} onClick={handleStep1Next}>Continue →</button>
                </div>
              )}

              {/* Step 2: Work Profile */}
              {step === 2 && (
                <div className="gs-card-static" style={{ animation: 'fadeSlideUp 0.5s ease both' }}>
                  <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 20 }}>Work Profile</h2>

                  <div className="form-group">
                    <label className="gs-label">Declared Weekly Income</label>
                    <div className="tile-group">
                      {INCOMES.map(inc => (
                        <div key={inc} className={`tile ${form.declaredWeeklyIncome === inc ? 'tile-active' : ''}`} onClick={() => updateForm('declaredWeeklyIncome', inc)}>
                          <span className="tile-value">{formatINR(inc)}</span>
                          <span className="tile-label">per week</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="gs-label">Years Active on Platform</label>
                    <div className="tile-group">
                      {YEARS.map(yr => (
                        <div key={yr} className={`tile ${form.yearsActive === yr ? 'tile-active' : ''}`} onClick={() => updateForm('yearsActive', yr)}>
                          <span className="tile-value">{yr}</span>
                          <span className="tile-label">years</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="gs-label">UPI ID (optional)</label>
                    <input className="gs-input" placeholder="yourname@upi" value={form.upiId} onChange={e => updateForm('upiId', e.target.value)} />
                  </div>

                  {error && <p style={{ color: 'var(--danger-red)', fontSize: 13, marginBottom: 12 }}>{error}</p>}

                  {aiLoading ? (
                    <AISpinner text="AI calculating your risk profile..." />
                  ) : (
                    <div style={{ display: 'flex', gap: 12 }}>
                      <button className="gs-btn-secondary" onClick={() => setStep(1)}>← Back</button>
                      <button className="gs-btn-primary" style={{ flex: 1 }} onClick={handleStep2Submit}>Get AI Risk Score →</button>
                    </div>
                  )}

                  {/* Risk Result */}
                  {rp && !aiLoading && (
                    <div className="risk-result">
                      <div className={`risk-badge risk-${rp.riskLabel?.toLowerCase()}`}>
                        {rp.riskLabel} Risk — Score: {rp.riskScore}/100
                      </div>
                      <p style={{ fontSize: 14, marginBottom: 8 }}>Recommended premium: <strong style={{ color: 'var(--green)' }}>₹{rp.weeklyPremium}/week</strong></p>
                      <p style={{ fontSize: 14, marginBottom: 8 }}>Coverage: <strong>{rp.coveragePercent}%</strong> of declared income</p>
                      <p style={{ fontSize: 13, color: 'var(--grey-mid)' }}>{rp.reasoning}</p>
                      <PoweredByClaude />

                      {/* AI Debug Panel */}
                      {state.aiDebugData?.riskScoring && (
                        <div className="ai-debug-panel">
                          <button className="ai-debug-toggle" onClick={() => setShowDebug(!showDebug)}>
                            <span>🔍 AI Debug Panel</span>
                            <span>{showDebug ? '▲' : '▼'}</span>
                          </button>
                          {showDebug && (
                            <div className="ai-debug-content">
                              <span className="ai-debug-label">System Prompt:</span>
                              {state.aiDebugData.riskScoring.prompt?.system}
                              <span className="ai-debug-label">User Message:</span>
                              {state.aiDebugData.riskScoring.prompt?.user}
                              <span className="ai-debug-label">Raw Response:</span>
                              {state.aiDebugData.riskScoring.rawResponse}
                              <span className="ai-debug-label">Response Time:</span>
                              {Math.round(state.aiDebugData.riskScoring.responseTime)}ms
                              <span className="ai-debug-label">Model:</span>
                              {state.aiDebugData.riskScoring.model}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Step 3: Plan Selection */}
              {step === 3 && (
                <div className="gs-card-static" style={{ animation: 'fadeSlideUp 0.5s ease both' }}>
                  <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>Choose Your Shield</h2>
                  <p style={{ color: 'var(--grey-mid)', fontSize: 14, marginBottom: 20 }}>
                    All plans cover income loss from 5 disruption types. Weekly billing only.
                  </p>

                  <div className="plan-cards">
                    {PLANS.map(plan => (
                      <div
                        key={plan.tier}
                        className={`plan-card ${form.planTier === plan.tier ? 'plan-active' : ''} ${plan.tier === 'Standard Shield' ? 'plan-recommended' : ''}`}
                        onClick={() => updateForm('planTier', plan.tier)}
                      >
                        <div className="plan-name">{plan.tier}</div>
                        <div className="plan-price">₹{plan.premium}</div>
                        <div className="plan-price-sub">per week</div>
                        <div className="plan-coverage">{plan.coverage}% income coverage</div>
                        <div className="plan-for">{plan.bestFor}</div>
                        <ul style={{ listStyle: 'none', marginTop: 12, textAlign: 'left' }}>
                          {plan.features.map(f => (
                            <li key={f} style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginBottom: 4 }}>✓ {f}</li>
                          ))}
                        </ul>
                        {form.declaredWeeklyIncome && (
                          <div style={{ marginTop: 8, fontSize: 13, color: 'var(--green)', fontWeight: 600 }}>
                            Covers up to {formatINR(Math.round(form.declaredWeeklyIncome * plan.coverage / 100))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {error && <p style={{ color: 'var(--danger-red)', fontSize: 13, marginBottom: 12 }}>{error}</p>}

                  <button className="gs-btn-primary" style={{ width: '100%', marginTop: 8 }} onClick={handleBuyPolicy}>
                    Pay ₹{selectedPlan.premium}/week — Subscribe
                  </button>
                  <p style={{ textAlign: 'center', fontSize: 11, color: '#555', marginTop: 8 }}>🔒 256-bit SSL encrypted · Powered by Razorpay</p>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* Marquee Strip */}
      <section className="marquee-section">
        <div className="marquee-track">
          <div className="marquee-content">
            {['Income Protection', '•', 'Weekly Coverage', '•', 'Instant Payouts', '•', 'No Claims Needed', '•', 'AI-Powered', '•', 'Swiggy & Zomato', '•',
              'Income Protection', '•', 'Weekly Coverage', '•', 'Instant Payouts', '•', 'No Claims Needed', '•', 'AI-Powered', '•', 'Swiggy & Zomato', '•'].map((text, i) => (
              <span key={i} className={text === '•' ? 'marquee-dot' : ''}>{text}</span>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="section-dark">
        <div className="section-header">
          <h2>How Allievo Works</h2>
          <p>Parametric insurance that protects your income automatically when disruptions strike your zone.</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 16 }}>
          {[
            { icon: '🛡️', title: 'Choose Your Shield', desc: 'Pick a weekly plan starting at ₹49. Coverage ranges from 60-80% of your declared income.' },
            { icon: '📡', title: 'AI Monitors Your Zone', desc: 'Our system tracks 5 disruption types: rain, heat, AQI, curfews, and platform outages in real-time.' },
            { icon: '⚡', title: 'Instant Auto-Payout', desc: 'When a threshold is breached, AI validates the claim and credits your UPI in 4.2 seconds. Zero paperwork.' },
            { icon: '🔒', title: 'Fraud Protection', desc: 'Multi-signal fraud detection checks GPS, weather patterns, and claim history to keep the system fair.' },
          ].map((feat, i) => (
            <div key={i} className="gs-card" style={{ cursor: 'default' }}>
              <div style={{ fontSize: 32, marginBottom: 16 }}>{feat.icon}</div>
              <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>{feat.title}</h3>
              <p style={{ fontSize: 14, color: 'var(--grey-mid)', lineHeight: 1.65 }}>{feat.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Payment Modal ──────────────────────────────────────── */}
      {showPaymentModal && (
        <PaymentModal
          plan={selectedPlan}
          onClose={() => setShowPaymentModal(false)}
          onSuccess={handlePaymentSuccess}
        />
      )}
    </>
  );
}


