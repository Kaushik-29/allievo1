import React from 'react';
import { formatINR } from '../utils/formatters';

export default function PhoneMockup({ worker, policy }) {
  return (
    <div className="phone-mockup">
      <div className="phone-screen">
        <div className="phone-header">
          <div className="phone-greeting">Hey {worker?.name?.split(' ')[0] || 'there'} 👋</div>
          <div className="phone-balance-label">Coverage Active</div>
          <div className="phone-balance">{formatINR(policy?.coverage_amount || 3500)}</div>
        </div>
        <div className="phone-card-visual">
          <div className="phone-card">
            <div className="phone-card-chip" />
            <div className="phone-card-num">Allievo</div>
            <div className="phone-card-name">{policy?.policy_number || 'GS-XXXXXX'}</div>
          </div>
        </div>
        <div className="phone-stats">
          <div className="phone-stat-row">
            <span className="phone-stat-label">Plan</span>
            <span className="phone-stat-value">{policy?.plan_tier || 'Standard Shield'}</span>
          </div>
          <div className="phone-stat-row">
            <span className="phone-stat-label">Premium</span>
            <span className="phone-stat-value">₹{policy?.weekly_premium || 89}/week</span>
          </div>
          <div className="phone-stat-row">
            <span className="phone-stat-label">Status</span>
            <span className="phone-stat-value" style={{ color: '#2ee89b' }}>● Active</span>
          </div>
        </div>
      </div>
    </div>
  );
}
