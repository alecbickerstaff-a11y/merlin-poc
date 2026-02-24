'use client';

import type { WorkspaceView } from '../../lib/types';
import { useWorkspace } from '../context/WorkspaceContext';

// ── Tab definitions ──────────────────────────────────────────────────────────

const TABS: { view: WorkspaceView; label: string; icon: React.ReactNode }[] = [
  {
    view: 'editor',
    label: 'Editor',
    icon: (
      <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
        <rect x="1" y="1" width="14" height="14" rx="2" stroke="currentColor" strokeWidth="1.5" />
        <line x1="5.5" y1="1" x2="5.5" y2="15" stroke="currentColor" strokeWidth="1.5" />
        <line x1="5.5" y1="5.5" x2="15" y2="5.5" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    ),
  },
  {
    view: 'assets',
    label: 'Assets',
    icon: (
      <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
        <rect x="1" y="1" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5" />
        <rect x="9" y="1" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5" />
        <rect x="1" y="9" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5" />
        <rect x="9" y="9" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    ),
  },
  {
    view: 'tracker',
    label: 'Tracker',
    icon: (
      <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
        <polyline points="1,12 5,6 9,9 15,2" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <line x1="1" y1="14" x2="15" y2="14" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    ),
  },
];

// ── Component ────────────────────────────────────────────────────────────────

export default function TopNavBar() {
  const { state, dispatch } = useWorkspace();

  return (
    <nav
      style={{
        display: 'flex',
        alignItems: 'center',
        height: '44px',
        minHeight: '44px',
        padding: '0 16px',
        background: 'var(--bg-darkest)',
        borderBottom: '1px solid var(--border)',
        gap: '24px',
      }}
    >
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
        <svg width="20" height="20" viewBox="0 0 16 16" fill="none">
          <path
            d="M8 1L10 5.5L15 6.5L11.5 10L12.5 15L8 12.5L3.5 15L4.5 10L1 6.5L6 5.5L8 1Z"
            fill="var(--accent)"
            stroke="var(--accent)"
            strokeWidth="0.5"
          />
        </svg>
        <span
          style={{
            fontFamily: 'var(--font-montserrat), Montserrat, sans-serif',
            fontWeight: 800,
            fontSize: '14px',
            letterSpacing: '2px',
            color: 'var(--accent)',
          }}
        >
          MERLIN
        </span>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
        {TABS.map(({ view, label, icon }) => {
          const isActive = state.activeView === view;
          return (
            <button
              key={view}
              onClick={() => dispatch({ type: 'SET_VIEW', view })}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 14px',
                fontFamily: 'var(--font-montserrat), Montserrat, sans-serif',
                fontSize: '12px',
                fontWeight: 600,
                letterSpacing: '0.3px',
                color: isActive ? 'var(--accent)' : 'var(--text-muted)',
                background: isActive ? 'var(--accent-dim)' : 'transparent',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                transition: 'all 0.15s',
                position: 'relative',
              }}
            >
              {icon}
              {label}
              {isActive && (
                <span
                  style={{
                    position: 'absolute',
                    bottom: '-7px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: '20px',
                    height: '2px',
                    background: 'var(--accent)',
                    borderRadius: '1px',
                  }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Right side — spacer for now */}
      <div style={{ marginLeft: 'auto' }} />
    </nav>
  );
}
