'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Asset, AssetFilters as FilterType } from '../../lib/types';
import { useWorkspace } from '../context/WorkspaceContext';
import AssetFilters from './AssetFilters';
import AssetGrid from './AssetGrid';
import AssetDetailModal from './AssetDetailModal';

// ── AssetsView — Full-page asset gallery ─────────────────────────────────────

export default function AssetsView() {
  const { state, dispatch } = useWorkspace();
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [dbError, setDbError] = useState<string | null>(null);

  const filters = state.assetFilters;

  const fetchAssets = useCallback(async () => {
    setLoading(true);
    setDbError(null);
    try {
      const params = new URLSearchParams();
      if (filters.search) params.set('search', filters.search);
      if (filters.size) params.set('size', filters.size);
      if (filters.visualTone) params.set('visualTone', filters.visualTone);
      if (filters.messagingType) params.set('messagingType', filters.messagingType);

      const res = await fetch(`/api/assets?${params.toString()}`);
      const data = await res.json();

      if (!res.ok) {
        if (res.status === 503) {
          setDbError(data.error || 'Database not configured.');
        } else {
          setDbError(data.error || 'Failed to load assets.');
        }
        dispatch({ type: 'SET_ASSETS', assets: [] });
        setTotalCount(0);
        return;
      }

      dispatch({ type: 'SET_ASSETS', assets: data.assets });
      setTotalCount(data.total);
    } catch {
      setDbError('Failed to connect to the database.');
      dispatch({ type: 'SET_ASSETS', assets: [] });
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }, [filters, dispatch]);

  useEffect(() => {
    fetchAssets();
  }, [fetchAssets]);

  const handleFilterChange = (newFilters: FilterType) => {
    dispatch({ type: 'SET_ASSET_FILTERS', filters: newFilters });
  };

  const handleDeleteAsset = async (id: string) => {
    try {
      await fetch(`/api/assets/${id}`, { method: 'DELETE' });
      dispatch({ type: 'REMOVE_ASSET', id });
      setSelectedAsset(null);
      setTotalCount((c) => c - 1);
    } catch {
      // silently fail
    }
  };

  const handleUpdateAsset = (updated: Asset) => {
    dispatch({ type: 'UPDATE_ASSET', asset: updated });
    setSelectedAsset(updated);
  };

  // Show setup message if DB isn't configured
  if (dbError) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
        }}
      >
        <AssetFilters filters={filters} onChange={handleFilterChange} totalCount={0} />
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            flex: 1,
            padding: '40px',
            color: 'var(--text-muted)',
          }}
        >
          <svg width="48" height="48" viewBox="0 0 16 16" fill="none" style={{ opacity: 0.3, marginBottom: '16px' }}>
            <rect x="2" y="4" width="12" height="9" rx="1" stroke="currentColor" strokeWidth="1.5" />
            <circle cx="8" cy="8.5" r="2" stroke="currentColor" strokeWidth="1.5" />
            <line x1="6" y1="3" x2="6" y2="5" stroke="currentColor" strokeWidth="1.5" />
            <line x1="10" y1="3" x2="10" y2="5" stroke="currentColor" strokeWidth="1.5" />
          </svg>
          <h3 style={{ margin: '0 0 8px', fontSize: '16px', fontWeight: 600, color: 'var(--text-secondary)' }}>
            Database Setup Required
          </h3>
          <p style={{ margin: '0 0 16px', fontSize: '13px', textAlign: 'center', lineHeight: 1.6, maxWidth: '440px' }}>
            To use the Asset Repository, connect a Postgres database in your Vercel dashboard and add the <code style={{ background: 'var(--bg-mid)', padding: '1px 4px', borderRadius: '3px', fontSize: '12px' }}>POSTGRES_URL</code> environment variable.
          </p>
          <div
            style={{
              padding: '12px 16px',
              background: 'var(--bg-darkest)',
              border: '1px solid var(--border)',
              borderRadius: '6px',
              fontSize: '11px',
              color: 'var(--text-muted)',
              maxWidth: '440px',
              lineHeight: 1.5,
            }}
          >
            <strong style={{ color: 'var(--text-secondary)' }}>Steps:</strong><br />
            1. Go to your Vercel project → Storage tab<br />
            2. Create a new Postgres database<br />
            3. Link it to your project<br />
            4. Run the schema from <code style={{ fontSize: '10px' }}>scripts/schema.sql</code><br />
            5. Redeploy
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <AssetFilters filters={filters} onChange={handleFilterChange} totalCount={totalCount} />
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <AssetGrid
          assets={state.assets}
          loading={loading}
          onSelectAsset={setSelectedAsset}
        />
      </div>

      {selectedAsset && (
        <AssetDetailModal
          asset={selectedAsset}
          onClose={() => setSelectedAsset(null)}
          onDelete={handleDeleteAsset}
          onUpdate={handleUpdateAsset}
        />
      )}
    </div>
  );
}
