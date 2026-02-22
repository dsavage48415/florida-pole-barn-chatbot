'use client';

import React from 'react';
import VideoCard from './VideoCard';
import KeyframeGallery from './KeyframeGallery';
import type { VideoCardData } from '@/lib/types';

interface ChatMessageProps {
  role: 'user' | 'assistant';
  content: string;
  videos?: VideoCardData[];
  videoUrlMap?: Record<string, string>;
  onImageClick?: (allImages: string[], clickedIndex: number) => void;
}

/**
 * Render markdown-like content with basic formatting.
 * Handles: bold, bullets, numbered lists, [VIDEO:NNNN] tokens, line breaks.
 */
function renderContent(
  text: string,
  videos: VideoCardData[],
  videoUrlMap: Record<string, string>,
  onImageClick?: (allImages: string[], clickedIndex: number) => void
) {
  // Build a flat array of ALL medium-resolution keyframe URLs across all videos
  // so the gallery lightbox can navigate through every image in the response.
  const allMediumImages: string[] = [];
  const videoStartIndices: Record<string, number> = {};
  for (const v of videos) {
    videoStartIndices[v.video_number] = allMediumImages.length;
    for (const url of v.keyframe_urls) {
      allMediumImages.push(url.replace('_thumb', '_medium'));
    }
  }

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
        const startIndex = videoStartIndices[video.video_number] ?? 0;
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
                allImages={allMediumImages}
                startIndex={startIndex}
                onImageClick={onImageClick}
              />
            )}
          </div>
        );
      } else {
        // Video not found in sources — render as clickable link if we have a URL
        const tiktokUrl = videoUrlMap[videoNum] || '';
        if (tiktokUrl) {
          elements.push(
            <a
              key={`ref-${i}`}
              href={tiktokUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                color: '#C9232A',
                fontWeight: 600,
                textDecoration: 'none',
                borderBottom: '1px solid rgba(201, 35, 42, 0.3)',
              }}
            >
              Video #{videoNum}
            </a>
          );
        } else {
          // No URL available — link to FloGrown TikTok profile as fallback
          elements.push(
            <a
              key={`ref-${i}`}
              href="https://www.tiktok.com/@floydfonck"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                color: '#C9232A',
                fontWeight: 600,
                textDecoration: 'none',
                borderBottom: '1px solid rgba(201, 35, 42, 0.3)',
              }}
            >
              Video #{videoNum}
            </a>
          );
        }
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

export default function ChatMessage({
  role,
  content,
  videos = [],
  videoUrlMap = {},
  onImageClick,
}: ChatMessageProps) {
  const isUser = role === 'user';

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: isUser ? 'flex-end' : 'flex-start',
        padding: '6px 20px',
      }}
    >
      {/* Avatar + bubble */}
      <div
        style={{
          display: 'flex',
          gap: '10px',
          maxWidth: '85%',
          flexDirection: isUser ? 'row-reverse' : 'row',
          alignItems: 'flex-start',
        }}
      >
        {/* Avatar */}
        <div
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            background: isUser ? '#E2E8F0' : '#C9232A',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: isUser ? '#64748B' : '#FFF',
            fontSize: isUser ? '14px' : '16px',
            flexShrink: 0,
            marginTop: '2px',
          }}
        >
          {isUser ? (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          ) : (
            '🏗️'
          )}
        </div>

        <div
          style={{
            background: isUser ? '#C9232A' : '#F7F7F8',
            color: isUser ? '#FFFFFF' : '#1A1A1A',
            borderRadius: isUser ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
            padding: '12px 16px',
            fontSize: '14px',
            lineHeight: '1.6',
            wordBreak: 'break-word',
          }}
        >
          {isUser ? content : renderContent(content, videos, videoUrlMap, onImageClick)}
        </div>
      </div>
    </div>
  );
}
