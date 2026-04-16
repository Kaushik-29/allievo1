import React, { useState } from 'react';

export const MOCK_QR_SVG = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
  <rect width="200" height="200" fill="%230d0d0d"/>
  <rect x="10" y="10" width="60" height="60" fill="none" stroke="%232ee89b" stroke-width="4"/>
  <rect x="20" y="20" width="40" height="40" fill="%232ee89b"/>
  <rect x="130" y="10" width="60" height="60" fill="none" stroke="%232ee89b" stroke-width="4"/>
  <rect x="140" y="20" width="40" height="40" fill="%232ee89b"/>
  <rect x="10" y="130" width="60" height="60" fill="none" stroke="%232ee89b" stroke-width="4"/>
  <rect x="20" y="140" width="40" height="40" fill="%232ee89b"/>
  <rect x="85" y="10" width="10" height="10" fill="%232ee89b"/>
  <rect x="100" y="10" width="10" height="10" fill="%232ee89b"/>
  <rect x="85" y="25" width="20" height="10" fill="%232ee89b"/>
  <rect x="85" y="85" width="10" height="10" fill="%232ee89b"/>
  <rect x="100" y="85" width="45" height="10" fill="%232ee89b"/>
  <rect x="130" y="100" width="15" height="10" fill="%232ee89b"/>
  <rect x="150" y="100" width="10" height="10" fill="%232ee89b"/>
  <rect x="130" y="115" width="30" height="10" fill="%232ee89b"/>
  <rect x="85" y="115" width="30" height="10" fill="%232ee89b"/>
  <rect x="100" y="130" width="10" height="40" fill="%232ee89b"/>
  <rect x="85" y="150" width="10" height="20" fill="%232ee89b"/>
  <rect x="115" y="140" width="20" height="10" fill="%232ee89b"/>
  <rect x="140" y="140" width="50" height="10" fill="%232ee89b"/>
  <rect x="155" y="155" width="15" height="15" fill="%232ee89b"/>
  <rect x="140" y="170" width="50" height="10" fill="%232ee89b"/>
</svg>`;

export default function PaymentModal({ plan, qrSvg, onClose, onSuccess }) {
  const [payStep, setPayStep] = useState('select'); // select | qr | card | success
  const [processing, setProcessing] = useState(false);
  const [card, setCard] = useState({ number: '', expiry: '', cvv: '', name: '' });

  const simulatePay = () => {
    setProcessing(true);
    setTimeout(() => {
      setProcessing(false);
      setPayStep('success');
      setTimeout(() => onSuccess(), 1800);
    }, 2200);
  };

  const formatCardNumber = (v) =>
    v.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim();

  const formatExpiry = (v) => {
    const d = v.replace(/\D/g, '').slice(0, 4);
    return d.length > 2 ? d.slice(0, 2) + '/' + d.slice(2) : d;
  };

  return (
    <div className="modal-overlay" onClick={payStep !== 'success' ? onClose : undefined}>
      <div className="payment-modal" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="payment-modal-header">
          {payStep !== 'select' && payStep !== 'success' ? (
            <button className="payment-back-btn" onClick={() => setPayStep('select')}>←</button>
          ) : (
            <div className="payment-plan-icon">🛡️</div>
          )}
          <div style={{ flex: 1 }}>
            <div className="payment-title">
              {payStep === 'select' ? `Subscribe · ${plan.tier}` :
               payStep === 'qr' ? 'Pay via UPI / QR Code' :
               payStep === 'card' ? 'Pay via Debit / Credit Card' : ''}
            </div>
            <div className="payment-subtitle">₹{plan.premium}/week · {plan.coverage}% coverage</div>
          </div>
          {payStep !== 'success' && (
            <button className="payment-close-btn" onClick={onClose}>✕</button>
          )}
        </div>

        {/* Body */}
        <div className="payment-body">

          {/* ── Step 1: Select Method ── */}
          {payStep === 'select' && (
            <>
              {/* Plan summary */}
              <div className="payment-summary">
                <div className="payment-summary-row"><span>Plan</span><span style={{ fontWeight: 700 }}>{plan.tier}</span></div>
                <div className="payment-summary-row"><span>Coverage</span><span style={{ fontWeight: 700 }}>{plan.coverage}% income</span></div>
                <div className="payment-summary-row"><span>Disruptions</span><span style={{ fontWeight: 700 }}>All 5 types</span></div>
                <div className="payment-summary-row" style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 12, marginTop: 8 }}>
                  <span style={{ fontWeight: 600 }}>Weekly Premium</span>
                  <span style={{ fontSize: 22, fontWeight: 800 }}>₹{plan.premium}</span>
                </div>
              </div>

              <p style={{ textAlign: 'center', fontSize: 12, color: '#555', marginBottom: 12 }}>Choose your payment method</p>

              {/* UPI Option */}
              <button className="payment-method-btn" onClick={() => setPayStep('qr')}>
                <div className="payment-method-icon" style={{ background: 'rgba(46,232,155,0.12)' }}>📱</div>
                <div style={{ textAlign: 'left', flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>UPI / QR Code</div>
                  <div style={{ fontSize: 12, color: '#666', marginTop: 2 }}>Scan with GPay, PhonePe, Paytm</div>
                </div>
                <span style={{ color: '#444' }}>›</span>
              </button>

              {/* Card Option */}
              <button className="payment-method-btn" onClick={() => setPayStep('card')}>
                <div className="payment-method-icon" style={{ background: 'rgba(59,130,246,0.12)' }}>💳</div>
                <div style={{ textAlign: 'left', flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>Debit / Credit Card</div>
                  <div style={{ fontSize: 12, color: '#666', marginTop: 2 }}>Visa, Mastercard, RuPay accepted</div>
                </div>
                <span style={{ color: '#444' }}>›</span>
              </button>

              <div style={{ textAlign: 'center', fontSize: 11, color: '#444', marginTop: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                🔒 256-bit SSL encrypted · Powered by Razorpay
              </div>
            </>
          )}

          {/* ── Step 2a: QR Code ── */}
          {payStep === 'qr' && (
            <>
              <div style={{ background: 'var(--surface-2)', borderRadius: 16, padding: 24, textAlign: 'center', marginBottom: 16 }}>
                <img src={qrSvg || MOCK_QR_SVG} alt="UPI QR Code" style={{ width: 176, height: 176, borderRadius: 12, border: '1px solid rgba(255,255,255,0.08)', margin: '0 auto 12px' }} />
                <p style={{ fontSize: 12, color: '#888' }}>Scan with <strong style={{ color: '#fff' }}>GPay, PhonePe, or Paytm</strong></p>
                <p style={{ fontSize: 22, fontWeight: 800, marginTop: 8 }}>₹{plan.premium}</p>
                <p style={{ fontSize: 11, color: '#555', fontFamily: 'monospace' }}>allievo@razorpay</p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
                {[
                  'Open your UPI app and tap "Scan QR"',
                  `Enter amount ₹${plan.premium} if not auto-filled`,
                  'Confirm payment with your UPI PIN',
                  'Come back here and click "I\'ve Paid"',
                ].map((txt, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 12, color: '#888' }}>
                    <span style={{ width: 18, height: 18, borderRadius: '50%', background: 'rgba(46,232,155,0.15)', color: 'var(--green)', fontWeight: 700, fontSize: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{i + 1}</span>
                    {txt}
                  </div>
                ))}
              </div>

              <button className="gs-btn-primary" style={{ width: '100%' }} onClick={simulatePay} disabled={processing}>
                {processing ? '⟳ Verifying Payment...' : "✓ I've Paid"}
              </button>
            </>
          )}

          {/* ── Step 2b: Card ── */}
          {payStep === 'card' && (
            <>
              {/* Card Preview */}
              <div className="card-preview">
                <div className="card-preview-shine" />
                <div style={{ position: 'relative', zIndex: 1 }}>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>Card Number</div>
                  <div style={{ fontSize: 18, fontFamily: 'monospace', letterSpacing: 3, marginTop: 4, color: '#e0e0e0' }}>
                    {card.number || '•••• •••• •••• ••••'}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12 }}>
                    <div>
                      <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>Cardholder</div>
                      <div style={{ fontSize: 12, fontWeight: 600 }}>{card.name || 'YOUR NAME'}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>Expires</div>
                      <div style={{ fontSize: 12, fontWeight: 600 }}>{card.expiry || 'MM/YY'}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card Form */}
              <div className="form-group">
                <label className="gs-label">Cardholder Name</label>
                <input className="gs-input" placeholder="As printed on card" value={card.name}
                  onChange={e => setCard(c => ({ ...c, name: e.target.value.toUpperCase() }))} />
              </div>
              <div className="form-group">
                <label className="gs-label">Card Number</label>
                <input className="gs-input" placeholder="1234 5678 9012 3456" maxLength={19}
                  style={{ fontFamily: 'monospace', letterSpacing: 2 }}
                  value={card.number}
                  onChange={e => setCard(c => ({ ...c, number: formatCardNumber(e.target.value) }))} />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="gs-label">Expiry</label>
                  <input className="gs-input" placeholder="MM/YY" maxLength={5}
                    style={{ fontFamily: 'monospace' }}
                    value={card.expiry}
                    onChange={e => setCard(c => ({ ...c, expiry: formatExpiry(e.target.value) }))} />
                </div>
                <div className="form-group">
                  <label className="gs-label">CVV</label>
                  <input className="gs-input" placeholder="•••" type="password" maxLength={3}
                    style={{ fontFamily: 'monospace' }}
                    value={card.cvv}
                    onChange={e => setCard(c => ({ ...c, cvv: e.target.value.replace(/\D/g, '').slice(0, 3) }))} />
                </div>
              </div>

              <p style={{ textAlign: 'center', fontSize: 11, color: '#444', marginBottom: 12 }}>🔒 Your card details are encrypted and never stored</p>

              <button className="gs-btn-primary" style={{ width: '100%' }} onClick={simulatePay}
                disabled={processing || !card.number || !card.expiry || !card.cvv || !card.name}>
                {processing ? '⟳ Processing...' : `Pay ₹${plan.premium} & Subscribe`}
              </button>
            </>
          )}

          {/* ── Step 3: Success ── */}
          {payStep === 'success' && (
            <div style={{ textAlign: 'center', padding: '40px 20px' }}>
              <div className="payment-success-icon">✓</div>
              <h3 style={{ fontSize: 22, fontWeight: 800, marginTop: 16 }}>Payment Successful!</h3>
              <p style={{ fontSize: 14, color: '#888', marginTop: 8 }}>
                You're now enrolled in the <strong style={{ color: '#fff' }}>{plan.tier}</strong> plan
              </p>
              <p style={{ fontSize: 12, color: '#555', marginTop: 12 }}>Activating your coverage...</p>
              <div className="ai-spinner" style={{ margin: '16px auto 0', width: 20, height: 20 }} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
