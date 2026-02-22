'use client';

import React from 'react';

interface KeyframeGalleryProps {
  images: string[];
  videoNumber: string;
  onImageClick?: (url: string) => void;
}

export default function KeyframeGallery({ images, videoNumber, onImageClick }: KeyframeGalleryProps) {
  if (!images || images.length === 0) return null;

  return (
    <div
      style={{
        display: 'flex',
        gap: '6px',
        overflowX: 'auto',
        padding: '6px 0',
        marginTop: '4px',
      }}
    >
      {images.map((url, i) => (
        <div
          key={i}
          onClick={() => onImageClick?.(url.replace('_thumb', '_medium'))}
          style={{
            width: '80px',
            height: '80px',
            borderRadius: '8px',
            overflow: 'hidden',
            flexShrink: 0,
            cursor: onImageClick ? 'pointer' : 'default',
            border: '1px solid #E2E8F0',
          }}
        >
          <img
            src={url}
            alt={`Video #${videoNumber} keyframe ${i + 1}`}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
            loading="lazy"
          />
        </div>
      ))}
    </div>
  );
}
