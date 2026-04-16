import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';

const TABS_UNAUTH = [
  { id: 'onboarding', label: 'Get Started' },
  { id: 'admin', label: 'Insurer' },
];

const TABS_AUTHED = [
  { id: 'dashboard', label: '📊 Dashboard' },
  { id: 'policy', label: '🛡️ My Policy' },
  { id: 'manual-claim', label: '📝 File Claim' },
  { id: 'monitor', label: '📡 Live Monitor' },
  { id: 'admin', label: '🏢 Insurer' },
];

export default function Nav() {
  const { state, dispatch, logout } = useApp();
  const [adminPrompt, setAdminPrompt] = useState(false);
  const [adminPin, setAdminPin] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const tabs = state.worker ? TABS_AUTHED : TABS_UNAUTH;

  const handleTabClick = (tabId) => {
    if (tabId === 'admin') {
      if (!state.adminUnlocked) {
        setAdminPrompt(true);
        return;
      }
    }
    dispatch({ type: 'SET_TAB', payload: tabId });
  };

  const handleAdminPinSubmit = () => {
    if (adminPin === 'GS2026') {
      dispatch({ type: 'SET_ADMIN_UNLOCKED' });
      dispatch({ type: 'SET_TAB', payload: 'admin' });
      setAdminPrompt(false);
      setAdminPin('');
    } else {
      alert('Invalid admin PIN. Hint: GS2026');
    }
  };

  return (
    <>
      <header className="header" id="mainNav">
        <div className="header-inner">
          <a href="#" className="logo" onClick={(e) => {
            e.preventDefault();
            dispatch({ type: 'SET_TAB', payload: state.worker ? 'dashboard' : 'onboarding' });
          }}>
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
              <rect width="32" height="32" rx="8" fill="#2ee89b"/>
              <path d="M8 10h5l3 4.5L13 19H8l3-4.5L8 10z" fill="#0d0d0d" opacity="0.9"/>
              <path d="M16 10h8v9h-5l-3-4.5L16 10z" fill="#0d0d0d" opacity="0.6"/>
            </svg>
            <span>Allievo</span>
          </a>

          <nav className="nav-pill">
            {tabs.map(tab => (
              <a
                key={tab.id}
                href="#"
                className={`nav-link ${state.currentTab === tab.id ? 'nav-link-active' : ''}`}
                onClick={(e) => { e.preventDefault(); handleTabClick(tab.id); }}
              >
                {tab.label}
              </a>
            ))}
          </nav>

          <div className="header-auth">
            {state.worker ? (
              <>
                <span className="nav-user-name">👤 {state.worker.name}</span>
                <button className="btn-signin" onClick={logout}>Sign Out</button>
              </>
            ) : state.currentTab === 'onboarding' ? (
              <div style={{ color: 'var(--grey-mid)', fontSize: '14px', fontWeight: '500', display: 'flex', alignItems: 'center' }}>
                <span style={{ marginRight: '8px' }}>🕒</span>
                {currentTime.toLocaleString('en-IN', { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute:'2-digit', second:'2-digit' })}
              </div>
            ) : (
              <>
                <button className="btn-signin" onClick={() => dispatch({ type: 'SET_TAB', payload: 'onboarding' })}>Sign In</button>
                <button className="btn-signup" onClick={() => dispatch({ type: 'SET_TAB', payload: 'onboarding' })}>Sign Up</button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Admin PIN Modal */}
      {adminPrompt && (
        <div className="modal-overlay" onClick={() => setAdminPrompt(false)}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <h3>🏢 Insurer Dashboard Access</h3>
            <p style={{ color: '#888', marginBottom: 16 }}>Enter the admin PIN to access the insurer dashboard.</p>
            <input
              type="password"
              className="gs-input"
              placeholder="Admin PIN"
              value={adminPin}
              onChange={e => setAdminPin(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAdminPinSubmit()}
              autoFocus
            />
            <p style={{ color: '#555', fontSize: 11, marginTop: 8 }}>Hint for demo: GS2026</p>
            <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
              <button className="gs-btn-primary" onClick={handleAdminPinSubmit}>Access Dashboard</button>
              <button className="gs-btn-secondary" onClick={() => setAdminPrompt(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
