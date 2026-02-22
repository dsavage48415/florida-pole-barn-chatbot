/**
 * Florida Pole Barn Chatbot — Widget Entry Point
 *
 * This file creates a self-mounting chatbot widget using Shadow DOM
 * for complete style isolation from the host page (WordPress).
 *
 * Built as an IIFE bundle by Vite → public/widget.js
 *
 * Usage on any page:
 * <script src="https://fpb-chatbot.vercel.app/widget.js" defer data-fpb-chatbot></script>
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

function init() {
  // Find the script tag to get the API base URL
  const scriptTag = document.querySelector('script[data-fpb-chatbot]');
  let apiBaseUrl = '';

  if (scriptTag) {
    const src = scriptTag.getAttribute('src');
    if (src) {
      try {
        const url = new URL(src);
        apiBaseUrl = url.origin;
      } catch {
        // If relative URL, use current origin
        apiBaseUrl = window.location.origin;
      }
    }

    // Allow override via data attribute
    const customApi = scriptTag.getAttribute('data-api-url');
    if (customApi) {
      apiBaseUrl = customApi;
    }
  }

  // Create container element
  const container = document.createElement('div');
  container.id = 'fpb-chatbot-root';
  container.style.cssText = 'position: fixed; z-index: 99999; bottom: 0; right: 0;';
  document.body.appendChild(container);

  // Create shadow DOM for style isolation
  const shadow = container.attachShadow({ mode: 'open' });

  // Inject styles into shadow DOM
  const styleSheet = document.createElement('style');
  styleSheet.textContent = WIDGET_CSS;
  shadow.appendChild(styleSheet);

  // Create mount point inside shadow DOM
  const mountPoint = document.createElement('div');
  mountPoint.id = 'fpb-chatbot-mount';
  shadow.appendChild(mountPoint);

  // Mount React app
  const root = createRoot(mountPoint);
  root.render(
    React.createElement(ChatWidget, { apiBaseUrl })
  );
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
