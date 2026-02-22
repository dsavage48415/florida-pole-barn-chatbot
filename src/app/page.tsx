'use client';

import ChatWidget from '@/components/ChatWidget';

/**
 * Dev/test page — renders the chatbot widget directly.
 * In production, the widget is embedded via widget.js on the WordPress site.
 */
export default function Home() {
  return (
    <div style={{ padding: '40px', maxWidth: '800px', margin: '0 auto' }}>
      <h1
        style={{
          fontSize: '28px',
          fontWeight: 700,
          color: '#1E293B',
          marginBottom: '16px',
        }}
      >
        Florida Pole Barn — AI Chatbot Test Page
      </h1>

      <p style={{ color: '#64748B', lineHeight: '1.6', marginBottom: '24px' }}>
        This is a development test page. The chatbot widget appears as a floating
        blue bubble in the bottom-right corner. Click it to open the chat.
      </p>

      <div
        style={{
          background: '#FFFFFF',
          border: '1px solid #E2E8F0',
          borderRadius: '12px',
          padding: '24px',
          marginBottom: '24px',
        }}
      >
        <h2
          style={{
            fontSize: '18px',
            fontWeight: 600,
            color: '#1E293B',
            marginBottom: '12px',
          }}
        >
          Test Queries
        </h2>
        <ul style={{ color: '#334155', lineHeight: '2', paddingLeft: '20px' }}>
          <li>How do I install trusses on a pole barn?</li>
          <li>What size posts do I need for a 30x40 barn?</li>
          <li>How do I pour footers for pole barn posts?</li>
          <li>What type of metal roofing should I use?</li>
          <li>How to attach purlins to trusses?</li>
          <li>Best way to level posts for a pole barn?</li>
        </ul>
      </div>

      <div
        style={{
          background: '#F0F5FA',
          border: '1px solid #E2E8F0',
          borderRadius: '12px',
          padding: '24px',
        }}
      >
        <h2
          style={{
            fontSize: '18px',
            fontWeight: 600,
            color: '#1E293B',
            marginBottom: '12px',
          }}
        >
          API Endpoints
        </h2>
        <div style={{ fontFamily: 'monospace', fontSize: '13px', color: '#334155' }}>
          <p style={{ marginBottom: '8px' }}>
            <strong>POST /api/chat</strong> — RAG chatbot (SSE streaming)
          </p>
          <p style={{ marginBottom: '8px' }}>
            <strong>GET /api/search?q=truss&amp;type=all&amp;limit=10</strong> — Direct search
          </p>
        </div>
      </div>

      {/* Chatbot Widget */}
      <ChatWidget />
    </div>
  );
}
