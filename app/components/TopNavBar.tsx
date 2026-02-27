'use client';

import type { WorkspaceView, ContentType } from '../../lib/types';
import { useWorkspace } from '../context/WorkspaceContext';

// ── Content type definitions ────────────────────────────────────────────────

const CONTENT_TYPES: { value: ContentType; label: string; icon: React.ReactNode }[] = [
  {
    value: 'banner',
    label: 'Banner Ads',
    icon: (
      <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
        <rect x="1" y="3" width="14" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
        <line x1="4" y1="7" x2="12" y2="7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="4" y1="10" x2="9" y2="10" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    value: 'leave_behind',
    label: 'Leave Behinds',
    icon: (
      <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
        <rect x="2" y="1" width="12" height="14" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
        <line x1="5" y1="4" x2="11" y2="4" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
        <line x1="5" y1="7" x2="11" y2="7" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
        <line x1="5" y1="10" x2="9" y2="10" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
      </svg>
    ),
  },
];

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
    view: 'artifacts',
    label: 'Artifacts',
    icon: (
      <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
        <path d="M2 4l6-3 6 3v8l-6 3-6-3V4z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
        <path d="M8 7v8M2 4l6 3 6-3" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
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

      {/* Right side — content type toggle */}
      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '2px' }}>
        {state.activeView === 'editor' && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '2px',
              background: 'var(--bg-mid)',
              borderRadius: '6px',
              padding: '2px',
            }}
          >
            {CONTENT_TYPES.map(({ value, label, icon }) => {
              const isActive = state.activeContentType === value;
              return (
                <button
                  key={value}
                  onClick={() => dispatch({ type: 'SET_CONTENT_TYPE', contentType: value })}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    padding: '4px 10px',
                    fontSize: '11px',
                    fontWeight: 600,
                    color: isActive ? 'var(--text-primary)' : 'var(--text-muted)',
                    background: isActive ? 'var(--bg-dark)' : 'transparent',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                    letterSpacing: '0.2px',
                  }}
                >
                  {icon}
                  {label}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </nav>
  );
}
