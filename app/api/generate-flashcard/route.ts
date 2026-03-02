import { NextRequest, NextResponse } from 'next/server';
import type { FlashcardPage, FlashcardSection, FlashcardTemplate } from '../../../lib/types';
import { assignArtifactsToPages } from '../../../lib/artifact-matcher';

// ── POST /api/generate-flashcard ─────────────────────────────────────────────
// Generates a FlashcardConfig (pages + sections) from a key message and tone.
//
// If N8N_FLASHCARD_WEBHOOK_URL is configured, it forwards to n8n.
// Otherwise, it uses a built-in template generator (great for POC demos).

let sectionCounter = 0;
function genId(): string {
  return `ai-sec-${Date.now()}-${++sectionCounter}`;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { keyMessage, visualTone, template } = body as {
      keyMessage: string;
      visualTone: string;
      template: FlashcardTemplate;
    };

    if (!keyMessage) {
      return NextResponse.json({ error: 'keyMessage is required.' }, { status: 400 });
    }

    // ── Try n8n webhook if configured ──────────────────────────────────────
    const webhookUrl = process.env.N8N_FLASHCARD_WEBHOOK_URL;
    if (webhookUrl && webhookUrl !== 'PASTE_YOUR_WEBHOOK_URL_HERE') {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 120_000);

        const response = await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ keyMessage, visualTone, template }),
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        if (response.ok) {
          const data = await response.json();
          // Enrich n8n-generated pages with artifacts from the library
          if (data.pages && Array.isArray(data.pages)) {
            try {
              data.pages = await assignArtifactsToPages(data.pages, visualTone, keyMessage);
            } catch (err) {
              console.warn('[generate-flashcard] Artifact matching failed on n8n pages:', err);
            }
          }
          return NextResponse.json(data);
        }
      } catch {
        // Fall through to built-in generator
        console.log('[generate-flashcard] n8n webhook failed, using built-in generator');
      }
    }

    // ── Built-in generator ─────────────────────────────────────────────────
    const rawPages =
      template === 'announcement'
        ? generateAnnouncementPages(keyMessage, visualTone)
        : generateStandardPages(keyMessage, visualTone);

    // Auto-assign artifacts from the library (graceful: falls back to raw pages)
    let pages = rawPages;
    try {
      pages = await assignArtifactsToPages(rawPages, visualTone, keyMessage);
    } catch (err) {
      console.warn('[generate-flashcard] Artifact matching failed:', err);
    }

    return NextResponse.json({ pages, generated: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'An unexpected error occurred.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// ── Built-in generators ────────────────────────────────────────────────────

// Content variants based on visual tone
function getToneContent(tone: string) {
  switch (tone) {
    case 'Clinical & Trustworthy':
      return {
        heroEyebrow: 'CLINICAL EVIDENCE',
        adjective: 'clinically proven',
        ctaVerb: 'Review the clinical data',
        footerNote: 'Based on Phase 3 clinical trial data.',
      };
    case 'Active & Energetic':
      return {
        heroEyebrow: 'A NEW ERA IN TREATMENT',
        adjective: 'breakthrough',
        ctaVerb: 'Discover what\'s possible',
        footerNote: 'Empowering patients to move forward.',
      };
    case 'Calm & Reassuring':
      return {
        heroEyebrow: 'TRUSTED RELIEF',
        adjective: 'well-established',
        ctaVerb: 'Learn how VELARA can help',
        footerNote: 'Supporting your patients\' journey.',
      };
    default: // Warm & Hopeful
      return {
        heroEyebrow: 'NOW APPROVED',
        adjective: 'promising',
        ctaVerb: 'See what VELARA can offer',
        footerNote: 'A hopeful new option for your patients.',
      };
  }
}

function generateAnnouncementPages(keyMessage: string, visualTone: string): FlashcardPage[] {
  const tone = getToneContent(visualTone);

  return [
    // ── Fold 1: Hero + Efficacy ────────────────────────────────
    {
      id: 'fold-1',
      label: 'Fold 1 — Hero',
      foldRole: 'content' as const,
      sections: [
        sec('hero', {
          type: 'hero',
          eyebrow: tone.heroEyebrow,
          headline: keyMessage || 'A new treatment option for moderate-to-severe chronic inflammatory joint disease',
          subheadline: 'VELARA (celipruvant) 10mg — Once-daily oral dosing',
        }),
        sec('divider', { type: 'divider', style: 'accent' }),
        sec('visualization', {
          type: 'visualization',
          title: 'Efficacy Results',
          alt: 'VELARA efficacy data visualization',
          caption: 'Select an approved chart or diagram from the Artifact Library',
        }),
        sec('checkmark_callout', {
          type: 'checkmark_callout',
          items: [
            {
              heading: `${tone.adjective.charAt(0).toUpperCase() + tone.adjective.slice(1)} Efficacy`,
              body: '52% of patients achieved ACR20 response at Week 24 (p<0.001 vs placebo)',
            },
            {
              heading: 'Convenient Dosing',
              body: 'Once-daily oral tablet — no injections, no infusions required',
            },
            {
              heading: 'Established Safety Profile',
              body: 'Safety profile consistent with the known class effects. See full ISI for details.',
            },
          ],
        }),
      ],
    },

    // ── Fold 2: Details + Steps + QR ───────────────────────────
    {
      id: 'fold-2',
      label: 'Fold 2 — Details',
      foldRole: 'content' as const,
      sections: [
        sec('headline', {
          type: 'headline',
          text: 'Significant joint pain relief vs. placebo at Week 12',
          level: 'h2',
        }),
        sec('body_text', {
          type: 'body_text',
          text: 'VELARA significantly reduced joint pain vs. placebo at Week 12 (p<0.001). Results were sustained through Week 24 across all primary and key secondary endpoints.',
        }),
        sec('ruled_subheader', {
          type: 'ruled_subheader',
          text: 'Dose modification steps to consider:',
        }),
        sec('icon_flow', {
          type: 'icon_flow',
          showConnectors: true,
          steps: [
            { title: 'Assess', description: 'Evaluate disease activity and risk factors' },
            { title: 'Initiate', description: 'Start VELARA 10mg once daily' },
            { title: 'Monitor', description: 'Check LFTs monthly for first 6 months' },
            { title: 'Adjust', description: 'Modify dose based on response and tolerability' },
          ],
        }),
        sec('body_text', {
          type: 'body_text',
          text: 'Do not initiate VELARA during an active, serious infection. See full Prescribing Information for complete dosing and administration details.',
        }),
        sec('qr_cta', {
          type: 'qr_cta',
          text: tone.ctaVerb + ' at velara-hcp.com',
          footnote: 'Data rates may apply.',
        }),
      ],
    },

    // ── Fold 3: References + Footer ────────────────────────────
    {
      id: 'fold-3',
      label: 'Fold 3 — References & Footer',
      foldRole: 'content' as const,
      sections: [
        sec('headline', { type: 'headline', text: 'Drug Interactions', level: 'h3' }),
        sec('body_text', {
          type: 'body_text',
          text: 'Avoid concomitant use with strong immunosuppressants.\nUse caution with live vaccines.\nMonitor closely when co-administered with CYP3A4 inhibitors.\nSee Full Prescribing Information for complete drug interaction details.',
          bullets: true,
        }),
        sec('divider', { type: 'divider', style: 'line' }),
        sec('references', {
          type: 'references',
          items: [
            'VELARA [prescribing information]. Fictional Pharma Corp; 2026.',
            'Smith J, et al. Celipruvant in moderate-to-severe CIJD: Phase 3 results. J Rheumatol. 2026;00:000-000.',
            'Data on file. Fictional Pharma Corp. Study VELARA-301.',
          ],
        }),
        sec('footer', {
          type: 'footer',
          legalLine: 'Please see Brief Summary of full Prescribing Information, including Boxed Warning, on adjacent page.',
          legalLines: [
            '**Please see full Prescribing Information, including Boxed Warning, at velara-hcp.com.**',
            'VELARA is a registered trademark of Fictional Pharma Corp.',
          ],
          copyrightLine: '\u00A9 2026 Fictional Pharma Corp. All rights reserved.',
          jobCode: 'cp-000000v1',
          date: '01/26',
          productLogos: [{ alt: 'VELARA Logo' }],
        }),
      ],
    },

    // ── Fold 4: ISI ────────────────────────────────────────────
    {
      id: 'fold-4',
      label: 'Fold 4 — ISI',
      foldRole: 'isi' as const,
      sections: [
        sec('headline', { type: 'headline', text: 'Important Safety Information', level: 'h2' }),
        sec('isi_block', { type: 'isi_block', variant: 'full' }),
      ],
    },

    // ── Blank / Glue ───────────────────────────────────────────
    { id: 'fold-blank', label: 'Blank', foldRole: 'blank' as const, sections: [] },
    { id: 'fold-glue', label: 'Glue', foldRole: 'glue' as const, sections: [] },
  ];
}

function generateStandardPages(keyMessage: string, visualTone: string): FlashcardPage[] {
  const tone = getToneContent(visualTone);

  return [
    {
      id: 'page-front',
      label: 'Front',
      sections: [
        sec('hero', {
          type: 'hero',
          eyebrow: tone.heroEyebrow,
          headline: keyMessage || 'Move Beyond the Pain',
          subheadline: 'VELARA (celipruvant) 10mg — for moderate-to-severe chronic inflammatory joint disease',
        }),
        sec('divider', { type: 'divider', style: 'accent' }),
        sec('stat_callout', {
          type: 'stat_callout',
          stats: [
            { value: '52%', label: 'ACR20 Response', sublabel: 'at Week 24', style: 'circle' },
            { value: 'p<0.001', label: 'vs. Placebo', sublabel: 'Week 12 primary endpoint', style: 'large-number' },
          ],
        }),
        sec('visualization', {
          type: 'visualization',
          title: 'Clinical Trial Results',
          alt: 'VELARA efficacy chart',
          caption: 'Select an approved visualization from the Artifact Library',
        }),
        sec('body_text', {
          type: 'body_text',
          text: tone.footerNote,
        }),
        sec('footer', {
          type: 'footer',
          jobCode: 'cp-000000v1',
          date: '01/26',
          legalLine: 'Please see Brief Summary of full Prescribing Information on reverse side.',
        }),
      ],
    },
    {
      id: 'page-back',
      label: 'Back',
      sections: [
        sec('headline', { type: 'headline', text: 'Important Safety Information', level: 'h2' }),
        sec('isi_block', { type: 'isi_block', variant: 'full' }),
        sec('references', {
          type: 'references',
          items: [
            'VELARA [prescribing information]. Fictional Pharma Corp; 2026.',
            'Smith J, et al. Phase 3 results. J Rheumatol. 2026;00:000-000.',
          ],
        }),
      ],
    },
  ];
}

// ── Helper: create a section with a generated ID ──────────────────────────

function sec(type: FlashcardSection['type'], data: FlashcardSection['data']): FlashcardSection {
  return { id: genId(), type, colSpan: 12, colStart: 1, data };
}
