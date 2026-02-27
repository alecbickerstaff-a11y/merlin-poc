'use client';

import { useState, useCallback } from 'react';
import type { Asset, AssetMetadata } from '../../lib/types';
import { useWorkspace } from '../context/WorkspaceContext';

interface Props {
  asset: Asset;
  onClose: () => void;
  onDelete: (id: string) => void;
  onUpdate: (asset: Asset) => void;
}

const MESSAGING_TYPES: AssetMetadata['messagingType'][] = [
  'efficacy',
  'awareness',
  'brand',
  'hcp',
  'other',
];

const AVAILABLE_DESCRIPTORS = [
  'woman patient',
  'man patient',
  'outdoor',
  'indoor',
  'golden hour',
  'active lifestyle',
  'family',
  'clinical setting',
  'hopeful',
  'calm',
];

export default function AssetDetailModal({ asset, onClose, onDelete, onUpdate }: Props) {
  const { dispatch } = useWorkspace();
  const [name, setName] = useState(asset.name);
  const [tags, setTags] = useState(asset.metadata.tags.join(', '));
  const [messagingType, setMessagingType] = useState<AssetMetadata['messagingType']>(asset.metadata.messagingType);
  const [visualTone, setVisualTone] = useState(asset.metadata.visualTone);
  const [imageryDescriptors, setImageryDescriptors] = useState<string[]>([...asset.metadata.imageryDescriptors]);
  const [newDescriptor, setNewDescriptor] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saved' | 'error'>('idle');

  const sizeLabel = asset.config.size.preset || `${asset.config.size.width}x${asset.config.size.height}`;
  const { width: w, height: h } = asset.config.size;
  const scale = Math.min(400 / w, 300 / h, 1);

  const addDescriptor = useCallback((desc: string) => {
    const trimmed = desc.trim().toLowerCase();
    if (trimmed && !imageryDescriptors.includes(trimmed)) {
      setImageryDescriptors((prev) => [...prev, trimmed]);
    }
    setNewDescriptor('');
  }, [imageryDescriptors]);

  const removeDescriptor = useCallback((desc: string) => {
    setImageryDescriptors((prev) => prev.filter((d) => d !== desc));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setSaveStatus('idle');
    try {
      const updatedMetadata: AssetMetadata = {
        ...asset.metadata,
        tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
        messagingType,
        visualTone,
        imageryDescriptors,
      };

      const res = await fetch(`/api/assets/${asset.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          metadata: updatedMetadata,
        }),
      });
      if (res.ok) {
        const updated = await res.json();
        onUpdate(updated);
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2000);
      } else {
        setSaveStatus('error');
        setTimeout(() => setSaveStatus('idle'), 3000);
      }
    } catch {
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
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

  // Descriptors available to add (not already selected)
  const availableToAdd = AVAILABLE_DESCRIPTORS.filter((d) => !imageryDescriptors.includes(d));

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
          maxWidth: '780px',
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
            <label style={labelStyle}>Name</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} />
          </div>

          {/* ── Read-only metadata ──────────────────────────────────── */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr 1fr',
              gap: '12px',
              padding: '12px',
              background: 'var(--bg-darkest)',
              borderRadius: '8px',
              border: '1px solid var(--border)',
            }}
          >
            <MetaField label="Size" value={sizeLabel} />
            <MetaField label="Source" value={asset.metadata.generationSource === 'ai' ? 'AI Generated' : 'Manual'} />
            <MetaField label="Created" value={new Date(asset.createdAt).toLocaleString()} />
            <MetaField label="ISI Hash" value={(asset.metadata.isiVersionHash?.slice(0, 16) || 'N/A') + (asset.metadata.isiVersionHash?.length > 16 ? '...' : '')} mono />
            <MetaField label="Updated" value={new Date(asset.updatedAt).toLocaleString()} />
            <MetaField label="ID" value={asset.id.slice(0, 8) + '...'} mono />
          </div>

          {/* ── Editable metadata section ──────────────────────────── */}
          <div
            style={{
              padding: '16px',
              background: 'var(--bg-mid)',
              borderRadius: '8px',
              border: '1px solid var(--border)',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
            }}
          >
            <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Metadata
            </div>

            {/* Visual Tone — editable text */}
            <div>
              <label style={labelStyle}>Visual Tone</label>
              <input
                type="text"
                value={visualTone}
                onChange={(e) => setVisualTone(e.target.value)}
                placeholder="e.g., Warm & Hopeful"
              />
            </div>

            {/* Messaging Type — dropdown */}
            <div>
              <label style={labelStyle}>Messaging Type</label>
              <select
                value={messagingType}
                onChange={(e) => setMessagingType(e.target.value as AssetMetadata['messagingType'])}
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  background: 'var(--bg-dark)',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border-light)',
                  borderRadius: '6px',
                  fontSize: '12px',
                  cursor: 'pointer',
                  textTransform: 'capitalize',
                }}
              >
                {MESSAGING_TYPES.map((mt) => (
                  <option key={mt} value={mt} style={{ textTransform: 'capitalize' }}>
                    {mt.charAt(0).toUpperCase() + mt.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            {/* Claims Used — read-only (auto-detected from banner content) */}
            <div>
              <label style={labelStyle}>
                Claims Used
                <span style={{ fontWeight: 400, color: 'var(--text-muted)', marginLeft: '6px' }}>auto-detected</span>
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                {asset.metadata.claimsUsed.length > 0 ? (
                  asset.metadata.claimsUsed.map((claim) => (
                    <span key={claim} style={claimChipStyle}>
                      {claim}
                    </span>
                  ))
                ) : (
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                    No approved claims detected
                  </span>
                )}
              </div>
            </div>

            {/* Imagery Descriptors — editable chips */}
            <div>
              <label style={labelStyle}>Imagery Descriptors</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '8px' }}>
                {imageryDescriptors.map((desc) => (
                  <span
                    key={desc}
                    style={{
                      fontSize: '10px',
                      background: 'var(--bg-dark)',
                      color: 'var(--text-secondary)',
                      padding: '3px 6px 3px 8px',
                      borderRadius: '3px',
                      border: '1px solid var(--border)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    {desc}
                    <button
                      onClick={() => removeDescriptor(desc)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--text-muted)',
                        cursor: 'pointer',
                        fontSize: '12px',
                        padding: '0 2px',
                        lineHeight: 1,
                      }}
                      title="Remove"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
              {/* Quick-add suggestions */}
              {availableToAdd.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3px', marginBottom: '6px' }}>
                  {availableToAdd.map((desc) => (
                    <button
                      key={desc}
                      onClick={() => addDescriptor(desc)}
                      style={{
                        fontSize: '9px',
                        background: 'transparent',
                        color: 'var(--text-muted)',
                        border: '1px dashed var(--border)',
                        borderRadius: '3px',
                        padding: '2px 6px',
                        cursor: 'pointer',
                        transition: 'all 0.15s',
                      }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--accent)';
                        (e.currentTarget as HTMLButtonElement).style.color = 'var(--accent)';
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border)';
                        (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-muted)';
                      }}
                      title={`Add "${desc}"`}
                    >
                      + {desc}
                    </button>
                  ))}
                </div>
              )}
              {/* Custom descriptor input */}
              <div style={{ display: 'flex', gap: '4px' }}>
                <input
                  type="text"
                  value={newDescriptor}
                  onChange={(e) => setNewDescriptor(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addDescriptor(newDescriptor);
                    }
                  }}
                  placeholder="Add custom descriptor..."
                  style={{ flex: 1, fontSize: '11px' }}
                />
                <button
                  onClick={() => addDescriptor(newDescriptor)}
                  disabled={!newDescriptor.trim()}
                  style={{
                    background: 'var(--bg-dark)',
                    border: '1px solid var(--border-light)',
                    color: newDescriptor.trim() ? 'var(--accent)' : 'var(--text-muted)',
                    borderRadius: '4px',
                    padding: '4px 10px',
                    fontSize: '11px',
                    cursor: newDescriptor.trim() ? 'pointer' : 'default',
                  }}
                >
                  Add
                </button>
              </div>
            </div>

            {/* Tags — editable */}
            <div>
              <label style={labelStyle}>Tags (comma-separated)</label>
              <input
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="e.g., Q1 campaign, HCP, print-ready"
              />
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', paddingTop: '4px' }}>
            <button className="action-btn primary" onClick={handleLoadIntoEditor}>
              Load into Editor
            </button>
            <button className="action-btn" onClick={handleDownload}>
              Download HTML
            </button>
            <button
              className="action-btn"
              onClick={handleSave}
              disabled={saving}
              style={
                saveStatus === 'saved'
                  ? { background: 'rgba(39,174,96,0.15)', borderColor: 'rgba(39,174,96,0.4)', color: '#27AE60' }
                  : saveStatus === 'error'
                    ? { background: 'rgba(231,76,60,0.15)', borderColor: 'rgba(231,76,60,0.4)', color: '#E74C3C' }
                    : {}
              }
            >
              {saving ? 'Saving...' : saveStatus === 'saved' ? '✓ Saved' : saveStatus === 'error' ? 'Save Failed' : 'Save Changes'}
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

// ── Styles ──────────────────────────────────────────────────────────────────

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '11px',
  color: 'var(--text-secondary)',
  fontWeight: 600,
  marginBottom: '4px',
};

const claimChipStyle: React.CSSProperties = {
  fontSize: '10px',
  background: 'rgba(46, 134, 193, 0.15)',
  color: '#2E86C1',
  padding: '3px 8px',
  borderRadius: '3px',
  border: '1px solid rgba(46, 134, 193, 0.3)',
};

function MetaField({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: '2px' }}>{label}</div>
      <div
        style={{
          fontSize: '12px',
          color: 'var(--text-primary)',
          fontFamily: mono ? 'var(--font-geist-mono), monospace' : 'inherit',
        }}
      >
        {value}
      </div>
    </div>
  );
}
