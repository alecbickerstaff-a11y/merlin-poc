'use client';

import React, { useState } from 'react';
import type { CampaignConfig, BannerPreset, FrameConfig, FrameTransition } from '../../lib/types';
import CollapsibleSection from './CollapsibleSection';

interface Props {
  config: CampaignConfig;
  onChange: (config: CampaignConfig) => void;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function Label({ children, sub }: { children: React.ReactNode; sub?: string }) {
  return (
    <label
      style={{
        display: 'block',
        fontSize: '11px',
        color: 'var(--text-secondary)',
        marginBottom: sub ? '0' : '4px',
        fontWeight: 600,
      }}
    >
      {children}
      {sub && (
        <span style={{ fontWeight: 400, color: 'var(--text-muted)', marginLeft: 4 }}>
          {sub}
        </span>
      )}
    </label>
  );
}

function FieldRow({ children }: { children: React.ReactNode }) {
  return <div style={{ marginBottom: '10px' }}>{children}</div>;
}

function InlineRow({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
      {children}
    </div>
  );
}

function Toggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="toggle-switch">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span className="toggle-slider" />
    </label>
  );
}

// ── Presets ───────────────────────────────────────────────────────────────────

const SIZE_PRESETS: { label: string; preset: BannerPreset; w: number; h: number }[] = [
  { label: '300\u00D7250', preset: '300x250', w: 300, h: 250 },
  { label: '728\u00D790', preset: '728x90', w: 728, h: 90 },
  { label: '300\u00D7600', preset: '300x600', w: 300, h: 600 },
  { label: '160\u00D7600', preset: '160x600', w: 160, h: 600 },
  { label: '320\u00D750', preset: '320x50', w: 320, h: 50 },
];

const FONT_OPTIONS = [
  'Montserrat',
  'Open Sans',
  'Roboto',
  'Lato',
  'Playfair Display',
  'Raleway',
  'Poppins',
  'Oswald',
];

// ── Logo Uploader ────────────────────────────────────────────────────────────

function LogoUploader({
  logoUrl,
  onChange,
}: {
  logoUrl?: string;
  onChange: (url: string | undefined) => void;
}) {
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const handleFile = (file: File) => {
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = () => {
      onChange(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const isBase64 = logoUrl?.startsWith('data:');

  return (
    <div>
      {/* Upload / drop zone */}
      {!logoUrl && (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          style={{
            border: `1px dashed ${dragging ? 'var(--accent)' : 'var(--border-light)'}`,
            borderRadius: '4px',
            padding: '14px 8px',
            textAlign: 'center',
            cursor: 'pointer',
            background: dragging ? 'var(--accent-dim)' : 'var(--bg-darkest)',
            transition: 'all 0.15s',
          }}
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" style={{ margin: '0 auto 6px', display: 'block' }}>
            <path d="M10 4V14M10 4L6 8M10 4L14 8" stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M3 14V15C3 16.1046 3.89543 17 5 17H15C16.1046 17 17 16.1046 17 15V14" stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <span style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'block' }}>
            Click to upload or drag &amp; drop
          </span>
          <span style={{ fontSize: '9px', color: 'var(--text-muted)', display: 'block', marginTop: '2px', opacity: 0.6 }}>
            PNG, SVG, JPG
          </span>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleInputChange}
            style={{ display: 'none' }}
          />
        </div>
      )}

      {/* URL input (always visible when no file uploaded, or as alternate) */}
      {!logoUrl && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px' }}>
          <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
          <span style={{ fontSize: '9px', color: 'var(--text-muted)' }}>or paste URL</span>
          <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
        </div>
      )}
      {!logoUrl && (
        <input
          type="url"
          placeholder="https://example.com/logo.png"
          style={{ marginTop: '6px' }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              const val = (e.target as HTMLInputElement).value.trim();
              if (val) onChange(val);
            }
          }}
          onBlur={(e) => {
            const val = e.target.value.trim();
            if (val) onChange(val);
          }}
        />
      )}

      {/* Preview & remove */}
      {logoUrl && (
        <div
          style={{
            padding: '8px',
            background: 'var(--bg-darkest)',
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}
        >
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '4px',
              border: '1px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: '#fff',
              flexShrink: 0,
              overflow: 'hidden',
            }}
          >
            <img
              src={logoUrl}
              alt="Logo"
              style={{ maxWidth: '44px', maxHeight: '44px', objectFit: 'contain' }}
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '10px', color: 'var(--text-primary)', fontWeight: 600 }}>
              {isBase64 ? 'Uploaded image' : 'URL'}
            </div>
            {!isBase64 && (
              <div style={{ fontSize: '9px', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {logoUrl}
              </div>
            )}
          </div>
          <button
            onClick={() => onChange(undefined)}
            style={{
              background: 'transparent',
              border: '1px solid var(--border-light)',
              color: 'var(--text-muted)',
              borderRadius: '3px',
              padding: '3px 8px',
              fontSize: '9px',
              cursor: 'pointer',
              flexShrink: 0,
            }}
          >
            Remove
          </button>
        </div>
      )}
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────────────────────

export default function PropertiesPanel({ config, onChange }: Props) {
  // Deep-update helpers
  const update = (partial: Partial<CampaignConfig>) => {
    onChange({ ...config, ...partial });
  };

  const updateFrame = (index: number, partial: Partial<FrameConfig>) => {
    const frames = config.frames.map((f, i) =>
      i === index ? { ...f, ...partial } : f,
    );
    const totalDuration = frames.reduce((sum, f) => sum + f.duration, 0);
    update({
      frames,
      animation: { ...config.animation, totalDuration },
    });
  };

  const addFrame = () => {
    const newFrame: FrameConfig = {
      id: `frame-${Date.now()}`,
      duration: 3000,
      headline: { text: 'New Frame', fontSize: '20px', color: '#FFFFFF', position: 'center' },
      bodyCopy: { text: 'Body copy here', fontSize: '11px', color: '#FFFFFF' },
      transition: 'fade',
      overlayOpacity: 0.5,
    };
    const frames = [...config.frames, newFrame];
    const totalDuration = frames.reduce((sum, f) => sum + f.duration, 0);
    update({
      frames,
      animation: { ...config.animation, totalDuration },
    });
  };

  const removeFrame = (index: number) => {
    if (config.frames.length <= 1) return;
    const frames = config.frames.filter((_, i) => i !== index);
    const totalDuration = frames.reduce((sum, f) => sum + f.duration, 0);
    update({
      frames,
      animation: { ...config.animation, totalDuration },
    });
  };

  return (
    <div
      style={{
        flex: 1,
        minHeight: 0,
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Panel Header */}
      <div
        style={{
          padding: '12px 14px',
          borderBottom: '1px solid var(--border)',
          fontFamily: 'var(--font-montserrat), Montserrat, sans-serif',
          fontWeight: 700,
          fontSize: '13px',
          letterSpacing: '0.5px',
          color: 'var(--accent)',
        }}
      >
        Properties
      </div>

      {/* ── Banner Size ── */}
      <CollapsibleSection title="Banner Size" defaultOpen>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '8px' }}>
          {SIZE_PRESETS.map((p) => (
            <button
              key={p.preset}
              className={`preset-btn ${config.size.preset === p.preset ? 'active' : ''}`}
              onClick={() =>
                update({
                  size: { width: p.w, height: p.h, preset: p.preset },
                })
              }
            >
              {p.label}
            </button>
          ))}
          <button
            className={`preset-btn ${config.size.preset === 'custom' ? 'active' : ''}`}
            onClick={() =>
              update({
                size: { ...config.size, preset: 'custom' },
              })
            }
          >
            Custom
          </button>
        </div>
        {config.size.preset === 'custom' && (
          <div style={{ display: 'flex', gap: '8px' }}>
            <FieldRow>
              <Label>Width</Label>
              <input
                type="number"
                value={config.size.width}
                min={50}
                max={2000}
                onChange={(e) =>
                  update({
                    size: { ...config.size, width: Number(e.target.value) },
                  })
                }
              />
            </FieldRow>
            <FieldRow>
              <Label>Height</Label>
              <input
                type="number"
                value={config.size.height}
                min={50}
                max={2000}
                onChange={(e) =>
                  update({
                    size: { ...config.size, height: Number(e.target.value) },
                  })
                }
              />
            </FieldRow>
          </div>
        )}
      </CollapsibleSection>

      {/* ── Brand ── */}
      <CollapsibleSection title="Brand">
        <FieldRow>
          <Label>Brand Name</Label>
          <input
            type="text"
            value={config.brand.name}
            onChange={(e) =>
              update({ brand: { ...config.brand, name: e.target.value } })
            }
          />
        </FieldRow>

        <FieldRow>
          <Label sub="optional">Logo</Label>
          <LogoUploader
            logoUrl={config.brand.logoUrl}
            onChange={(url) =>
              update({
                brand: { ...config.brand, logoUrl: url || undefined },
              })
            }
          />
        </FieldRow>

        <Label>Colors</Label>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr',
            gap: '6px',
            marginBottom: '10px',
          }}
        >
          {(
            [
              ['primary', 'Primary'],
              ['secondary', 'Secondary'],
              ['accent', 'Accent'],
              ['background', 'Background'],
              ['textDark', 'Text Dark'],
              ['textLight', 'Text Light'],
            ] as const
          ).map(([key, label]) => (
            <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <input
                type="color"
                value={config.brand.colors[key]}
                onChange={(e) =>
                  update({
                    brand: {
                      ...config.brand,
                      colors: { ...config.brand.colors, [key]: e.target.value },
                    },
                  })
                }
              />
              <span style={{ fontSize: '9px', color: 'var(--text-muted)' }}>{label}</span>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <FieldRow>
            <Label>Headline Font</Label>
            <select
              value={config.brand.typography.headlineFont}
              onChange={(e) =>
                update({
                  brand: {
                    ...config.brand,
                    typography: { ...config.brand.typography, headlineFont: e.target.value },
                  },
                })
              }
            >
              {FONT_OPTIONS.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
          </FieldRow>
          <FieldRow>
            <Label>Body Font</Label>
            <select
              value={config.brand.typography.bodyFont}
              onChange={(e) =>
                update({
                  brand: {
                    ...config.brand,
                    typography: { ...config.brand.typography, bodyFont: e.target.value },
                  },
                })
              }
            >
              {FONT_OPTIONS.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
          </FieldRow>
        </div>
      </CollapsibleSection>

      {/* ── Frames / Content ── */}
      <CollapsibleSection title="Frames / Content" defaultOpen>
        {config.frames.map((frame, idx) => (
          <FrameEditor
            key={frame.id}
            frame={frame}
            index={idx}
            canRemove={config.frames.length > 1}
            defaultClickUrl={config.clickTags.clickTag}
            onChange={(partial) => updateFrame(idx, partial)}
            onRemove={() => removeFrame(idx)}
          />
        ))}
        <button
          className="action-btn"
          style={{ width: '100%', marginTop: '6px' }}
          onClick={addFrame}
        >
          + Add Frame
        </button>
      </CollapsibleSection>

      {/* ── ISI Rules ── */}
      <CollapsibleSection title="ISI Rules">
        <InlineRow>
          <Label>Auto Scroll</Label>
          <Toggle
            checked={config.isi.rules.autoScroll}
            onChange={(v) =>
              update({
                isi: { ...config.isi, rules: { ...config.isi.rules, autoScroll: v } },
              })
            }
          />
        </InlineRow>

        <FieldRow>
          <Label sub={`${config.isi.rules.speed} px/sec`}>Speed</Label>
          <input
            type="range"
            min={5}
            max={50}
            value={config.isi.rules.speed}
            onChange={(e) =>
              update({
                isi: {
                  ...config.isi,
                  rules: { ...config.isi.rules, speed: Number(e.target.value) },
                },
              })
            }
          />
        </FieldRow>

        <div style={{ display: 'flex', gap: '8px' }}>
          <FieldRow>
            <Label sub="ms">Delay</Label>
            <input
              type="number"
              value={config.isi.rules.delay}
              step={500}
              min={0}
              onChange={(e) =>
                update({
                  isi: {
                    ...config.isi,
                    rules: { ...config.isi.rules, delay: Number(e.target.value) },
                  },
                })
              }
            />
          </FieldRow>
          <FieldRow>
            <Label sub="ms">Hard Stop</Label>
            <input
              type="number"
              value={config.isi.rules.hardStop}
              step={1000}
              min={1000}
              onChange={(e) =>
                update({
                  isi: {
                    ...config.isi,
                    rules: { ...config.isi.rules, hardStop: Number(e.target.value) },
                  },
                })
              }
            />
          </FieldRow>
        </div>

        <FieldRow>
          <Label>On Hover</Label>
          <select
            value={config.isi.rules.onHover}
            onChange={(e) =>
              update({
                isi: {
                  ...config.isi,
                  rules: {
                    ...config.isi.rules,
                    onHover: e.target.value as 'pause' | 'expand' | 'none',
                  },
                },
              })
            }
          >
            <option value="pause">Pause</option>
            <option value="expand">Expand</option>
            <option value="none">None</option>
          </select>
        </FieldRow>

        <FieldRow>
          <Label sub={config.isi.rules.stripHeight}>Strip Height</Label>
          <input
            type="range"
            min={10}
            max={50}
            value={parseInt(config.isi.rules.stripHeight)}
            onChange={(e) =>
              update({
                isi: {
                  ...config.isi,
                  rules: { ...config.isi.rules, stripHeight: `${e.target.value}%` },
                },
              })
            }
          />
        </FieldRow>

        <InlineRow>
          <Label>Expandable</Label>
          <Toggle
            checked={config.isi.rules.expandable}
            onChange={(v) =>
              update({
                isi: { ...config.isi, rules: { ...config.isi.rules, expandable: v } },
              })
            }
          />
        </InlineRow>

        <FieldRow>
          <Label>Font Size</Label>
          <input
            type="text"
            value={config.isi.rules.fontSize}
            onChange={(e) =>
              update({
                isi: {
                  ...config.isi,
                  rules: { ...config.isi.rules, fontSize: e.target.value },
                },
              })
            }
          />
        </FieldRow>
      </CollapsibleSection>

      {/* ── Click Tags ── */}
      <CollapsibleSection title="Click Tags">
        <FieldRow>
          <Label>clickTag (primary)</Label>
          <input
            type="url"
            value={config.clickTags.clickTag}
            onChange={(e) =>
              update({ clickTags: { ...config.clickTags, clickTag: e.target.value } })
            }
          />
        </FieldRow>
        <FieldRow>
          <Label sub="optional">clickTag2</Label>
          <input
            type="url"
            value={config.clickTags.clickTag2 || ''}
            placeholder="Optional"
            onChange={(e) =>
              update({
                clickTags: {
                  ...config.clickTags,
                  clickTag2: e.target.value || undefined,
                },
              })
            }
          />
        </FieldRow>
        <FieldRow>
          <Label sub="optional">clickTag3</Label>
          <input
            type="url"
            value={config.clickTags.clickTag3 || ''}
            placeholder="Optional"
            onChange={(e) =>
              update({
                clickTags: {
                  ...config.clickTags,
                  clickTag3: e.target.value || undefined,
                },
              })
            }
          />
        </FieldRow>
      </CollapsibleSection>

      {/* ── Animation ── */}
      <CollapsibleSection title="Animation">
        <FieldRow>
          <Label sub="auto-calculated">Total Duration</Label>
          <input
            type="text"
            value={`${config.animation.totalDuration}ms`}
            readOnly
            style={{ opacity: 0.6, cursor: 'not-allowed' }}
          />
        </FieldRow>
        <FieldRow>
          <Label sub="0 = infinite">Loops</Label>
          <input
            type="number"
            value={config.animation.loops}
            min={0}
            max={100}
            onChange={(e) =>
              update({
                animation: { ...config.animation, loops: Number(e.target.value) },
              })
            }
          />
        </FieldRow>
        <InlineRow>
          <Label>Autoplay</Label>
          <Toggle
            checked={config.animation.autoplay}
            onChange={(v) =>
              update({ animation: { ...config.animation, autoplay: v } })
            }
          />
        </InlineRow>
      </CollapsibleSection>

      {/* ── Image Generation (placeholder) ── */}
      <CollapsibleSection title="Image Generation">
        <FieldRow>
          <Label>Style</Label>
          <select
            value={config.imageGeneration?.style || 'dynamic'}
            onChange={() => {}}
          >
            <option value="dynamic">Dynamic</option>
            <option value="cinematic">Cinematic</option>
            <option value="illustration">Illustration</option>
            <option value="photography">Photography</option>
          </select>
        </FieldRow>

        <Label>Aspect Ratio</Label>
        <div style={{ display: 'flex', gap: '4px', marginBottom: '10px' }}>
          {(['1:1', '2:3', '16:9', '4:3'] as const).map((ar) => (
            <button key={ar} className="preset-btn" disabled>
              {ar}
            </button>
          ))}
        </div>

        <Label>Number of Images</Label>
        <div style={{ display: 'flex', gap: '4px', marginBottom: '10px' }}>
          {[1, 2, 3, 4].map((n) => (
            <button key={n} className="preset-btn" disabled>
              {n}
            </button>
          ))}
        </div>

        <button className="action-btn" disabled style={{ width: '100%' }}>
          Generate Image &mdash; Coming Soon
        </button>
      </CollapsibleSection>
    </div>
  );
}

// ── Frame Editor Sub-Component ───────────────────────────────────────────────

function FrameEditor({
  frame,
  index,
  canRemove,
  defaultClickUrl,
  onChange,
  onRemove,
}: {
  frame: FrameConfig;
  index: number;
  canRemove: boolean;
  defaultClickUrl: string;
  onChange: (partial: Partial<FrameConfig>) => void;
  onRemove: () => void;
}) {
  const [expanded, setExpanded] = useState(index === 0);

  return (
    <div
      style={{
        background: 'var(--bg-darkest)',
        border: '1px solid var(--border)',
        borderRadius: '4px',
        marginBottom: '6px',
        overflow: 'hidden',
      }}
    >
      {/* Frame header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '6px 8px',
          cursor: 'pointer',
          fontSize: '11px',
          fontWeight: 600,
        }}
        onClick={() => setExpanded(!expanded)}
      >
        <span style={{ color: 'var(--accent)' }}>
          Frame {index + 1}
          <span style={{ color: 'var(--text-muted)', fontWeight: 400, marginLeft: '6px' }}>
            {frame.duration}ms
          </span>
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {canRemove && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRemove();
              }}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                fontSize: '10px',
                padding: '2px 4px',
              }}
            >
              Remove
            </button>
          )}
          <svg
            width="10"
            height="10"
            viewBox="0 0 12 12"
            fill="none"
            style={{
              transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)',
              transition: 'transform 0.15s ease',
            }}
          >
            <path d="M4 2L8 6L4 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </div>
      </div>

      {/* Frame body */}
      {expanded && (
        <div style={{ padding: '6px 8px 10px' }}>
          <FieldRow>
            <Label>Headline</Label>
            <input
              type="text"
              value={frame.headline.text}
              onChange={(e) =>
                onChange({ headline: { ...frame.headline, text: e.target.value } })
              }
            />
          </FieldRow>

          <FieldRow>
            <Label>Body Copy</Label>
            <textarea
              rows={2}
              value={frame.bodyCopy?.text || ''}
              style={{ resize: 'vertical' }}
              onChange={(e) =>
                onChange({
                  bodyCopy: { ...frame.bodyCopy, text: e.target.value, fontSize: frame.bodyCopy?.fontSize, color: frame.bodyCopy?.color },
                })
              }
            />
          </FieldRow>

          <div style={{ display: 'flex', gap: '6px' }}>
            <FieldRow>
              <Label>CTA Text</Label>
              <input
                type="text"
                value={frame.cta?.text || ''}
                placeholder="None"
                onChange={(e) =>
                  onChange({
                    cta: e.target.value
                      ? {
                          text: e.target.value,
                          url: frame.cta?.url || defaultClickUrl || '#',
                          backgroundColor: frame.cta?.backgroundColor,
                          textColor: frame.cta?.textColor,
                          borderRadius: frame.cta?.borderRadius,
                        }
                      : undefined,
                  })
                }
              />
            </FieldRow>
            <FieldRow>
              <Label sub="ms">Duration</Label>
              <input
                type="number"
                value={frame.duration}
                step={500}
                min={500}
                onChange={(e) => onChange({ duration: Number(e.target.value) })}
              />
            </FieldRow>
          </div>

          <div style={{ display: 'flex', gap: '6px' }}>
            <FieldRow>
              <Label>Transition</Label>
              <select
                value={frame.transition || 'fade'}
                onChange={(e) =>
                  onChange({ transition: e.target.value as FrameTransition })
                }
              >
                <option value="fade">Fade</option>
                <option value="slide">Slide</option>
                <option value="none">None</option>
              </select>
            </FieldRow>
            <FieldRow>
              <Label sub={`${((frame.overlayOpacity ?? 0.5) * 100).toFixed(0)}%`}>Overlay</Label>
              <input
                type="range"
                min={0}
                max={100}
                value={(frame.overlayOpacity ?? 0.5) * 100}
                onChange={(e) =>
                  onChange({ overlayOpacity: Number(e.target.value) / 100 })
                }
              />
            </FieldRow>
          </div>
        </div>
      )}
    </div>
  );
}

