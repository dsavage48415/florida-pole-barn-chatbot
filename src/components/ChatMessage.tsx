'use client';

import React from 'react';
import VideoCard from './VideoCard';
import KeyframeGallery from './KeyframeGallery';
import type { VideoCardData } from '@/lib/types';

interface ChatMessageProps {
  role: 'user' | 'assistant';
  content: string;
  videos?: VideoCardData[];
  onImageClick?: (url: string) => void;
}

/**
 * Render markdown-like content with basic formatting.
 * Handles: bold, bullets, numbered lists, [VIDEO:NNNN] tokens, line breaks.
 */
function renderContent(text: string, videos: VideoCardData[], onImageClick?: (url: string) => void) {
  // Split by [VIDEO:NNNN] tokens
  const parts = text.split(/\[VIDEO:(\d{4})\]/g);
  const elements: React.ReactNode[] = [];

  for (let i = 0; i < parts.length; i++) {
    if (i % 2 === 0) {
      // Text segment — render with basic formatting
      const textPart = parts[i];
      if (textPart) {
        elements.push(
          <span key={`text-${i}`} dangerouslySetInnerHTML={{ __html: formatText(textPart) }} />
        );
      }
    } else {
      // Video number — find matching video and render card
      const videoNum = parts[i];
      const video = videos.find(v => v.video_number === videoNum);
      if (video) {
        elements.push(
          <div key={`video-${i}`}>
            <VideoCard
              videoNumber={video.video_number}
              caption={video.caption}
              tiktokUrl={video.tiktok_url}
              thumbnailUrl={video.thumbnail_url}
            />
            {video.keyframe_urls.length > 0 && (
              <KeyframeGallery
                images={video.keyframe_urls}
                videoNumber={video.video_number}
                onImageClick={onImageClick}
              />
            )}
          </div>
        );
      } else {
        // Video not found in sources — show as text reference
        elements.push(
          <span key={`ref-${i}`} style={{ color: '#046BD2', fontWeight: 600 }}>
            Video #{videoNum}
          </span>
        );
      }
    }
  }

  return elements;
}

/**
 * Basic text formatting: bold, line breaks, bullet points.
 */
function formatText(text: string): string {
  return text
    // Bold
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    // Line breaks
    .replace(/\n/g, '<br/>');
}

export default function ChatMessage({ role, content, videos = [], onImageClick }: ChatMessageProps) {
  const isUser = role === 'user';

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: isUser ? 'flex-end' : 'flex-start',
        padding: '4px 16px',
      }}
    >
      {/* Avatar + bubble */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          maxWidth: '90%',
          flexDirection: isUser ? 'row-reverse' : 'row',
          alignItems: 'flex-start',
        }}
      >
        {!isUser && (
          <div
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              background: '#046BD2',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFF',
              fontSize: '14px',
              flexShrink: 0,
              marginTop: '2px',
            }}
          >
            🏗️
          </div>
        )}

        <div
          style={{
            background: isUser ? '#046BD2' : '#F0F5FA',
            color: isUser ? '#FFFFFF' : '#334155',
            borderRadius: isUser ? '12px 12px 4px 12px' : '12px 12px 12px 4px',
            padding: '10px 14px',
            fontSize: '13.5px',
            lineHeight: '1.5',
            wordBreak: 'break-word',
          }}
        >
          {isUser ? content : renderContent(content, videos, onImageClick)}
        </div>
      </div>
    </div>
  );
}
