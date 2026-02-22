'use client';

import React, { useState, useRef } from 'react';

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
}

export default function ChatInput({ onSend, disabled = false }: ChatInputProps) {
  const [input, setInput] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || disabled) return;

    onSend(trimmed);
    setInput('');
    inputRef.current?.focus();
  };

  const canSend = !disabled && input.trim().length > 0;

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        display: 'flex',
        gap: '10px',
        padding: '14px 20px 16px',
        borderTop: '1px solid #E5E7EB',
        background: '#FFFFFF',
        flexShrink: 0,
        alignItems: 'center',
      }}
    >
      <input
        ref={inputRef}
        type="text"
        value={input}
        onChange={e => setInput(e.target.value)}
        placeholder={disabled ? 'Thinking...' : 'Ask about pole barn construction...'}
        disabled={disabled}
        style={{
          flex: 1,
          border: '1.5px solid #E5E7EB',
          borderRadius: '24px',
          padding: '12px 20px',
          fontSize: '14px',
          outline: 'none',
          color: '#1A1A1A',
          background: disabled ? '#F9FAFB' : '#FFFFFF',
          fontFamily: 'inherit',
          transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
        }}
        onFocus={e => {
          (e.target as HTMLInputElement).style.borderColor = '#046BD2';
          (e.target as HTMLInputElement).style.boxShadow = '0 0 0 3px rgba(4, 107, 210, 0.1)';
        }}
        onBlur={e => {
          (e.target as HTMLInputElement).style.borderColor = '#E5E7EB';
          (e.target as HTMLInputElement).style.boxShadow = 'none';
        }}
      />
      <button
        type="submit"
        disabled={!canSend}
        style={{
          width: '40px',
          height: '40px',
          borderRadius: '50%',
          background: canSend ? '#046BD2' : '#D1D5DB',
          border: 'none',
          cursor: canSend ? 'pointer' : 'not-allowed',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          transition: 'background 0.15s ease, transform 0.1s ease',
        }}
        onMouseEnter={e => {
          if (canSend) {
            (e.currentTarget as HTMLButtonElement).style.background = '#0356A8';
            (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.05)';
          }
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLButtonElement).style.background = canSend ? '#046BD2' : '#D1D5DB';
          (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)';
        }}
        aria-label="Send message"
      >
        {/* Arrow-up send icon */}
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#FFFFFF"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="12" y1="19" x2="12" y2="5" />
          <polyline points="5 12 12 5 19 12" />
        </svg>
      </button>
    </form>
  );
}
