'use client';

import { useState, useEffect, useCallback, useRef, type DragEvent } from 'react';
import type { Artifact, ArtifactCategory } from '../../lib/types';
import { useWorkspace } from '../context/WorkspaceContext';

// ── Constants ────────────────────────────────────────────────────────────────

const CATEGORIES: { value: ArtifactCategory | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'chart', label: 'Charts' },
  { value: 'icon', label: 'Icons' },
  { value: 'cta', label: 'CTAs' },
  { value: 'graphic', label: 'Graphics' },
  { value: 'logo', label: 'Logos' },
  { value: 'background', label: 'Backgrounds' },
  { value: 'photography', label: 'Photography' },
];

const CATEGORY_COLORS: Record<ArtifactCategory, string> = {
  chart: '#00CCC0',
  icon: '#008299',
  cta: '#FFE600',
  graphic: '#6366f1',
  logo: '#f59e0b',
  background: '#64748b',
  photography: '#ec4899',
};

// ── Upload Dropzone ─────────────────────────────────────────────────────────

function UploadDropzone({
  onUpload,
  category,
}: {
  onUpload: (files: File[]) => void;
  category: ArtifactCategory;
}) {
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    const files = Array.from(e.dataTransfer.files).filter((f) =>
      f.type.startsWith('image/') || f.type === 'image/svg+xml',
    );
    if (files.length > 0) onUpload(files);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      onUpload(Array.from(e.target.files));
      e.target.value = '';
    }
  };

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      style={{
        border: `2px dashed ${dragOver ? 'var(--accent)' : 'var(--border)'}`,
        borderRadius: '10px',
        padding: '28px 24px',
        textAlign: 'center',
        cursor: 'pointer',
        background: dragOver ? 'var(--accent-dim)' : 'var(--bg-mid)',
        transition: 'all 0.15s',
        marginBottom: '20px',
      }}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileSelect}
        style={{ display: 'none' }}
      />
      <svg
        width="32"
        height="32"
        viewBox="0 0 16 16"
        fill="none"
        style={{ opacity: 0.4, marginBottom: '8px' }}
      >
        <path
          d="M8 1v10M4 5l4-4 4 4"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M1 11v2a2 2 0 002 2h10a2 2 0 002-2v-2"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
      <p style={{ margin: '0 0 4px', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>
        Drop files here or click to upload
      </p>
      <p style={{ margin: 0, fontSize: '11px', color: 'var(--text-muted)' }}>
        PNG, SVG, JPG — will be saved as <strong>{category}</strong> artifacts
      </p>
    </div>
  );
}

// ── Artifact Card ───────────────────────────────────────────────────────────

function ArtifactCard({
  artifact,
  onDelete,
}: {
  artifact: Artifact;
  onDelete: (id: string) => void;
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const isDataUrl = artifact.fileUrl.startsWith('data:');

  return (
    <div
      style={{
        background: 'var(--bg-dark)',
        border: '1px solid var(--border)',
        borderRadius: '8px',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        transition: 'border-color 0.15s',
      }}
    >
      {/* Preview */}
      <div
        style={{
          height: '120px',
          background: 'var(--bg-darkest)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
        }}
      >
        {isDataUrl || artifact.fileUrl.startsWith('http') ? (
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
          <svg width="32" height="32" viewBox="0 0 16 16" fill="none" style={{ opacity: 0.2 }}>
            <rect x="1" y="1" width="14" height="14" rx="2" stroke="currentColor" strokeWidth="1.5" />
            <circle cx="5" cy="5" r="1.5" stroke="currentColor" strokeWidth="1" />
            <path d="M1 11l4-4 3 3 2-2 5 5H1V11z" fill="currentColor" opacity="0.3" />
          </svg>
        )}
      </div>

      {/* Info */}
      <div style={{ padding: '10px 12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
          <span
            style={{
              fontSize: '9px',
              fontWeight: 700,
              letterSpacing: '0.5px',
              textTransform: 'uppercase',
              color: CATEGORY_COLORS[artifact.category],
              background: `${CATEGORY_COLORS[artifact.category]}18`,
              padding: '2px 6px',
              borderRadius: '3px',
            }}
          >
            {artifact.category}
          </span>
          <span style={{ fontSize: '10px', color: 'var(--text-muted)', marginLeft: 'auto' }}>
            {(artifact.fileSize / 1024).toFixed(0)} KB
          </span>
        </div>

        <p
          style={{
            margin: '0 0 6px',
            fontSize: '12px',
            fontWeight: 600,
            color: 'var(--text-primary)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {artifact.name}
        </p>

        {artifact.tags.length > 0 && (
          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginBottom: '6px' }}>
            {artifact.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                style={{
                  fontSize: '9px',
                  background: 'var(--bg-mid)',
                  color: 'var(--text-muted)',
                  padding: '1px 5px',
                  borderRadius: '3px',
                }}
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', gap: '6px', marginTop: '4px' }}>
          {!confirmDelete ? (
            <button
              onClick={() => setConfirmDelete(true)}
              style={{
                fontSize: '10px',
                color: 'var(--text-muted)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '2px 0',
              }}
            >
              Delete
            </button>
          ) : (
            <>
              <button
                onClick={() => onDelete(artifact.id)}
                style={{
                  fontSize: '10px',
                  color: '#ef4444',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: 700,
                  padding: '2px 0',
                }}
              >
                Confirm delete
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                style={{
                  fontSize: '10px',
                  color: 'var(--text-muted)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '2px 0',
                }}
              >
                Cancel
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main View ───────────────────────────────────────────────────────────────

export default function ArtifactsView() {
  const { state, dispatch } = useWorkspace();
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [activeCategory, setActiveCategory] = useState<ArtifactCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [dbError, setDbError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);

  const uploadCategory: ArtifactCategory = activeCategory === 'all' ? 'graphic' : activeCategory;

  const fetchArtifacts = useCallback(async () => {
    setLoading(true);
    setDbError(null);
    try {
      const params = new URLSearchParams();
      if (activeCategory !== 'all') params.set('category', activeCategory);
      if (searchQuery) params.set('search', searchQuery);

      const res = await fetch(`/api/artifacts?${params.toString()}`);
      const data = await res.json();

      if (!res.ok) {
        setDbError(data.error || 'Failed to load artifacts.');
        dispatch({ type: 'SET_ARTIFACTS', artifacts: [] });
        return;
      }

      dispatch({ type: 'SET_ARTIFACTS', artifacts: data.artifacts });
      setTotalCount(data.total);
    } catch {
      setDbError('Failed to connect to the database.');
      dispatch({ type: 'SET_ARTIFACTS', artifacts: [] });
    } finally {
      setLoading(false);
    }
  }, [activeCategory, searchQuery, dispatch]);

  useEffect(() => {
    fetchArtifacts();
  }, [fetchArtifacts]);

  const handleUpload = async (files: File[]) => {
    setUploading(true);
    try {
      for (const file of files) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('category', uploadCategory);
        formData.append('name', file.name.replace(/\.[^.]+$/, ''));

        const res = await fetch('/api/artifacts', {
          method: 'POST',
          body: formData,
        });

        if (res.ok) {
          const artifact = await res.json();
          dispatch({ type: 'ADD_ARTIFACT', artifact });
          setTotalCount((c) => c + 1);
        }
      }
    } catch {
      // Silently fail for now
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await fetch(`/api/artifacts/${id}`, { method: 'DELETE' });
      dispatch({ type: 'REMOVE_ARTIFACT', id });
      setTotalCount((c) => c - 1);
    } catch {
      // Silently fail
    }
  };

  // DB not configured
  if (dbError) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          padding: '40px',
          color: 'var(--text-muted)',
        }}
      >
        <svg width="48" height="48" viewBox="0 0 16 16" fill="none" style={{ opacity: 0.3, marginBottom: '16px' }}>
          <rect x="2" y="4" width="12" height="9" rx="1" stroke="currentColor" strokeWidth="1.5" />
          <circle cx="8" cy="8.5" r="2" stroke="currentColor" strokeWidth="1.5" />
        </svg>
        <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-secondary)', margin: '0 0 8px' }}>
          Database Required
        </h3>
        <p style={{ fontSize: '13px', textAlign: 'center', lineHeight: 1.6, maxWidth: '400px', margin: 0 }}>
          {dbError}
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '12px 20px',
          borderBottom: '1px solid var(--border)',
          background: 'var(--bg-dark)',
          flexWrap: 'wrap',
        }}
      >
        <h2
          style={{
            margin: 0,
            fontSize: '14px',
            fontWeight: 700,
            color: 'var(--text-primary)',
            fontFamily: 'var(--font-montserrat), Montserrat, sans-serif',
            letterSpacing: '0.3px',
          }}
        >
          Artifact Library
        </h2>

        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
          {totalCount} artifact{totalCount !== 1 ? 's' : ''}
        </span>

        <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px', alignItems: 'center' }}>
          <input
            type="text"
            placeholder="Search artifacts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '200px',
              padding: '5px 10px',
              fontSize: '12px',
              background: 'var(--bg-mid)',
              border: '1px solid var(--border)',
              borderRadius: '6px',
              color: 'var(--text-primary)',
              outline: 'none',
            }}
          />
        </div>
      </div>

      {/* Category tabs */}
      <div
        style={{
          display: 'flex',
          gap: '4px',
          padding: '8px 20px',
          borderBottom: '1px solid var(--border)',
          background: 'var(--bg-dark)',
          overflowX: 'auto',
        }}
      >
        {CATEGORIES.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => setActiveCategory(value)}
            style={{
              padding: '4px 12px',
              fontSize: '11px',
              fontWeight: 600,
              color: activeCategory === value ? 'var(--accent)' : 'var(--text-muted)',
              background: activeCategory === value ? 'var(--accent-dim)' : 'transparent',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 0.15s',
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Content area */}
      <div style={{ flex: 1, overflow: 'auto', padding: '20px' }}>
        {/* Upload zone */}
        <UploadDropzone onUpload={handleUpload} category={uploadCategory} />

        {uploading && (
          <p style={{ fontSize: '12px', color: 'var(--accent)', marginBottom: '12px' }}>
            Uploading...
          </p>
        )}

        {/* Grid */}
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
            <div
              style={{
                width: '24px',
                height: '24px',
                border: '2px solid var(--border)',
                borderTopColor: 'var(--accent)',
                borderRadius: '50%',
                animation: 'spin 0.6s linear infinite',
              }}
            />
          </div>
        ) : state.artifacts.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: '40px',
              color: 'var(--text-muted)',
            }}
          >
            <p style={{ fontSize: '14px', fontWeight: 600, marginBottom: '4px', color: 'var(--text-secondary)' }}>
              No artifacts yet
            </p>
            <p style={{ fontSize: '12px', margin: 0 }}>
              Upload brand assets — charts, icons, CTAs, graphics, logos, and photography — to use in your content.
            </p>
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
              gap: '12px',
            }}
          >
            {state.artifacts.map((artifact) => (
              <ArtifactCard key={artifact.id} artifact={artifact} onDelete={handleDelete} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
