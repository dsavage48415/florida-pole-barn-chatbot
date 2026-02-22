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
  const [lightboxState, setLightboxState] = useState<{
    images: string[];
    currentIndex: number;
  } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const userMsgRef = useRef<HTMLDivElement>(null);

  // Scroll user's question to the top when they send a new message.
  // Only triggers on messages.length changes (not streaming token updates).
  useEffect(() => {
    if (messages.length > 0 && messages[messages.length - 1]?.role === 'user') {
      setTimeout(() => {
        userMsgRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  }, [messages.length]);

  // Always start fresh — clear any stale history on mount
  useEffect(() => {
    localStorage.removeItem('fpb-chat-history');
  }, []);

  // Build a video URL lookup map from all messages' video sources
  const videoUrlMap = React.useMemo(() => {
    const map: Record<string, string> = {};
    for (const msg of messages) {
      if (msg.videos) {
        for (const v of msg.videos) {
          if (v.tiktok_url) {
            map[v.video_number] = v.tiktok_url;
          }
        }
      }
    }
    return map;
  }, [messages]);

  const handleStartOver = useCallback(() => {
    setMessages([]);
    localStorage.removeItem('fpb-chat-history');
  }, []);

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
              content: `Sorry, I encountered an error: ${errorMessage}. Please try again or call us at (352) 340-0822.`,
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
  const showStartOver = messages.length > 0 && !isStreaming;

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
            <div key={i} ref={msg.role === 'user' ? userMsgRef : undefined}>
              <ChatMessage
                role={msg.role}
                content={msg.content}
                videos={msg.videos}
                videoUrlMap={videoUrlMap}
                onImageClick={(allImages, clickedIndex) => setLightboxState({ images: allImages, currentIndex: clickedIndex })}
              />
            </div>
          ))
        )}

        {isStreaming && messages[messages.length - 1]?.content === '' && <LoadingIndicator />}

        {/* Start Over button */}
        {showStartOver && (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '16px 20px 8px' }}>
            <button
              onClick={handleStartOver}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 20px',
                borderRadius: '20px',
                border: '1px solid #E5E7EB',
                background: '#F9FAFB',
                color: '#6B7280',
                fontSize: '13px',
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                fontFamily: 'inherit',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLButtonElement).style.background = '#F3F4F6';
                (e.currentTarget as HTMLButtonElement).style.borderColor = '#D1D5DB';
                (e.currentTarget as HTMLButtonElement).style.color = '#374151';
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLButtonElement).style.background = '#F9FAFB';
                (e.currentTarget as HTMLButtonElement).style.borderColor = '#E5E7EB';
                (e.currentTarget as HTMLButtonElement).style.color = '#6B7280';
              }}
            >
              <span style={{ fontSize: '14px' }}>🔄</span>
              Start Over
            </button>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <ChatInput onSend={sendMessage} disabled={isStreaming} />

      {lightboxState && (
        <ImageLightbox
          images={lightboxState.images}
          currentIndex={lightboxState.currentIndex}
          onNavigate={(index) => setLightboxState(prev => prev ? { ...prev, currentIndex: index } : null)}
          onClose={() => setLightboxState(null)}
        />
      )}
    </div>
  );
}
