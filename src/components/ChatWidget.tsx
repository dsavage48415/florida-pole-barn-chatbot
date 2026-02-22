'use client';

import React, { useState, useEffect } from 'react';
import ChatWindow from './ChatWindow';

interface ChatWidgetProps {
  apiBaseUrl?: string;
}

export default function ChatWidget({ apiBaseUrl = '' }: ChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <>
      {/* Chat Window */}
      {isOpen && (
        <div
          style={{
            position: 'fixed',
            ...(isMobile
              ? { top: 0, left: 0, right: 0, bottom: 0, zIndex: 99999 }
              : {
                  bottom: '90px',
                  right: '20px',
                  width: '380px',
                  height: '560px',
                  zIndex: 99999,
                  borderRadius: '12px',
                }),
          }}
        >
          <ChatWindow onClose={() => setIsOpen(false)} apiBaseUrl={apiBaseUrl} />
        </div>
      )}

      {/* Floating Bubble Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          style={{
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #046BD2 0%, #045CB4 100%)',
            border: 'none',
            cursor: 'pointer',
            boxShadow: '0 4px 14px rgba(4, 107, 210, 0.4), 0 2px 6px rgba(0, 0, 0, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 99998,
            transition: 'transform 0.2s ease, box-shadow 0.2s ease',
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.08)';
            (e.currentTarget as HTMLButtonElement).style.boxShadow =
              '0 6px 20px rgba(4, 107, 210, 0.5), 0 3px 8px rgba(0, 0, 0, 0.2)';
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)';
            (e.currentTarget as HTMLButtonElement).style.boxShadow =
              '0 4px 14px rgba(4, 107, 210, 0.4), 0 2px 6px rgba(0, 0, 0, 0.15)';
          }}
          aria-label="Open Ask Florida Pole Barn chat"
          title="Ask Florida Pole Barn"
        >
          {/* Chat icon */}
          <svg
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#FFFFFF"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        </button>
      )}

      {/* Tooltip that appears briefly */}
      {!isOpen && (
        <div
          style={{
            position: 'fixed',
            bottom: '88px',
            right: '20px',
            background: '#1E293B',
            color: '#FFFFFF',
            padding: '8px 14px',
            borderRadius: '8px',
            fontSize: '13px',
            fontWeight: 500,
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            zIndex: 99997,
            animation: 'fpb-tooltip-appear 0.3s ease',
            fontFamily:
              '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            whiteSpace: 'nowrap',
          }}
        >
          Ask Florida Pole Barn 🏗️
          <div
            style={{
              position: 'absolute',
              bottom: '-6px',
              right: '28px',
              width: 0,
              height: 0,
              borderLeft: '6px solid transparent',
              borderRight: '6px solid transparent',
              borderTop: '6px solid #1E293B',
            }}
          />
        </div>
      )}

      <style>{`
        @keyframes fpb-tooltip-appear {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </>
  );
}
