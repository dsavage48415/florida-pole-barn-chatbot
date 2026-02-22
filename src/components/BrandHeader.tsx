'use client';

import React from 'react';

interface BrandHeaderProps {
  onClose: () => void;
}

export default function BrandHeader({ onClose }: BrandHeaderProps) {
  return (
    <div
      style={{
        background: 'linear-gradient(135deg, #046BD2 0%, #045CB4 100%)',
        color: '#FFFFFF',
        padding: '16px 16px 14px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderRadius: '12px 12px 0 0',
        flexShrink: 0,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '8px',
            background: 'rgba(255,255,255,0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '20px',
          }}
        >
          🏗️
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: '15px', lineHeight: '1.2' }}>
            Ask Florida Pole Barn
          </div>
          <div style={{ fontSize: '11px', opacity: 0.85, marginTop: '2px' }}>
            DIY Pole Barn Expert
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <a
          href="tel:3525858831"
          style={{
            color: '#FFFFFF',
            textDecoration: 'none',
            fontSize: '11px',
            opacity: 0.85,
            padding: '4px 8px',
            borderRadius: '6px',
            background: 'rgba(255,255,255,0.15)',
          }}
          title="Call Florida Pole Barn"
        >
          📞 (352) 585-8831
        </a>
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            color: '#FFFFFF',
            fontSize: '20px',
            cursor: 'pointer',
            padding: '4px',
            lineHeight: '1',
            opacity: 0.85,
          }}
          aria-label="Close chat"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
