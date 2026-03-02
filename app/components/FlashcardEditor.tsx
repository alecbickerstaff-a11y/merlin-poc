'use client';

import { useState, useCallback, useMemo } from 'react';
import { useWorkspace, DEFAULT_FLASHCARD_CONFIG } from '../context/WorkspaceContext';
import { generateFlashcardHTML } from '../../lib/flashcard-template';
import ArtifactPicker from './ArtifactPicker';
import type {
  FlashcardConfig,
  FlashcardPage,
  FlashcardSection,
  FlashcardTemplate,
  SectionType,
  SectionData,
  SystemGraphicPreset,
  PageSize,
  ArtifactCategory,
} from '../../lib/types';

// =============================================================================
// Section template definitions — the pre-fab component library
// =============================================================================

interface SectionTemplate {
  type: SectionType;
  label: string;
  icon: string;
  description: string;
  defaultColSpan: number;
  createData: () => SectionData;
}

// ── Template groups for sidebar organization ──────────────────────────────

interface TemplateGroup {
  label: string;
  templates: SectionTemplate[];
}

const TEMPLATE_GROUPS: TemplateGroup[] = [
  {
    label: 'Text',
    templates: [
      {
        type: 'hero',
        label: 'Hero',
        icon: '🏔',
        description: 'Large headline with optional photography',
        defaultColSpan: 12,
        createData: () => ({
          type: 'hero' as const,
          headline: 'Enter headline',
          subheadline: '',
          eyebrow: '',
        }),
      },
      {
        type: 'headline',
        label: 'Headline',
        icon: 'H',
        description: 'Section header text',
        defaultColSpan: 12,
        createData: () => ({
          type: 'headline' as const,
          text: 'Section headline',
          level: 'h2' as const,
        }),
      },
      {
        type: 'body_text',
        label: 'Body Text',
        icon: '¶',
        description: 'Paragraph or bullet points',
        defaultColSpan: 12,
        createData: () => ({
          type: 'body_text' as const,
          text: 'Enter body text here.',
          bullets: false,
        }),
      },
    ],
  },
  {
    label: 'Visual',
    templates: [
      {
        type: 'visualization',
        label: 'Visualization',
        icon: '📊',
        description: 'Chart, table, stat — pick from artifacts',
        defaultColSpan: 12,
        createData: () => ({
          type: 'visualization' as const,
          alt: 'Visualization',
          title: '',
          caption: '',
          footnote: '',
          fit: 'contain' as const,
        }),
      },
      {
        type: 'image_block',
        label: 'Image',
        icon: '🖼',
        description: 'Photography or graphic from artifacts',
        defaultColSpan: 6,
        createData: () => ({
          type: 'image_block' as const,
          alt: 'Image description',
          caption: '',
        }),
      },
      {
        type: 'icon_row',
        label: 'Icon Row',
        icon: '⬡',
        description: 'Row of icons with labels',
        defaultColSpan: 12,
        createData: () => ({
          type: 'icon_row' as const,
          icons: [
            { label: 'Feature 1', sublabel: 'Description' },
            { label: 'Feature 2', sublabel: 'Description' },
            { label: 'Feature 3', sublabel: 'Description' },
          ],
        }),
      },
      {
        type: 'icon_flow',
        label: 'Icon Flow',
        icon: '→',
        description: 'Sequential steps with connectors',
        defaultColSpan: 12,
        createData: () => ({
          type: 'icon_flow' as const,
          steps: [
            { title: 'Step 1', description: 'First step' },
            { title: 'Step 2', description: 'Second step' },
            { title: 'Step 3', description: 'Third step' },
          ],
          showConnectors: true,
        }),
      },
      {
        type: 'cta_block',
        label: 'CTA',
        icon: '🔗',
        description: 'Call-to-action button or banner',
        defaultColSpan: 12,
        createData: () => ({
          type: 'cta_block' as const,
          text: 'Learn More',
          style: 'button' as const,
        }),
      },
      {
        type: 'checkmark_callout',
        label: 'Checkmark Callout',
        icon: '✓',
        description: 'Benefit statements with checkmark icons',
        defaultColSpan: 12,
        createData: () => ({
          type: 'checkmark_callout' as const,
          items: [
            { heading: 'Key benefit:', body: 'Description of benefit' },
            { heading: 'Another benefit:', body: 'Description of second benefit' },
          ],
        }),
      },
      {
        type: 'qr_cta',
        label: 'QR CTA',
        icon: '⊞',
        description: 'Callout with QR code image',
        defaultColSpan: 12,
        createData: () => ({
          type: 'qr_cta' as const,
          text: 'Learn more about this treatment',
          footnote: 'Data rates may apply.',
        }),
      },
    ],
  },
  {
    label: 'Data',
    templates: [
      {
        type: 'stat_callout',
        label: 'Stat Callout',
        icon: '%',
        description: 'Large numbers with labels',
        defaultColSpan: 12,
        createData: () => ({
          type: 'stat_callout' as const,
          stats: [
            { value: '52%', label: 'Primary endpoint', sublabel: 'at Week 24', style: 'circle' as const },
            { value: '28%', label: 'Secondary endpoint', sublabel: 'at Week 24', style: 'circle' as const },
          ],
        }),
      },
      {
        type: 'bar_chart',
        label: 'Bar Chart',
        icon: '▥',
        description: 'CSS bar chart — or use artifact image',
        defaultColSpan: 12,
        createData: () => ({
          type: 'bar_chart' as const,
          title: 'Chart Title',
          orientation: 'vertical' as const,
          groups: [
            {
              label: 'Week 24',
              bars: [
                { label: 'Product', value: 52, isProduct: true },
                { label: 'Placebo', value: 28, isProduct: false },
              ],
            },
          ],
        }),
      },
      {
        type: 'data_table',
        label: 'Data Table',
        icon: '📋',
        description: 'Structured data — or use artifact image',
        defaultColSpan: 12,
        createData: () => ({
          type: 'data_table' as const,
          title: 'Efficacy Results',
          headers: ['Endpoint', 'Product', 'Placebo', 'p-value'],
          rows: [
            { cells: ['ACR20 Wk 24', '52%', '28%', '<0.001'], isProduct: false, isHighlighted: true },
            { cells: ['ACR50 Wk 24', '30%', '12%', '<0.001'], isProduct: false },
          ],
        }),
      },
      {
        type: 'dosing_timeline',
        label: 'Dosing Timeline',
        icon: '💊',
        description: 'Treatment phases and dosing',
        defaultColSpan: 12,
        createData: () => ({
          type: 'dosing_timeline' as const,
          title: 'Dosing Schedule',
          phases: [
            { label: 'Induction', duration: 'Weeks 0-8', frequency: 'Every 2 weeks' },
            { label: 'Maintenance', duration: 'Weeks 8+', frequency: 'Every 8 weeks' },
          ],
        }),
      },
    ],
  },
  {
    label: 'Structure',
    templates: [
      {
        type: 'isi_block',
        label: 'ISI',
        icon: '⚠',
        description: 'Important Safety Information',
        defaultColSpan: 12,
        createData: () => ({
          type: 'isi_block' as const,
          variant: 'full' as const,
        }),
      },
      {
        type: 'references',
        label: 'References',
        icon: '#',
        description: 'Footnote references',
        defaultColSpan: 12,
        createData: () => ({
          type: 'references' as const,
          items: ['Reference 1.', 'Reference 2.'],
        }),
      },
      {
        type: 'footer',
        label: 'Footer',
        icon: '▬',
        description: 'Logo, job code, legal line',
        defaultColSpan: 12,
        createData: () => ({
          type: 'footer' as const,
          jobCode: 'XX-XXXXX-XXXX',
          date: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
          legalLine: '© 2026 Brand Name. All rights reserved.',
        }),
      },
      {
        type: 'ruled_subheader',
        label: 'Ruled Subheader',
        icon: '═',
        description: 'Centered text between horizontal rules',
        defaultColSpan: 12,
        createData: () => ({
          type: 'ruled_subheader' as const,
          text: 'Section title:',
        }),
      },
      {
        type: 'divider',
        label: 'Divider',
        icon: '—',
        description: 'Line, space, or accent separator',
        defaultColSpan: 12,
        createData: () => ({
          type: 'divider' as const,
          style: 'line' as const,
        }),
      },
    ],
  },
];

// Flatten for lookups
const SECTION_TEMPLATES: SectionTemplate[] = TEMPLATE_GROUPS.flatMap((g) => g.templates);

// =============================================================================
// Page size options
// =============================================================================

const PAGE_SIZE_OPTIONS: { value: PageSize; label: string; dims: string }[] = [
  { value: 'letter-landscape', label: 'Letter Landscape', dims: '11" × 8.5"' },
  { value: 'letter-portrait', label: 'Letter Portrait', dims: '8.5" × 11"' },
  { value: 'a4-landscape', label: 'A4 Landscape', dims: '297 × 210mm' },
  { value: 'a4-portrait', label: 'A4 Portrait', dims: '210 × 297mm' },
];

const SYSTEM_GRAPHIC_OPTIONS: { value: SystemGraphicPreset; label: string }[] = [
  { value: 'none', label: 'None' },
  { value: 'graphic-dominant', label: 'Graphic Dominant' },
  { value: 'balanced', label: 'Balanced' },
  { value: 'content-dominant', label: 'Content Dominant' },
  { value: 'left-accent', label: 'Left Accent' },
  { value: 'right-accent', label: 'Right Accent' },
];

// =============================================================================
// Helper: generate unique ID
// =============================================================================

let sectionIdCounter = 0;
function generateId(): string {
  return `sec-${Date.now()}-${++sectionIdCounter}`;
}

// =============================================================================
// Announcement Tri-fold Preset — pre-populated sections matching Figma layout
// =============================================================================

function buildAnnouncementPreset(): FlashcardPage[] {
  return [
    // ── Fold 1: Hero + Efficacy Data ──────────────────────────────
    {
      id: 'fold-1',
      label: 'Fold 1 — Hero',
      sections: [
        {
          id: generateId(),
          type: 'hero',
          colSpan: 12,
          colStart: 1,
          data: {
            type: 'hero',
            eyebrow: 'NOW APPROVED',
            headline: 'A new treatment option for moderate-to-severe chronic inflammatory joint disease',
            subheadline: 'VELARA (celipruvant) 10mg — Once-daily oral dosing',
          },
        },
        {
          id: generateId(),
          type: 'divider',
          colSpan: 12,
          colStart: 1,
          data: { type: 'divider', style: 'accent' },
        },
        {
          id: generateId(),
          type: 'visualization',
          colSpan: 12,
          colStart: 1,
          data: {
            type: 'visualization',
            title: 'Dosing Diagram',
            alt: 'VELARA dosing schedule diagram',
            caption: 'Upload approved dosing diagram artifact',
          },
        },
        {
          id: generateId(),
          type: 'checkmark_callout',
          colSpan: 12,
          colStart: 1,
          data: {
            type: 'checkmark_callout',
            items: [
              {
                heading: 'Proven Efficacy',
                body: '52% of patients achieved ACR20 response at Week 24 (p<0.001 vs placebo)',
              },
              {
                heading: 'Convenient Dosing',
                body: 'Once-daily oral tablet — no injections, no infusions',
              },
              {
                heading: 'Familiar Tolerability',
                body: 'Safety profile consistent with the known class effects. See ISI for full details.',
              },
            ],
          },
        },
      ],
      foldRole: 'content' as const,
    },

    // ── Fold 2: Steps + QR CTA ────────────────────────────────────
    {
      id: 'fold-2',
      label: 'Fold 2 — Details',
      sections: [
        {
          id: generateId(),
          type: 'headline',
          colSpan: 12,
          colStart: 1,
          data: {
            type: 'headline',
            text: 'Significant joint pain relief vs. placebo at Week 12',
            level: 'h2',
          },
        },
        {
          id: generateId(),
          type: 'body_text',
          colSpan: 12,
          colStart: 1,
          data: {
            type: 'body_text',
            text: 'VELARA significantly reduced joint pain vs. placebo at Week 12 (p<0.001). Results were sustained through Week 24 across all endpoints.',
          },
        },
        {
          id: generateId(),
          type: 'ruled_subheader',
          colSpan: 12,
          colStart: 1,
          data: {
            type: 'ruled_subheader',
            text: 'Dose modification steps to consider:',
          },
        },
        {
          id: generateId(),
          type: 'icon_flow',
          colSpan: 12,
          colStart: 1,
          data: {
            type: 'icon_flow',
            showConnectors: true,
            steps: [
              { title: 'Assess', description: 'Evaluate disease activity and risk factors' },
              { title: 'Initiate', description: 'Start VELARA 10mg once daily' },
              { title: 'Monitor', description: 'Check LFTs monthly for first 6 months' },
              { title: 'Adjust', description: 'Modify dose based on response and tolerability' },
            ],
          },
        },
        {
          id: generateId(),
          type: 'body_text',
          colSpan: 12,
          colStart: 1,
          data: {
            type: 'body_text',
            text: 'Do not initiate VELARA during an active, serious infection. See full Prescribing Information for complete dosing and administration details.',
            bullets: false,
          },
        },
        {
          id: generateId(),
          type: 'qr_cta',
          colSpan: 12,
          colStart: 1,
          data: {
            type: 'qr_cta',
            text: 'For more information, scan the QR code or visit velara-hcp.com',
            footnote: 'Data rates may apply.',
          },
        },
      ],
      foldRole: 'content' as const,
    },

    // ── Fold 3: References + Footer ───────────────────────────────
    {
      id: 'fold-3',
      label: 'Fold 3 — References & Footer',
      sections: [
        {
          id: generateId(),
          type: 'headline',
          colSpan: 12,
          colStart: 1,
          data: {
            type: 'headline',
            text: 'Drug Interactions',
            level: 'h3',
          },
        },
        {
          id: generateId(),
          type: 'body_text',
          colSpan: 12,
          colStart: 1,
          data: {
            type: 'body_text',
            text: 'Avoid concomitant use with strong immunosuppressants.\nUse caution with live vaccines.\nMonitor closely when co-administered with CYP3A4 inhibitors.\nSee Full Prescribing Information for complete drug interaction details.',
            bullets: true,
          },
        },
        {
          id: generateId(),
          type: 'divider',
          colSpan: 12,
          colStart: 1,
          data: { type: 'divider', style: 'line' },
        },
        {
          id: generateId(),
          type: 'references',
          colSpan: 12,
          colStart: 1,
          data: {
            type: 'references',
            items: [
              'VELARA [prescribing information]. Fictional Pharma Corp; 2026.',
              'Smith J, et al. Celipruvant in moderate-to-severe CIJD: Phase 3 results. J Rheumatol. 2026;00:000-000.',
              'Data on file. Fictional Pharma Corp. Study VELARA-301.',
            ],
          },
        },
        {
          id: generateId(),
          type: 'footer',
          colSpan: 12,
          colStart: 1,
          data: {
            type: 'footer',
            legalLine: 'Please see Brief Summary of full Prescribing Information, including Boxed Warning, on adjacent page.',
            legalLines: [
              '**Please see full Prescribing Information, including Boxed Warning, at velara-hcp.com.**',
              'VELARA is a registered trademark of Fictional Pharma Corp.',
            ],
            copyrightLine: '\u00A9 2026 Fictional Pharma Corp. All rights reserved.',
            jobCode: 'cp-000000v1',
            date: '01/26',
            productLogos: [
              { alt: 'VELARA Logo' },
            ],
          },
        },
      ],
      foldRole: 'content' as const,
    },

    // ── Fold 4: ISI (back) ────────────────────────────────────────
    {
      id: 'fold-4',
      label: 'Fold 4 — ISI',
      sections: [
        {
          id: generateId(),
          type: 'headline',
          colSpan: 12,
          colStart: 1,
          data: {
            type: 'headline',
            text: 'Important Safety Information',
            level: 'h2',
          },
        },
        {
          id: generateId(),
          type: 'isi_block',
          colSpan: 12,
          colStart: 1,
          data: {
            type: 'isi_block',
            variant: 'full',
          },
        },
      ],
      foldRole: 'isi' as const,
    },

    // ── Blank panel ───────────────────────────────────────────────
    {
      id: 'fold-blank',
      label: 'Blank',
      sections: [],
      foldRole: 'blank' as const,
    },

    // ── Glue panel ────────────────────────────────────────────────
    {
      id: 'fold-glue',
      label: 'Glue',
      sections: [],
      foldRole: 'glue' as const,
    },
  ];
}

// =============================================================================
// Section preview card on canvas
// =============================================================================

function SectionCard({
  section,
  isSelected,
  onSelect,
  onRemove,
  onMoveUp,
  onMoveDown,
  isFirst,
  isLast,
}: {
  section: FlashcardSection;
  isSelected: boolean;
  onSelect: () => void;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  isFirst: boolean;
  isLast: boolean;
}) {
  const template = SECTION_TEMPLATES.find((t) => t.type === section.type);

  return (
    <div
      onClick={onSelect}
      style={{
        gridColumn: `${section.colStart} / span ${section.colSpan}`,
        background: isSelected ? 'var(--accent-dim)' : 'rgba(22, 22, 36, 0.92)',
        border: `1px solid ${isSelected ? 'var(--accent)' : 'var(--border)'}`,
        borderRadius: '6px',
        padding: '10px 12px',
        cursor: 'pointer',
        transition: 'all 0.15s',
        position: 'relative',
        minHeight: '60px',
        zIndex: 1,
        backdropFilter: 'blur(8px)',
      }}
    >
      {/* Type badge */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
        <span style={{ fontSize: '12px' }}>{template?.icon || '?'}</span>
        <span
          style={{
            fontSize: '10px',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            color: isSelected ? 'var(--accent)' : 'var(--text-muted)',
          }}
        >
          {template?.label || section.type}
        </span>
        <span style={{ fontSize: '9px', color: 'var(--text-muted)', marginLeft: 'auto' }}>
          col {section.colStart}–{section.colStart + section.colSpan - 1}
        </span>
      </div>

      {/* Artifact thumbnail preview in compose */}
      {(() => {
        const d = section.data;
        const url =
          (d.type === 'visualization' && d.artifactUrl) ||
          (d.type === 'image_block' && d.artifactUrl) ||
          (d.type === 'bar_chart' && d.artifactUrl) ||
          (d.type === 'line_chart' && d.artifactUrl) ||
          (d.type === 'donut_chart' && d.artifactUrl) ||
          (d.type === 'data_table' && d.artifactUrl) ||
          (d.type === 'cta_block' && d.artifactUrl) ||
          (d.type === 'qr_cta' && d.qrArtifactUrl) ||
          null;
        if (url) {
          return (
            <div
              style={{
                margin: '4px 0 6px',
                borderRadius: '4px',
                overflow: 'hidden',
                background: 'var(--bg-darkest)',
                border: '1px solid var(--border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                maxHeight: '120px',
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={url}
                alt=""
                style={{
                  maxWidth: '100%',
                  maxHeight: '120px',
                  objectFit: 'contain',
                  display: 'block',
                }}
              />
            </div>
          );
        }
        return null;
      })()}

      {/* Preview text */}
      <div style={{ fontSize: '11px', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
        {section.data.type === 'hero' && section.data.headline}
        {section.data.type === 'headline' && section.data.text}
        {section.data.type === 'body_text' && section.data.text.slice(0, 60) + (section.data.text.length > 60 ? '...' : '')}
        {section.data.type === 'visualization' && (
          <span>
            {section.data.artifactUrl
              ? <span style={{ color: 'var(--accent)' }}>{section.data.title || 'Artifact linked'}</span>
              : <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>No artifact selected</span>}
          </span>
        )}
        {section.data.type === 'stat_callout' && `${section.data.stats.length} stat(s)`}
        {section.data.type === 'bar_chart' && (
          <span>{section.data.artifactUrl
            ? <span style={{ color: 'var(--accent)' }}>{section.data.title}</span>
            : section.data.title}</span>
        )}
        {section.data.type === 'line_chart' && section.data.title}
        {section.data.type === 'donut_chart' && (
          <span>{section.data.artifactUrl
            ? <span style={{ color: 'var(--accent)' }}>{section.data.title || 'Chart artifact'}</span>
            : `${section.data.charts.length} chart(s)`}</span>
        )}
        {section.data.type === 'data_table' && (
          <span>{section.data.artifactUrl
            ? <span style={{ color: 'var(--accent)' }}>{section.data.title}</span>
            : section.data.title}</span>
        )}
        {section.data.type === 'icon_row' && `${section.data.icons.length} icon(s)`}
        {section.data.type === 'icon_flow' && `${section.data.steps.length} step(s)`}
        {section.data.type === 'dosing_timeline' && section.data.title}
        {section.data.type === 'image_block' && (
          <span>{section.data.artifactUrl
            ? <span style={{ color: 'var(--accent)' }}>Artifact linked</span>
            : section.data.alt}</span>
        )}
        {section.data.type === 'cta_block' && section.data.text}
        {section.data.type === 'isi_block' && `ISI — ${section.data.variant}`}
        {section.data.type === 'references' && `${section.data.items.length} ref(s)`}
        {section.data.type === 'footer' && (section.data.jobCode || 'Footer')}
        {section.data.type === 'divider' && `${section.data.style} divider`}
        {section.data.type === 'checkmark_callout' && `${section.data.items.length} callout(s)`}
        {section.data.type === 'ruled_subheader' && section.data.text}
        {section.data.type === 'qr_cta' && section.data.text.slice(0, 50)}
      </div>

      {/* Controls (show on selected) */}
      {isSelected && (
        <div
          style={{
            position: 'absolute',
            top: '4px',
            right: '4px',
            display: 'flex',
            gap: '2px',
          }}
        >
          {!isFirst && (
            <button
              onClick={(e) => { e.stopPropagation(); onMoveUp(); }}
              style={controlBtnStyle}
              title="Move up"
            >
              ↑
            </button>
          )}
          {!isLast && (
            <button
              onClick={(e) => { e.stopPropagation(); onMoveDown(); }}
              style={controlBtnStyle}
              title="Move down"
            >
              ↓
            </button>
          )}
          <button
            onClick={(e) => { e.stopPropagation(); onRemove(); }}
            style={{ ...controlBtnStyle, color: '#ef4444' }}
            title="Remove"
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
}

const controlBtnStyle: React.CSSProperties = {
  width: '20px',
  height: '20px',
  fontSize: '12px',
  fontWeight: 700,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'var(--bg-darkest)',
  border: '1px solid var(--border)',
  borderRadius: '4px',
  color: 'var(--text-secondary)',
  cursor: 'pointer',
};

// =============================================================================
// Flashcard Editor — Main Component
// =============================================================================

export default function FlashcardEditor() {
  const { state, dispatch } = useWorkspace();
  const config = state.flashcardConfig;

  const [activePageIndex, setActivePageIndex] = useState(0);
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
  const [canvasMode, setCanvasMode] = useState<'compose' | 'preview'>('compose');
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saved' | 'error'>('idle');

  // AI generation state
  const [aiKeyMessage, setAiKeyMessage] = useState('');
  const [aiVisualTone, setAiVisualTone] = useState('Warm & Hopeful');
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  const activePage = config.pages[activePageIndex] || config.pages[0];
  const selectedSection = activePage?.sections.find((s) => s.id === selectedSectionId) || null;

  // Generate live HTML preview
  const flashcardHTML = useMemo(() => generateFlashcardHTML(config), [config]);

  // ── Config updater ─────────────────────────────────────────────────────────

  const updateConfig = useCallback(
    (updater: (prev: FlashcardConfig) => FlashcardConfig) => {
      dispatch({ type: 'SET_FLASHCARD_CONFIG', config: updater(config) });
    },
    [config, dispatch],
  );

  const updateActivePage = useCallback(
    (updater: (page: FlashcardPage) => FlashcardPage) => {
      updateConfig((prev) => ({
        ...prev,
        pages: prev.pages.map((p, i) => (i === activePageIndex ? updater(p) : p)),
      }));
    },
    [activePageIndex, updateConfig],
  );

  // ── Section operations ─────────────────────────────────────────────────────

  const addSection = (template: SectionTemplate) => {
    const newSection: FlashcardSection = {
      id: generateId(),
      type: template.type,
      colSpan: template.defaultColSpan,
      colStart: 1,
      data: template.createData(),
    };
    updateActivePage((page) => ({
      ...page,
      sections: [...page.sections, newSection],
    }));
    setSelectedSectionId(newSection.id);
  };

  const removeSection = (sectionId: string) => {
    updateActivePage((page) => ({
      ...page,
      sections: page.sections.filter((s) => s.id !== sectionId),
    }));
    if (selectedSectionId === sectionId) setSelectedSectionId(null);
  };

  const moveSection = (sectionId: string, direction: 'up' | 'down') => {
    updateActivePage((page) => {
      const idx = page.sections.findIndex((s) => s.id === sectionId);
      if (idx < 0) return page;
      const newIdx = direction === 'up' ? idx - 1 : idx + 1;
      if (newIdx < 0 || newIdx >= page.sections.length) return page;
      const sections = [...page.sections];
      [sections[idx], sections[newIdx]] = [sections[newIdx], sections[idx]];
      return { ...page, sections };
    });
  };

  const updateSectionColSpan = (sectionId: string, colSpan: number) => {
    updateActivePage((page) => ({
      ...page,
      sections: page.sections.map((s) =>
        s.id === sectionId ? { ...s, colSpan: Math.max(1, Math.min(12, colSpan)) } : s,
      ),
    }));
  };

  const updateSectionColStart = (sectionId: string, colStart: number) => {
    updateActivePage((page) => ({
      ...page,
      sections: page.sections.map((s) =>
        s.id === sectionId ? { ...s, colStart: Math.max(1, Math.min(12, colStart)) } : s,
      ),
    }));
  };

  // ── Page operations ────────────────────────────────────────────────────────

  const addPage = () => {
    const newPage: FlashcardPage = {
      id: `page-${Date.now()}`,
      label: `Page ${config.pages.length + 1}`,
      sections: [],
    };
    updateConfig((prev) => ({
      ...prev,
      pages: [...prev.pages, newPage],
    }));
    setActivePageIndex(config.pages.length);
    setSelectedSectionId(null);
  };

  const removePage = (index: number) => {
    if (config.pages.length <= 1) return;
    updateConfig((prev) => ({
      ...prev,
      pages: prev.pages.filter((_, i) => i !== index),
    }));
    if (activePageIndex >= config.pages.length - 1) {
      setActivePageIndex(Math.max(0, config.pages.length - 2));
    }
    setSelectedSectionId(null);
  };

  const handleReset = () => {
    dispatch({ type: 'RESET_FLASHCARD_CONFIG' });
    setActivePageIndex(0);
    setSelectedSectionId(null);
  };

  // ── AI Generation ──────────────────────────────────────────────────────────

  const handleAIGenerate = async () => {
    if (!aiKeyMessage.trim()) return;
    setAiError(null);
    setAiGenerating(true);

    try {
      const res = await fetch('/api/generate-flashcard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          keyMessage: aiKeyMessage.trim(),
          visualTone: aiVisualTone,
          template: config.template || 'standard',
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setAiError(data.error || `Request failed (${res.status})`);
        return;
      }

      // Apply generated pages to config
      if (data.pages && Array.isArray(data.pages)) {
        updateConfig((prev) => ({
          ...prev,
          template: (data.pages.length > 4 ? 'announcement' : prev.template || 'standard') as FlashcardTemplate,
          pageSize: data.pages.length > 4 ? 'letter-portrait' : prev.pageSize,
          pages: data.pages,
        }));
        setActivePageIndex(0);
        setSelectedSectionId(null);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Network error';
      setAiError(msg);
    } finally {
      setAiGenerating(false);
    }
  };

  // ── Save to Assets ─────────────────────────────────────────────────────────

  const saveToAssets = async () => {
    setSaving(true);
    setSaveStatus('idle');
    try {
      const res = await fetch('/api/assets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `${config.brand.name} — Leave Behind`,
          contentType: 'leave_behind',
          config: state.editorConfig, // banner config as fallback
          flashcardConfig: config,
          html: flashcardHTML,
          metadata: {
            claimsUsed: [],
            imageryDescriptors: [],
            messagingType: 'brand' as const,
            visualTone: 'Professional',
            isiVersionHash: '',
            generationSource: 'manual' as const,
            tags: ['leave-behind', 'flashcard'],
          },
        }),
      });

      if (res.ok) {
        const asset = await res.json();
        dispatch({ type: 'ADD_ASSET', asset });
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 3000);
      } else {
        setSaveStatus('error');
        setTimeout(() => setSaveStatus('idle'), 3000);
      }
    } catch {
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } finally {
      setSaving(false);
    }
  };

  // ── Print to PDF ───────────────────────────────────────────────────────────

  const printToPDF = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(flashcardHTML);
      printWindow.document.close();
      // Small delay to ensure fonts and styles load
      setTimeout(() => {
        printWindow.print();
      }, 500);
    }
  };

  return (
    <div style={{ display: 'flex', flex: 1, height: '100%', overflow: 'hidden' }}>
      {/* ── Left sidebar: section template library ──────────────────────────── */}
      <div
        style={{
          width: '220px',
          minWidth: '220px',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          background: 'var(--bg-dark)',
          borderRight: '1px solid var(--border)',
        }}
      >
        {/* ── AI Generation panel ─────────────────────────────────── */}
        <div style={{ padding: '14px', borderBottom: '1px solid var(--border)', background: 'var(--bg-dark)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px' }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M8 1L10 5.5L15 6.5L11.5 10L12.5 15L8 12.5L3.5 15L4.5 10L1 6.5L6 5.5L8 1Z" fill="var(--accent)" stroke="var(--accent)" strokeWidth="0.5" />
            </svg>
            <span style={{ fontFamily: 'var(--font-montserrat), Montserrat, sans-serif', fontWeight: 700, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--accent)' }}>
              Generate with AI
            </span>
          </div>

          <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 600, marginBottom: '4px' }}>
            Key Message
          </label>
          <textarea
            rows={3}
            placeholder="e.g., Highlight efficacy data and once-daily dosing convenience"
            value={aiKeyMessage}
            onChange={(e) => setAiKeyMessage(e.target.value)}
            disabled={aiGenerating}
            style={{ resize: 'vertical', marginBottom: '8px', opacity: aiGenerating ? 0.6 : 1, width: '100%', fontSize: '11px', padding: '6px 8px', borderRadius: '5px', border: '1px solid var(--border)', background: 'var(--bg-darkest)', color: 'var(--text-primary)' }}
          />

          <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 600, marginBottom: '4px' }}>
            Visual Tone
          </label>
          <select
            value={aiVisualTone}
            onChange={(e) => setAiVisualTone(e.target.value)}
            disabled={aiGenerating}
            style={{ ...selectStyle, marginBottom: '12px', opacity: aiGenerating ? 0.6 : 1 }}
          >
            <option value="Warm & Hopeful">Warm &amp; Hopeful</option>
            <option value="Clinical & Trustworthy">Clinical &amp; Trustworthy</option>
            <option value="Active & Energetic">Active &amp; Energetic</option>
            <option value="Calm & Reassuring">Calm &amp; Reassuring</option>
          </select>

          <button
            onClick={handleAIGenerate}
            disabled={aiGenerating || !aiKeyMessage.trim()}
            style={{
              width: '100%',
              padding: '10px 16px',
              fontSize: '12px',
              fontFamily: 'var(--font-montserrat), Montserrat, sans-serif',
              fontWeight: 700,
              backgroundColor: aiGenerating ? 'var(--bg-mid)' : 'var(--accent)',
              border: '1px solid var(--accent)',
              color: aiGenerating ? 'var(--text-secondary)' : '#000',
              borderRadius: '6px',
              cursor: aiGenerating || !aiKeyMessage.trim() ? 'not-allowed' : 'pointer',
              transition: 'all 0.15s',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              opacity: !aiKeyMessage.trim() && !aiGenerating ? 0.5 : 1,
            }}
          >
            {aiGenerating ? (
              <>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ animation: 'spin 1s linear infinite' }}>
                  <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                  <circle cx="8" cy="8" r="6" stroke="var(--text-muted)" strokeWidth="2" fill="none" />
                  <path d="M14 8a6 6 0 0 0-6-6" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" />
                </svg>
                Generating...
              </>
            ) : (
              <>
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                  <path d="M8 1L10 5.5L15 6.5L11.5 10L12.5 15L8 12.5L3.5 15L4.5 10L1 6.5L6 5.5L8 1Z" fill="currentColor" />
                </svg>
                Generate Leave Behind
              </>
            )}
          </button>

          {aiError && (
            <div style={{ marginTop: '10px', padding: '8px 10px', backgroundColor: 'rgba(231, 76, 60, 0.15)', border: '1px solid rgba(231, 76, 60, 0.4)', borderRadius: '4px', fontSize: '11px', color: '#E74C3C', lineHeight: '1.4' }}>
              {aiError}
            </div>
          )}
        </div>

        {/* Document settings */}
        <div style={{ padding: '12px', borderBottom: '1px solid var(--border)' }}>
          <h3
            style={{
              margin: '0 0 8px',
              fontSize: '11px',
              fontWeight: 700,
              color: 'var(--text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.8px',
            }}
          >
            Document
          </h3>

          <label style={labelStyle}>Template</label>
          <select
            value={config.template || 'standard'}
            onChange={(e) => {
              const tmpl = e.target.value as FlashcardTemplate;
              if (tmpl === 'announcement') {
                updateConfig((prev) => ({
                  ...prev,
                  template: 'announcement',
                  pageSize: 'letter-portrait',
                  pages: buildAnnouncementPreset(),
                }));
                setActivePageIndex(0);
                setSelectedSectionId(null);
              } else {
                updateConfig((prev) => ({
                  ...prev,
                  template: 'standard',
                }));
              }
            }}
            style={selectStyle}
          >
            <option value="standard">Standard</option>
            <option value="announcement">Announcement (Tri-fold)</option>
          </select>

          <label style={labelStyle}>Page Size</label>
          <select
            value={config.pageSize}
            onChange={(e) =>
              updateConfig((prev) => ({ ...prev, pageSize: e.target.value as PageSize }))
            }
            style={selectStyle}
          >
            {PAGE_SIZE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label} ({opt.dims})
              </option>
            ))}
          </select>

          <label style={labelStyle}>System Graphic</label>
          <select
            value={config.systemGraphic}
            onChange={(e) =>
              updateConfig((prev) => ({
                ...prev,
                systemGraphic: e.target.value as SystemGraphicPreset,
              }))
            }
            style={selectStyle}
          >
            {SYSTEM_GRAPHIC_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Section templates — grouped */}
        <div style={{ flex: 1, overflow: 'auto', padding: '8px' }}>
          {TEMPLATE_GROUPS.map((group) => (
            <div key={group.label} style={{ marginBottom: '8px' }}>
              <h3
                style={{
                  margin: '4px 4px 6px',
                  fontSize: '10px',
                  fontWeight: 700,
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.8px',
                }}
              >
                {group.label}
              </h3>

              {group.templates.map((template) => (
                <button
                  key={template.type}
                  onClick={() => addSection(template)}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '7px 8px',
                    marginBottom: '2px',
                    background: 'transparent',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: 'pointer',
                    textAlign: 'left',
                    color: 'var(--text-secondary)',
                    transition: 'background 0.1s',
                  }}
                  onMouseOver={(e) => (e.currentTarget.style.background = 'var(--bg-mid)')}
                  onMouseOut={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <span style={{ width: '20px', textAlign: 'center', fontSize: '12px', flexShrink: 0 }}>
                    {template.icon}
                  </span>
                  <div>
                    <div style={{ fontSize: '11px', fontWeight: 600 }}>{template.label}</div>
                    <div style={{ fontSize: '9px', color: 'var(--text-muted)', lineHeight: 1.3 }}>
                      {template.description}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          ))}
        </div>

        {/* Actions */}
        <div style={{ padding: '8px 12px', borderTop: '1px solid var(--border)' }}>
          <button
            onClick={handleReset}
            style={{
              width: '100%',
              padding: '6px',
              fontSize: '11px',
              fontWeight: 600,
              color: 'var(--text-muted)',
              background: 'transparent',
              border: '1px solid var(--border)',
              borderRadius: '5px',
              cursor: 'pointer',
            }}
          >
            Reset Document
          </button>
        </div>
      </div>

      {/* ── Center: canvas ─────────────────────────────────────────────────── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Page tabs */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            padding: '6px 12px',
            background: 'var(--bg-dark)',
            borderBottom: '1px solid var(--border)',
          }}
        >
          {config.pages.map((page, i) => (
            <div key={page.id} style={{ display: 'flex', alignItems: 'center' }}>
              <button
                onClick={() => {
                  setActivePageIndex(i);
                  setSelectedSectionId(null);
                }}
                style={{
                  padding: '4px 10px',
                  fontSize: '11px',
                  fontWeight: 600,
                  color: i === activePageIndex ? 'var(--accent)' : 'var(--text-muted)',
                  background: i === activePageIndex ? 'var(--accent-dim)' : 'transparent',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                }}
              >
                {page.label}
              </button>
              {config.pages.length > 1 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removePage(i);
                  }}
                  style={{
                    fontSize: '10px',
                    color: 'var(--text-muted)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '2px 4px',
                    marginLeft: '-4px',
                  }}
                >
                  ×
                </button>
              )}
            </div>
          ))}
          <button
            onClick={addPage}
            style={{
              padding: '4px 8px',
              fontSize: '11px',
              fontWeight: 700,
              color: 'var(--text-muted)',
              background: 'none',
              border: '1px dashed var(--border)',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            + Page
          </button>

          {/* Compose / Preview toggle */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '2px', marginLeft: 'auto' }}>
            <span style={{ fontSize: '10px', color: 'var(--text-muted)', marginRight: '8px' }}>
              {activePage.sections.length} section{activePage.sections.length !== 1 ? 's' : ''}
            </span>
            <button
              onClick={() => setCanvasMode('compose')}
              style={{
                padding: '3px 10px',
                fontSize: '10px',
                fontWeight: 600,
                color: canvasMode === 'compose' ? 'var(--accent)' : 'var(--text-muted)',
                background: canvasMode === 'compose' ? 'var(--accent-dim)' : 'transparent',
                border: `1px solid ${canvasMode === 'compose' ? 'var(--accent)' : 'var(--border)'}`,
                borderRadius: '4px 0 0 4px',
                cursor: 'pointer',
              }}
            >
              Compose
            </button>
            <button
              onClick={() => setCanvasMode('preview')}
              style={{
                padding: '3px 10px',
                fontSize: '10px',
                fontWeight: 600,
                color: canvasMode === 'preview' ? 'var(--accent)' : 'var(--text-muted)',
                background: canvasMode === 'preview' ? 'var(--accent-dim)' : 'transparent',
                border: `1px solid ${canvasMode === 'preview' ? 'var(--accent)' : 'var(--border)'}`,
                borderRadius: '0 4px 4px 0',
                cursor: 'pointer',
              }}
            >
              Preview
            </button>

            {/* Action buttons */}
            <button
              onClick={saveToAssets}
              disabled={saving}
              style={{
                marginLeft: '8px',
                padding: '3px 10px',
                fontSize: '10px',
                fontWeight: 600,
                color: saveStatus === 'saved' ? '#22c55e' : saveStatus === 'error' ? '#ef4444' : 'var(--text-secondary)',
                background: 'var(--bg-mid)',
                border: '1px solid var(--border)',
                borderRadius: '4px',
                cursor: saving ? 'wait' : 'pointer',
                opacity: saving ? 0.6 : 1,
              }}
            >
              {saving ? 'Saving...' : saveStatus === 'saved' ? '✓ Saved' : saveStatus === 'error' ? 'Error' : 'Save to Assets'}
            </button>

            <button
              onClick={printToPDF}
              style={{
                padding: '3px 10px',
                fontSize: '10px',
                fontWeight: 600,
                color: 'var(--text-secondary)',
                background: 'var(--bg-mid)',
                border: '1px solid var(--border)',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              Print / PDF
            </button>

            {canvasMode === 'preview' && (
              <button
                onClick={() => {
                  const blob = new Blob([flashcardHTML], { type: 'text/html' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `${config.brand.name}-flashcard.html`;
                  a.click();
                  URL.revokeObjectURL(url);
                }}
                style={{
                  padding: '3px 10px',
                  fontSize: '10px',
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  background: 'var(--accent)',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                }}
              >
                Download HTML
              </button>
            )}
          </div>
        </div>

        {/* Canvas area */}
        <div
          style={{
            flex: 1,
            overflow: 'auto',
            padding: canvasMode === 'preview' ? '0' : '24px',
            background: 'var(--bg-darkest)',
          }}
        >
          {canvasMode === 'preview' ? (
            /* Live HTML Preview */
            <iframe
              srcDoc={flashcardHTML}
              title="Flashcard Preview"
              style={{
                width: '100%',
                height: '100%',
                border: 'none',
                background: 'white',
              }}
            />
          ) : activePage.sections.length === 0 ? (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                color: 'var(--text-muted)',
                userSelect: 'none',
                maxWidth: '900px',
                margin: '0 auto',
                width: '100%',
                minHeight: '400px',
                borderRadius: '8px',
                border: '1px solid var(--border)',
                position: 'relative',
                overflow: 'hidden',
                backgroundImage: activePage.backgroundArtifactUrl
                  ? `url(${activePage.backgroundArtifactUrl})`
                  : config.template === 'announcement'
                    ? 'linear-gradient(170deg, #B8860B 0%, #DAA520 25%, #E8C666 50%, #DAA520 75%, #B8860B 100%)'
                    : 'none',
                backgroundColor: (!activePage.backgroundArtifactUrl && config.template !== 'announcement')
                  ? 'var(--bg-dark)'
                  : 'transparent',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            >
              {(activePage.backgroundArtifactUrl || config.template === 'announcement') && (
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    backgroundColor: activePage.backgroundOverlay || 'rgba(255,255,255,0.75)',
                    pointerEvents: 'none',
                    zIndex: 0,
                  }}
                />
              )}
              <div style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
                <svg width="40" height="40" viewBox="0 0 16 16" fill="none" style={{ opacity: 0.2, marginBottom: '12px' }}>
                  <rect x="2" y="1" width="12" height="14" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
                  <line x1="5" y1="5" x2="11" y2="5" stroke="currentColor" strokeWidth="1" />
                  <line x1="5" y1="8" x2="11" y2="8" stroke="currentColor" strokeWidth="1" />
                  <line x1="5" y1="11" x2="9" y2="11" stroke="currentColor" strokeWidth="1" />
                </svg>
                <p style={{ fontSize: '14px', fontWeight: 600, marginBottom: '4px', color: 'var(--text-secondary)' }}>
                  {activePage.foldRole === 'blank' ? 'Blank panel' : activePage.foldRole === 'glue' ? 'Glue panel' : 'Empty page'}
                </p>
                <p style={{ fontSize: '12px', margin: 0 }}>
                  {activePage.foldRole === 'blank' || activePage.foldRole === 'glue'
                    ? 'This panel is intentionally empty'
                    : 'Click a section template from the left panel to start building'}
                </p>
              </div>
            </div>
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(12, 1fr)',
                gap: '8px',
                maxWidth: '900px',
                margin: '0 auto',
                backgroundImage: activePage.backgroundArtifactUrl
                  ? `url(${activePage.backgroundArtifactUrl})`
                  : config.template === 'announcement'
                    ? 'linear-gradient(170deg, #B8860B 0%, #DAA520 25%, #E8C666 50%, #DAA520 75%, #B8860B 100%)'
                    : 'none',
                backgroundColor: (!activePage.backgroundArtifactUrl && config.template !== 'announcement')
                  ? 'var(--bg-dark)'
                  : 'transparent',
                backgroundSize: 'cover',
                backgroundPosition: activePage.backgroundPosition === 'bottom' ? 'center bottom'
                  : activePage.backgroundPosition === 'top' ? 'center top'
                  : 'center center',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                padding: '16px',
                minHeight: '400px',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              {/* Background overlay for readability */}
              {(activePage.backgroundArtifactUrl || config.template === 'announcement') && (
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    backgroundColor: activePage.backgroundOverlay || 'rgba(255,255,255,0.75)',
                    pointerEvents: 'none',
                    borderRadius: '8px',
                    zIndex: 0,
                  }}
                />
              )}
              {activePage.sections.map((section, idx) => (
                <SectionCard
                  key={section.id}
                  section={section}
                  isSelected={selectedSectionId === section.id}
                  onSelect={() => setSelectedSectionId(section.id)}
                  onRemove={() => removeSection(section.id)}
                  onMoveUp={() => moveSection(section.id, 'up')}
                  onMoveDown={() => moveSection(section.id, 'down')}
                  isFirst={idx === 0}
                  isLast={idx === activePage.sections.length - 1}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Right sidebar: section properties ──────────────────────────────── */}
      <div
        style={{
          width: '260px',
          minWidth: '260px',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          background: 'var(--bg-dark)',
          borderLeft: '1px solid var(--border)',
          overflow: 'auto',
        }}
      >
        {selectedSection ? (
          <SectionProperties
            section={selectedSection}
            onUpdate={(updated) => {
              updateActivePage((page) => ({
                ...page,
                sections: page.sections.map((s) => (s.id === updated.id ? updated : s)),
              }));
            }}
            onColSpanChange={(v) => updateSectionColSpan(selectedSection.id, v)}
            onColStartChange={(v) => updateSectionColStart(selectedSection.id, v)}
          />
        ) : (
          <div style={{ padding: '12px' }}>
            <h3
              style={{
                margin: '0 0 10px',
                fontSize: '11px',
                fontWeight: 700,
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.8px',
              }}
            >
              Page: {activePage.label}
            </h3>

            <label style={labelStyle}>Page Label</label>
            <input
              value={activePage.label}
              onChange={(e) =>
                updateActivePage((page) => ({ ...page, label: e.target.value }))
              }
              style={inputStyle}
            />

            <label style={labelStyle}>Background Image</label>
            <ArtifactPicker
              value={activePage.backgroundArtifactId}
              onChange={(id) =>
                updateActivePage((page) => ({ ...page, backgroundArtifactId: id }))
              }
              onUrlResolved={(url) =>
                updateActivePage((page) => ({ ...page, backgroundArtifactUrl: url }))
              }
              filterCategories={['background', 'photography', 'graphic'] as ArtifactCategory[]}
              label="Background Artifact"
            />

            {activePage.backgroundArtifactUrl && (
              <>
                <label style={labelStyle}>Position</label>
                <select
                  value={activePage.backgroundPosition || 'cover'}
                  onChange={(e) =>
                    updateActivePage((page) => ({
                      ...page,
                      backgroundPosition: e.target.value as 'cover' | 'bottom' | 'top' | 'center',
                    }))
                  }
                  style={selectStyle}
                >
                  <option value="cover">Cover (fill)</option>
                  <option value="bottom">Bottom</option>
                  <option value="top">Top</option>
                  <option value="center">Center</option>
                </select>

                <label style={labelStyle}>Overlay Tint</label>
                <input
                  value={activePage.backgroundOverlay || ''}
                  onChange={(e) =>
                    updateActivePage((page) => ({ ...page, backgroundOverlay: e.target.value }))
                  }
                  style={inputStyle}
                  placeholder="e.g., rgba(255,255,255,0.85)"
                />
              </>
            )}

            {config.template === 'announcement' && (
              <>
                <label style={labelStyle}>Fold Role</label>
                <select
                  value={activePage.foldRole || 'content'}
                  onChange={(e) =>
                    updateActivePage((page) => ({
                      ...page,
                      foldRole: e.target.value as 'content' | 'isi' | 'blank' | 'glue',
                    }))
                  }
                  style={selectStyle}
                >
                  <option value="content">Content</option>
                  <option value="isi">ISI</option>
                  <option value="blank">Blank</option>
                  <option value="glue">Glue</option>
                </select>
              </>
            )}

            <p style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '16px' }}>
              Select a section to edit its properties
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// =============================================================================
// Section Properties Panel
// =============================================================================

function SectionProperties({
  section,
  onUpdate,
  onColSpanChange,
  onColStartChange,
}: {
  section: FlashcardSection;
  onUpdate: (section: FlashcardSection) => void;
  onColSpanChange: (v: number) => void;
  onColStartChange: (v: number) => void;
}) {
  const template = SECTION_TEMPLATES.find((t) => t.type === section.type);

  const updateData = (partial: Partial<SectionData>) => {
    onUpdate({ ...section, data: { ...section.data, ...partial } as SectionData });
  };

  return (
    <div style={{ padding: '12px' }}>
      {/* Header */}
      <div style={{ marginBottom: '12px', paddingBottom: '8px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
          <span style={{ fontSize: '14px' }}>{template?.icon}</span>
          <h3 style={{ margin: 0, fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
            {template?.label || section.type}
          </h3>
        </div>
        <p style={{ margin: 0, fontSize: '10px', color: 'var(--text-muted)' }}>
          {template?.description}
        </p>
      </div>

      {/* Grid layout */}
      <div style={{ marginBottom: '12px' }}>
        <h4 style={sectionHeaderStyle}>Layout</h4>
        <div style={{ display: 'flex', gap: '8px' }}>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>Col Span</label>
            <input
              type="number"
              min={1}
              max={12}
              value={section.colSpan}
              onChange={(e) => onColSpanChange(parseInt(e.target.value, 10))}
              style={inputStyle}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>Col Start</label>
            <input
              type="number"
              min={1}
              max={12}
              value={section.colStart}
              onChange={(e) => onColStartChange(parseInt(e.target.value, 10))}
              style={inputStyle}
            />
          </div>
        </div>
      </div>

      {/* Type-specific properties */}
      <h4 style={sectionHeaderStyle}>Content</h4>

      {section.data.type === 'hero' && (
        <>
          <label style={labelStyle}>Eyebrow</label>
          <input
            value={section.data.eyebrow || ''}
            onChange={(e) => updateData({ eyebrow: e.target.value })}
            style={inputStyle}
            placeholder="Optional eyebrow text"
          />
          <label style={labelStyle}>Headline</label>
          <input
            value={section.data.headline}
            onChange={(e) => updateData({ headline: e.target.value })}
            style={inputStyle}
          />
          <label style={labelStyle}>Subheadline</label>
          <input
            value={section.data.subheadline || ''}
            onChange={(e) => updateData({ subheadline: e.target.value })}
            style={inputStyle}
            placeholder="Optional"
          />
        </>
      )}

      {section.data.type === 'headline' && (
        <>
          <label style={labelStyle}>Text</label>
          <input
            value={section.data.text}
            onChange={(e) => updateData({ text: e.target.value })}
            style={inputStyle}
          />
          <label style={labelStyle}>Level</label>
          <select
            value={section.data.level}
            onChange={(e) => updateData({ level: e.target.value as 'h1' | 'h2' | 'h3' })}
            style={selectStyle}
          >
            <option value="h1">H1</option>
            <option value="h2">H2</option>
            <option value="h3">H3</option>
          </select>
        </>
      )}

      {section.data.type === 'body_text' && (
        <>
          <label style={labelStyle}>Text</label>
          <textarea
            value={section.data.text}
            onChange={(e) => updateData({ text: e.target.value })}
            style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }}
          />
          <label style={{ ...labelStyle, display: 'flex', alignItems: 'center', gap: '6px' }}>
            <input
              type="checkbox"
              checked={section.data.bullets || false}
              onChange={(e) => updateData({ bullets: e.target.checked })}
            />
            Bullet list
          </label>
        </>
      )}

      {section.data.type === 'visualization' && (
        <>
          <ArtifactPicker
            value={section.data.artifactId}
            onChange={(id) => updateData({ artifactId: id })}
            onUrlResolved={(url) => updateData({ artifactUrl: url })}
            filterCategories={['chart', 'graphic', 'cta'] as ArtifactCategory[]}
            label="Artifact"
          />
          <label style={labelStyle}>Title</label>
          <input
            value={section.data.title || ''}
            onChange={(e) => updateData({ title: e.target.value })}
            style={inputStyle}
            placeholder="Optional title above visualization"
          />
          <label style={labelStyle}>Caption</label>
          <input
            value={section.data.caption || ''}
            onChange={(e) => updateData({ caption: e.target.value })}
            style={inputStyle}
            placeholder="Optional caption below"
          />
          <label style={labelStyle}>Footnote</label>
          <input
            value={section.data.footnote || ''}
            onChange={(e) => updateData({ footnote: e.target.value })}
            style={inputStyle}
            placeholder='e.g., "p<0.001 vs placebo"'
          />
          <label style={labelStyle}>Alt Text</label>
          <input
            value={section.data.alt}
            onChange={(e) => updateData({ alt: e.target.value })}
            style={inputStyle}
          />
          <label style={labelStyle}>Fit</label>
          <select
            value={section.data.fit || 'contain'}
            onChange={(e) => updateData({ fit: e.target.value as 'contain' | 'cover' })}
            style={selectStyle}
          >
            <option value="contain">Contain (show all)</option>
            <option value="cover">Cover (fill area)</option>
          </select>
        </>
      )}

      {section.data.type === 'bar_chart' && (
        <>
          <label style={labelStyle}>Title</label>
          <input
            value={section.data.title}
            onChange={(e) => updateData({ title: e.target.value })}
            style={inputStyle}
          />
          <ArtifactPicker
            value={section.data.artifactId}
            onChange={(id) => updateData({ artifactId: id })}
            onUrlResolved={(url) => updateData({ artifactUrl: url })}
            filterCategories={['chart'] as ArtifactCategory[]}
            label="Use Artifact Image Instead"
          />
          {!section.data.artifactId && (
            <>
              <label style={labelStyle}>Orientation</label>
              <select
                value={section.data.orientation}
                onChange={(e) => updateData({ orientation: e.target.value as 'vertical' | 'horizontal' })}
                style={selectStyle}
              >
                <option value="vertical">Vertical</option>
                <option value="horizontal">Horizontal</option>
              </select>
              <p style={{ fontSize: '10px', color: 'var(--text-muted)', margin: '8px 0 0' }}>
                Using CSS-rendered chart. Pick an artifact above for production-quality charts.
              </p>
            </>
          )}
        </>
      )}

      {section.data.type === 'line_chart' && (
        <>
          <label style={labelStyle}>Title</label>
          <input
            value={section.data.title}
            onChange={(e) => updateData({ title: e.target.value })}
            style={inputStyle}
          />
          <ArtifactPicker
            value={section.data.artifactId}
            onChange={(id) => updateData({ artifactId: id })}
            onUrlResolved={(url) => updateData({ artifactUrl: url })}
            filterCategories={['chart'] as ArtifactCategory[]}
            label="Use Artifact Image Instead"
          />
          {!section.data.artifactId && (
            <p style={{ fontSize: '10px', color: 'var(--text-muted)', margin: '8px 0 0' }}>
              Line charts render as placeholder. Pick an artifact above for the real chart image.
            </p>
          )}
        </>
      )}

      {section.data.type === 'data_table' && (
        <>
          <label style={labelStyle}>Title</label>
          <input
            value={section.data.title}
            onChange={(e) => updateData({ title: e.target.value })}
            style={inputStyle}
          />
          <ArtifactPicker
            value={section.data.artifactId}
            onChange={(id) => updateData({ artifactId: id })}
            onUrlResolved={(url) => updateData({ artifactUrl: url })}
            filterCategories={['chart', 'graphic'] as ArtifactCategory[]}
            label="Use Artifact Image Instead"
          />
          {!section.data.artifactId && (
            <p style={{ fontSize: '10px', color: 'var(--text-muted)', margin: '8px 0 0' }}>
              Using CSS-rendered table. Pick an artifact above for pre-approved table images.
            </p>
          )}
        </>
      )}

      {section.data.type === 'stat_callout' && (
        <p style={{ fontSize: '10px', color: 'var(--text-muted)', margin: '4px 0 0' }}>
          Stats: {section.data.stats.map((s) => `${s.value} ${s.label}`).join(', ')}
          <br />Edit via config panel for detailed control.
          <br /><br />Tip: For production-quality stat graphics, use a Visualization section with an artifact image instead.
        </p>
      )}

      {section.data.type === 'cta_block' && (
        <>
          <label style={labelStyle}>CTA Text</label>
          <input
            value={section.data.text}
            onChange={(e) => updateData({ text: e.target.value })}
            style={inputStyle}
          />
          <label style={labelStyle}>Style</label>
          <select
            value={section.data.style}
            onChange={(e) => updateData({ style: e.target.value as 'button' | 'banner' | 'callout' })}
            style={selectStyle}
          >
            <option value="button">Button</option>
            <option value="banner">Banner</option>
            <option value="callout">Callout Box</option>
          </select>
          <ArtifactPicker
            value={section.data.artifactId}
            onChange={(id) => updateData({ artifactId: id })}
            onUrlResolved={(url) => updateData({ artifactUrl: url })}
            filterCategories={['cta', 'graphic'] as ArtifactCategory[]}
            label="Use CTA Artifact Image"
          />
          {section.data.artifactId && (
            <p style={{ fontSize: '10px', color: 'var(--accent)', margin: '6px 0 0' }}>
              Artifact image will replace the CSS-rendered CTA
            </p>
          )}
        </>
      )}

      {section.data.type === 'isi_block' && (
        <>
          <label style={labelStyle}>Variant</label>
          <select
            value={section.data.variant}
            onChange={(e) => updateData({ variant: e.target.value as 'full' | 'selected' })}
            style={selectStyle}
          >
            <option value="full">Full ISI</option>
            <option value="selected">Selected ISI</option>
          </select>
        </>
      )}

      {section.data.type === 'footer' && (
        <>
          <label style={labelStyle}>Job Code</label>
          <input
            value={section.data.jobCode || ''}
            onChange={(e) => updateData({ jobCode: e.target.value })}
            style={inputStyle}
          />
          <label style={labelStyle}>Date</label>
          <input
            value={section.data.date || ''}
            onChange={(e) => updateData({ date: e.target.value })}
            style={inputStyle}
          />
          <label style={labelStyle}>Legal Line</label>
          <input
            value={section.data.legalLine || ''}
            onChange={(e) => updateData({ legalLine: e.target.value })}
            style={inputStyle}
          />
          <label style={labelStyle}>Copyright Line</label>
          <input
            value={section.data.copyrightLine || ''}
            onChange={(e) => updateData({ copyrightLine: e.target.value })}
            style={inputStyle}
            placeholder="e.g., © 2026 Company. All rights reserved."
          />
          <label style={labelStyle}>Legal Lines (one per line)</label>
          <textarea
            value={(section.data.legalLines || []).join('\n')}
            onChange={(e) => updateData({ legalLines: e.target.value.split('\n').filter(Boolean) })}
            style={{ ...inputStyle, minHeight: '60px', resize: 'vertical' }}
            placeholder="Wrap with ** for bold"
          />
          <ArtifactPicker
            value={section.data.corporateLogoArtifactId}
            onChange={(id) => updateData({ corporateLogoArtifactId: id })}
            onUrlResolved={(url) => updateData({ corporateLogoArtifactUrl: url })}
            filterCategories={['logo'] as ArtifactCategory[]}
            label="Corporate Logo"
          />
        </>
      )}

      {section.data.type === 'divider' && (
        <>
          <label style={labelStyle}>Style</label>
          <select
            value={section.data.style}
            onChange={(e) => updateData({ style: e.target.value as 'line' | 'space' | 'accent' })}
            style={selectStyle}
          >
            <option value="line">Line</option>
            <option value="space">Space</option>
            <option value="accent">Accent</option>
          </select>
        </>
      )}

      {section.data.type === 'image_block' && (
        <>
          <ArtifactPicker
            value={section.data.artifactId}
            onChange={(id) => updateData({ artifactId: id })}
            onUrlResolved={(url) => updateData({ artifactUrl: url })}
            filterCategories={['photography', 'graphic', 'background'] as ArtifactCategory[]}
            label="Image Source"
          />
          <label style={labelStyle}>Alt Text</label>
          <input
            value={section.data.alt}
            onChange={(e) => updateData({ alt: e.target.value })}
            style={inputStyle}
          />
          <label style={labelStyle}>Caption</label>
          <input
            value={section.data.caption || ''}
            onChange={(e) => updateData({ caption: e.target.value })}
            style={inputStyle}
            placeholder="Optional"
          />
        </>
      )}

      {section.data.type === 'dosing_timeline' && (
        <>
          <label style={labelStyle}>Title</label>
          <input
            value={section.data.title}
            onChange={(e) => updateData({ title: e.target.value })}
            style={inputStyle}
          />
          <p style={{ fontSize: '10px', color: 'var(--text-muted)', margin: '8px 0 0' }}>
            {section.data.phases.length} phase(s) — edit via config panel
          </p>
        </>
      )}

      {(section.data.type === 'icon_row' || section.data.type === 'icon_flow') && (
        <p style={{ fontSize: '10px', color: 'var(--text-muted)', margin: '4px 0 0' }}>
          {section.data.type === 'icon_row' ? `${section.data.icons.length} icons` : `${section.data.steps.length} steps`}
          — edit via config panel
        </p>
      )}

      {section.data.type === 'references' && (
        <>
          <label style={labelStyle}>References (one per line)</label>
          <textarea
            value={section.data.items.join('\n')}
            onChange={(e) => updateData({ items: e.target.value.split('\n').filter(Boolean) })}
            style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }}
          />
        </>
      )}

      {section.data.type === 'donut_chart' && (
        <>
          <label style={labelStyle}>Title</label>
          <input
            value={section.data.title || ''}
            onChange={(e) => updateData({ title: e.target.value })}
            style={inputStyle}
            placeholder="Optional title"
          />
          <ArtifactPicker
            value={section.data.artifactId}
            onChange={(id) => updateData({ artifactId: id })}
            onUrlResolved={(url) => updateData({ artifactUrl: url })}
            filterCategories={['chart'] as ArtifactCategory[]}
            label="Use Artifact Image Instead"
          />
          {!section.data.artifactId && (
            <p style={{ fontSize: '10px', color: 'var(--text-muted)', margin: '8px 0 0' }}>
              {section.data.charts.length} chart(s) — CSS-rendered. Pick an artifact for production quality.
            </p>
          )}
        </>
      )}

      {section.data.type === 'checkmark_callout' && (() => {
        const cmData = section.data;
        return (
          <>
            {cmData.items.map((item, idx) => (
              <div key={idx} style={{ borderBottom: '1px solid var(--border)', paddingBottom: '8px', marginBottom: '4px' }}>
                <label style={labelStyle}>Item {idx + 1} — Heading</label>
                <input
                  value={item.heading}
                  onChange={(e) => {
                    const items = [...cmData.items];
                    items[idx] = { ...items[idx], heading: e.target.value };
                    updateData({ items });
                  }}
                  style={inputStyle}
                />
                <label style={labelStyle}>Body</label>
                <textarea
                  value={item.body}
                  onChange={(e) => {
                    const items = [...cmData.items];
                    items[idx] = { ...items[idx], body: e.target.value };
                    updateData({ items });
                  }}
                  style={{ ...inputStyle, minHeight: '50px', resize: 'vertical' }}
                />
              </div>
            ))}
            <button
              onClick={() => updateData({ items: [...cmData.items, { heading: 'New benefit:', body: 'Description' }] })}
              style={{ ...inputStyle, cursor: 'pointer', textAlign: 'center', fontWeight: 600, fontSize: '11px', marginTop: '4px' }}
            >
              + Add Item
            </button>
          </>
        );
      })()}

      {section.data.type === 'ruled_subheader' && (
        <>
          <label style={labelStyle}>Subheader Text</label>
          <input
            value={section.data.text}
            onChange={(e) => updateData({ text: e.target.value })}
            style={inputStyle}
          />
        </>
      )}

      {section.data.type === 'qr_cta' && (
        <>
          <label style={labelStyle}>CTA Text</label>
          <textarea
            value={section.data.text}
            onChange={(e) => updateData({ text: e.target.value })}
            style={{ ...inputStyle, minHeight: '60px', resize: 'vertical' }}
          />
          <ArtifactPicker
            value={section.data.qrArtifactId}
            onChange={(id) => updateData({ qrArtifactId: id })}
            onUrlResolved={(url) => updateData({ qrArtifactUrl: url })}
            filterCategories={['graphic'] as ArtifactCategory[]}
            label="QR Code Image"
          />
          <label style={labelStyle}>Footnote</label>
          <input
            value={section.data.footnote || ''}
            onChange={(e) => updateData({ footnote: e.target.value })}
            style={inputStyle}
            placeholder="e.g., Data rates may apply."
          />
        </>
      )}
    </div>
  );
}

// =============================================================================
// Shared styles
// =============================================================================

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '10px',
  fontWeight: 600,
  color: 'var(--text-muted)',
  marginBottom: '3px',
  marginTop: '8px',
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '5px 8px',
  fontSize: '12px',
  background: 'var(--bg-mid)',
  border: '1px solid var(--border)',
  borderRadius: '5px',
  color: 'var(--text-primary)',
  outline: 'none',
  boxSizing: 'border-box',
};

const selectStyle: React.CSSProperties = {
  ...inputStyle,
  cursor: 'pointer',
};

const sectionHeaderStyle: React.CSSProperties = {
  margin: '0 0 6px',
  fontSize: '10px',
  fontWeight: 700,
  color: 'var(--text-muted)',
  textTransform: 'uppercase',
  letterSpacing: '0.8px',
};
