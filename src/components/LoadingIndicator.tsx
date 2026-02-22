'use client';

import React from 'react';

export default function LoadingIndicator() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '12px 16px' }}>
      <div
        style={{
          width: '32px',
          height: '32px',
          borderRadius: '50%',
          background: '#046BD2',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#FFF',
          fontSize: '14px',
          flexShrink: 0,
        }}
      >
        🏗️
      </div>
      <div
        style={{
          background: '#F0F5FA',
          borderRadius: '12px 12px 12px 4px',
          padding: '12px 16px',
          display: 'flex',
          gap: '4px',
          alignItems: 'center',
        }}
      >
        {[0, 1, 2].map(i => (
          <div
            key={i}
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: '#94A3B8',
              animation: `fpb-bounce 1.4s ease-in-out ${i * 0.16}s infinite both`,
            }}
          />
        ))}
      </div>
      <style>{`
        @keyframes fpb-bounce {
          0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
          40% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
