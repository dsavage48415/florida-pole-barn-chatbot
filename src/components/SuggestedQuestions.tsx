'use client';

import React from 'react';

interface SuggestedQuestionsProps {
  onSelect: (question: string) => void;
}

const SUGGESTIONS = [
  { emoji: '🏗️', text: 'How do I install trusses on a pole barn?' },
  { emoji: '📐', text: 'What size posts do I need for a 30x40 barn?' },
  { emoji: '🧱', text: 'How do I pour footers for pole barn posts?' },
  { emoji: '🔩', text: 'What type of metal roofing should I use?' },
];

export default function SuggestedQuestions({ onSelect }: SuggestedQuestionsProps) {
  return (
    <div
      style={{
        padding: '8px 20px 16px',
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '10px',
      }}
    >
      {SUGGESTIONS.map((item, i) => (
        <button
          key={i}
          onClick={() => onSelect(item.text)}
          style={{
            background: '#FFFFFF',
            border: '1px solid #E5E7EB',
            borderRadius: '12px',
            padding: '14px 16px',
            fontSize: '13px',
            color: '#374151',
            cursor: 'pointer',
            textAlign: 'left',
            lineHeight: '1.4',
            transition: 'all 0.15s ease',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLButtonElement).style.borderColor = '#C9232A';
            (e.currentTarget as HTMLButtonElement).style.background = '#FFF5F5';
            (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-1px)';
            (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 2px 8px rgba(201, 35, 42, 0.1)';
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLButtonElement).style.borderColor = '#E5E7EB';
            (e.currentTarget as HTMLButtonElement).style.background = '#FFFFFF';
            (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)';
            (e.currentTarget as HTMLButtonElement).style.boxShadow = 'none';
          }}
        >
          <span style={{ fontSize: '20px' }}>{item.emoji}</span>
          <span>{item.text}</span>
        </button>
      ))}
    </div>
  );
}
