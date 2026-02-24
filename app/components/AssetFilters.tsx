'use client';

import type { AssetFilters as FilterType } from '../../lib/types';

interface Props {
  filters: FilterType;
  onChange: (filters: FilterType) => void;
  totalCount: number;
}

const TONE_OPTIONS = ['Warm & Hopeful', 'Clinical & Trustworthy', 'Active & Energetic', 'Calm & Reassuring'];
const SIZE_OPTIONS = ['300x250', '728x90', '300x600', '160x600', '320x50'];
const TYPE_OPTIONS = ['efficacy', 'awareness', 'brand', 'hcp', 'other'];

export default function AssetFilters({ filters, onChange, totalCount }: Props) {
  const update = (partial: Partial<FilterType>) => {
    onChange({ ...filters, ...partial });
  };

  const hasFilters = filters.search || filters.size || filters.visualTone || filters.messagingType;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '12px 20px',
        borderBottom: '1px solid var(--border)',
        background: 'var(--bg-dark)',
        flexWrap: 'wrap',
      }}
    >
      {/* Search */}
      <div style={{ position: 'relative', flex: '1 1 200px', maxWidth: '300px' }}>
        <input
          type="text"
          placeholder="Search assets..."
          value={filters.search}
          onChange={(e) => update({ search: e.target.value })}
          style={{ paddingLeft: '28px' }}
        />
        <svg
          width="14"
          height="14"
          viewBox="0 0 16 16"
          fill="none"
          style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)' }}
        >
          <circle cx="7" cy="7" r="5" stroke="var(--text-muted)" strokeWidth="1.5" />
          <line x1="11" y1="11" x2="14" y2="14" stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </div>

      {/* Size filter */}
      <select
        value={filters.size || ''}
        onChange={(e) => update({ size: e.target.value || null })}
        style={{ width: 'auto', minWidth: '100px' }}
      >
        <option value="">All Sizes</option>
        {SIZE_OPTIONS.map((s) => (
          <option key={s} value={s}>{s}</option>
        ))}
      </select>

      {/* Tone filter */}
      <select
        value={filters.visualTone || ''}
        onChange={(e) => update({ visualTone: e.target.value || null })}
        style={{ width: 'auto', minWidth: '130px' }}
      >
        <option value="">All Tones</option>
        {TONE_OPTIONS.map((t) => (
          <option key={t} value={t}>{t}</option>
        ))}
      </select>

      {/* Messaging type filter */}
      <select
        value={filters.messagingType || ''}
        onChange={(e) => update({ messagingType: e.target.value || null })}
        style={{ width: 'auto', minWidth: '120px', textTransform: 'capitalize' }}
      >
        <option value="">All Types</option>
        {TYPE_OPTIONS.map((t) => (
          <option key={t} value={t} style={{ textTransform: 'capitalize' }}>{t}</option>
        ))}
      </select>

      {/* Count + Clear */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: 'auto' }}>
        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
          {totalCount} asset{totalCount !== 1 ? 's' : ''}
        </span>
        {hasFilters && (
          <button
            onClick={() => onChange({
              search: '',
              size: null,
              visualTone: null,
              messagingType: null,
              dateRange: { from: null, to: null },
            })}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--accent)',
              fontSize: '10px',
              cursor: 'pointer',
              padding: 0,
            }}
          >
            Clear filters
          </button>
        )}
      </div>
    </div>
  );
}
