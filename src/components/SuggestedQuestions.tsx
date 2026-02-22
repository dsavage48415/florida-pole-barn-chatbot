'use client';

import React from 'react';

interface SuggestedQuestionsProps {
  onSelect: (question: string) => void;
}

const SUGGESTIONS = [
  'How do I install trusses on a pole barn?',
  'What size posts do I need for a 30x40 barn?',
  'How do I pour footers for pole barn posts?',
  'What type of metal roofing should I use?',
];

export default function SuggestedQuestions({ onSelect }: SuggestedQuestionsProps) {
  return (
    <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div
        style={{
          fontSize: '13px',
          color: '#64748B',
          textAlign: 'center',
          marginBottom: '4px',
        }}
      >
        Ask me anything about pole barn construction:
      </div>
      {SUGGESTIONS.map((question, i) => (
        <button
          key={i}
          onClick={() => onSelect(question)}
          style={{
            background: '#F0F5FA',
            border: '1px solid #E2E8F0',
            borderRadius: '10px',
            padding: '10px 14px',
            fontSize: '13px',
            color: '#334155',
            cursor: 'pointer',
            textAlign: 'left',
            lineHeight: '1.4',
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={e => {
            (e.target as HTMLButtonElement).style.background = '#E2E8F0';
            (e.target as HTMLButtonElement).style.borderColor = '#046BD2';
          }}
          onMouseLeave={e => {
            (e.target as HTMLButtonElement).style.background = '#F0F5FA';
            (e.target as HTMLButtonElement).style.borderColor = '#E2E8F0';
          }}
        >
          {question}
        </button>
      ))}
    </div>
  );
}
