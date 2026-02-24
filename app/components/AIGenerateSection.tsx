'use client';

import { useState } from 'react';
import type { CampaignConfig } from '../../lib/types';

// ── Visual tone options ──────────────────────────────────────────────────────

const VISUAL_TONES = [
  'Warm & Hopeful',
  'Clinical & Trustworthy',
  'Active & Energetic',
  'Calm & Reassuring',
] as const;

// ── Props ────────────────────────────────────────────────────────────────────

interface Props {
  config: CampaignConfig;
  onConfigUpdate: (config: CampaignConfig) => void;
}

// ── Component ────────────────────────────────────────────────────────────────

export default function AIGenerateSection({ config, onConfigUpdate }: Props) {
  const [keyMessage, setKeyMessage] = useState('');
  const [visualTone, setVisualTone] = useState<string>(VISUAL_TONES[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!keyMessage.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          keyMessage: keyMessage.trim(),
          visualTone,
          size: config.size.preset || `${config.size.width}x${config.size.height}`,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || `Request failed (${res.status})`);
        return;
      }

      // ── Map n8n response onto the CampaignConfig ──────────────────────
      const updatedConfig = applyAIResponse(config, data);
      onConfigUpdate(updatedConfig);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Network error';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        padding: '14px',
        borderBottom: '1px solid var(--border)',
        background: 'var(--bg-dark)',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          marginBottom: '12px',
        }}
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
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
            fontWeight: 700,
            fontSize: '11px',
            textTransform: 'uppercase',
            letterSpacing: '0.8px',
            color: 'var(--accent)',
          }}
        >
          Generate with AI
        </span>
      </div>

      {/* Key Message */}
      <label
        style={{
          display: 'block',
          fontSize: '11px',
          color: 'var(--text-secondary)',
          fontWeight: 600,
          marginBottom: '4px',
        }}
      >
        Key Message
      </label>
      <textarea
        rows={3}
        placeholder="e.g., Emphasize efficacy data, hopeful tone"
        value={keyMessage}
        onChange={(e) => setKeyMessage(e.target.value)}
        disabled={loading}
        style={{
          resize: 'vertical',
          marginBottom: '8px',
          opacity: loading ? 0.6 : 1,
        }}
      />

      {/* Visual Tone */}
      <label
        style={{
          display: 'block',
          fontSize: '11px',
          color: 'var(--text-secondary)',
          fontWeight: 600,
          marginBottom: '4px',
        }}
      >
        Visual Tone
      </label>
      <select
        value={visualTone}
        onChange={(e) => setVisualTone(e.target.value)}
        disabled={loading}
        style={{ marginBottom: '12px', opacity: loading ? 0.6 : 1 }}
      >
        {VISUAL_TONES.map((tone) => (
          <option key={tone} value={tone}>
            {tone}
          </option>
        ))}
      </select>

      {/* Generate button */}
      <button
        onClick={handleGenerate}
        disabled={loading || !keyMessage.trim()}
        style={{
          width: '100%',
          padding: '10px 16px',
          fontSize: '12px',
          fontFamily: 'var(--font-montserrat), Montserrat, sans-serif',
          fontWeight: 700,
          background: loading ? 'var(--bg-mid)' : 'var(--accent)',
          border: '1px solid var(--accent)',
          color: loading ? 'var(--text-secondary)' : '#000',
          borderRadius: '6px',
          cursor: loading || !keyMessage.trim() ? 'not-allowed' : 'pointer',
          transition: 'all 0.15s',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          opacity: !keyMessage.trim() && !loading ? 0.5 : 1,
        }}
      >
        {loading ? (
          <>
            <Spinner />
            Generating... (~20 seconds)
          </>
        ) : (
          <>
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <path
                d="M8 1L10 5.5L15 6.5L11.5 10L12.5 15L8 12.5L3.5 15L4.5 10L1 6.5L6 5.5L8 1Z"
                fill="currentColor"
              />
            </svg>
            Generate with AI
          </>
        )}
      </button>

      {/* Error banner */}
      {error && (
        <div
          style={{
            marginTop: '10px',
            padding: '8px 10px',
            background: 'rgba(231, 76, 60, 0.15)',
            border: '1px solid rgba(231, 76, 60, 0.4)',
            borderRadius: '4px',
            fontSize: '11px',
            color: '#E74C3C',
            lineHeight: '1.4',
          }}
        >
          {error}
        </div>
      )}
    </div>
  );
}

// ── Spinner ──────────────────────────────────────────────────────────────────

function Spinner() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      style={{ animation: 'spin 1s linear infinite' }}
    >
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <circle cx="8" cy="8" r="6" stroke="var(--text-muted)" strokeWidth="2" fill="none" />
      <path
        d="M14 8a6 6 0 0 0-6-6"
        stroke="var(--accent)"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

// ── Map AI response onto CampaignConfig ──────────────────────────────────────
// Handles various possible response shapes from n8n.

function applyAIResponse(
  config: CampaignConfig,
  data: Record<string, unknown>,
): CampaignConfig {
  const updated = structuredClone(config);

  // Background image — apply to all frames
  const bgUrl =
    (data.background_image_url as string) ||
    (data.backgroundImageUrl as string) ||
    (data.image_url as string) ||
    null;

  if (bgUrl) {
    updated.frames.forEach((frame) => {
      frame.backgroundImageUrl = bgUrl;
    });
  }

  // Frames — update headlines and body copy if provided
  const aiFrames = data.frames as
    | Array<{
        headline?: string;
        body?: string;
        body_copy?: string;
        bodyCopy?: string;
        cta_text?: string;
        ctaText?: string;
      }>
    | undefined;

  if (Array.isArray(aiFrames)) {
    aiFrames.forEach((aiFrame, i) => {
      if (i < updated.frames.length) {
        if (aiFrame.headline) {
          updated.frames[i].headline.text = aiFrame.headline;
        }
        const bodyText =
          aiFrame.body || aiFrame.body_copy || aiFrame.bodyCopy || null;
        if (bodyText && updated.frames[i].bodyCopy) {
          updated.frames[i].bodyCopy!.text = bodyText;
        }
        // Per-frame CTA
        const frameCta = aiFrame.cta_text || aiFrame.ctaText || null;
        if (frameCta && updated.frames[i].cta) {
          updated.frames[i].cta!.text = frameCta;
        }
      }
    });
  }

  // Top-level CTA text — apply to all frames that have a CTA
  const ctaText =
    (data.cta_text as string) || (data.ctaText as string) || null;
  if (ctaText) {
    updated.frames.forEach((frame) => {
      if (frame.cta) {
        frame.cta.text = ctaText;
      }
    });
  }

  return updated;
}
