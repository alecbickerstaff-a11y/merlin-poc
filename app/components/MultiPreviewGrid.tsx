'use client';

import type { GenerationJob } from '../../lib/types';
import BannerCard from './BannerCard';

// ── Props ────────────────────────────────────────────────────────────────────

interface Props {
  jobs: GenerationJob[];
  selectedJobId: string | null;
  onSelectJob: (jobId: string) => void;
}

// ── Component ────────────────────────────────────────────────────────────────

export default function MultiPreviewGrid({ jobs, selectedJobId, onSelectJob }: Props) {
  if (jobs.length === 0) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          color: 'var(--text-muted)',
          fontSize: '13px',
          userSelect: 'none',
          padding: '24px',
        }}
      >
        <svg width="40" height="40" viewBox="0 0 16 16" fill="none" style={{ opacity: 0.3, marginBottom: '12px' }}>
          <rect x="1" y="1" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5" />
          <rect x="9" y="1" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5" />
          <rect x="1" y="9" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5" />
          <rect x="9" y="9" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5" />
        </svg>
        <span>Select sizes and generate to see banners here</span>
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
        gap: '16px',
        padding: '20px',
        overflowY: 'auto',
        height: '100%',
        alignContent: 'start',
      }}
    >
      {jobs.map((job) => (
        <BannerCard
          key={job.id}
          job={job}
          isSelected={selectedJobId === job.id}
          onSelect={() => onSelectJob(job.id)}
        />
      ))}
    </div>
  );
}
