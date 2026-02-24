'use client';

import { useState } from 'react';

// ── Available sizes with visual indicators ───────────────────────────────────

export interface SizeOption {
  label: string;
  value: string;
  width: number;
  height: number;
}

export const AVAILABLE_SIZES: SizeOption[] = [
  { label: '300×250', value: '300x250', width: 300, height: 250 },
  { label: '728×90', value: '728x90', width: 728, height: 90 },
  { label: '300×600', value: '300x600', width: 300, height: 600 },
  { label: '160×600', value: '160x600', width: 160, height: 600 },
  { label: '320×50', value: '320x50', width: 320, height: 50 },
];

// ── Props ────────────────────────────────────────────────────────────────────

interface Props {
  selectedSizes: string[];
  onChange: (sizes: string[]) => void;
  disabled?: boolean;
}

// ── Component ────────────────────────────────────────────────────────────────

export default function SizeSelector({ selectedSizes, onChange, disabled }: Props) {
  const [expanded, setExpanded] = useState(true);

  const toggleSize = (value: string) => {
    if (disabled) return;
    if (selectedSizes.includes(value)) {
      onChange(selectedSizes.filter((s) => s !== value));
    } else {
      onChange([...selectedSizes, value]);
    }
  };

  const selectAll = () => {
    if (disabled) return;
    onChange(AVAILABLE_SIZES.map((s) => s.value));
  };

  const selectNone = () => {
    if (disabled) return;
    onChange([]);
  };

  return (
    <div style={{ marginBottom: '8px' }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '6px',
          cursor: 'pointer',
        }}
        onClick={() => setExpanded(!expanded)}
      >
        <span
          style={{
            fontSize: '11px',
            color: 'var(--text-secondary)',
            fontWeight: 600,
          }}
        >
          Banner Sizes
          {selectedSizes.length > 0 && (
            <span style={{ color: 'var(--accent)', marginLeft: '4px' }}>
              ({selectedSizes.length})
            </span>
          )}
        </span>
        <svg
          width="10"
          height="10"
          viewBox="0 0 12 12"
          fill="none"
          style={{
            transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)',
            transition: 'transform 0.15s',
          }}
        >
          <path d="M4 2L8 6L4 10" stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </div>

      {expanded && (
        <>
          {/* Quick actions */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '6px' }}>
            <button
              onClick={selectAll}
              disabled={disabled}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--accent)',
                fontSize: '10px',
                cursor: disabled ? 'not-allowed' : 'pointer',
                padding: 0,
                opacity: disabled ? 0.5 : 1,
              }}
            >
              Select All
            </button>
            <button
              onClick={selectNone}
              disabled={disabled}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-muted)',
                fontSize: '10px',
                cursor: disabled ? 'not-allowed' : 'pointer',
                padding: 0,
                opacity: disabled ? 0.5 : 1,
              }}
            >
              Clear
            </button>
          </div>

          {/* Size checkboxes */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {AVAILABLE_SIZES.map((size) => {
              const isSelected = selectedSizes.includes(size.value);
              return (
                <div
                  key={size.value}
                  role="checkbox"
                  aria-checked={isSelected}
                  tabIndex={0}
                  onClick={() => toggleSize(size.value)}
                  onKeyDown={(e) => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); toggleSize(size.value); } }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '5px 8px',
                    background: isSelected ? 'var(--accent-dim)' : 'var(--bg-darkest)',
                    border: `1px solid ${isSelected ? 'var(--accent)' : 'var(--border)'}`,
                    borderRadius: '4px',
                    cursor: disabled ? 'not-allowed' : 'pointer',
                    transition: 'all 0.15s',
                    opacity: disabled ? 0.6 : 1,
                  }}
                >
                  {/* Checkbox */}
                  <div
                    style={{
                      width: '14px',
                      height: '14px',
                      borderRadius: '3px',
                      border: `1.5px solid ${isSelected ? 'var(--accent)' : 'var(--border-light)'}`,
                      background: isSelected ? 'var(--accent)' : 'transparent',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      transition: 'all 0.15s',
                    }}
                  >
                    {isSelected && (
                      <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                        <path d="M2 6L5 9L10 3" stroke="#000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </div>

                  {/* Size thumbnail */}
                  <div
                    style={{
                      width: '28px',
                      height: '20px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <div
                      style={{
                        width: `${Math.min(26, size.width / 30)}px`,
                        height: `${Math.min(18, size.height / 30)}px`,
                        minWidth: '4px',
                        minHeight: '3px',
                        border: `1px solid ${isSelected ? 'var(--accent)' : 'var(--text-muted)'}`,
                        borderRadius: '1px',
                        opacity: isSelected ? 1 : 0.5,
                      }}
                    />
                  </div>

                  {/* Label */}
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: isSelected ? 600 : 400,
                      color: isSelected ? 'var(--accent)' : 'var(--text-secondary)',
                      fontFamily: 'var(--font-geist-mono), monospace',
                    }}
                  >
                    {size.label}
                  </span>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
