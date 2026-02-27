'use client';

import { useWorkspace } from '../context/WorkspaceContext';
import TopNavBar from './TopNavBar';
import EditorView from './EditorView';
import AssetsView from './AssetsView';
import ArtifactsView from './ArtifactsView';
import TrackerView from './TrackerView';

// ── AppShell ─────────────────────────────────────────────────────────────────

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
        {state.activeView === 'assets' && <AssetsView />}
        {state.activeView === 'artifacts' && <ArtifactsView />}
        {state.activeView === 'tracker' && <TrackerView />}
      </div>
    </div>
  );
}
