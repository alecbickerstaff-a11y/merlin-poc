'use client';

import type { Asset } from '../../lib/types';
import AssetCard from './AssetCard';

interface Props {
  assets: Asset[];
  loading: boolean;
  onSelectAsset: (asset: Asset) => void;
}

export default function AssetGrid({ assets, loading, onSelectAsset }: Props) {
  if (loading) {
    return (
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
          gap: '16px',
          padding: '20px',
        }}
      >
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            style={{
              background: 'var(--bg-dark)',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              height: '220px',
              animation: 'pulse 1.5s ease-in-out infinite',
            }}
          />
        ))}
        <style>{`
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
          }
        `}</style>
      </div>
    );
  }

  if (assets.length === 0) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          minHeight: '300px',
          color: 'var(--text-muted)',
          userSelect: 'none',
          padding: '40px',
        }}
      >
        <svg width="48" height="48" viewBox="0 0 16 16" fill="none" style={{ opacity: 0.3, marginBottom: '16px' }}>
          <rect x="1" y="1" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5" />
          <rect x="9" y="1" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5" />
          <rect x="1" y="9" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5" />
          <rect x="9" y="9" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5" />
        </svg>
        <h3 style={{ margin: '0 0 8px', fontSize: '16px', fontWeight: 600, color: 'var(--text-secondary)' }}>
          No assets yet
        </h3>
        <p style={{ margin: 0, fontSize: '13px', textAlign: 'center', lineHeight: 1.5, maxWidth: '360px' }}>
          Generate a banner in the Editor and click &ldquo;Save to Assets&rdquo; to start building your creative library.
        </p>
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
        gap: '16px',
        padding: '20px',
        overflowY: 'auto',
        height: '100%',
        alignContent: 'start',
      }}
    >
      {assets.map((asset) => (
        <AssetCard key={asset.id} asset={asset} onSelect={() => onSelectAsset(asset)} />
      ))}
    </div>
  );
}
