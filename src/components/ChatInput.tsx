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

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        display: 'flex',
        gap: '8px',
        padding: '12px 16px',
        borderTop: '1px solid #E2E8F0',
        background: '#FFFFFF',
        borderRadius: '0 0 12px 12px',
        flexShrink: 0,
      }}
    >
      <input
        ref={inputRef}
        type="text"
        value={input}
        onChange={e => setInput(e.target.value)}
        placeholder={disabled ? 'Thinking...' : 'Ask about pole barns...'}
        disabled={disabled}
        style={{
          flex: 1,
          border: '1px solid #E2E8F0',
          borderRadius: '8px',
          padding: '10px 14px',
          fontSize: '14px',
          outline: 'none',
          color: '#334155',
          background: disabled ? '#F8FAFC' : '#FFFFFF',
          fontFamily: 'inherit',
        }}
        onFocus={e => {
          (e.target as HTMLInputElement).style.borderColor = '#046BD2';
        }}
        onBlur={e => {
          (e.target as HTMLInputElement).style.borderColor = '#E2E8F0';
        }}
      />
      <button
        type="submit"
        disabled={disabled || !input.trim()}
        style={{
          background: disabled || !input.trim() ? '#94A3B8' : '#046BD2',
          color: '#FFFFFF',
          border: 'none',
          borderRadius: '8px',
          padding: '10px 16px',
          fontSize: '14px',
          cursor: disabled || !input.trim() ? 'not-allowed' : 'pointer',
          fontWeight: 600,
          transition: 'background 0.15s ease',
          flexShrink: 0,
        }}
        aria-label="Send message"
      >
        Send
      </button>
    </form>
  );
}
