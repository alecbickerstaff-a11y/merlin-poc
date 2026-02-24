'use client';

import type { GenerationJob } from '../../lib/types';

// ── Props ────────────────────────────────────────────────────────────────────

interface Props {
  jobs: GenerationJob[];
}

// ── Component ────────────────────────────────────────────────────────────────

export default function GenerationProgress({ jobs }: Props) {
  if (jobs.length === 0) return null;

  const completed = jobs.filter((j) => j.status === 'complete').length;
  const errored = jobs.filter((j) => j.status === 'error').length;
  const total = jobs.length;

  return (
    <div
      style={{
        padding: '10px',
        background: 'var(--bg-darkest)',
        borderRadius: '6px',
        border: '1px solid var(--border)',
      }}
    >
      {/* Summary line */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '8px',
          fontSize: '11px',
        }}
      >
        <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>
          Generating {total} banner{total > 1 ? 's' : ''}
        </span>
        <span style={{ color: 'var(--text-muted)' }}>
          {completed}/{total}
          {errored > 0 && (
            <span style={{ color: '#E74C3C', marginLeft: '4px' }}>
              ({errored} failed)
            </span>
          )}
        </span>
      </div>

      {/* Progress bar */}
      <div
        style={{
          height: '3px',
          background: 'var(--border)',
          borderRadius: '2px',
          overflow: 'hidden',
          marginBottom: '8px',
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${((completed + errored) / total) * 100}%`,
            background: errored > 0 && completed === 0 ? '#E74C3C' : 'var(--accent)',
            borderRadius: '2px',
            transition: 'width 0.3s ease',
          }}
        />
      </div>

      {/* Per-size status */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {jobs.map((job) => (
          <div
            key={job.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '10px',
            }}
          >
            <StatusIcon status={job.status} />
            <span
              style={{
                color:
                  job.status === 'complete'
                    ? 'var(--text-primary)'
                    : job.status === 'error'
                      ? '#E74C3C'
                      : 'var(--text-muted)',
                fontFamily: 'var(--font-geist-mono), monospace',
              }}
            >
              {job.size}
            </span>
            {job.status === 'error' && job.error && (
              <span style={{ color: '#E74C3C', fontSize: '9px', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {job.error}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Status Icon ──────────────────────────────────────────────────────────────

function StatusIcon({ status }: { status: GenerationJob['status'] }) {
  if (status === 'complete') {
    return (
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
        <circle cx="6" cy="6" r="5" fill="var(--accent)" />
        <path d="M3 6L5 8L9 4" stroke="#000" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  if (status === 'error') {
    return (
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
        <circle cx="6" cy="6" r="5" fill="#E74C3C" />
        <path d="M4 4L8 8M8 4L4 8" stroke="#FFF" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    );
  }

  if (status === 'generating') {
    return (
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ animation: 'spin 1s linear infinite' }}>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <circle cx="6" cy="6" r="4.5" stroke="var(--border-light)" strokeWidth="1.5" fill="none" />
        <path d="M10.5 6a4.5 4.5 0 0 0-4.5-4.5" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    );
  }

  // pending
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
      <circle cx="6" cy="6" r="4.5" stroke="var(--border-light)" strokeWidth="1.5" fill="none" />
    </svg>
  );
}
