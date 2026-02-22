'use client';

import React from 'react';

interface KeyframeGalleryProps {
  images: string[];
  videoNumber: string;
  allImages?: string[];   // flat array of all medium URLs across all videos in the response
  startIndex?: number;    // offset of this gallery's images within allImages
  onImageClick?: (allImages: string[], clickedIndex: number) => void;
}

export default function KeyframeGallery({ images, videoNumber, allImages, startIndex = 0, onImageClick }: KeyframeGalleryProps) {
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
          onClick={() => {
            if (allImages && onImageClick) {
              onImageClick(allImages, startIndex + i);
            }
          }}
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
