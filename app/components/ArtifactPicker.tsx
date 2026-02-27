'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Artifact, ArtifactCategory } from '../../lib/types';

// =============================================================================
// ArtifactPicker — inline picker for selecting artifacts from the library.
// Used in the FlashcardEditor properties panel when a section needs an artifact
// (visualizations, images, icons, CTAs, etc.)
// =============================================================================

const CATEGORY_COLORS: Record<ArtifactCategory, string> = {
  chart: '#00CCC0',
  icon: '#008299',
  cta: '#FFE600',
  graphic: '#6366f1',
  logo: '#f59e0b',
  background: '#64748b',
  photography: '#ec4899',
};

const CATEGORY_LABELS: Record<ArtifactCategory, string> = {
  chart: 'Charts',
  icon: 'Icons',
  cta: 'CTAs',
  graphic: 'Graphics',
  logo: 'Logos',
  background: 'Backgrounds',
  photography: 'Photography',
};

// ── Artifact Thumbnail ──────────────────────────────────────────────────────

function ArtifactThumb({
  artifact,
  isSelected,
  onSelect,
}: {
  artifact: Artifact;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const hasPreview = artifact.fileUrl.startsWith('data:') || artifact.fileUrl.startsWith('http');

  return (
    <button
      onClick={onSelect}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '4px',
        padding: '6px',
        background: isSelected ? 'var(--accent-dim)' : 'var(--bg-darkest)',
        border: `2px solid ${isSelected ? 'var(--accent)' : 'var(--border)'}`,
        borderRadius: '6px',
        cursor: 'pointer',
        transition: 'all 0.15s',
        width: '100%',
      }}
      title={artifact.name}
    >
      {/* Image preview */}
      <div
        style={{
          width: '100%',
          height: '64px',
          borderRadius: '3px',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--bg-mid)',
        }}
      >
        {hasPreview ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={artifact.fileUrl}
            alt={artifact.name}
            style={{
              maxWidth: '100%',
              maxHeight: '100%',
              objectFit: 'contain',
            }}
          />
        ) : (
          <svg width="20" height="20" viewBox="0 0 16 16" fill="none" style={{ opacity: 0.3 }}>
            <rect x="1" y="1" width="14" height="14" rx="2" stroke="currentColor" strokeWidth="1.5" />
            <circle cx="5" cy="5" r="1.5" stroke="currentColor" strokeWidth="1" />
            <path d="M1 11l4-4 3 3 2-2 5 5H1V11z" fill="currentColor" opacity="0.3" />
          </svg>
        )}
      </div>

      {/* Name + category badge */}
      <div style={{ width: '100%', textAlign: 'left' }}>
        <div
          style={{
            fontSize: '10px',
            fontWeight: 600,
            color: isSelected ? 'var(--accent)' : 'var(--text-secondary)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {artifact.name}
        </div>
        <span
          style={{
            fontSize: '8px',
            fontWeight: 700,
            letterSpacing: '0.5px',
            textTransform: 'uppercase',
            color: CATEGORY_COLORS[artifact.category],
          }}
        >
          {artifact.category}
        </span>
      </div>
    </button>
  );
}

// ── Main Picker Component ───────────────────────────────────────────────────

export default function ArtifactPicker({
  value,
  onChange,
  onUrlResolved,
  filterCategories,
  label = 'Select Artifact',
}: {
  /** Currently selected artifact ID */
  value?: string;
  /** Called when user picks an artifact */
  onChange: (artifactId: string | undefined) => void;
  /** Called with the artifact's file URL when selection changes */
  onUrlResolved?: (url: string | undefined) => void;
  /** Optional: limit which categories are shown */
  filterCategories?: ArtifactCategory[];
  /** Label displayed above the picker */
  label?: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const [artifacts, setArtifacts] = useState<Artifact[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeFilter, setActiveFilter] = useState<ArtifactCategory | 'all'>('all');
  const [selectedArtifact, setSelectedArtifact] = useState<Artifact | null>(null);

  // Fetch artifacts when expanded
  const fetchArtifacts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (activeFilter !== 'all') params.set('category', activeFilter);

      const res = await fetch(`/api/artifacts?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        const all: Artifact[] = data.artifacts || [];
        // Apply filterCategories if provided
        const filtered = filterCategories
          ? all.filter((a: Artifact) => filterCategories.includes(a.category))
          : all;
        setArtifacts(filtered);

        // Resolve selected artifact details
        if (value) {
          const found = all.find((a: Artifact) => a.id === value);
          setSelectedArtifact(found || null);
        }
      }
    } catch {
      // Silent fail
    } finally {
      setLoading(false);
    }
  }, [activeFilter, filterCategories, value]);

  // Fetch when expanded or filter changes
  useEffect(() => {
    if (expanded) {
      fetchArtifacts();
    }
  }, [expanded, fetchArtifacts]);

  // Resolve the initially selected artifact on mount
  useEffect(() => {
    if (value && !selectedArtifact) {
      (async () => {
        try {
          const res = await fetch(`/api/artifacts?limit=200`);
          if (res.ok) {
            const data = await res.json();
            const found = (data.artifacts || []).find((a: Artifact) => a.id === value);
            if (found) setSelectedArtifact(found);
          }
        } catch {
          // Silent
        }
      })();
    }
  }, [value, selectedArtifact]);

  const handleSelect = (artifact: Artifact) => {
    setSelectedArtifact(artifact);
    onChange(artifact.id);
    onUrlResolved?.(artifact.fileUrl);
    setExpanded(false);
  };

  const handleClear = () => {
    setSelectedArtifact(null);
    onChange(undefined);
    onUrlResolved?.(undefined);
  };

  // Available category filters
  const availableCategories: ArtifactCategory[] = filterCategories || [
    'chart',
    'icon',
    'cta',
    'graphic',
    'logo',
    'background',
    'photography',
  ];

  return (
    <div style={{ marginTop: '8px' }}>
      <label
        style={{
          display: 'block',
          fontSize: '10px',
          fontWeight: 600,
          color: 'var(--text-muted)',
          marginBottom: '4px',
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
        }}
      >
        {label}
      </label>

      {/* Selected preview or "Pick" button */}
      {selectedArtifact ? (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '6px 8px',
            background: 'var(--bg-darkest)',
            border: '1px solid var(--accent)',
            borderRadius: '6px',
          }}
        >
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '4px',
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'var(--bg-mid)',
              flexShrink: 0,
            }}
          >
            {selectedArtifact.fileUrl.startsWith('data:') ||
            selectedArtifact.fileUrl.startsWith('http') ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={selectedArtifact.fileUrl}
                alt={selectedArtifact.name}
                style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
              />
            ) : (
              <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>?</span>
            )}
          </div>

          <div style={{ flex: 1, overflow: 'hidden' }}>
            <div
              style={{
                fontSize: '11px',
                fontWeight: 600,
                color: 'var(--text-primary)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {selectedArtifact.name}
            </div>
            <span
              style={{
                fontSize: '9px',
                color: CATEGORY_COLORS[selectedArtifact.category],
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}
            >
              {selectedArtifact.category}
            </span>
          </div>

          <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
            <button
              onClick={() => setExpanded(!expanded)}
              style={{
                padding: '3px 8px',
                fontSize: '10px',
                fontWeight: 600,
                color: 'var(--text-secondary)',
                background: 'var(--bg-mid)',
                border: '1px solid var(--border)',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              Change
            </button>
            <button
              onClick={handleClear}
              style={{
                padding: '3px 6px',
                fontSize: '10px',
                fontWeight: 600,
                color: '#ef4444',
                background: 'none',
                border: '1px solid var(--border)',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              ×
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setExpanded(!expanded)}
          style={{
            width: '100%',
            padding: '10px',
            fontSize: '11px',
            fontWeight: 600,
            color: 'var(--text-muted)',
            background: 'var(--bg-darkest)',
            border: '2px dashed var(--border)',
            borderRadius: '6px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            transition: 'all 0.15s',
          }}
        >
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" style={{ opacity: 0.5 }}>
            <rect x="1" y="1" width="14" height="14" rx="2" stroke="currentColor" strokeWidth="1.5" />
            <circle cx="5" cy="5" r="1.5" stroke="currentColor" strokeWidth="1" />
            <path d="M1 11l4-4 3 3 2-2 5 5H1V11z" fill="currentColor" opacity="0.3" />
          </svg>
          Pick from Artifact Library
        </button>
      )}

      {/* Expanded picker panel */}
      {expanded && (
        <div
          style={{
            marginTop: '6px',
            background: 'var(--bg-dark)',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            overflow: 'hidden',
            maxHeight: '320px',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Category filter tabs */}
          {availableCategories.length > 1 && (
            <div
              style={{
                display: 'flex',
                gap: '2px',
                padding: '6px 8px',
                borderBottom: '1px solid var(--border)',
                background: 'var(--bg-darkest)',
                flexWrap: 'wrap',
              }}
            >
              <button
                onClick={() => setActiveFilter('all')}
                style={{
                  padding: '2px 8px',
                  fontSize: '9px',
                  fontWeight: 600,
                  color: activeFilter === 'all' ? 'var(--accent)' : 'var(--text-muted)',
                  background: activeFilter === 'all' ? 'var(--accent-dim)' : 'transparent',
                  border: 'none',
                  borderRadius: '3px',
                  cursor: 'pointer',
                }}
              >
                All
              </button>
              {availableCategories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveFilter(cat)}
                  style={{
                    padding: '2px 8px',
                    fontSize: '9px',
                    fontWeight: 600,
                    color: activeFilter === cat ? CATEGORY_COLORS[cat] : 'var(--text-muted)',
                    background: activeFilter === cat ? `${CATEGORY_COLORS[cat]}18` : 'transparent',
                    border: 'none',
                    borderRadius: '3px',
                    cursor: 'pointer',
                  }}
                >
                  {CATEGORY_LABELS[cat]}
                </button>
              ))}
            </div>
          )}

          {/* Grid of artifacts */}
          <div style={{ flex: 1, overflow: 'auto', padding: '8px' }}>
            {loading ? (
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  padding: '24px',
                }}
              >
                <div
                  style={{
                    width: '16px',
                    height: '16px',
                    border: '2px solid var(--border)',
                    borderTopColor: 'var(--accent)',
                    borderRadius: '50%',
                    animation: 'spin 0.6s linear infinite',
                  }}
                />
              </div>
            ) : artifacts.length === 0 ? (
              <p
                style={{
                  textAlign: 'center',
                  fontSize: '11px',
                  color: 'var(--text-muted)',
                  padding: '20px 8px',
                  margin: 0,
                }}
              >
                No artifacts found. Upload assets in the Artifacts tab first.
              </p>
            ) : (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: '6px',
                }}
              >
                {artifacts.map((artifact) => (
                  <ArtifactThumb
                    key={artifact.id}
                    artifact={artifact}
                    isSelected={value === artifact.id}
                    onSelect={() => handleSelect(artifact)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
