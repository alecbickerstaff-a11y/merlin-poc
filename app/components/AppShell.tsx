'use client';

import { useWorkspace } from '../context/WorkspaceContext';
import TopNavBar from './TopNavBar';
import EditorView from './EditorView';

// ── Placeholder views for Phase 3 & 5 ───────────────────────────────────────

const placeholderStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  height: '100%',
  color: 'var(--text-secondary)',
  userSelect: 'none',
};

function AssetsPlaceholder() {
  return (
    <div style={placeholderStyle}>
      <svg width="48" height="48" viewBox="0 0 16 16" fill="none" style={{ opacity: 0.3 }}>
        <rect x="1" y="1" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5" />
        <rect x="9" y="1" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5" />
        <rect x="1" y="9" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5" />
        <rect x="9" y="9" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5" />
      </svg>
      <h2 style={{ margin: '16px 0 8px', fontSize: '18px', fontWeight: 600 }}>
        Asset Repository
      </h2>
      <p style={{ color: 'var(--text-muted)', fontSize: '13px', maxWidth: '400px', textAlign: 'center', lineHeight: 1.5 }}>
        Save generated banners here and browse your creative library. Coming in Phase 3.
      </p>
    </div>
  );
}

function TrackerPlaceholder() {
  return (
    <div style={placeholderStyle}>
      <svg width="48" height="48" viewBox="0 0 16 16" fill="none" style={{ opacity: 0.3 }}>
        <polyline points="1,12 5,6 9,9 15,2" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <line x1="1" y1="14" x2="15" y2="14" stroke="currentColor" strokeWidth="1.5" />
      </svg>
      <h2 style={{ margin: '16px 0 8px', fontSize: '18px', fontWeight: 600 }}>
        Metadata Tracker
      </h2>
      <p style={{ color: 'var(--text-muted)', fontSize: '13px', maxWidth: '400px', textAlign: 'center', lineHeight: 1.5 }}>
        Track claims usage, visual tones, messaging types, and ISI versioning across all assets. Coming in Phase 5.
      </p>
    </div>
  );
}

// ── AppShell ─────────────────────────────────────────────────────────────────
// Top nav bar + view switcher. Renders the active view below the nav.

export default function AppShell() {
  const { state } = useWorkspace();

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        width: '100vw',
        overflow: 'hidden',
      }}
    >
      <TopNavBar />

      <div style={{ flex: 1, overflow: 'hidden' }}>
        {state.activeView === 'editor' && <EditorView />}
        {state.activeView === 'assets' && <AssetsPlaceholder />}
        {state.activeView === 'tracker' && <TrackerPlaceholder />}
      </div>
    </div>
  );
}
