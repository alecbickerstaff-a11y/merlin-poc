// =============================================================================
// MERLIN — Flashcard / Leave-Behind Template Engine
//
// Takes a FlashcardConfig and returns a fully self-contained HTML string that
// renders a print-ready flashcard document. Follows Tremfya-style brand
// system with 12-column grid, system graphics, and brand typography.
// =============================================================================

import type {
  FlashcardConfig,
  FlashcardPage,
  FlashcardSection,
  SystemGraphicPreset,
  BrandSettings,
} from './types';

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function generateFlashcardHTML(config: FlashcardConfig): string {
  const { brand, pageSize, systemGraphic, pages, isi } = config;

  const dims = getPageDimensions(config);
  const css = buildCSS(config, dims);
  const pagesHTML = pages.map((p, i) => buildPage(p, i, config, dims)).join('\n');

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeHTML(brand.name)} — Leave Behind</title>
<style>
${css}
</style>
</head>
<body>
${pagesHTML}
</body>
</html>`;
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
  const { brand, systemGraphic } = config;
  const primary = brand.colors.primary;
  const accent = brand.colors.accent;
  const bg = brand.colors.background;
  const text = brand.colors.textDark;

  const headlineFont = brand.typography.headlineFont;
  const bodyFont = brand.typography.bodyFont;

  return `
    @import url('https://fonts.googleapis.com/css2?family=${encodeURIComponent(headlineFont)}:wght@400;600;700;800&family=${encodeURIComponent(bodyFont)}:wght@300;400;500;600&display=swap');

    * { margin: 0; padding: 0; box-sizing: border-box; }

    body {
      background: #1a1a2e;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 24px;
      padding: 24px;
      font-family: '${bodyFont}', sans-serif;
    }

    .fc-page {
      position: relative;
      width: ${dims.width}${dims.unit};
      height: ${dims.height}${dims.unit};
      background: ${bg};
      color: ${text};
      overflow: hidden;
      page-break-after: always;
      box-shadow: 0 4px 24px rgba(0,0,0,0.3);
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
      padding: 40px 48px;
      height: 100%;
      align-content: start;
    }

    /* Section types */
    .fc-section {
      min-height: 0;
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

    /* Print styles */
    @media print {
      body {
        background: white;
        padding: 0;
        gap: 0;
      }
      .fc-page {
        box-shadow: none;
        page-break-after: always;
      }
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

  return `
    <div class="fc-page" data-page="${index + 1}" data-label="${escapeHTML(page.label)}">
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
      if (data.artifactId) {
        inner = `<div class="fc-bar-chart"><div class="fc-chart-title">${escapeHTML(data.title)}</div><div class="fc-image-placeholder">Chart artifact</div></div>`;
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
          ${data.artifactId ? '<div class="fc-image-placeholder">Chart artifact</div>' : '<div class="fc-image-placeholder">Line chart (use artifact for production)</div>'}
        </div>
      `;
      break;

    case 'donut_chart':
      inner = `
        <div class="fc-donut-chart">
          ${data.title ? `<div class="fc-chart-title">${escapeHTML(data.title)}</div>` : ''}
          ${
            data.artifactId
              ? '<div class="fc-image-placeholder">Donut chart artifact</div>'
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
      if (data.artifactId) {
        inner = `<div><div class="fc-chart-title">${escapeHTML(data.title)}</div><div class="fc-image-placeholder">Table artifact</div></div>`;
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
          ${data.artifactId ? '<div class="fc-image-placeholder">Image (linked artifact)</div>' : '<div class="fc-image-placeholder">No image selected</div>'}
          ${data.caption ? `<div class="caption">${escapeHTML(data.caption)}</div>` : ''}
        </div>
      `;
      break;

    case 'cta_block':
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
      inner = `
        <div class="fc-footer">
          <div>${data.legalLine ? escapeHTML(data.legalLine) : ''}</div>
          <div>${data.jobCode ? escapeHTML(data.jobCode) : ''} ${data.date ? `| ${escapeHTML(data.date)}` : ''}</div>
        </div>
      `;
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
