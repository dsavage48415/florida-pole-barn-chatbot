/**
 * Florida Pole Barn Chatbot — Widget Entry Point
 *
 * Supports two embed modes:
 *
 * 1. INLINE EMBED (recommended):
 *    <div id="fpb-chatbot"></div>
 *    <script src="https://florida-pole-barn-chatbot.vercel.app/widget.js" defer
 *            data-fpb-chatbot-embed data-target="fpb-chatbot"></script>
 *
 * 2. FLOATING BUBBLE (legacy):
 *    <script src="https://florida-pole-barn-chatbot.vercel.app/widget.js" defer
 *            data-fpb-chatbot></script>
 *
 * Built as an IIFE bundle by Vite → public/widget.js
 */

import React from 'react';
import { createRoot } from 'react-dom/client';
import ChatWidget from '../components/ChatWidget';

// Widget CSS — injected into shadow DOM
const WIDGET_CSS = `
/* Reset inside shadow DOM */
:host {
  all: initial;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
}

*, *::before, *::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

/* Scrollbar styling */
::-webkit-scrollbar {
  width: 6px;
}
::-webkit-scrollbar-track {
  background: transparent;
}
::-webkit-scrollbar-thumb {
  background: #CBD5E1;
  border-radius: 3px;
}
::-webkit-scrollbar-thumb:hover {
  background: #94A3B8;
}
`;

function getApiBaseUrl(scriptTag: Element | null): string {
  let apiBaseUrl = '';

  if (scriptTag) {
    const src = scriptTag.getAttribute('src');
    if (src) {
      try {
        const url = new URL(src);
        apiBaseUrl = url.origin;
      } catch {
        apiBaseUrl = window.location.origin;
      }
    }

    // Allow override via data attribute
    const customApi = scriptTag.getAttribute('data-api-url');
    if (customApi) {
      apiBaseUrl = customApi;
    }
  }

  return apiBaseUrl;
}

function initInline(scriptTag: Element) {
  const targetId = scriptTag.getAttribute('data-target') || 'fpb-chatbot';
  const height = scriptTag.getAttribute('data-height') || '600px';
  const targetEl = document.getElementById(targetId);

  if (!targetEl) {
    console.error(`[FPB Chatbot] Target element #${targetId} not found`);
    return;
  }

  const apiBaseUrl = getApiBaseUrl(scriptTag);

  // Create shadow DOM for style isolation
  const shadow = targetEl.attachShadow({ mode: 'open' });

  // Inject styles
  const styleSheet = document.createElement('style');
  styleSheet.textContent = WIDGET_CSS;
  shadow.appendChild(styleSheet);

  // Create mount point
  const mountPoint = document.createElement('div');
  mountPoint.id = 'fpb-chatbot-mount';
  shadow.appendChild(mountPoint);

  // Mount React app inline
  const root = createRoot(mountPoint);
  root.render(
    React.createElement(ChatWidget, { apiBaseUrl, height })
  );
}

function initFloating(scriptTag: Element | null) {
  const apiBaseUrl = getApiBaseUrl(scriptTag);

  // Create container element (fixed position for floating mode)
  const container = document.createElement('div');
  container.id = 'fpb-chatbot-root';
  container.style.cssText = 'position: fixed; z-index: 99999; bottom: 0; right: 0;';
  document.body.appendChild(container);

  // Create shadow DOM
  const shadow = container.attachShadow({ mode: 'open' });

  // Inject styles
  const styleSheet = document.createElement('style');
  styleSheet.textContent = WIDGET_CSS;
  shadow.appendChild(styleSheet);

  // Create mount point
  const mountPoint = document.createElement('div');
  mountPoint.id = 'fpb-chatbot-mount';
  shadow.appendChild(mountPoint);

  // Mount React app
  const root = createRoot(mountPoint);
  root.render(
    React.createElement(ChatWidget, { apiBaseUrl })
  );
}

function init() {
  // Check for inline embed mode first
  const inlineScript = document.querySelector('script[data-fpb-chatbot-embed]');
  if (inlineScript) {
    initInline(inlineScript);
    return;
  }

  // Fall back to floating bubble mode (legacy)
  const floatingScript = document.querySelector('script[data-fpb-chatbot]');
  initFloating(floatingScript);
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
