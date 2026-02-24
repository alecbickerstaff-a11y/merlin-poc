'use client';

import { useCallback, useState } from 'react';
import type { CampaignConfig } from '../../lib/types';

interface Props {
  config: CampaignConfig;
}

// Basic JSON syntax highlighting — color keys, strings, numbers, booleans
function highlightJSON(json: string): string {
  return json
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    // Keys (property names)
    .replace(
      /("(?:[^"\\]|\\.)*")(\s*:)/g,
      '<span style="color:#F39C12">$1</span>$2',
    )
    // String values
    .replace(
      /:\s*("(?:[^"\\]|\\.)*")/g,
      (match, str) => match.replace(str, `<span style="color:#27AE60">${str}</span>`),
    )
    // Numbers
    .replace(
      /:\s*(-?\d+\.?\d*)/g,
      (match, num) => match.replace(num, `<span style="color:#3498DB">${num}</span>`),
    )
    // Booleans & null
    .replace(
      /:\s*(true|false|null)/g,
      (match, val) => match.replace(val, `<span style="color:#E74C3C">${val}</span>`),
    );
}

export default function ConfigPanel({ config }: Props) {
  const [collapsed, setCollapsed] = useState(false);
  const jsonStr = JSON.stringify(config, null, 2);

  const copyJSON = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(jsonStr);
      alert('JSON copied to clipboard!');
    } catch {
      const ta = document.createElement('textarea');
      ta.value = jsonStr;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      alert('JSON copied to clipboard!');
    }
  }, [jsonStr]);

  if (collapsed) {
    return (
      <div
        style={{
          width: '32px',
          minWidth: '32px',
          height: '100%',
          background: 'var(--bg-dark)',
          borderLeft: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'center',
          paddingTop: '12px',
          cursor: 'pointer',
        }}
        onClick={() => setCollapsed(false)}
        title="Expand Config Panel"
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 12 12"
          fill="none"
          style={{ transform: 'rotate(180deg)' }}
        >
          <path d="M4 2L8 6L4 10" stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </div>
    );
  }

  return (
    <div
      style={{
        width: '320px',
        minWidth: '320px',
        height: '100%',
        background: 'var(--bg-dark)',
        borderLeft: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 14px',
          borderBottom: '1px solid var(--border)',
        }}
      >
        <span
          style={{
            fontFamily: 'var(--font-montserrat), Montserrat, sans-serif',
            fontWeight: 700,
            fontSize: '13px',
            letterSpacing: '0.5px',
            color: 'var(--accent)',
          }}
        >
          Config
        </span>
        <div style={{ display: 'flex', gap: '6px' }}>
          <button className="action-btn" onClick={copyJSON} style={{ fontSize: '10px', padding: '4px 10px' }}>
            Copy JSON
          </button>
          <button
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '4px',
            }}
            onClick={() => setCollapsed(true)}
            title="Collapse"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M4 2L8 6L4 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      </div>

      {/* JSON view */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '12px',
        }}
      >
        <pre
          style={{
            fontFamily: 'var(--font-geist-mono), monospace',
            fontSize: '10.5px',
            lineHeight: '1.5',
            margin: 0,
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
          }}
          dangerouslySetInnerHTML={{ __html: highlightJSON(jsonStr) }}
        />
      </div>
    </div>
  );
}
