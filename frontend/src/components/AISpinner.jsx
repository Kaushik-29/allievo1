import React from 'react';

export default function AISpinner({ text = 'AI processing...' }) {
  return (
    <div className="ai-spinner-wrapper">
      <div className="ai-spinner" />
      <span className="ai-spinner-text">{text}</span>
    </div>
  );
}
