// =============================================================================
// MERLIN — Flashcard / Leave-Behind Template Engine
//
// Takes a FlashcardConfig and returns a fully self-contained HTML string that
// renders a print-ready flashcard document. Follows Tremfya-style brand
// system with 12-column grid, system graphics, and brand typography.
//
// Tri-fold "Slim Jim" layout:
//   SIDE A (Outside, face-up when folded):
//     ┌─────────────┬─────────────┬─────────────┐
//     │  Panel 6    │  Panel 1    │  Panel 2    │
//     │  (Glue)     │  (Hero)     │  (Details)  │
//     │  Left flap  │  Front      │  Back flap  │
//     └─────────────┴─────────────┴─────────────┘
//
//   SIDE B (Inside, visible when fully opened):
//     ┌─────────────┬─────────────┬─────────────┐
//     │  Panel 3    │  Panel 4    │  Panel 5    │
//     │  (Refs)     │  (ISI)      │  (Blank)    │
//     │  Left       │  Center     │  Right      │
//     └─────────────┴─────────────┴─────────────┘
//
// Each panel: 8.5" × 11" portrait (816 × 1056px at 96dpi)
// Spread width: 25.5" (2448px) — scaled to fit viewport
// =============================================================================

import type {
  FlashcardConfig,
  FlashcardPage,
  FlashcardSection,
  SystemGraphicPreset,
} from './types';

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function generateFlashcardHTML(config: FlashcardConfig): string {
  const { brand, pageSize, systemGraphic, pages, isi, template } = config;

  const dims = getPageDimensions(config);
  const css = buildCSS(config, dims);
  const isTriFold = template === 'announcement';
  const spreadWidth = dims.width * 3;

  let pagesHTML: string;

  if (isTriFold) {
    pagesHTML = buildTriFoldSpreads(pages, config, dims);
  } else {
    pagesHTML = pages.map((p, i) => buildPage(p, i, config, dims)).join('\n');
  }

  const fontsLink = buildGoogleFontsLink(brand.typography.headlineFont, brand.typography.bodyFont);
  const configMeta = JSON.stringify(config, null, 2);

  // Inline script for responsive spread scaling (tri-fold only)
  const scaleScript = isTriFold ? `
<script>
  // ── Responsive spread scaling ──────────────────────────────────────
  // Each spread is ${spreadWidth}px wide (3 × ${dims.width}px panels).
  // This script scales it to fit the browser viewport while maintaining
  // aspect ratio. Runs on load and resize.
  (function() {
    var SPREAD_W = ${spreadWidth};
    var PANEL_H = ${dims.height};
    function scaleSpreads() {
      var spreads = document.querySelectorAll('.fc-spread');
      var available = window.innerWidth - 64;
      var s = Math.min(1, available / SPREAD_W);
      for (var i = 0; i < spreads.length; i++) {
        spreads[i].style.transform = 'scale(' + s + ')';
        // Negative margin compensates for the scaled-down height
        spreads[i].style.marginBottom = (PANEL_H * (s - 1)) + 'px';
      }
    }
    scaleSpreads();
    window.addEventListener('resize', scaleSpreads);
  })();
</script>` : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeHTML(brand.name)} — Leave Behind${isTriFold ? ' (Tri-Fold)' : ''}</title>
${fontsLink}
<!--
  ════════════════════════════════════════════════════════════════════════════
  MERLIN — Leave-Behind Template Export
  Generated: ${new Date().toISOString()}

  Brand:     ${brand.name}
  Template:  ${template || 'standard'}
  Page Size: ${pageSize}
  Panels:    ${pages.length}
  Fonts:     ${brand.typography.headlineFont} (headlines), ${brand.typography.bodyFont} (body)
  Colors:    Primary ${brand.colors.primary}, Accent ${brand.colors.accent}, BG ${brand.colors.background}

  ${isTriFold ? `LAYOUT: Tri-Fold "Slim Jim"
  ─────────────────────────────
  Panel dimensions: ${dims.width} × ${dims.height}px (${dims.width / 96}" × ${dims.height / 96}" at 96dpi)
  Spread dimensions: ${spreadWidth} × ${dims.height}px (${spreadWidth / 96}" × ${dims.height / 96}")

  SIDE A (Outside — face-up when folded):
    Panel 1: Glue Flap (left)  — hidden when folded, adhesive/blank
    Panel 2: Front Cover (center) — visible face when document is folded
    Panel 3: Back Flap (right) — folds over the front, tucks in

  SIDE B (Inside — visible when fully opened):
    Panel 4: Inside Left   — references, drug interactions
    Panel 5: Inside Center — ISI (Important Safety Information)
    Panel 6: Inside Right  — blank or continuation

  FOLD INSTRUCTIONS:
    1. Print Side A on front, Side B on back (duplex)
    2. Fold right panel (Back Flap) LEFT over center
    3. Fold left panel (Glue) RIGHT behind center
    4. Front Cover is now face-up` : `LAYOUT: Standard
  Pages: ${pages.map((p, i) => `${i + 1}. ${p.label}`).join(', ')}`}

  CSS ARCHITECTURE:
  ─────────────────
  .fc-page            — Individual panel/page container (${dims.width}×${dims.height}px)
  .fc-content          — 12-column CSS Grid content area
  .fc-section          — Grid child, positioned via grid-column
  .fc-spread           — Tri-fold spread (3 panels in a row)
  .fc-spread-wrapper   — Spread + labels container
  .fc-panel-label      — Position/role annotation overlay
  .fc-fold-marks       — Dashed fold lines at ⅓ and ⅔
  .fc-bg-image         — Background artifact layer (z-index: 0)
  .fc-bg-overlay       — Semi-transparent overlay on backgrounds

  SECTION TYPES:
  ──────────────
  hero               — Full-width hero with eyebrow + headline + subheadline
  headline           — h1/h2/h3 heading with optional eyebrow
  body_text           — Paragraph or bulleted list
  stat_callout        — Stat circles or large numbers
  visualization       — Chart/diagram artifact placeholder
  bar_chart           — CSS bar chart or artifact image
  line_chart          — Artifact-driven line chart
  donut_chart         — CSS conic-gradient donut or artifact
  data_table          — HTML table with highlighted rows
  icon_row            — Horizontal icon strip
  icon_flow           — Step flow with connectors (1 → 2 → 3 → 4)
  dosing_timeline     — Phase-based dosing strip
  image_block         — Photography/graphic artifact
  cta_block           — Button, banner, or callout CTA
  qr_cta              — QR code with text prompt
  checkmark_callout   — Checkmark items (heading + body)
  ruled_subheader     — Centered text with horizontal rules
  isi_block           — Important Safety Information (2-column, 8px)
  references          — Numbered reference list
  footer              — Legal lines, logos, job code
  divider             — Line, accent gradient, or whitespace

  GRID SYSTEM:
  ────────────
  12-column grid with 12px gap
  Each section has: colStart (1-12) and colSpan (1-12)
  Example: colStart=1, colSpan=12 → full width
           colStart=1, colSpan=6  → left half
           colStart=7, colSpan=6  → right half

  ════════════════════════════════════════════════════════════════════════════
-->
<style>
${css}
</style>
</head>
<body>
${pagesHTML}
${scaleScript}
<!-- Configuration JSON (for programmatic consumption) -->
<script type="application/json" id="merlin-config">
${escapeHTML(configMeta)}
</script>
</body>
</html>`;
}

// ---------------------------------------------------------------------------
// Google Fonts (link tag instead of @import for reliable export)
// ---------------------------------------------------------------------------

function buildGoogleFontsLink(headlineFont: string, bodyFont: string): string {
  const families: string[] = [];
  if (!families.includes(headlineFont)) families.push(headlineFont);
  if (!families.includes(bodyFont)) families.push(bodyFont);
  const params = families
    .map((f) => `family=${encodeURIComponent(f)}:wght@300;400;500;600;700;800`)
    .join('&');
  return `<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?${params}&display=swap" rel="stylesheet">`;
}

// ---------------------------------------------------------------------------
// Tri-fold spread builder — documented panel positions
// ---------------------------------------------------------------------------

function buildTriFoldSpreads(pages: FlashcardPage[], config: FlashcardConfig, dims: PageDims): string {
  // Ensure we have all 6 panels (pad with empty if needed)
  const allPages = [...pages];
  while (allPages.length < 6) {
    allPages.push({ id: `pad-${allPages.length}`, label: 'Empty', sections: [] });
  }

  // Panel labels for positioning reference
  const sideALabels = [
    { role: 'GLUE FLAP', position: 'Left Panel (folds behind)', foldNote: 'Hidden when folded' },
    { role: 'FRONT COVER', position: 'Center Panel (face-up)', foldNote: 'Visible when folded' },
    { role: 'BACK FLAP', position: 'Right Panel (folds over)', foldNote: 'Tucks into fold' },
  ];
  const sideBLabels = [
    { role: 'INSIDE LEFT', position: 'Left Panel', foldNote: 'Visible when opened' },
    { role: 'INSIDE CENTER', position: 'Center Panel', foldNote: 'Visible when opened' },
    { role: 'INSIDE RIGHT', position: 'Right Panel', foldNote: 'Visible when opened' },
  ];

  // Side A (Outside): Glue(6) → Hero(1) → Details(2)
  const sideAOrder = [5, 0, 1]; // indices into allPages
  const sideAPages = sideAOrder.map((idx, pos) =>
    buildPageWithLabel(allPages[idx], idx, config, dims, sideALabels[pos]),
  );

  // Side B (Inside): Refs(3) → ISI(4) → Blank(5)
  const sideBOrder = [2, 3, 4];
  const sideBPages = sideBOrder.map((idx, pos) =>
    buildPageWithLabel(allPages[idx], idx, config, dims, sideBLabels[pos]),
  );

  return `
    <!-- ══════════════════════════════════════════════════════════════════════
         SIDE A — OUTSIDE (face-up when folded)
         Physical layout: Glue | Front Cover | Back Flap
         Fold direction: Right flap folds LEFT over the front, then glue
         folds RIGHT behind.
         ══════════════════════════════════════════════════════════════════════ -->
    <div class="fc-spread-wrapper">
      <div class="fc-spread-label">
        <span class="fc-side-badge">SIDE A</span> Outside — Print this side first
      </div>
      <div class="fc-spread" data-spread="A" data-side="outside">
        <div class="fc-fold-marks">
          <div class="fc-fold-line" style="left: 33.333%"><span class="fc-fold-label">← FOLD</span></div>
          <div class="fc-fold-line" style="left: 66.666%"><span class="fc-fold-label">FOLD →</span></div>
        </div>
        ${sideAPages.join('\n')}
      </div>
      <div class="fc-spread-dimensions">
        ${dims.width}×${dims.height}px per panel · ${dims.width * 3}×${dims.height}px spread · Fold at ⅓ and ⅔
      </div>
    </div>

    <!-- ══════════════════════════════════════════════════════════════════════
         SIDE B — INSIDE (visible when fully opened)
         Physical layout: Inside Left | Inside Center | Inside Right
         This is the back of Side A — print on reverse.
         ══════════════════════════════════════════════════════════════════════ -->
    <div class="fc-spread-wrapper">
      <div class="fc-spread-label">
        <span class="fc-side-badge">SIDE B</span> Inside — Print on reverse of Side A
      </div>
      <div class="fc-spread" data-spread="B" data-side="inside">
        <div class="fc-fold-marks">
          <div class="fc-fold-line" style="left: 33.333%"><span class="fc-fold-label">← FOLD</span></div>
          <div class="fc-fold-line" style="left: 66.666%"><span class="fc-fold-label">FOLD →</span></div>
        </div>
        ${sideBPages.join('\n')}
      </div>
      <div class="fc-spread-dimensions">
        ${dims.width}×${dims.height}px per panel · ${dims.width * 3}×${dims.height}px spread · Fold at ⅓ and ⅔
      </div>
    </div>
  `;
}

// Build a page with its position label overlay
function buildPageWithLabel(
  page: FlashcardPage,
  index: number,
  config: FlashcardConfig,
  dims: PageDims,
  label: { role: string; position: string; foldNote: string },
): string {
  const sectionsHTML = page.sections.length > 0
    ? page.sections.map((s) => buildSection(s, config)).join('\n')
    : `<div class="fc-empty-panel"><div class="fc-empty-role">${escapeHTML(page.foldRole?.toUpperCase() || 'EMPTY')}</div><div class="fc-empty-note">${escapeHTML(page.label)}</div></div>`;

  const bgPosClass = page.backgroundPosition ? `bg-${page.backgroundPosition}` : '';
  const bgLayer = page.backgroundArtifactUrl
    ? `<div class="fc-bg-image ${bgPosClass}">
        <img src="${escapeHTML(page.backgroundArtifactUrl)}" alt="" />
        ${page.backgroundOverlay ? `<div class="fc-bg-overlay" style="background:${escapeHTML(page.backgroundOverlay)}"></div>` : ''}
      </div>`
    : '';

  return `
    <div class="fc-page" data-page="${index + 1}" data-label="${escapeHTML(page.label)}"${page.foldRole ? ` data-fold-role="${page.foldRole}"` : ''}>
      <div class="fc-panel-label">
        <div class="fc-panel-role">${escapeHTML(label.role)}</div>
        <div class="fc-panel-position">${escapeHTML(label.position)}</div>
        <div class="fc-panel-fold">${escapeHTML(label.foldNote)}</div>
      </div>
      ${bgLayer}
      <div class="fc-content">
        ${sectionsHTML}
      </div>
    </div>
  `;
}

// ---------------------------------------------------------------------------
// Page dimensions
// ---------------------------------------------------------------------------

interface PageDims {
  width: number;
  height: number;
  unit: string;
}

function getPageDimensions(config: FlashcardConfig): PageDims {
  switch (config.pageSize) {
    case 'letter-landscape':
      return { width: 1056, height: 816, unit: 'px' }; // 11" × 8.5" at 96dpi
    case 'letter-portrait':
      return { width: 816, height: 1056, unit: 'px' };
    case 'a4-landscape':
      return { width: 1123, height: 794, unit: 'px' }; // 297 × 210mm at 96dpi
    case 'a4-portrait':
      return { width: 794, height: 1123, unit: 'px' };
    case 'custom':
      if (config.customSize) {
        return {
          width: config.customSize.width,
          height: config.customSize.height,
          unit: config.customSize.unit,
        };
      }
      return { width: 1056, height: 816, unit: 'px' };
    default:
      return { width: 1056, height: 816, unit: 'px' };
  }
}

// ---------------------------------------------------------------------------
// CSS generation
// ---------------------------------------------------------------------------

function buildCSS(config: FlashcardConfig, dims: PageDims): string {
  const { brand, systemGraphic, template } = config;
  const primary = brand.colors.primary;
  const accent = brand.colors.accent;
  const bg = brand.colors.background;
  const text = brand.colors.textDark;

  const headlineFont = brand.typography.headlineFont;
  const bodyFont = brand.typography.bodyFont;

  const isTriFold = template === 'announcement';
  const spreadWidth = dims.width * 3;

  return `
    * { margin: 0; padding: 0; box-sizing: border-box; }

    body {
      background: ${isTriFold ? '#f5f5f5' : '#1a1a2e'};
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: ${isTriFold ? '48px' : '24px'};
      padding: ${isTriFold ? '32px 16px' : '24px'};
      font-family: '${bodyFont}', sans-serif;
      color: #333;
    }

    /* ── Tri-fold spread wrapper ─────────────────────────────────────── */

    .fc-spread-wrapper {
      max-width: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
    }

    .fc-spread-label {
      font-family: '${headlineFont}', sans-serif;
      font-size: 14px;
      font-weight: 700;
      color: #333;
      margin-bottom: 12px;
      text-align: center;
      letter-spacing: 0.5px;
    }

    .fc-side-badge {
      display: inline-block;
      padding: 2px 10px;
      background: ${primary};
      color: white;
      border-radius: 4px;
      font-size: 11px;
      font-weight: 800;
      letter-spacing: 1px;
      margin-right: 8px;
      vertical-align: middle;
    }

    .fc-spread-dimensions {
      font-size: 11px;
      color: #999;
      margin-top: 8px;
      font-family: monospace;
      letter-spacing: 0.3px;
    }

    .fc-spread {
      display: flex;
      flex-direction: row;
      position: relative;
      box-shadow: 0 4px 32px rgba(0,0,0,0.12);
      border-radius: 4px;
      overflow: visible;
      width: ${spreadWidth}px;
      height: ${dims.height}px;
      transform-origin: top center;
    }

    .fc-spread .fc-page {
      box-shadow: none;
      flex-shrink: 0;
      border-radius: 0;
    }

    /* ── Fold marks ──────────────────────────────────────────────────── */

    .fc-fold-marks {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 10;
    }

    .fc-fold-line {
      position: absolute;
      top: 0;
      width: 0;
      height: 100%;
      border-left: 2px dashed rgba(0, 0, 0, 0.15);
    }

    .fc-fold-label {
      position: absolute;
      top: 8px;
      left: -22px;
      width: 44px;
      text-align: center;
      font-size: 8px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: rgba(0, 0, 0, 0.3);
      font-family: '${headlineFont}', sans-serif;
    }

    /* ── Panel position labels ──────────────────────────────────────── */

    .fc-panel-label {
      position: absolute;
      top: 8px;
      left: 8px;
      right: 8px;
      z-index: 5;
      background: rgba(0, 0, 0, 0.06);
      border-radius: 4px;
      padding: 6px 10px;
      pointer-events: none;
    }

    .fc-panel-role {
      font-family: '${headlineFont}', sans-serif;
      font-size: 9px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      color: ${primary};
      margin-bottom: 2px;
    }

    .fc-panel-position {
      font-size: 9px;
      font-weight: 600;
      color: #666;
    }

    .fc-panel-fold {
      font-size: 8px;
      color: #999;
      font-style: italic;
    }

    /* ── Empty panel state ──────────────────────────────────────────── */

    .fc-empty-panel {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100%;
      grid-column: 1 / -1;
    }

    .fc-empty-role {
      font-family: '${headlineFont}', sans-serif;
      font-size: 16px;
      font-weight: 800;
      letter-spacing: 3px;
      color: rgba(0, 0, 0, 0.08);
      text-transform: uppercase;
    }

    .fc-empty-note {
      font-size: 11px;
      color: rgba(0, 0, 0, 0.15);
      margin-top: 4px;
    }

    /* ── Page (panel) ────────────────────────────────────────────────── */

    .fc-page {
      position: relative;
      width: ${dims.width}${dims.unit};
      height: ${dims.height}${dims.unit};
      background: ${bg};
      color: ${text};
      overflow: hidden;
      page-break-after: always;
      box-shadow: 0 4px 24px rgba(0,0,0,0.15);
    }

    /* System graphic backgrounds */
    .fc-page::before {
      content: '';
      position: absolute;
      pointer-events: none;
      z-index: 0;
      ${buildSystemGraphicCSS(systemGraphic, primary, accent)}
    }

    .fc-content {
      position: relative;
      z-index: 1;
      display: grid;
      grid-template-columns: repeat(12, 1fr);
      gap: 12px;
      padding: ${isTriFold ? '52px 36px 32px' : '40px 48px'};
      height: 100%;
      align-content: start;
    }

    /* Section types */
    .fc-section {
      min-height: 0;
    }

    /* ── Print styles ────────────────────────────────────────────────── */

    @media print {
      body {
        background: white;
        padding: 0;
        gap: 0;
      }
      .fc-spread-wrapper {
        page-break-after: always;
      }
      .fc-spread {
        box-shadow: none;
        transform: none !important;
        margin-bottom: 0 !important;
        width: 100% !important;
      }
      .fc-spread .fc-page {
        width: 33.333% !important;
        height: auto !important;
        aspect-ratio: ${dims.width} / ${dims.height};
      }
      .fc-page {
        box-shadow: none;
        page-break-after: always;
      }
      .fc-spread-label,
      .fc-spread-dimensions {
        color: #666 !important;
        font-size: 10px !important;
      }
      .fc-panel-label {
        background: rgba(0, 0, 0, 0.03);
      }
      .fc-fold-line {
        border-left-color: rgba(0, 0, 0, 0.08);
      }
    }

    .fc-hero {
      display: flex;
      flex-direction: column;
      justify-content: center;
      padding: 24px 0;
    }

    .fc-hero .eyebrow {
      font-family: '${headlineFont}', sans-serif;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 2px;
      color: ${primary};
      margin-bottom: 8px;
    }

    .fc-hero .headline {
      font-family: '${headlineFont}', sans-serif;
      font-size: 32px;
      font-weight: 800;
      line-height: 1.15;
      color: ${primary};
      margin-bottom: 8px;
    }

    .fc-hero .subheadline {
      font-size: 14px;
      color: ${text};
      line-height: 1.5;
    }

    .fc-headline h1 { font-family: '${headlineFont}', sans-serif; font-size: 28px; font-weight: 800; color: ${primary}; }
    .fc-headline h2 { font-family: '${headlineFont}', sans-serif; font-size: 22px; font-weight: 700; color: ${primary}; }
    .fc-headline h3 { font-family: '${headlineFont}', sans-serif; font-size: 18px; font-weight: 700; color: ${primary}; }
    .fc-headline .eyebrow {
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      color: ${primary};
      margin-bottom: 4px;
    }

    .fc-body-text {
      font-size: 12px;
      line-height: 1.6;
      color: ${text};
    }

    .fc-body-text ul {
      padding-left: 16px;
    }

    .fc-body-text ul li {
      margin-bottom: 4px;
    }

    .fc-stat-callout {
      display: flex;
      gap: 24px;
      align-items: flex-start;
    }

    .fc-stat {
      text-align: center;
      flex: 1;
    }

    .fc-stat .value {
      font-family: '${headlineFont}', sans-serif;
      font-size: 36px;
      font-weight: 800;
      color: ${primary};
      line-height: 1;
    }

    .fc-stat .label {
      font-size: 11px;
      font-weight: 600;
      color: ${text};
      margin-top: 4px;
    }

    .fc-stat .sublabel {
      font-size: 10px;
      color: #666;
      margin-top: 2px;
    }

    .fc-stat-circle .value {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 80px;
      height: 80px;
      border-radius: 50%;
      background: ${primary};
      color: white;
      font-family: '${headlineFont}', sans-serif;
      font-size: 24px;
      font-weight: 800;
      margin: 0 auto 8px;
    }

    /* Charts */
    .fc-bar-chart, .fc-line-chart, .fc-donut-chart {
      padding: 12px 0;
    }

    .fc-chart-title {
      font-family: '${headlineFont}', sans-serif;
      font-size: 14px;
      font-weight: 700;
      color: ${primary};
      margin-bottom: 12px;
    }

    .fc-bar-group {
      display: flex;
      align-items: flex-end;
      gap: 8px;
      height: 120px;
      border-bottom: 2px solid #e0e0e0;
      padding-bottom: 4px;
      margin-bottom: 4px;
    }

    .fc-bar {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: flex-end;
      height: 100%;
    }

    .fc-bar .bar-fill {
      width: 60%;
      border-radius: 3px 3px 0 0;
      transition: height 0.3s;
    }

    .fc-bar .bar-fill.product {
      background: ${primary};
    }

    .fc-bar .bar-fill.comparator {
      background: #ccc;
    }

    .fc-bar .bar-label {
      font-size: 9px;
      color: #666;
      margin-top: 4px;
      text-align: center;
    }

    .fc-bar .bar-value {
      font-size: 10px;
      font-weight: 700;
      color: ${text};
      margin-bottom: 2px;
    }

    /* Data table */
    .fc-data-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 11px;
    }

    .fc-data-table th {
      background: ${primary};
      color: white;
      padding: 8px 12px;
      text-align: left;
      font-weight: 700;
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .fc-data-table td {
      padding: 6px 12px;
      border-bottom: 1px solid #e8e8e8;
    }

    .fc-data-table tr.highlighted td {
      background: ${primary}10;
      font-weight: 600;
    }

    /* Icon row + flow */
    .fc-icon-row, .fc-icon-flow {
      display: flex;
      gap: 16px;
      align-items: flex-start;
    }

    .fc-icon-item {
      flex: 1;
      text-align: center;
    }

    .fc-icon-item .icon-placeholder {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      background: ${primary}20;
      border: 2px solid ${primary};
      margin: 0 auto 8px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .fc-icon-item .icon-label {
      font-size: 11px;
      font-weight: 700;
      color: ${primary};
    }

    .fc-icon-item .icon-sublabel {
      font-size: 10px;
      color: #666;
      margin-top: 2px;
    }

    .fc-flow-connector {
      display: flex;
      align-items: center;
      color: ${primary};
      font-size: 18px;
      padding-top: 16px;
    }

    /* Dosing timeline */
    .fc-dosing-timeline {
      display: flex;
      gap: 0;
      border: 2px solid ${primary};
      border-radius: 8px;
      overflow: hidden;
    }

    .fc-dosing-phase {
      flex: 1;
      padding: 12px 16px;
      text-align: center;
      border-right: 1px solid ${primary}40;
    }

    .fc-dosing-phase:last-child {
      border-right: none;
    }

    .fc-dosing-phase .phase-label {
      font-family: '${headlineFont}', sans-serif;
      font-size: 12px;
      font-weight: 700;
      color: ${primary};
      margin-bottom: 4px;
    }

    .fc-dosing-phase .phase-duration {
      font-size: 10px;
      color: ${text};
      margin-bottom: 2px;
    }

    .fc-dosing-phase .phase-freq {
      font-size: 10px;
      color: #666;
    }

    /* Visualization block */
    .fc-visualization {
      text-align: center;
    }

    .fc-visualization .viz-title {
      font-family: '${headlineFont}', sans-serif;
      font-size: 14px;
      font-weight: 700;
      color: ${primary};
      margin-bottom: 8px;
      text-align: left;
    }

    .fc-visualization img {
      max-width: 100%;
      object-fit: contain;
      border-radius: 4px;
    }

    .fc-visualization img.fit-cover {
      width: 100%;
      object-fit: cover;
    }

    .fc-visualization .viz-caption {
      font-size: 9px;
      color: #888;
      margin-top: 6px;
      font-style: italic;
      text-align: left;
    }

    .fc-visualization .viz-footnote {
      font-size: 8px;
      color: #999;
      margin-top: 4px;
      text-align: left;
    }

    /* Image block */
    .fc-image-block {
      text-align: center;
    }

    .fc-image-block img {
      max-width: 100%;
      max-height: 200px;
      object-fit: contain;
      border-radius: 4px;
    }

    .fc-image-block .caption {
      font-size: 9px;
      color: #888;
      margin-top: 4px;
      font-style: italic;
    }

    .fc-image-placeholder {
      width: 100%;
      height: 120px;
      background: #f0f0f0;
      border: 2px dashed #ccc;
      border-radius: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #999;
      font-size: 11px;
    }

    /* CTA block */
    .fc-cta-button {
      display: inline-block;
      padding: 10px 28px;
      background: ${primary};
      color: white;
      font-family: '${headlineFont}', sans-serif;
      font-size: 13px;
      font-weight: 700;
      border-radius: 4px;
      text-decoration: none;
      text-transform: uppercase;
      letter-spacing: 1px;
    }

    .fc-cta-banner {
      display: block;
      padding: 14px 24px;
      background: ${primary};
      color: white;
      font-family: '${headlineFont}', sans-serif;
      font-size: 14px;
      font-weight: 700;
      text-align: center;
      border-radius: 6px;
      text-transform: uppercase;
      letter-spacing: 1px;
    }

    .fc-cta-callout {
      display: block;
      padding: 16px 24px;
      background: ${accent}20;
      border-left: 4px solid ${accent};
      font-size: 13px;
      font-weight: 600;
      color: ${text};
      border-radius: 0 6px 6px 0;
    }

    /* ISI */
    .fc-isi {
      font-size: 8px;
      line-height: 1.4;
      color: #555;
      column-count: 2;
      column-gap: 24px;
      padding-top: 8px;
      border-top: 1px solid #ccc;
    }

    /* References */
    .fc-references {
      font-size: 8px;
      color: #888;
      line-height: 1.5;
    }

    .fc-references ol {
      padding-left: 12px;
    }

    /* Footer */
    .fc-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 8px;
      color: #888;
      padding-top: 8px;
      border-top: 1px solid #e0e0e0;
    }

    /* Dividers */
    .fc-divider-line {
      border-top: 1px solid #e0e0e0;
      margin: 8px 0;
    }

    .fc-divider-accent {
      height: 3px;
      background: linear-gradient(90deg, ${primary}, ${accent || primary});
      border-radius: 2px;
      margin: 8px 0;
    }

    .fc-divider-space {
      height: 16px;
    }

    /* Donut charts (CSS-only) */
    .fc-donut-row {
      display: flex;
      gap: 24px;
      justify-content: center;
    }

    .fc-donut {
      text-align: center;
    }

    .fc-donut-ring {
      width: 80px;
      height: 80px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 8px;
      position: relative;
    }

    .fc-donut-ring .donut-value {
      font-family: '${headlineFont}', sans-serif;
      font-size: 18px;
      font-weight: 800;
      color: ${text};
      position: relative;
      z-index: 1;
    }

    .fc-donut .donut-label {
      font-size: 10px;
      font-weight: 600;
      color: ${text};
    }

    /* Background image layer */
    .fc-bg-image {
      position: absolute;
      top: 0; left: 0;
      width: 100%; height: 100%;
      z-index: 0;
      pointer-events: none;
    }

    .fc-bg-image img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }

    .fc-bg-image.bg-bottom img { object-position: center bottom; }
    .fc-bg-image.bg-top img { object-position: center top; }
    .fc-bg-image.bg-center img { object-position: center center; }

    .fc-bg-overlay {
      position: absolute;
      top: 0; left: 0;
      width: 100%; height: 100%;
    }

    /* Checkmark callout */
    .fc-checkmark-callout {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .fc-checkmark-item {
      display: flex;
      gap: 12px;
      align-items: flex-start;
    }

    .fc-checkmark-icon {
      flex-shrink: 0;
      width: 28px;
      height: 28px;
      color: ${primary};
      font-size: 24px;
      line-height: 28px;
    }

    .fc-checkmark-content {
      flex: 1;
    }

    .fc-checkmark-content .cm-heading {
      font-family: '${headlineFont}', sans-serif;
      font-size: 13px;
      font-weight: 700;
      color: ${text};
      margin-bottom: 2px;
    }

    .fc-checkmark-content .cm-body {
      font-size: 12px;
      color: ${text};
      line-height: 1.5;
    }

    /* Ruled subheader */
    .fc-ruled-subheader {
      display: flex;
      align-items: center;
      gap: 12px;
      margin: 12px 0;
    }

    .fc-ruled-subheader .rule {
      flex: 1;
      height: 1px;
      background: ${text};
    }

    .fc-ruled-subheader .label {
      font-family: '${headlineFont}', sans-serif;
      font-size: 15px;
      font-weight: 700;
      color: ${text};
      white-space: nowrap;
    }

    /* QR CTA */
    .fc-qr-cta {
      display: flex;
      align-items: center;
      gap: 20px;
      padding: 20px 24px;
      background: #f5f5f5;
      border-left: 5px solid ${primary};
      border-radius: 0 8px 8px 0;
    }

    .fc-qr-cta .qr-text {
      flex: 1;
      font-family: '${headlineFont}', sans-serif;
      font-size: 16px;
      font-weight: 700;
      color: ${primary};
      line-height: 1.4;
    }

    .fc-qr-cta .qr-right {
      text-align: center;
    }

    .fc-qr-cta .qr-right img {
      width: 80px;
      height: 80px;
      object-fit: contain;
    }

    .fc-qr-cta .qr-footnote {
      font-size: 9px;
      color: #666;
      margin-top: 4px;
    }

    /* Enhanced footer with multi-logo */
    .fc-footer-enhanced {
      display: flex;
      flex-direction: column;
      gap: 8px;
      font-size: 8px;
      color: #888;
    }

    .fc-footer-enhanced .legal-lines {
      line-height: 1.5;
    }

    .fc-footer-enhanced .legal-lines .bold-line {
      font-weight: 700;
      color: ${text};
    }

    .fc-footer-enhanced .logo-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding-top: 8px;
      border-top: 1px solid #e0e0e0;
    }

    .fc-footer-enhanced .logo-bar img {
      max-height: 32px;
      object-fit: contain;
    }

    .fc-footer-enhanced .product-logos {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .fc-footer-enhanced .product-logos .plus {
      font-size: 14px;
      color: #666;
      font-weight: 600;
    }

  `;
}

// ---------------------------------------------------------------------------
// System graphic CSS
// ---------------------------------------------------------------------------

function buildSystemGraphicCSS(preset: SystemGraphicPreset, primary: string, accent: string): string {
  switch (preset) {
    case 'graphic-dominant':
      return `
        top: -20%; right: -20%;
        width: 80%; height: 120%;
        border-radius: 50%;
        background: radial-gradient(circle, ${primary}15 0%, transparent 70%);
      `;
    case 'balanced':
      return `
        bottom: -30%; right: -15%;
        width: 60%; height: 80%;
        border-radius: 50%;
        background: radial-gradient(circle, ${primary}12 0%, transparent 65%);
      `;
    case 'content-dominant':
      return `
        bottom: 0; right: 0;
        width: 30%; height: 30%;
        border-radius: 50% 0 0 0;
        background: ${primary}08;
      `;
    case 'left-accent':
      return `
        top: 0; left: 0;
        width: 6px; height: 100%;
        background: linear-gradient(180deg, ${primary}, ${accent || primary});
      `;
    case 'right-accent':
      return `
        top: 0; right: 0;
        width: 6px; height: 100%;
        background: linear-gradient(180deg, ${primary}, ${accent || primary});
      `;
    case 'none':
    default:
      return 'display: none;';
  }
}

// ---------------------------------------------------------------------------
// Page builder
// ---------------------------------------------------------------------------

function buildPage(page: FlashcardPage, index: number, config: FlashcardConfig, dims: PageDims): string {
  const sectionsHTML = page.sections.map((s) => buildSection(s, config)).join('\n');

  const bgPosClass = page.backgroundPosition ? `bg-${page.backgroundPosition}` : '';
  const bgLayer = page.backgroundArtifactUrl
    ? `<div class="fc-bg-image ${bgPosClass}">
        <img src="${escapeHTML(page.backgroundArtifactUrl)}" alt="" />
        ${page.backgroundOverlay ? `<div class="fc-bg-overlay" style="background:${escapeHTML(page.backgroundOverlay)}"></div>` : ''}
      </div>`
    : '';

  return `
    <div class="fc-page" data-page="${index + 1}" data-label="${escapeHTML(page.label)}"${page.foldRole ? ` data-fold-role="${page.foldRole}"` : ''}>
      ${bgLayer}
      <div class="fc-content">
        ${sectionsHTML}
      </div>
    </div>
  `;
}

// ---------------------------------------------------------------------------
// Section builder (dispatches by type)
// ---------------------------------------------------------------------------

function buildSection(section: FlashcardSection, config: FlashcardConfig): string {
  const style = `grid-column: ${section.colStart} / span ${section.colSpan};`;
  const data = section.data;

  let inner = '';

  switch (data.type) {
    case 'hero':
      inner = `
        <div class="fc-hero">
          ${data.eyebrow ? `<div class="eyebrow">${escapeHTML(data.eyebrow)}</div>` : ''}
          <div class="headline">${escapeHTML(data.headline)}</div>
          ${data.subheadline ? `<div class="subheadline">${escapeHTML(data.subheadline)}</div>` : ''}
        </div>
      `;
      break;

    case 'headline':
      inner = `
        <div class="fc-headline">
          ${data.eyebrow ? `<div class="eyebrow">${escapeHTML(data.eyebrow)}</div>` : ''}
          <${data.level}>${escapeHTML(data.text)}</${data.level}>
        </div>
      `;
      break;

    case 'body_text':
      if (data.bullets) {
        const lines = data.text.split('\n').filter(Boolean);
        inner = `<div class="fc-body-text"><ul>${lines.map((l) => `<li>${escapeHTML(l)}</li>`).join('')}</ul></div>`;
      } else {
        inner = `<div class="fc-body-text">${escapeHTML(data.text).replace(/\n/g, '<br>')}</div>`;
      }
      break;

    case 'visualization':
      inner = `
        <div class="fc-visualization">
          ${data.title ? `<div class="viz-title">${escapeHTML(data.title)}</div>` : ''}
          ${
            data.artifactUrl
              ? `<img src="${escapeHTML(data.artifactUrl)}" alt="${escapeHTML(data.alt)}" class="${data.fit === 'cover' ? 'fit-cover' : ''}" />`
              : '<div class="fc-image-placeholder">No visualization selected — pick an artifact</div>'
          }
          ${data.caption ? `<div class="viz-caption">${escapeHTML(data.caption)}</div>` : ''}
          ${data.footnote ? `<div class="viz-footnote">${escapeHTML(data.footnote)}</div>` : ''}
        </div>
      `;
      break;

    case 'stat_callout':
      inner = `
        <div class="fc-stat-callout">
          ${data.stats
            .map(
              (s) => `
            <div class="fc-stat ${s.style === 'circle' ? 'fc-stat-circle' : ''}">
              <div class="value">${escapeHTML(s.value)}</div>
              <div class="label">${escapeHTML(s.label)}</div>
              ${s.sublabel ? `<div class="sublabel">${escapeHTML(s.sublabel)}</div>` : ''}
            </div>
          `,
            )
            .join('')}
        </div>
      `;
      break;

    case 'bar_chart':
      if (data.artifactUrl) {
        inner = `<div class="fc-bar-chart"><div class="fc-chart-title">${escapeHTML(data.title)}</div><img src="${escapeHTML(data.artifactUrl)}" alt="${escapeHTML(data.title)}" style="max-width:100%;border-radius:4px;" /></div>`;
      } else if (data.artifactId) {
        inner = `<div class="fc-bar-chart"><div class="fc-chart-title">${escapeHTML(data.title)}</div><div class="fc-image-placeholder">Chart artifact (loading...)</div></div>`;
      } else {
        const maxVal = Math.max(...data.groups.flatMap((g) => g.bars.map((b) => b.value)), 1);
        inner = `
          <div class="fc-bar-chart">
            <div class="fc-chart-title">${escapeHTML(data.title)}</div>
            ${data.groups
              .map(
                (g) => `
              <div style="margin-bottom:12px;">
                <div style="font-size:10px;font-weight:600;color:#666;margin-bottom:4px;">${escapeHTML(g.label)}</div>
                <div class="fc-bar-group">
                  ${g.bars
                    .map(
                      (b) => `
                    <div class="fc-bar">
                      <div class="bar-value">${b.value}%</div>
                      <div class="bar-fill ${b.isProduct ? 'product' : 'comparator'}" style="height:${(b.value / maxVal) * 100}%"></div>
                      <div class="bar-label">${escapeHTML(b.label)}</div>
                    </div>
                  `,
                    )
                    .join('')}
                </div>
              </div>
            `,
              )
              .join('')}
          </div>
        `;
      }
      break;

    case 'line_chart':
      inner = `
        <div class="fc-line-chart">
          <div class="fc-chart-title">${escapeHTML(data.title)}</div>
          ${data.artifactUrl
            ? `<img src="${escapeHTML(data.artifactUrl)}" alt="${escapeHTML(data.title)}" style="max-width:100%;border-radius:4px;" />`
            : '<div class="fc-image-placeholder">Line chart — pick an artifact for production</div>'}
        </div>
      `;
      break;

    case 'donut_chart':
      inner = `
        <div class="fc-donut-chart">
          ${data.title ? `<div class="fc-chart-title">${escapeHTML(data.title)}</div>` : ''}
          ${
            data.artifactUrl
              ? `<img src="${escapeHTML(data.artifactUrl)}" alt="${escapeHTML(data.title || 'Donut chart')}" style="max-width:100%;border-radius:4px;" />`
              : `<div class="fc-donut-row">
              ${data.charts
                .map((c) => {
                  const pct = Math.round((c.value / c.total) * 100);
                  const color = c.isProduct ? config.brand.colors.primary : '#ccc';
                  return `
                    <div class="fc-donut">
                      <div class="fc-donut-ring" style="background: conic-gradient(${color} ${pct * 3.6}deg, #e8e8e8 ${pct * 3.6}deg);">
                        <div class="donut-value">${c.value}%</div>
                      </div>
                      <div class="donut-label">${escapeHTML(c.label)}</div>
                    </div>
                  `;
                })
                .join('')}
            </div>`
          }
        </div>
      `;
      break;

    case 'data_table':
      if (data.artifactUrl) {
        inner = `<div><div class="fc-chart-title">${escapeHTML(data.title)}</div><img src="${escapeHTML(data.artifactUrl)}" alt="${escapeHTML(data.title)}" style="max-width:100%;border-radius:4px;" /></div>`;
      } else if (data.artifactId) {
        inner = `<div><div class="fc-chart-title">${escapeHTML(data.title)}</div><div class="fc-image-placeholder">Table artifact (loading...)</div></div>`;
      } else {
        inner = `
          <div>
            <div class="fc-chart-title">${escapeHTML(data.title)}</div>
            <table class="fc-data-table">
              <thead><tr>${data.headers.map((h) => `<th>${escapeHTML(h)}</th>`).join('')}</tr></thead>
              <tbody>
                ${data.rows
                  .map(
                    (r) =>
                      `<tr class="${r.isHighlighted ? 'highlighted' : ''}">${r.cells.map((c) => `<td>${escapeHTML(c)}</td>`).join('')}</tr>`,
                  )
                  .join('')}
              </tbody>
            </table>
          </div>
        `;
      }
      break;

    case 'icon_row':
      inner = `
        <div class="fc-icon-row">
          ${data.icons
            .map(
              (icon) => `
            <div class="fc-icon-item">
              <div class="icon-placeholder">${icon.artifactId ? '📷' : '◆'}</div>
              <div class="icon-label">${escapeHTML(icon.label)}</div>
              ${icon.sublabel ? `<div class="icon-sublabel">${escapeHTML(icon.sublabel)}</div>` : ''}
            </div>
          `,
            )
            .join('')}
        </div>
      `;
      break;

    case 'icon_flow':
      const stepsWithConnectors: string[] = [];
      data.steps.forEach((step, i) => {
        stepsWithConnectors.push(`
          <div class="fc-icon-item">
            <div class="icon-placeholder">${step.artifactId ? '📷' : (i + 1).toString()}</div>
            <div class="icon-label">${escapeHTML(step.title)}</div>
            ${step.description ? `<div class="icon-sublabel">${escapeHTML(step.description)}</div>` : ''}
          </div>
        `);
        if (data.showConnectors && i < data.steps.length - 1) {
          stepsWithConnectors.push('<div class="fc-flow-connector">→</div>');
        }
      });
      inner = `<div class="fc-icon-flow">${stepsWithConnectors.join('')}</div>`;
      break;

    case 'dosing_timeline':
      inner = `
        <div>
          <div class="fc-chart-title">${escapeHTML(data.title)}</div>
          <div class="fc-dosing-timeline">
            ${data.phases
              .map(
                (p) => `
              <div class="fc-dosing-phase">
                <div class="phase-label">${escapeHTML(p.label)}</div>
                <div class="phase-duration">${escapeHTML(p.duration)}</div>
                <div class="phase-freq">${escapeHTML(p.frequency)}</div>
              </div>
            `,
              )
              .join('')}
          </div>
        </div>
      `;
      break;

    case 'image_block':
      inner = `
        <div class="fc-image-block">
          ${
            data.artifactUrl
              ? `<img src="${escapeHTML(data.artifactUrl)}" alt="${escapeHTML(data.alt)}" />`
              : '<div class="fc-image-placeholder">No image selected — pick an artifact</div>'
          }
          ${data.caption ? `<div class="caption">${escapeHTML(data.caption)}</div>` : ''}
        </div>
      `;
      break;

    case 'cta_block':
      if (data.artifactUrl) {
        inner = `<div class="fc-image-block"><img src="${escapeHTML(data.artifactUrl)}" alt="${escapeHTML(data.text)}" style="max-width:100%;border-radius:4px;" /></div>`;
      } else {
        switch (data.style) {
          case 'button':
            inner = `<div><span class="fc-cta-button">${escapeHTML(data.text)}</span></div>`;
            break;
          case 'banner':
            inner = `<div class="fc-cta-banner">${escapeHTML(data.text)}</div>`;
            break;
          case 'callout':
            inner = `<div class="fc-cta-callout">${escapeHTML(data.text)}</div>`;
            break;
        }
      }
      break;

    case 'isi_block':
      if (data.variant === 'full' && config.isi.enabled) {
        inner = `<div class="fc-isi">${escapeHTML(config.isi.text).replace(/\n/g, '<br>')}</div>`;
      } else if (data.text) {
        inner = `<div class="fc-isi">${escapeHTML(data.text).replace(/\n/g, '<br>')}</div>`;
      } else {
        inner = `<div class="fc-isi" style="font-style:italic;color:#999;">ISI text will appear here</div>`;
      }
      break;

    case 'references':
      inner = `
        <div class="fc-references">
          <ol>${data.items.map((item) => `<li>${escapeHTML(item)}</li>`).join('')}</ol>
        </div>
      `;
      break;

    case 'footer':
      if (data.productLogos?.length || data.legalLines?.length || data.copyrightLine) {
        // Enhanced multi-logo footer
        const legalLinesHTML = (data.legalLines || [])
          .map((line) => {
            const isBold = line.startsWith('**') && line.endsWith('**');
            const cleanLine = isBold ? line.slice(2, -2) : line;
            return `<div${isBold ? ' class="bold-line"' : ''}>${escapeHTML(cleanLine)}</div>`;
          })
          .join('');
        const productLogosHTML = (data.productLogos || [])
          .map((logo, i) => {
            const img = logo.artifactUrl
              ? `<img src="${escapeHTML(logo.artifactUrl)}" alt="${escapeHTML(logo.alt)}" />`
              : `<span style="font-size:10px;color:#666;">${escapeHTML(logo.alt)}</span>`;
            return (i > 0 ? '<span class="plus">+</span>' : '') + img;
          })
          .join('');
        inner = `
          <div class="fc-footer-enhanced">
            ${data.legalLine ? `<div>${escapeHTML(data.legalLine)}</div>` : ''}
            ${legalLinesHTML ? `<div class="legal-lines">${legalLinesHTML}</div>` : ''}
            ${data.copyrightLine ? `<div>${escapeHTML(data.copyrightLine)}</div>` : ''}
            ${data.jobCode ? `<div>${escapeHTML(data.jobCode)}${data.date ? ` | ${escapeHTML(data.date)}` : ''}</div>` : ''}
            <div class="logo-bar">
              <div>${data.corporateLogoArtifactUrl ? `<img src="${escapeHTML(data.corporateLogoArtifactUrl)}" alt="Corporate logo" />` : ''}</div>
              ${productLogosHTML ? `<div class="product-logos">${productLogosHTML}</div>` : ''}
            </div>
          </div>
        `;
      } else {
        // Legacy simple footer
        inner = `
          <div class="fc-footer">
            <div>${data.legalLine ? escapeHTML(data.legalLine) : ''}</div>
            <div>${data.jobCode ? escapeHTML(data.jobCode) : ''} ${data.date ? `| ${escapeHTML(data.date)}` : ''}</div>
          </div>
        `;
      }
      break;

    case 'divider':
      switch (data.style) {
        case 'line':
          inner = '<div class="fc-divider-line"></div>';
          break;
        case 'accent':
          inner = '<div class="fc-divider-accent"></div>';
          break;
        case 'space':
          inner = '<div class="fc-divider-space"></div>';
          break;
      }
      break;

    case 'checkmark_callout':
      inner = `
        <div class="fc-checkmark-callout">
          ${data.items
            .map(
              (item) => `
            <div class="fc-checkmark-item">
              <div class="fc-checkmark-icon">✓</div>
              <div class="fc-checkmark-content">
                <div class="cm-heading">${escapeHTML(item.heading)}</div>
                <div class="cm-body">${escapeHTML(item.body)}</div>
              </div>
            </div>
          `,
            )
            .join('')}
        </div>
      `;
      break;

    case 'ruled_subheader':
      inner = `
        <div class="fc-ruled-subheader">
          <div class="rule"></div>
          <div class="label">${escapeHTML(data.text)}</div>
          <div class="rule"></div>
        </div>
      `;
      break;

    case 'qr_cta':
      inner = `
        <div class="fc-qr-cta">
          <div class="qr-text">${escapeHTML(data.text)}</div>
          <div class="qr-right">
            ${data.qrArtifactUrl
              ? `<img src="${escapeHTML(data.qrArtifactUrl)}" alt="QR Code" />`
              : '<div class="fc-image-placeholder" style="width:80px;height:80px;font-size:9px;">QR Code</div>'}
            ${data.footnote ? `<div class="qr-footnote">${escapeHTML(data.footnote)}</div>` : ''}
          </div>
        </div>
      `;
      break;
  }

  return `<div class="fc-section" style="${style}" data-section-type="${data.type}">${inner}</div>`;
}

// ---------------------------------------------------------------------------
// Utility
// ---------------------------------------------------------------------------

function escapeHTML(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
