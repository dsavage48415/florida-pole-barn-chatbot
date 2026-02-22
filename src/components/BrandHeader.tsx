'use client';

import React from 'react';

export default function BrandHeader() {
  return (
    <div
      style={{
        background: 'linear-gradient(135deg, #046BD2 0%, #045CB4 100%)',
        color: '#FFFFFF',
        padding: '20px 24px 18px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexShrink: 0,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div
          style={{
            width: '42px',
            height: '42px',
            borderRadius: '10px',
            background: 'rgba(255,255,255,0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '24px',
          }}
        >
          🏗️
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: '17px', lineHeight: '1.2' }}>
            Ask Florida Pole Barn
          </div>
          <div style={{ fontSize: '12px', opacity: 0.8, marginTop: '3px' }}>
            Powered by 1,860+ construction videos
          </div>
        </div>
      </div>

      <a
        href="tel:3525858831"
        style={{
          color: '#FFFFFF',
          textDecoration: 'none',
          fontSize: '12px',
          opacity: 0.9,
          padding: '6px 12px',
          borderRadius: '8px',
          background: 'rgba(255,255,255,0.15)',
          fontWeight: 500,
          transition: 'background 0.15s ease',
        }}
        title="Call Florida Pole Barn"
      >
        📞 (352) 585-8831
      </a>
    </div>
  );
}
