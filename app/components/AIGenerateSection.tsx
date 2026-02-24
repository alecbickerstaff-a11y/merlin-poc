'use client';

import { useState } from 'react';
import type { CampaignConfig, GenerationJob } from '../../lib/types';
import { useWorkspace } from '../context/WorkspaceContext';
import SizeSelector from './SizeSelector';
import GenerationProgress from './GenerationProgress';

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
  const { state, dispatch } = useWorkspace();
  const [keyMessage, setKeyMessage] = useState('');
  const [visualTone, setVisualTone] = useState<string>(VISUAL_TONES[0]);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([
    config.size.preset || '300x250',
  ]);
  const [error, setError] = useState<string | null>(null);

  const loading = state.isGenerating;

  const handleGenerate = async () => {
    if (!keyMessage.trim()) return;
    if (selectedSizes.length === 0) {
      setError('Select at least one banner size.');
      return;
    }

    setError(null);

    // ── Single-size mode (1 size selected): same as before ──────────────
    if (selectedSizes.length === 1) {
      dispatch({ type: 'SET_IS_GENERATING', value: true });

      try {
        const res = await fetch('/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            keyMessage: keyMessage.trim(),
            visualTone,
            size: selectedSizes[0],
          }),
        });

        const data = await res.json();

        if (!res.ok) {
          setError(data.error || `Request failed (${res.status})`);
          return;
        }

        // Apply to the current editor config
        const updatedConfig = applyAIResponse(config, data);
        onConfigUpdate(updatedConfig);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Network error';
        setError(msg);
      } finally {
        dispatch({ type: 'SET_IS_GENERATING', value: false });
      }
      return;
    }

    // ── Multi-size mode ─────────────────────────────────────────────────
    dispatch({ type: 'SET_IS_GENERATING', value: true });

    // Create initial job list
    const initialJobs: GenerationJob[] = selectedSizes.map((size) => ({
      id: `job-${size}-${Date.now()}`,
      size,
      status: 'generating',
    }));
    dispatch({ type: 'SET_GENERATION_JOBS', jobs: initialJobs });

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          keyMessage: keyMessage.trim(),
          visualTone,
          sizes: selectedSizes,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || `Request failed (${res.status})`);
        // Mark all jobs as errored
        const errorJobs: GenerationJob[] = initialJobs.map((j) => ({
          ...j,
          status: 'error' as const,
          error: data.error || 'Request failed',
        }));
        dispatch({ type: 'SET_GENERATION_JOBS', jobs: errorJobs });
        return;
      }

      // Map results back to jobs
      const results = data.results as Array<{
        size: string;
        status: 'complete' | 'error';
        data?: Record<string, unknown>;
        error?: string;
      }>;

      const updatedJobs: GenerationJob[] = initialJobs.map((job) => {
        const result = results.find((r) => r.size === job.size);
        if (!result) {
          return { ...job, status: 'error' as const, error: 'No result returned' };
        }

        if (result.status === 'complete' && result.data) {
          // Build a config for this size
          const sizeConfig = buildConfigForSize(config, job.size, result.data);
          return {
            ...job,
            status: 'complete' as const,
            config: sizeConfig,
          };
        }

        return {
          ...job,
          status: 'error' as const,
          error: result.error || 'Generation failed',
        };
      });

      dispatch({ type: 'SET_GENERATION_JOBS', jobs: updatedJobs });

      // Also update the editor with the first successful result
      const firstSuccess = updatedJobs.find((j) => j.status === 'complete' && j.config);
      if (firstSuccess?.config) {
        onConfigUpdate(firstSuccess.config);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Network error';
      setError(msg);
      const errorJobs: GenerationJob[] = initialJobs.map((j) => ({
        ...j,
        status: 'error' as const,
        error: msg,
      }));
      dispatch({ type: 'SET_GENERATION_JOBS', jobs: errorJobs });
    } finally {
      dispatch({ type: 'SET_IS_GENERATING', value: false });
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

      {/* Size Selector */}
      <SizeSelector
        selectedSizes={selectedSizes}
        onChange={setSelectedSizes}
        disabled={loading}
      />

      {/* Generate button */}
      <button
        onClick={handleGenerate}
        disabled={loading || !keyMessage.trim() || selectedSizes.length === 0}
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
          cursor: loading || !keyMessage.trim() || selectedSizes.length === 0 ? 'not-allowed' : 'pointer',
          transition: 'all 0.15s',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          opacity: (!keyMessage.trim() || selectedSizes.length === 0) && !loading ? 0.5 : 1,
        }}
      >
        {loading ? (
          <>
            <Spinner />
            Generating {selectedSizes.length > 1 ? `${selectedSizes.length} banners` : ''}... (~20s)
          </>
        ) : (
          <>
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <path
                d="M8 1L10 5.5L15 6.5L11.5 10L12.5 15L8 12.5L3.5 15L4.5 10L1 6.5L6 5.5L8 1Z"
                fill="currentColor"
              />
            </svg>
            Generate {selectedSizes.length > 1 ? `${selectedSizes.length} Banners` : 'with AI'}
          </>
        )}
      </button>

      {/* Generation Progress (multi-size) */}
      {state.generationJobs.length > 0 && (
        <div style={{ marginTop: '10px' }}>
          <GenerationProgress jobs={state.generationJobs} />
        </div>
      )}

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

// ── Build a config for a specific size from base config + AI response ───────

function buildConfigForSize(
  baseConfig: CampaignConfig,
  size: string,
  data: Record<string, unknown>,
): CampaignConfig {
  const [w, h] = size.split('x').map(Number);
  const updated = structuredClone(baseConfig);

  // Set size
  updated.size = { width: w, height: h, preset: size as CampaignConfig['size']['preset'] };

  // Apply AI response data
  return applyAIResponse(updated, data);
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
