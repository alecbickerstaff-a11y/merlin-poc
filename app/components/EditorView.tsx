'use client';

import { useMemo, useState } from 'react';
import { useWorkspace } from '../context/WorkspaceContext';
import { generateBannerHTML } from '../../lib/banner-template';
import AIGenerateSection from './AIGenerateSection';
import PropertiesPanel from './PropertiesPanel';
import PreviewPanel from './PreviewPanel';
import ConfigPanel from './ConfigPanel';
import MultiPreviewGrid from './MultiPreviewGrid';
import FlashcardEditor from './FlashcardEditor';

// ── EditorView ───────────────────────────────────────────────────────────────
// Wraps the 3-panel editor layout. When multi-size generation has results,
// shows a grid view toggle to see all generated banners.
// When content type is 'leave_behind', shows the flashcard editor instead.

export default function EditorView() {
  const { state, dispatch } = useWorkspace();

  // ── Leave Behind mode → Flashcard editor ─────────────────────────────────
  if (state.activeContentType === 'leave_behind') {
    return <FlashcardEditor />;
  }

  // ── Banner mode → existing 3-panel layout ────────────────────────────────
  const config = state.editorConfig;
  const jobs = state.generationJobs;
  const hasMultiResults = jobs.length > 1;

  const [viewMode, setViewMode] = useState<'single' | 'grid'>('single');
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);

  const bannerHTML = useMemo(() => generateBannerHTML(config), [config]);

  const handleConfigUpdate = (updated: typeof config) => {
    dispatch({ type: 'SET_EDITOR_CONFIG', config: updated });
  };

  const handleReset = () => {
    dispatch({ type: 'RESET_EDITOR_CONFIG' });
    dispatch({ type: 'SET_GENERATION_JOBS', jobs: [] });
    setViewMode('single');
    setSelectedJobId(null);
  };

  // When a job is selected in the grid, load its config into the editor
  const handleSelectJob = (jobId: string) => {
    setSelectedJobId(jobId);
    const job = jobs.find((j) => j.id === jobId);
    if (job?.config) {
      dispatch({ type: 'SET_EDITOR_CONFIG', config: job.config });
    }
  };

  // Auto-switch to grid when multi results come in
  if (hasMultiResults && viewMode === 'single' && jobs.some((j) => j.status === 'complete')) {
    // Don't auto-switch if user manually went back to single
  }

  return (
    <div
      style={{
        display: 'flex',
        flex: 1,
        height: '100%',
        overflow: 'hidden',
      }}
    >
      {/* Left — AI Generate + Properties */}
      <div
        style={{
          width: '280px',
          minWidth: '280px',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          background: 'var(--bg-dark)',
          borderRight: '1px solid var(--border)',
        }}
      >
        <AIGenerateSection config={config} onConfigUpdate={handleConfigUpdate} />
        <PropertiesPanel config={config} onChange={handleConfigUpdate} />
      </div>

      {/* Center — Preview area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* View mode toggle (only show when multi-results exist) */}
        {hasMultiResults && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '6px 12px',
              background: 'var(--bg-dark)',
              borderBottom: '1px solid var(--border)',
            }}
          >
            <button
              onClick={() => setViewMode('single')}
              style={{
                padding: '4px 12px',
                fontSize: '11px',
                fontWeight: 600,
                background: viewMode === 'single' ? 'var(--accent-dim)' : 'transparent',
                color: viewMode === 'single' ? 'var(--accent)' : 'var(--text-muted)',
                border: `1px solid ${viewMode === 'single' ? 'var(--accent)' : 'var(--border)'}`,
                borderRadius: '4px',
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              Single
            </button>
            <button
              onClick={() => setViewMode('grid')}
              style={{
                padding: '4px 12px',
                fontSize: '11px',
                fontWeight: 600,
                background: viewMode === 'grid' ? 'var(--accent-dim)' : 'transparent',
                color: viewMode === 'grid' ? 'var(--accent)' : 'var(--text-muted)',
                border: `1px solid ${viewMode === 'grid' ? 'var(--accent)' : 'var(--border)'}`,
                borderRadius: '4px',
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              Grid ({jobs.filter((j) => j.status === 'complete').length}/{jobs.length})
            </button>

            {selectedJobId && viewMode === 'grid' && (
              <span style={{ fontSize: '10px', color: 'var(--text-muted)', marginLeft: '8px' }}>
                Click a card to edit in single view
              </span>
            )}
          </div>
        )}

        {/* Content */}
        <div style={{ flex: 1, overflow: 'hidden' }}>
          {viewMode === 'grid' && hasMultiResults ? (
            <MultiPreviewGrid
              jobs={jobs}
              selectedJobId={selectedJobId}
              onSelectJob={(jobId) => {
                handleSelectJob(jobId);
                setViewMode('single');
              }}
            />
          ) : (
            <PreviewPanel config={config} html={bannerHTML} onReset={handleReset} />
          )}
        </div>
      </div>

      {/* Right — Config JSON */}
      <ConfigPanel config={config} />
    </div>
  );
}
