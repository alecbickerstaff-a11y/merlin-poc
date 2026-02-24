'use client';

import { useState } from 'react';
import type { Asset } from '../../lib/types';
import { useWorkspace } from '../context/WorkspaceContext';

interface Props {
  asset: Asset;
  onClose: () => void;
  onDelete: (id: string) => void;
  onUpdate: (asset: Asset) => void;
}

export default function AssetDetailModal({ asset, onClose, onDelete, onUpdate }: Props) {
  const { dispatch } = useWorkspace();
  const [name, setName] = useState(asset.name);
  const [tags, setTags] = useState(asset.metadata.tags.join(', '));
  const [saving, setSaving] = useState(false);

  const sizeLabel = asset.config.size.preset || `${asset.config.size.width}x${asset.config.size.height}`;
  const { width: w, height: h } = asset.config.size;
  const scale = Math.min(400 / w, 300 / h, 1);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/assets/${asset.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          metadata: {
            ...asset.metadata,
            tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
          },
        }),
      });
      if (res.ok) {
        const updated = await res.json();
        onUpdate(updated);
      }
    } catch {
      // silently fail for now
    } finally {
      setSaving(false);
    }
  };

  const handleLoadIntoEditor = () => {
    dispatch({ type: 'SET_EDITOR_CONFIG', config: asset.config });
    dispatch({ type: 'SET_VIEW', view: 'editor' });
    onClose();
  };

  const handleDownload = () => {
    const blob = new Blob([asset.html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${asset.name.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '20px',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        style={{
          background: 'var(--bg-dark)',
          border: '1px solid var(--border)',
          borderRadius: '12px',
          width: '100%',
          maxWidth: '720px',
          maxHeight: '90vh',
          overflow: 'auto',
          boxShadow: '0 24px 48px rgba(0,0,0,0.5)',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 20px',
            borderBottom: '1px solid var(--border)',
          }}
        >
          <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>
            Asset Detail
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              fontSize: '18px',
              padding: '4px',
            }}
          >
            ✕
          </button>
        </div>

        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Preview */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '16px',
              background: 'var(--bg-darkest)',
              borderRadius: '8px',
              border: '1px solid var(--border)',
            }}
          >
            <div
              style={{
                width: `${w * scale}px`,
                height: `${h * scale}px`,
                overflow: 'hidden',
                boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
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

          {/* Name */}
          <div>
            <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 600, marginBottom: '4px' }}>
              Name
            </label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} />
          </div>

          {/* Metadata grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <MetaField label="Size" value={sizeLabel} />
            <MetaField label="Visual Tone" value={asset.metadata.visualTone} />
            <MetaField label="Messaging Type" value={asset.metadata.messagingType} />
            <MetaField label="Source" value={asset.metadata.generationSource === 'ai' ? 'AI Generated' : 'Manual'} />
            <MetaField label="Created" value={new Date(asset.createdAt).toLocaleString()} />
            <MetaField label="ISI Hash" value={asset.metadata.isiVersionHash?.slice(0, 12) + '...' || 'N/A'} mono />
          </div>

          {/* Claims */}
          {asset.metadata.claimsUsed.length > 0 && (
            <div>
              <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 600, marginBottom: '6px' }}>
                Claims Used
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                {asset.metadata.claimsUsed.map((claim) => (
                  <span
                    key={claim}
                    style={{
                      fontSize: '10px',
                      background: 'rgba(46, 134, 193, 0.15)',
                      color: '#2E86C1',
                      padding: '3px 8px',
                      borderRadius: '3px',
                      border: '1px solid rgba(46, 134, 193, 0.3)',
                    }}
                  >
                    {claim}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Imagery Descriptors */}
          {asset.metadata.imageryDescriptors.length > 0 && (
            <div>
              <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 600, marginBottom: '6px' }}>
                Imagery Descriptors
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                {asset.metadata.imageryDescriptors.map((desc) => (
                  <span
                    key={desc}
                    style={{
                      fontSize: '10px',
                      background: 'var(--bg-mid)',
                      color: 'var(--text-secondary)',
                      padding: '3px 8px',
                      borderRadius: '3px',
                      border: '1px solid var(--border)',
                    }}
                  >
                    {desc}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Tags */}
          <div>
            <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 600, marginBottom: '4px' }}>
              Tags (comma-separated)
            </label>
            <input type="text" value={tags} onChange={(e) => setTags(e.target.value)} placeholder="e.g., Q1 campaign, HCP, print-ready" />
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', paddingTop: '4px' }}>
            <button className="action-btn primary" onClick={handleLoadIntoEditor}>
              Load into Editor
            </button>
            <button className="action-btn" onClick={handleDownload}>
              Download HTML
            </button>
            <button className="action-btn" onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
            <button
              onClick={() => { if (confirm('Delete this asset?')) onDelete(asset.id); }}
              style={{
                marginLeft: 'auto',
                background: 'none',
                border: '1px solid rgba(231,76,60,0.4)',
                color: '#E74C3C',
                borderRadius: '4px',
                padding: '6px 14px',
                fontSize: '11px',
                cursor: 'pointer',
              }}
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function MetaField({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: '2px' }}>{label}</div>
      <div
        style={{
          fontSize: '12px',
          color: 'var(--text-primary)',
          fontFamily: mono ? 'var(--font-geist-mono), monospace' : 'inherit',
          textTransform: label === 'Messaging Type' ? 'capitalize' : 'none',
        }}
      >
        {value}
      </div>
    </div>
  );
}
