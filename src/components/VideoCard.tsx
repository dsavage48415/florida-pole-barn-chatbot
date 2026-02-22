'use client';

import React from 'react';

interface VideoCardProps {
  videoNumber: string;
  caption: string;
  tiktokUrl: string;
  thumbnailUrl: string;
}

export default function VideoCard({ videoNumber, caption, tiktokUrl, thumbnailUrl }: VideoCardProps) {
  return (
    <div
      style={{
        display: 'flex',
        gap: '10px',
        padding: '10px',
        background: '#FFFFFF',
        border: '1px solid #E2E8F0',
        borderRadius: '10px',
        marginTop: '8px',
        alignItems: 'center',
      }}
    >
      {/* Thumbnail */}
      <div
        style={{
          width: '70px',
          height: '70px',
          borderRadius: '8px',
          overflow: 'hidden',
          flexShrink: 0,
          background: '#F0F5FA',
        }}
      >
        {thumbnailUrl ? (
          <img
            src={thumbnailUrl}
            alt={`Video #${videoNumber}`}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
            loading="lazy"
          />
        ) : (
          <div
            style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#94A3B8',
              fontSize: '24px',
            }}
          >
            🎬
          </div>
        )}
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: '12px',
            color: '#64748B',
            marginBottom: '2px',
          }}
        >
          Video #{videoNumber}
        </div>
        <div
          style={{
            fontSize: '13px',
            color: '#334155',
            lineHeight: '1.3',
            overflow: 'hidden',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
          }}
        >
          {caption}
        </div>
        {tiktokUrl && (
          <a
            href={tiktokUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-block',
              marginTop: '6px',
              fontSize: '11px',
              color: '#046BD2',
              textDecoration: 'none',
              fontWeight: 600,
              padding: '3px 8px',
              background: '#F0F5FA',
              borderRadius: '6px',
            }}
          >
            ▶ Watch on TikTok
          </a>
        )}
      </div>
    </div>
  );
}
