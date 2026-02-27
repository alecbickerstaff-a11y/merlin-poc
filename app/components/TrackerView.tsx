'use client';

import { useState, useEffect, useCallback } from 'react';
import type { TrackerData, Asset } from '../../lib/types';

// =============================================================================
// Stat Card
// =============================================================================

function StatCard({
  label,
  value,
  sublabel,
  accent,
}: {
  label: string;
  value: string | number;
  sublabel?: string;
  accent?: boolean;
}) {
  return (
    <div
      style={{
        background: 'var(--bg-dark)',
        border: '1px solid var(--border)',
        borderRadius: '8px',
        padding: '16px 20px',
        flex: 1,
        minWidth: '140px',
      }}
    >
      <div
        style={{
          fontSize: '10px',
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.8px',
          color: 'var(--text-muted)',
          marginBottom: '6px',
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: '28px',
          fontWeight: 800,
          color: accent ? 'var(--accent)' : 'var(--text-primary)',
          fontFamily: 'var(--font-montserrat), Montserrat, sans-serif',
          lineHeight: 1,
        }}
      >
        {value}
      </div>
      {sublabel && (
        <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px' }}>
          {sublabel}
        </div>
      )}
    </div>
  );
}

// =============================================================================
// Horizontal Bar Chart
// =============================================================================

function HorizontalBarChart({
  title,
  data,
  colorFn,
}: {
  title: string;
  data: Record<string, number>;
  colorFn?: (key: string, index: number) => string;
}) {
  const entries = Object.entries(data).sort((a, b) => b[1] - a[1]);
  const maxVal = Math.max(...entries.map(([, v]) => v), 1);

  const defaultColors = ['#6366f1', '#00CCC0', '#f59e0b', '#ec4899', '#22c55e', '#ef4444', '#8b5cf6', '#64748b'];

  if (entries.length === 0) {
    return (
      <div style={chartContainerStyle}>
        <h3 style={chartTitleStyle}>{title}</h3>
        <p style={{ fontSize: '11px', color: 'var(--text-muted)', fontStyle: 'italic' }}>No data yet</p>
      </div>
    );
  }

  return (
    <div style={chartContainerStyle}>
      <h3 style={chartTitleStyle}>{title}</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {entries.map(([key, val], i) => {
          const color = colorFn ? colorFn(key, i) : defaultColors[i % defaultColors.length];
          const pct = (val / maxVal) * 100;
          return (
            <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div
                style={{
                  width: '100px',
                  fontSize: '10px',
                  fontWeight: 600,
                  color: 'var(--text-secondary)',
                  textAlign: 'right',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                }}
                title={key}
              >
                {key}
              </div>
              <div style={{ flex: 1, height: '18px', background: 'var(--bg-darkest)', borderRadius: '3px', overflow: 'hidden' }}>
                <div
                  style={{
                    width: `${pct}%`,
                    height: '100%',
                    background: color,
                    borderRadius: '3px',
                    transition: 'width 0.5s',
                    minWidth: '2px',
                  }}
                />
              </div>
              <div style={{ width: '36px', fontSize: '11px', fontWeight: 700, color: 'var(--text-primary)', textAlign: 'right', flexShrink: 0 }}>
                {val}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// =============================================================================
// Timeline Chart (simple sparkline-style)
// =============================================================================

function TimelineChart({ data }: { data: Array<{ date: string; count: number }> }) {
  if (data.length === 0) {
    return (
      <div style={chartContainerStyle}>
        <h3 style={chartTitleStyle}>Generation Activity</h3>
        <p style={{ fontSize: '11px', color: 'var(--text-muted)', fontStyle: 'italic' }}>No generation history yet</p>
      </div>
    );
  }

  const sorted = [...data].sort((a, b) => a.date.localeCompare(b.date));
  const maxCount = Math.max(...sorted.map((d) => d.count), 1);

  return (
    <div style={chartContainerStyle}>
      <h3 style={chartTitleStyle}>Generation Activity</h3>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: '3px', height: '80px' }}>
        {sorted.map((d) => {
          const heightPct = (d.count / maxCount) * 100;
          const dateLabel = new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          return (
            <div
              key={d.date}
              style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}
              title={`${dateLabel}: ${d.count} assets`}
            >
              <div
                style={{
                  width: '100%',
                  maxWidth: '24px',
                  height: `${Math.max(heightPct, 4)}%`,
                  background: 'var(--accent)',
                  borderRadius: '2px 2px 0 0',
                  opacity: 0.8,
                  transition: 'height 0.3s',
                }}
              />
            </div>
          );
        })}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
        {sorted.length > 0 && (
          <>
            <span style={{ fontSize: '9px', color: 'var(--text-muted)' }}>
              {new Date(sorted[0].date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </span>
            <span style={{ fontSize: '9px', color: 'var(--text-muted)' }}>
              {new Date(sorted[sorted.length - 1].date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </span>
          </>
        )}
      </div>
    </div>
  );
}

// =============================================================================
// Recent Activity
// =============================================================================

function RecentActivity({ assets }: { assets: Asset[] }) {
  if (assets.length === 0) {
    return (
      <div style={chartContainerStyle}>
        <h3 style={chartTitleStyle}>Recent Assets</h3>
        <p style={{ fontSize: '11px', color: 'var(--text-muted)', fontStyle: 'italic' }}>
          No assets yet — generate a banner or create a leave-behind to get started.
        </p>
      </div>
    );
  }

  return (
    <div style={chartContainerStyle}>
      <h3 style={chartTitleStyle}>Recent Assets</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {assets.slice(0, 8).map((asset) => (
          <div
            key={asset.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '6px 8px',
              background: 'var(--bg-darkest)',
              borderRadius: '5px',
            }}
          >
            <span
              style={{
                fontSize: '8px',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                padding: '2px 6px',
                borderRadius: '3px',
                background: asset.contentType === 'leave_behind' ? '#6366f120' : 'var(--accent-dim)',
                color: asset.contentType === 'leave_behind' ? '#6366f1' : 'var(--accent)',
                flexShrink: 0,
              }}
            >
              {asset.contentType === 'leave_behind' ? 'LB' : 'AD'}
            </span>
            <span
              style={{
                flex: 1,
                fontSize: '11px',
                fontWeight: 600,
                color: 'var(--text-secondary)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {asset.name}
            </span>
            <span style={{ fontSize: '9px', color: 'var(--text-muted)', flexShrink: 0 }}>
              {new Date(asset.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// =============================================================================
// TrackerView — Main Component
// =============================================================================

export default function TrackerView() {
  const [data, setData] = useState<TrackerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/tracker');
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || 'Failed to load tracker data.');
        return;
      }
      setData(json);
    } catch {
      setError('Failed to connect to the database.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
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
    );
  }

  if (error) {
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
          <polyline points="1,12 5,6 9,9 15,2" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          <line x1="1" y1="14" x2="15" y2="14" stroke="currentColor" strokeWidth="1.5" />
        </svg>
        <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-secondary)', margin: '0 0 8px' }}>
          Tracker Unavailable
        </h3>
        <p style={{ fontSize: '13px', textAlign: 'center', lineHeight: 1.6, maxWidth: '400px', margin: 0 }}>
          {error}
        </p>
      </div>
    );
  }

  if (!data) return null;

  // Determine top entries for stat cards
  const topSize = Object.entries(data.sizeDistribution).sort((a, b) => b[1] - a[1])[0];
  const topTone = Object.entries(data.toneDistribution).sort((a, b) => b[1] - a[1])[0];
  const topMessaging = Object.entries(data.messagingTypes).sort((a, b) => b[1] - a[1])[0];

  return (
    <div style={{ height: '100%', overflow: 'auto' }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '24px' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
          <h2
            style={{
              margin: 0,
              fontSize: '18px',
              fontWeight: 800,
              color: 'var(--text-primary)',
              fontFamily: 'var(--font-montserrat), Montserrat, sans-serif',
            }}
          >
            Metadata Tracker
          </h2>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            Creative asset analytics and compliance overview
          </span>
          <button
            onClick={fetchData}
            style={{
              marginLeft: 'auto',
              padding: '5px 12px',
              fontSize: '11px',
              fontWeight: 600,
              color: 'var(--text-secondary)',
              background: 'var(--bg-mid)',
              border: '1px solid var(--border)',
              borderRadius: '5px',
              cursor: 'pointer',
            }}
          >
            Refresh
          </button>
        </div>

        {/* Stat cards row */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
          <StatCard label="Total Assets" value={data.totalAssets} accent />
          <StatCard
            label="Most Used Size"
            value={topSize ? topSize[0] : '—'}
            sublabel={topSize ? `${topSize[1]} assets` : undefined}
          />
          <StatCard
            label="Top Visual Tone"
            value={topTone ? topTone[0] : '—'}
            sublabel={topTone ? `${topTone[1]} assets` : undefined}
          />
          <StatCard
            label="Top Messaging"
            value={topMessaging ? topMessaging[0] : '—'}
            sublabel={topMessaging ? `${topMessaging[1]} assets` : undefined}
          />
        </div>

        {/* Charts grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
            gap: '16px',
            marginBottom: '20px',
          }}
        >
          <HorizontalBarChart
            title="Size Distribution"
            data={data.sizeDistribution}
            colorFn={(_, i) => ['#6366f1', '#00CCC0', '#f59e0b', '#ec4899', '#22c55e'][i % 5]}
          />
          <HorizontalBarChart
            title="Visual Tone"
            data={data.toneDistribution}
            colorFn={(_, i) => ['#008299', '#00CCC0', '#FFE600', '#f59e0b', '#ec4899'][i % 5]}
          />
          <HorizontalBarChart
            title="Claims Usage"
            data={data.claimsUsage}
            colorFn={() => '#008299'}
          />
          <HorizontalBarChart
            title="Messaging Types"
            data={data.messagingTypes}
            colorFn={(_, i) => ['#6366f1', '#22c55e', '#f59e0b', '#ec4899', '#64748b'][i % 5]}
          />
          <HorizontalBarChart
            title="Imagery Descriptors"
            data={data.imageryTypes}
            colorFn={() => '#00CCC0'}
          />
          <TimelineChart data={data.generationTimeline} />
        </div>

        {/* Recent activity */}
        <RecentActivity assets={data.recentActivity} />
      </div>
    </div>
  );
}

// =============================================================================
// Shared styles
// =============================================================================

const chartContainerStyle: React.CSSProperties = {
  background: 'var(--bg-dark)',
  border: '1px solid var(--border)',
  borderRadius: '8px',
  padding: '16px 20px',
};

const chartTitleStyle: React.CSSProperties = {
  margin: '0 0 12px',
  fontSize: '12px',
  fontWeight: 700,
  color: 'var(--text-primary)',
  fontFamily: 'var(--font-montserrat), Montserrat, sans-serif',
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
};
