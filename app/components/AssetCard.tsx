'use client';

import type { Asset } from '../../lib/types';

interface Props {
  asset: Asset;
  onSelect: () => void;
}

export default function AssetCard({ asset, onSelect }: Props) {
  const sizeLabel = asset.config.size.preset || `${asset.config.size.width}x${asset.config.size.height}`;
  const { width: w, height: h } = asset.config.size;
  const scale = Math.min(240 / w, 160 / h, 1);

  return (
    <div
      onClick={onSelect}
      style={{
        background: 'var(--bg-dark)',
        border: '1px solid var(--border)',
        borderRadius: '8px',
        overflow: 'hidden',
        cursor: 'pointer',
        transition: 'all 0.15s',
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--accent)';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--border)';
      }}
    >
      {/* Thumbnail / Preview */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '12px',
          minHeight: '120px',
          background: 'var(--bg-darkest)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: `${w * scale}px`,
            height: `${h * scale}px`,
            overflow: 'hidden',
            boxShadow: '0 2px 12px rgba(0,0,0,0.4)',
          }}
        >
          <iframe
            srcDoc={asset.html}
            title={asset.name}
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
      </div>

      {/* Info footer */}
      <div
        style={{
          padding: '10px 12px',
          borderTop: '1px solid var(--border)',
        }}
      >
        <div
          style={{
            fontSize: '12px',
            fontWeight: 600,
            color: 'var(--text-primary)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            marginBottom: '4px',
          }}
        >
          {asset.name}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
          {/* Size badge */}
          <span
            style={{
              fontSize: '10px',
              fontFamily: 'var(--font-geist-mono), monospace',
              color: 'var(--accent)',
              background: 'var(--accent-dim)',
              padding: '2px 6px',
              borderRadius: '3px',
            }}
          >
            {sizeLabel}
          </span>

          {/* Messaging type badge */}
          <span
            style={{
              fontSize: '10px',
              color: 'var(--text-muted)',
              background: 'var(--bg-mid)',
              padding: '2px 6px',
              borderRadius: '3px',
              textTransform: 'capitalize',
            }}
          >
            {asset.metadata.messagingType}
          </span>

          {/* Tone */}
          <span style={{ fontSize: '9px', color: 'var(--text-muted)' }}>
            {asset.metadata.visualTone}
          </span>
        </div>

        <div style={{ fontSize: '9px', color: 'var(--text-muted)', marginTop: '4px' }}>
          {new Date(asset.createdAt).toLocaleDateString()}
        </div>
      </div>
    </div>
  );
}
