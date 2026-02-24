'use client';

import { useCallback, useState } from 'react';
import type { CampaignConfig } from '../../lib/types';

interface Props {
  config: CampaignConfig;
  html: string;
  onReset: () => void;
}

export default function PreviewPanel({ config, html, onReset }: Props) {
  const { width, height } = config.size;
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saved' | 'error'>('idle');

  const downloadHTML = useCallback(() => {
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `banner-${width}x${height}.html`;
    a.click();
    URL.revokeObjectURL(url);
  }, [html, width, height]);

  const copyHTML = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(html);
      alert('HTML copied to clipboard!');
    } catch {
      // Fallback
      const ta = document.createElement('textarea');
      ta.value = html;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      alert('HTML copied to clipboard!');
    }
  }, [html]);

  const saveToAssets = useCallback(async () => {
    setSaving(true);
    setSaveStatus('idle');
    try {
      const res = await fetch('/api/assets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          config,
          html,
          generationSource: 'ai',
        }),
      });

      if (res.ok) {
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 3000);
      } else {
        const data = await res.json();
        console.error('Save failed:', data.error);
        setSaveStatus('error');
        setTimeout(() => setSaveStatus('idle'), 3000);
      }
    } catch {
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } finally {
      setSaving(false);
    }
  }, [config, html]);

  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--bg-darkest)',
        overflow: 'hidden',
      }}
    >
      {/* Preview area */}
      <div
        className="checkered-bg"
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'auto',
          padding: '24px',
        }}
      >
        <div
          style={{
            width: `${width}px`,
            height: `${height}px`,
            flexShrink: 0,
            boxShadow: '0 4px 24px rgba(0,0,0,0.5)',
          }}
        >
          <iframe
            srcDoc={html}
            title="Banner Preview"
            style={{
              width: `${width}px`,
              height: `${height}px`,
              border: 'none',
              display: 'block',
            }}
            sandbox="allow-scripts allow-same-origin"
          />
        </div>
      </div>

      {/* Bottom bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 12px',
          background: 'var(--bg-dark)',
          borderTop: '1px solid var(--border)',
          gap: '8px',
          flexWrap: 'wrap',
        }}
      >
        <span
          style={{
            fontSize: '11px',
            color: 'var(--text-secondary)',
            fontFamily: 'var(--font-geist-mono), monospace',
            whiteSpace: 'nowrap',
          }}
        >
          {width} &times; {height}
          <span style={{ color: 'var(--text-muted)', marginLeft: '6px' }}>
            {(new Blob([html]).size / 1024).toFixed(1)} KB
          </span>
        </span>

        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
          <button
            className="action-btn primary"
            onClick={saveToAssets}
            disabled={saving}
            style={{ fontSize: '10px', padding: '5px 10px' }}
          >
            {saving ? 'Saving...' : saveStatus === 'saved' ? '✓ Saved' : saveStatus === 'error' ? 'DB Not Set Up' : 'Save to Assets'}
          </button>
          <button className="action-btn" onClick={downloadHTML} style={{ fontSize: '10px', padding: '5px 10px' }}>
            Download HTML
          </button>
          <button className="action-btn" disabled title="Coming soon" style={{ fontSize: '10px', padding: '5px 10px' }}>
            PNG
          </button>
          <button className="action-btn" onClick={copyHTML} style={{ fontSize: '10px', padding: '5px 10px' }}>
            Copy HTML
          </button>
          <button className="action-btn" onClick={onReset} style={{ fontSize: '10px', padding: '5px 10px' }}>
            Reset
          </button>
        </div>
      </div>
    </div>
  );
}
