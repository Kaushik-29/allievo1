import React from 'react';

/* ── Horizontal Bar Chart ─────────────────────────── */
export function HorizontalBarChart({ data, maxValue, height = 260 }) {
  const barHeight = 32;
  const gap = 16;
  const leftPad = 130;
  const rightPad = 60;
  const w = 600;
  const chartW = w - leftPad - rightPad;
  const max = maxValue || Math.max(...data.map(d => d.value), 1);

  return (
    <svg viewBox={`0 0 ${w} ${data.length * (barHeight + gap) + 20}`} className="svg-chart">
      {data.map((item, i) => {
        const y = i * (barHeight + gap) + 10;
        const barW = (item.value / max) * chartW;
        return (
          <g key={i}>
            <text x={leftPad - 10} y={y + barHeight / 2 + 5} textAnchor="end" fill="#ccc" fontSize="13" fontWeight="500">{item.label}</text>
            <rect x={leftPad} y={y} width={barW} height={barHeight} rx={8} fill={item.color || '#2ee89b'} opacity={0.9} />
            <text x={leftPad + barW + 8} y={y + barHeight / 2 + 5} fill="#fff" fontSize="13" fontWeight="600">{item.value}</text>
          </g>
        );
      })}
    </svg>
  );
}

/* ── Vertical Bar Chart (Weekly) ──────────────────── */
export function WeeklyBarChart({ data }) {
  const w = 600, h = 240;
  const padL = 60, padR = 20, padT = 20, padB = 50;
  const chartW = w - padL - padR;
  const chartH = h - padT - padB;
  const max = Math.max(...data.map(d => d.value), 1);
  const barW = chartW / data.length * 0.6;
  const gap = chartW / data.length;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="svg-chart">
      {/* Grid lines */}
      {[0, 0.25, 0.5, 0.75, 1].map((frac, i) => (
        <g key={i}>
          <line x1={padL} x2={w - padR} y1={padT + chartH * (1 - frac)} y2={padT + chartH * (1 - frac)} stroke="rgba(255,255,255,0.06)" />
          <text x={padL - 8} y={padT + chartH * (1 - frac) + 4} textAnchor="end" fill="#666" fontSize="11">₹{Math.round(max * frac).toLocaleString('en-IN')}</text>
        </g>
      ))}
      {/* Bars */}
      {data.map((item, i) => {
        const barH = (item.value / max) * chartH;
        const x = padL + i * gap + (gap - barW) / 2;
        const y = padT + chartH - barH;
        return (
          <g key={i}>
            <rect x={x} y={y} width={barW} height={barH} rx={6} fill={item.covered ? '#2ee89b' : '#333'} opacity={0.85} />
            {item.covered && item.payout > 0 && (
              <text x={x + barW / 2} y={y - 6} textAnchor="middle" fill="#2ee89b" fontSize="11" fontWeight="600">₹{item.payout.toLocaleString('en-IN')}</text>
            )}
            <text x={x + barW / 2} y={h - 10} textAnchor="middle" fill="#888" fontSize="10">{item.label}</text>
          </g>
        );
      })}
    </svg>
  );
}

/* ── Donut Chart ──────────────────────────────────── */
export function DonutChart({ segments, size = 200 }) {
  const cx = size / 2, cy = size / 2, r = size * 0.35;
  const strokeW = size * 0.12;
  const circumference = 2 * Math.PI * r;
  let offset = 0;

  return (
    <div className="donut-chart-wrapper">
      <svg viewBox={`0 0 ${size} ${size}`} className="donut-chart">
        {segments.map((seg, i) => {
          const dash = (seg.percent / 100) * circumference;
          const el = (
            <circle
              key={i}
              cx={cx} cy={cy} r={r}
              fill="none"
              stroke={seg.color}
              strokeWidth={strokeW}
              strokeDasharray={`${dash} ${circumference - dash}`}
              strokeDashoffset={-offset}
              strokeLinecap="round"
              transform={`rotate(-90 ${cx} ${cy})`}
            />
          );
          offset += dash;
          return el;
        })}
        <text x={cx} y={cy - 4} textAnchor="middle" fill="#fff" fontSize="22" fontWeight="700">
          {segments.reduce((s, seg) => s + seg.percent, 0)}%
        </text>
        <text x={cx} y={cy + 14} textAnchor="middle" fill="#888" fontSize="11">Total</text>
      </svg>
      <div className="donut-legend">
        {segments.map((seg, i) => (
          <div key={i} className="donut-legend-item">
            <span className="donut-legend-dot" style={{ background: seg.color }} />
            <span>{seg.label}: {seg.percent}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Mini Progress Bar ────────────────────────────── */
export function MiniProgressBar({ value, max = 1, color = '#2ee89b', width = 120 }) {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div className="mini-progress" style={{ width }}>
      <div className="mini-progress-fill" style={{ width: `${pct}%`, background: color }} />
    </div>
  );
}
