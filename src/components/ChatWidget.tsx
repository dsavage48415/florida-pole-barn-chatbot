'use client';

import React from 'react';
import ChatWindow from './ChatWindow';

interface ChatWidgetProps {
  apiBaseUrl?: string;
  height?: string;
}

/**
 * Inline chat widget — renders ChatWindow directly as an inline block.
 * No floating bubble, no popover. Designed to be embedded into page content.
 */
export default function ChatWidget({ apiBaseUrl = '', height = '600px' }: ChatWidgetProps) {
  return (
    <div
      style={{
        width: '100%',
        maxWidth: '900px',
        height,
        margin: '0 auto',
        position: 'relative',
      }}
    >
      <ChatWindow apiBaseUrl={apiBaseUrl} />
    </div>
  );
}
