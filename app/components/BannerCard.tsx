'use client';

import { useCallback } from 'react';
import type { GenerationJob } from '../../lib/types';
import { generateBannerHTML } from '../../lib/banner-template';

// ── Props ────────────────────────────────────────────────────────────────────

interface Props {
  job: GenerationJob;
  isSelected: boolean;
  onSelect: () => void;
}

// ── Component ────────────────────────────────────────────────────────────────

export default function BannerCard({ job, isSelected, onSelect }: Props) {
  const { size, status, config, error } = job;
  const [w, h] = size.split('x').map(Number);

  const html = config ? generateBannerHTML(config) : null;

  const downloadHTML = useCallback(() => {
    if (!html) return;
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `banner-${size}.html`;
    a.click();
    URL.revokeObjectURL(url);
  }, [html, size]);

  // Scale factor to fit the banner inside the card
  const maxCardWidth = 280;
  const maxCardHeight = 200;
  const scale = Math.min(maxCardWidth / w, maxCardHeight / h, 1);

  return (
    <div
      onClick={onSelect}
      style={{
        background: 'var(--bg-dark)',
        border: `1px solid ${isSelected ? 'var(--accent)' : 'var(--border)'}`,
        borderRadius: '8px',
        overflow: 'hidden',
        cursor: 'pointer',
        transition: 'all 0.15s',
        boxShadow: isSelected ? '0 0 0 1px var(--accent)' : 'none',
      }}
    >
      {/* Preview area */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '12px',
          minHeight: '120px',
          background: 'var(--bg-darkest)',
          position: 'relative',
        }}
      >
        {status === 'complete' && html ? (
          <div
            style={{
              width: `${w * scale}px`,
              height: `${h * scale}px`,
              overflow: 'hidden',
              boxShadow: '0 2px 12px rgba(0,0,0,0.4)',
            }}
          >
            <iframe
              srcDoc={html}
              title={`Banner ${size}`}
              style={{
                width: `${w}px`,
                height: `${h}px`,
                border: 'none',
                transform: `scale(${scale})`,
                transformOrigin: 'top left',
                pointerEvents: 'none',
              }}
              sandbox="allow-scripts"
            />
          </div>
        ) : status === 'generating' ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
            <svg width="24" height="24" viewBox="0 0 16 16" fill="none" style={{ animation: 'spin 1s linear infinite' }}>
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
              <circle cx="8" cy="8" r="6" stroke="var(--border-light)" strokeWidth="2" fill="none" />
              <path d="M14 8a6 6 0 0 0-6-6" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Generating...</span>
          </div>
        ) : status === 'error' ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', padding: '8px' }}>
            <svg width="24" height="24" viewBox="0 0 16 16" fill="none">
              <circle cx="8" cy="8" r="7" stroke="#E74C3C" strokeWidth="1.5" fill="none" />
              <path d="M5.5 5.5L10.5 10.5M10.5 5.5L5.5 10.5" stroke="#E74C3C" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            <span style={{ fontSize: '9px', color: '#E74C3C', textAlign: 'center', lineHeight: 1.3 }}>
              {error || 'Generation failed'}
            </span>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Pending...</span>
          </div>
        )}
      </div>

      {/* Footer */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 12px',
          borderTop: '1px solid var(--border)',
        }}
      >
        <div>
          <div
            style={{
              fontSize: '12px',
              fontWeight: 600,
              fontFamily: 'var(--font-geist-mono), monospace',
              color: isSelected ? 'var(--accent)' : 'var(--text-primary)',
            }}
          >
            {size}
          </div>
          <div style={{ fontSize: '9px', color: 'var(--text-muted)', marginTop: '1px' }}>
            {status === 'complete' ? 'Ready' : status === 'generating' ? 'Generating...' : status === 'error' ? 'Failed' : 'Pending'}
          </div>
        </div>

        {status === 'complete' && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              downloadHTML();
            }}
            style={{
              background: 'var(--bg-mid)',
              border: '1px solid var(--border-light)',
              color: 'var(--text-secondary)',
              borderRadius: '4px',
              padding: '3px 8px',
              fontSize: '9px',
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
          >
            Download
          </button>
        )}
      </div>
    </div>
  );
}
