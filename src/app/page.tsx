'use client';

import ChatWidget from '@/components/ChatWidget';

/**
 * Dev/test page — renders the chatbot inline, exactly like it will appear
 * when embedded on the WordPress Resources page.
 */
export default function Home() {
  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#F3F4F6',
        padding: '40px 20px',
      }}
    >
      <div style={{ maxWidth: '900px', margin: '0 auto 32px' }}>
        <h1
          style={{
            fontSize: '28px',
            fontWeight: 700,
            color: '#111827',
            marginBottom: '8px',
          }}
        >
          Florida Pole Barn — Resources
        </h1>
        <p style={{ color: '#6B7280', lineHeight: '1.6', fontSize: '15px' }}>
          Get expert pole barn construction advice from our AI assistant,
          powered by 1,860+ instructional videos from Floyd Fonck.
        </p>
      </div>

      {/* Inline chatbot — same as WordPress embed */}
      <ChatWidget height="600px" />

      <div
        style={{
          maxWidth: '900px',
          margin: '32px auto 0',
          background: '#FFFFFF',
          border: '1px solid #E5E7EB',
          borderRadius: '12px',
          padding: '24px',
        }}
      >
        <h2
          style={{
            fontSize: '16px',
            fontWeight: 600,
            color: '#111827',
            marginBottom: '12px',
          }}
        >
          API Endpoints
        </h2>
        <div style={{ fontFamily: 'monospace', fontSize: '13px', color: '#374151' }}>
          <p style={{ marginBottom: '8px' }}>
            <strong>POST /api/chat</strong> — RAG chatbot (SSE streaming)
          </p>
          <p>
            <strong>GET /api/search?q=truss&amp;type=all&amp;limit=10</strong> — Direct search
          </p>
        </div>
      </div>
    </div>
  );
}
