'use client';

import React, { useEffect, useCallback } from 'react';

interface ImageLightboxProps {
  images: string[];
  currentIndex: number;
  onNavigate: (index: number) => void;
  onClose: () => void;
}

export default function ImageLightbox({ images, currentIndex, onNavigate, onClose }: ImageLightboxProps) {
  const isFirst = currentIndex <= 0;
  const isLast = currentIndex >= images.length - 1;

  const goPrev = useCallback(
    (e: React.MouseEvent | KeyboardEvent) => {
      e.stopPropagation();
      if (!isFirst) onNavigate(currentIndex - 1);
    },
    [currentIndex, isFirst, onNavigate]
  );

  const goNext = useCallback(
    (e: React.MouseEvent | KeyboardEvent) => {
      e.stopPropagation();
      if (!isLast) onNavigate(currentIndex + 1);
    },
    [currentIndex, isLast, onNavigate]
  );

  // Keyboard navigation
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' && !isFirst) {
        goPrev(e);
      } else if (e.key === 'ArrowRight' && !isLast) {
        goNext(e);
      } else if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [goPrev, goNext, isFirst, isLast, onClose]);

  const arrowButtonStyle: React.CSSProperties = {
    position: 'absolute',
    top: '50%',
    transform: 'translateY(-50%)',
    background: 'rgba(255, 255, 255, 0.15)',
    border: 'none',
    color: '#FFF',
    fontSize: '28px',
    fontWeight: 300,
    cursor: 'pointer',
    width: '48px',
    height: '48px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'background 0.2s ease',
    zIndex: 2,
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.85)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100000,
        cursor: 'pointer',
      }}
    >
      {/* Close button */}
      <button
        onClick={onClose}
        style={{
          position: 'absolute',
          top: '16px',
          right: '16px',
          background: 'rgba(255,255,255,0.2)',
          border: 'none',
          color: '#FFF',
          fontSize: '24px',
          cursor: 'pointer',
          width: '40px',
          height: '40px',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 3,
        }}
        aria-label="Close image"
      >
        ✕
      </button>

      {/* Left arrow */}
      {!isFirst && (
        <button
          onClick={(e) => goPrev(e)}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.3)'; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.15)'; }}
          style={{ ...arrowButtonStyle, left: '16px' }}
          aria-label="Previous image"
        >
          ‹
        </button>
      )}

      {/* Right arrow */}
      {!isLast && (
        <button
          onClick={(e) => goNext(e)}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.3)'; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.15)'; }}
          style={{ ...arrowButtonStyle, right: '16px' }}
          aria-label="Next image"
        >
          ›
        </button>
      )}

      {/* Image */}
      <img
        src={images[currentIndex]}
        alt={`Image ${currentIndex + 1} of ${images.length}`}
        onClick={e => e.stopPropagation()}
        style={{
          maxWidth: '85vw',
          maxHeight: '85vh',
          objectFit: 'contain',
          borderRadius: '8px',
          cursor: 'default',
        }}
      />

      {/* Counter */}
      {images.length > 1 && (
        <div
          onClick={e => e.stopPropagation()}
          style={{
            position: 'absolute',
            bottom: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            color: '#FFF',
            fontSize: '14px',
            fontWeight: 500,
            textShadow: '0 1px 4px rgba(0,0,0,0.6)',
            background: 'rgba(0, 0, 0, 0.4)',
            padding: '6px 16px',
            borderRadius: '20px',
            zIndex: 2,
          }}
        >
          {currentIndex + 1} of {images.length}
        </div>
      )}
    </div>
  );
}
