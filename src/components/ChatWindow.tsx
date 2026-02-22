'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import BrandHeader from './BrandHeader';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';
import SuggestedQuestions from './SuggestedQuestions';
import LoadingIndicator from './LoadingIndicator';
import ImageLightbox from './ImageLightbox';
import type { VideoCardData, SSEEvent } from '@/lib/types';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  videos?: VideoCardData[];
}

interface ChatWindowProps {
  apiBaseUrl: string;
}

export default function ChatWindow({ apiBaseUrl }: ChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Load conversation history from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('fpb-chat-history');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setMessages(parsed.slice(-20)); // Keep last 20 messages
        }
      }
    } catch {
      // Ignore parse errors
    }
  }, []);

  // Save conversation history
  useEffect(() => {
    if (messages.length > 0) {
      try {
        // Only save text content, not video data (to keep localStorage small)
        const toSave = messages.map(m => ({
          role: m.role,
          content: m.content,
        }));
        localStorage.setItem('fpb-chat-history', JSON.stringify(toSave));
      } catch {
        // Ignore storage errors
      }
    }
  }, [messages]);

  const sendMessage = useCallback(
    async (text: string) => {
      if (isStreaming) return;

      // Add user message
      const userMsg: Message = { role: 'user', content: text };
      setMessages(prev => [...prev, userMsg]);
      setIsStreaming(true);

      try {
        // Build history for the API (text only, last 6 messages)
        const history = messages.slice(-6).map(m => ({
          role: m.role as 'user' | 'assistant',
          content: m.content,
        }));

        const response = await fetch(`${apiBaseUrl}/api/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: text, history }),
        });

        if (!response.ok) {
          const error = await response.json().catch(() => ({ error: 'Unknown error' }));
          throw new Error(error.error || `HTTP ${response.status}`);
        }

        if (!response.body) throw new Error('No response body');

        // Read the SSE stream
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        let assistantContent = '';
        let videos: VideoCardData[] = [];

        // Add placeholder assistant message
        setMessages(prev => [...prev, { role: 'assistant', content: '', videos: [] }]);

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed.startsWith('data: ')) continue;

            try {
              const event: SSEEvent = JSON.parse(trimmed.slice(6));

              if (event.type === 'sources' && event.sources) {
                videos = event.sources.videos || [];
              } else if (event.type === 'token' && event.content) {
                assistantContent += event.content;
                // Update the last message with accumulated content
                setMessages(prev => {
                  const updated = [...prev];
                  const lastIdx = updated.length - 1;
                  updated[lastIdx] = {
                    role: 'assistant',
                    content: assistantContent,
                    videos,
                  };
                  return updated;
                });
              } else if (event.type === 'error') {
                throw new Error(event.error || 'Stream error');
              }
            } catch (parseError) {
              // Skip malformed SSE lines
              if (parseError instanceof Error && parseError.message !== 'Stream error') {
                continue;
              }
              throw parseError;
            }
          }
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Something went wrong. Please try again.';

        setMessages(prev => {
          // Remove the empty placeholder if it exists, add error message
          const filtered = prev.filter(m => !(m.role === 'assistant' && m.content === ''));
          return [
            ...filtered,
            {
              role: 'assistant',
              content: `Sorry, I encountered an error: ${errorMessage}. Please try again or call us at (352) 585-8831.`,
            },
          ];
        });
      } finally {
        setIsStreaming(false);
      }
    },
    [messages, isStreaming, apiBaseUrl]
  );

  const showSuggestions = messages.length === 0 && !isStreaming;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        background: '#FFFFFF',
        borderRadius: '16px',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08), 0 4px 24px rgba(0, 0, 0, 0.06)',
        overflow: 'hidden',
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        border: '1px solid #E5E7EB',
      }}
    >
      <BrandHeader />

      {/* Messages area */}
      <div
        ref={scrollContainerRef}
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '8px 0',
          background: '#FFFFFF',
        }}
      >
        {showSuggestions ? (
          <div>
            <div
              style={{
                padding: '28px 20px 12px',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: '40px', marginBottom: '12px' }}>🏗️</div>
              <div style={{ fontSize: '18px', fontWeight: 600, color: '#111827' }}>
                Welcome to Ask Florida Pole Barn!
              </div>
              <div
                style={{ fontSize: '14px', color: '#6B7280', marginTop: '6px', lineHeight: '1.5' }}
              >
                Get expert advice from 1,860+ pole barn construction videos.
              </div>
            </div>
            <SuggestedQuestions onSelect={sendMessage} />
          </div>
        ) : (
          messages.map((msg, i) => (
            <ChatMessage
              key={i}
              role={msg.role}
              content={msg.content}
              videos={msg.videos}
              onImageClick={url => setLightboxImage(url)}
            />
          ))
        )}

        {isStreaming && messages[messages.length - 1]?.content === '' && <LoadingIndicator />}
        <div ref={messagesEndRef} />
      </div>

      <ChatInput onSend={sendMessage} disabled={isStreaming} />

      {lightboxImage && (
        <ImageLightbox imageUrl={lightboxImage} onClose={() => setLightboxImage(null)} />
      )}
    </div>
  );
}
