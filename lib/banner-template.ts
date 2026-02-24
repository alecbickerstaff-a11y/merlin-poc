// =============================================================================
// MERLIN — Banner Template Engine
//
// Takes a CampaignConfig and returns a fully self-contained HTML string that
// renders an animated pharma banner ad. Zero external dependencies (except
// Google Fonts). Works as a standalone file dropped into any ad server.
// =============================================================================

import type { CampaignConfig, FrameConfig } from './types';

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function generateBannerHTML(config: CampaignConfig): string {
  const { size, brand, frames, isi, clickTags, animation } = config;

  const fonts = buildGoogleFontsLink(brand.typography.headlineFont, brand.typography.bodyFont);
  const css = buildCSS(config);
  const framesHTML = frames.map((f, i) => buildFrame(f, i, config)).join('\n');
  const isiHTML = isi.enabled ? buildISI(config) : '';
  const clickTagJS = buildClickTagJS(clickTags);
  const configMeta = escapeHTML(JSON.stringify(config));

  const logoHTML = buildLogo(config);

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="ad.size" content="width=${size.width},height=${size.height}">
<meta name="campaign-config" content='${configMeta}'>
<title>${escapeHTML(brand.name)} — ${size.width}x${size.height}</title>
${fonts}
<style>
${css}
</style>
<script>
${clickTagJS}
</script>
</head>
<body>
<div id="banner" class="banner">
  <a id="click-area" class="click-area" href="javascript:void(0)" onclick="window.open(clickTag)" target="_blank">
    <div class="frames-container">
${framesHTML}
    </div>
${logoHTML}
  </a>
${isiHTML}
</div>
</body>
</html>`;
}

// ---------------------------------------------------------------------------
// Google Fonts
// ---------------------------------------------------------------------------

function buildGoogleFontsLink(headlineFont: string, bodyFont: string): string {
  const familyArr: string[] = [];
  if (!familyArr.includes(headlineFont)) familyArr.push(headlineFont);
  if (!familyArr.includes(bodyFont)) familyArr.push(bodyFont);
  const params = familyArr
    .map((f) => `family=${encodeURIComponent(f)}:wght@400;600;700`)
    .join('&');
  return `<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?${params}&display=swap" rel="stylesheet">`;
}

// ---------------------------------------------------------------------------
// Click-tag JS (ad-server standard)
// ---------------------------------------------------------------------------

function buildClickTagJS(clickTags: CampaignConfig['clickTags']): string {
  const lines = [`var clickTag = "${clickTags.clickTag}";`];
  if (clickTags.clickTag2) lines.push(`var clickTag2 = "${clickTags.clickTag2}";`);
  if (clickTags.clickTag3) lines.push(`var clickTag3 = "${clickTags.clickTag3}";`);
  return lines.join('\n');
}

// ---------------------------------------------------------------------------
// CSS generation
// ---------------------------------------------------------------------------

function buildCSS(config: CampaignConfig): string {
  const { size, brand, frames, isi, animation } = config;
  const totalDur = animation.totalDuration;
  const loopCount = animation.loops === 0 ? 'infinite' : String(animation.loops);

  // Calculate frame timing percentages for the keyframe animation
  const frameKeyframes = buildFrameKeyframes(frames, totalDur);

  // ISI scroll distance and timing
  const isiStripHeight = isi.rules.stripHeight;
  const isiScrollDur = Math.min(
    (isi.rules.hardStop - isi.rules.delay) / 1000,
    totalDur / 1000,
  );

  return `
/* === Reset === */
*, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }
body { margin: 0; padding: 0; background: transparent; overflow: hidden; }

/* === Banner container === */
.banner {
  position: relative;
  width: ${size.width}px;
  height: ${size.height}px;
  overflow: hidden;
  background: ${brand.colors.primary};
  font-family: '${brand.typography.bodyFont}', sans-serif;
  border: 1px solid #ccc;
}

/* === Click area === */
.click-area {
  display: block;
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: ${isi.enabled ? `calc(100% - ${isiStripHeight})` : '100%'};
  z-index: 1;
  text-decoration: none;
  cursor: pointer;
}

/* === Frames container === */
.frames-container {
  position: relative;
  width: 100%;
  height: 100%;
}

/* === Individual frames === */
.frame {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
  overflow: hidden;
}

.frame-bg {
  position: absolute;
  top: 0; left: 0;
  width: 100%;
  height: 100%;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
}

.frame-overlay {
  position: absolute;
  top: 0; left: 0;
  width: 100%;
  height: 100%;
}

.frame-content {
  position: relative;
  z-index: 2;
  padding: 12px 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  height: 100%;
}

.frame-content--top    { justify-content: flex-start; padding-top: 20px; }
.frame-content--center { justify-content: center; }
.frame-content--bottom { justify-content: flex-end; padding-bottom: 20px; }

/* === Typography === */
.headline {
  font-family: '${brand.typography.headlineFont}', sans-serif;
  font-weight: 700;
  color: ${brand.colors.textLight};
  text-shadow: 0 1px 4px rgba(0,0,0,0.5);
  line-height: 1.2;
  margin-bottom: 6px;
}

.body-copy {
  font-family: '${brand.typography.bodyFont}', sans-serif;
  font-weight: 400;
  color: ${brand.colors.textLight};
  text-shadow: 0 1px 3px rgba(0,0,0,0.4);
  line-height: 1.4;
  margin-bottom: 8px;
  max-width: 90%;
}

/* === Brand logo === */
.brand-logo {
  position: absolute;
  top: 8px;
  left: 10px;
  z-index: 5;
  font-family: '${brand.typography.headlineFont}', sans-serif;
  font-weight: 700;
  color: ${brand.colors.textLight};
  text-shadow: 0 1px 3px rgba(0,0,0,0.6);
  pointer-events: none;
}

/* === CTA button === */
.cta-btn {
  display: inline-block;
  padding: 6px 18px;
  font-family: '${brand.typography.bodyFont}', sans-serif;
  font-weight: 600;
  font-size: 11px;
  text-decoration: none;
  cursor: pointer;
  border: none;
  transition: opacity 0.2s, transform 0.15s;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
.cta-btn:hover {
  opacity: 0.9;
  transform: scale(1.03);
}

/* === ISI strip === */
${isi.enabled ? buildISICSS(config) : ''}

/* === Frame animation keyframes === */
${frameKeyframes}

/* === ISI scroll keyframes === */
${isi.enabled ? `
@keyframes isi-scroll {
  0%, ${((isi.rules.delay / 1000) / isiScrollDur * 100).toFixed(1)}% {
    transform: translateY(0);
  }
  100% {
    transform: translateY(var(--isi-scroll-distance));
  }
}
` : ''}
`;
}

// ---------------------------------------------------------------------------
// Frame keyframes builder
// ---------------------------------------------------------------------------

function buildFrameKeyframes(frames: FrameConfig[], totalDuration: number): string {
  const fadeDur = 0.04; // 4% of total for fade in/out
  let css = '';

  frames.forEach((frame, index) => {
    // Calculate the start/end time of this frame as a percentage
    let elapsed = 0;
    for (let i = 0; i < index; i++) elapsed += frames[i].duration;

    const startPct = (elapsed / totalDuration) * 100;
    const endPct = ((elapsed + frame.duration) / totalDuration) * 100;

    const fadeInStart = startPct;
    const fadeInEnd = Math.min(startPct + fadeDur * 100, endPct);
    const fadeOutStart = Math.max(endPct - fadeDur * 100, fadeInEnd);
    const fadeOutEnd = endPct;

    const useFade = frame.transition === 'fade' || frame.transition === undefined;
    const useSlide = frame.transition === 'slide';

    if (useFade) {
      css += `
@keyframes frame-${index} {
  0%, ${fadeInStart.toFixed(2)}% { opacity: 0; }
  ${fadeInEnd.toFixed(2)}% { opacity: 1; }
  ${fadeOutStart.toFixed(2)}% { opacity: 1; }
  ${fadeOutEnd.toFixed(2)}%, 100% { opacity: 0; }
}
`;
    } else if (useSlide) {
      css += `
@keyframes frame-${index} {
  0%, ${fadeInStart.toFixed(2)}% { opacity: 0; transform: translateX(100%); }
  ${fadeInEnd.toFixed(2)}% { opacity: 1; transform: translateX(0); }
  ${fadeOutStart.toFixed(2)}% { opacity: 1; transform: translateX(0); }
  ${fadeOutEnd.toFixed(2)}%, 100% { opacity: 0; transform: translateX(-100%); }
}
`;
    } else {
      // 'none' — instant show/hide
      css += `
@keyframes frame-${index} {
  0%, ${fadeInStart.toFixed(2)}% { opacity: 0; }
  ${(fadeInStart + 0.01).toFixed(2)}% { opacity: 1; }
  ${(fadeOutEnd - 0.01).toFixed(2)}% { opacity: 1; }
  ${fadeOutEnd.toFixed(2)}%, 100% { opacity: 0; }
}
`;
    }

    const loopCount =
      Math.ceil(totalDuration / frames.reduce((a, f) => a + f.duration, 0)) > 1
        ? 'infinite'
        : 'infinite'; // always use the animation loop setting from parent

    css += `
.frame-${index} {
  animation: frame-${index} ${totalDuration}ms ease-in-out ${frames.length > 1 ? 'infinite' : `${totalDuration}ms`};
}
`;
  });

  return css;
}

// ---------------------------------------------------------------------------
// ISI CSS
// ---------------------------------------------------------------------------

function buildISICSS(config: CampaignConfig): string {
  const { isi } = config;
  const r = isi.rules;

  return `
.isi-strip {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: ${r.stripHeight};
  background: ${r.backgroundColor};
  color: ${r.textColor};
  z-index: 10;
  overflow: hidden;
  border-top: 1px solid rgba(255,255,255,0.2);
  transition: height 0.3s ease;
  cursor: default;
}

${r.expandable ? `
.isi-strip:hover,
.isi-strip.expanded {
  height: ${r.expandedHeight || '70%'};
}
` : ''}

.isi-header {
  position: sticky;
  top: 0;
  left: 0;
  width: 100%;
  padding: 3px 8px;
  font-family: '${config.brand.typography.bodyFont}', sans-serif;
  font-size: ${r.fontSize};
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.3px;
  background: ${r.backgroundColor};
  z-index: 11;
  border-bottom: 1px solid rgba(255,255,255,0.1);
}

.isi-body {
  padding: 4px 8px 20px;
  font-family: '${config.brand.typography.bodyFont}', sans-serif;
  font-size: ${r.fontSize};
  line-height: ${r.lineHeight};
  white-space: pre-wrap;
  will-change: transform;
}

.isi-scroll-wrapper {
  overflow: hidden;
  height: calc(100% - 18px);
}

.isi-scroll-content {
  ${r.autoScroll ? `animation: isi-scroll ${((r.hardStop - r.delay) / 1000).toFixed(1)}s linear ${(r.delay / 1000).toFixed(1)}s forwards;` : ''}
}

${r.onHover === 'pause' ? `
.isi-strip:hover .isi-scroll-content {
  animation-play-state: paused;
}
` : ''}
`;
}

// ---------------------------------------------------------------------------
// Frame HTML builder
// ---------------------------------------------------------------------------

function buildFrame(frame: FrameConfig, index: number, config: CampaignConfig): string {
  const overlayOpacity = frame.overlayOpacity ?? 0.5;
  const headlinePos = frame.headline.position || 'center';
  const headlineFontSize = frame.headline.fontSize || '20px';
  const headlineColor = frame.headline.color || config.brand.colors.textLight;
  const bodyFontSize = frame.bodyCopy?.fontSize || '11px';
  const bodyColor = frame.bodyCopy?.color || config.brand.colors.textLight;

  const bgStyle = frame.backgroundImageUrl
    ? `background-image: url('${frame.backgroundImageUrl}');`
    : `background: ${config.brand.colors.primary};`;

  const overlayGradient = `background: linear-gradient(
    to bottom,
    rgba(0,0,0,${(overlayOpacity * 0.3).toFixed(2)}) 0%,
    rgba(0,0,0,${overlayOpacity.toFixed(2)}) 60%,
    rgba(0,0,0,${(overlayOpacity * 0.9).toFixed(2)}) 100%
  );`;

  let ctaHTML = '';
  if (frame.cta) {
    const ctaBg = frame.cta.backgroundColor || config.brand.colors.accent;
    const ctaColor = frame.cta.textColor || '#FFFFFF';
    const ctaRadius = frame.cta.borderRadius || '4px';
    ctaHTML = `
      <span class="cta-btn" style="background:${ctaBg};color:${ctaColor};border-radius:${ctaRadius};">
        ${escapeHTML(frame.cta.text)}
      </span>`;
  }

  let bodyHTML = '';
  if (frame.bodyCopy) {
    bodyHTML = `
      <p class="body-copy" style="font-size:${bodyFontSize};color:${bodyColor};">
        ${escapeHTML(frame.bodyCopy.text)}
      </p>`;
  }

  return `
      <div class="frame frame-${index}" aria-label="Frame ${index + 1}">
        <div class="frame-bg" style="${bgStyle}"></div>
        <div class="frame-overlay" style="${overlayGradient}"></div>
        <div class="frame-content frame-content--${headlinePos}">
          <h2 class="headline" style="font-size:${headlineFontSize};color:${headlineColor};">
            ${escapeHTML(frame.headline.text)}
          </h2>
          ${bodyHTML}
          ${ctaHTML}
        </div>
      </div>`;
}

// ---------------------------------------------------------------------------
// ISI HTML builder
// ---------------------------------------------------------------------------

function buildISI(config: CampaignConfig): string {
  const { isi } = config;

  // Split ISI text: first line is the header, rest is body
  const lines = isi.text.trim().split('\n');
  const header = lines[0];
  const body = lines.slice(1).join('\n').trim();

  // Calculate scroll distance: rough estimate — we assume the text is much
  // taller than the strip. The CSS variable lets the keyframe reference it.
  // We set a generous default; the hard-stop timing controls when it actually
  // stops regardless.
  const scrollDistance = -(isi.text.split('\n').length * 12); // ~12px per line

  return `
  <div class="isi-strip" style="--isi-scroll-distance: ${scrollDistance}px;">
    <div class="isi-header">${escapeHTML(header)}</div>
    <div class="isi-scroll-wrapper">
      <div class="isi-scroll-content">
        <div class="isi-body">${escapeHTML(body)}</div>
      </div>
    </div>
  </div>`;
}

// ---------------------------------------------------------------------------
// Brand logo builder
// ---------------------------------------------------------------------------

function buildLogo(config: CampaignConfig): string {
  const { brand, size } = config;

  // Scale logo font size based on banner dimensions
  const minDim = Math.min(size.width, size.height);
  const logoSize = Math.max(10, Math.min(16, Math.round(minDim * 0.14)));

  if (brand.logoUrl) {
    // If a real logo image URL is provided, use an <img>
    const imgHeight = Math.max(14, Math.round(minDim * 0.16));
    return `
    <div class="brand-logo">
      <img src="${brand.logoUrl}" alt="${escapeHTML(brand.name)}" style="height:${imgHeight}px;width:auto;">
    </div>`;
  }

  // Otherwise render the brand name as text in the corner
  return `
    <div class="brand-logo" style="font-size:${logoSize}px;">
      ${escapeHTML(brand.name.split('(')[0].trim())}
    </div>`;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function escapeHTML(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
