// =============================================================
// src/components/shared/ScoreRing.jsx
// Animated circular progress ring for AI match scores
// =============================================================
import React from 'react';

const scoreColor = (score) => {
  if (score >= 80) return { stroke: '#16a34a', text: 'text-green-700', bg: 'bg-green-50' };
  if (score >= 65) return { stroke: '#2563eb', text: 'text-blue-700',  bg: 'bg-blue-50'  };
  if (score >= 50) return { stroke: '#d97706', text: 'text-amber-700', bg: 'bg-amber-50' };
  return              { stroke: '#dc2626', text: 'text-red-700',   bg: 'bg-red-50'   };
};

export default function ScoreRing({ score = 0, size = 80, label = '' }) {
  const radius      = (size - 10) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset      = circumference - (score / 100) * circumference;
  const colors      = scoreColor(score);

  return (
    <div className="flex flex-col items-center gap-1">
      <div className={`relative rounded-full ${colors.bg} p-1`} style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90">
          {/* Background ring */}
          <circle
            cx={size / 2} cy={size / 2} r={radius}
            fill="none" stroke="#e2e8f0" strokeWidth={6}
          />
          {/* Score ring */}
          <circle
            cx={size / 2} cy={size / 2} r={radius}
            fill="none"
            stroke={colors.stroke}
            strokeWidth={6}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="score-ring-fill"
          />
        </svg>
        {/* Score text */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`font-bold ${colors.text}`} style={{ fontSize: size * 0.2 }}>
            {Math.round(score)}%
          </span>
        </div>
      </div>
      {label && <span className="text-xs text-slate-500 text-center">{label}</span>}
    </div>
  );
}

// Small inline score badge (for tables/lists)
export function ScoreBadge({ score }) {
  const colors = scoreColor(score);
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${colors.bg} ${colors.text}`}>
      {Math.round(score)}%
    </span>
  );
}

// Ranking label badge
export function RankingBadge({ label }) {
  const styles = {
    'Highly Recommended': 'bg-green-100 text-green-800 border-green-200',
    'Recommended':        'bg-blue-100 text-blue-800 border-blue-200',
    'Average Fit':        'bg-amber-100 text-amber-800 border-amber-200',
    'Below Average':      'bg-orange-100 text-orange-800 border-orange-200',
    'Not Recommended':    'bg-red-100 text-red-800 border-red-200',
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${styles[label] || 'bg-slate-100 text-slate-600'}`}>
      {label}
    </span>
  );
}
