// =============================================================================
// MERLIN — Artifact Auto-Matcher
// Enriches generated FlashcardPages with artifacts from the library.
// Called server-side from /api/generate-flashcard after page generation.
// =============================================================================

import type { Artifact, ArtifactCategory, FlashcardPage, FlashcardSection } from './types';
import { listArtifacts, isDbConfigured } from './db';

// ── Section type → artifact category mapping ──────────────────────────────────

const SECTION_CATEGORY: Record<string, ArtifactCategory> = {
  visualization: 'chart',
  bar_chart: 'chart',
  line_chart: 'chart',
  donut_chart: 'chart',
  data_table: 'chart',
  image_block: 'photography',
  cta_block: 'cta',
  qr_cta: 'graphic',
};

// ── Visual-tone → search keywords ──────────────────────────────────────────────

const TONE_KEYWORDS: Record<string, string[]> = {
  'Warm & Hopeful': ['hopeful', 'warm', 'golden', 'sunrise', 'nature', 'freedom', 'optimistic', 'bright', 'outdoor'],
  'Clinical & Trustworthy': ['clinical', 'data', 'professional', 'clean', 'precise', 'evidence', 'science', 'trust'],
  'Active & Energetic': ['active', 'movement', 'dynamic', 'energy', 'vitality', 'motion', 'sport', 'outdoor'],
  'Calm & Reassuring': ['calm', 'gentle', 'serene', 'peaceful', 'soft', 'soothing', 'comfort', 'quiet'],
};

// ── Stop words for keyword extraction ──────────────────────────────────────────

const STOP_WORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of',
  'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had',
  'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'can',
  'this', 'that', 'these', 'those', 'it', 'its', 'from', 'into', 'about', 'than',
  'not', 'no', 'all', 'each', 'every', 'any', 'some', 'such', 'only', 'also',
  'how', 'when', 'where', 'what', 'which', 'who', 'whom', 'why', 'once', 'both',
]);

function extractKeywords(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOP_WORDS.has(w));
}

// ── Scoring ────────────────────────────────────────────────────────────────────

function scoreArtifact(
  artifact: Artifact,
  toneKws: string[],
  msgKws: string[],
  brandId?: string,
): number {
  let score = 0;
  const tags = artifact.tags.map((t) => t.toLowerCase());
  const name = artifact.name.toLowerCase();

  // Tone-keyword matches (highest weight)
  for (const kw of toneKws) {
    if (tags.some((t) => t.includes(kw) || kw.includes(t))) score += 3;
    if (name.includes(kw)) score += 2;
  }

  // Key-message keyword matches
  for (const kw of msgKws) {
    if (tags.some((t) => t.includes(kw) || kw.includes(t))) score += 2;
    if (name.includes(kw)) score += 1;
  }

  // Brand affinity
  if (brandId && artifact.brandId === brandId) score += 5;
  if (!artifact.brandId) score += 1; // shared assets get a small bonus

  return score;
}

// ── Section enrichment ─────────────────────────────────────────────────────────

type PickFn = (category: ArtifactCategory) => { id: string; url: string } | null;

function enrichSection(section: FlashcardSection, pick: PickFn): FlashcardSection {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data: any = { ...section.data };

  switch (data.type) {
    case 'visualization':
    case 'bar_chart':
    case 'line_chart':
    case 'donut_chart':
    case 'data_table': {
      if (!data.artifactId) {
        const m = pick(SECTION_CATEGORY[data.type] || 'chart');
        if (m) { data.artifactId = m.id; data.artifactUrl = m.url; }
      }
      break;
    }

    case 'image_block': {
      if (!data.artifactId) {
        const m = pick('photography') || pick('graphic');
        if (m) { data.artifactId = m.id; data.artifactUrl = m.url; }
      }
      break;
    }

    case 'icon_flow': {
      if (Array.isArray(data.steps)) {
        data.steps = data.steps.map((step: Record<string, unknown>) => {
          if (!step.artifactId) {
            const m = pick('icon');
            if (m) return { ...step, artifactId: m.id };
          }
          return step;
        });
      }
      break;
    }

    case 'icon_row': {
      if (Array.isArray(data.icons)) {
        data.icons = data.icons.map((icon: Record<string, unknown>) => {
          if (!icon.artifactId) {
            const m = pick('icon');
            if (m) return { ...icon, artifactId: m.id };
          }
          return icon;
        });
      }
      break;
    }

    case 'footer': {
      if (!data.logoArtifactId) {
        const m = pick('logo');
        if (m) { data.logoArtifactId = m.id; data.logoArtifactUrl = m.url; }
      }
      if (!data.corporateLogoArtifactId) {
        const m = pick('logo');
        if (m) { data.corporateLogoArtifactId = m.id; data.corporateLogoArtifactUrl = m.url; }
      }
      if (Array.isArray(data.productLogos)) {
        data.productLogos = data.productLogos.map((pl: Record<string, unknown>) => {
          if (!pl.artifactId) {
            const m = pick('logo');
            if (m) return { ...pl, artifactId: m.id, artifactUrl: m.url };
          }
          return pl;
        });
      }
      break;
    }

    case 'cta_block': {
      if (!data.artifactId) {
        const m = pick('cta');
        if (m) { data.artifactId = m.id; data.artifactUrl = m.url; }
      }
      break;
    }

    case 'qr_cta': {
      if (!data.qrArtifactId) {
        const m = pick('graphic');
        if (m) { data.qrArtifactId = m.id; data.qrArtifactUrl = m.url; }
      }
      break;
    }

    // hero, headline, body_text, stat_callout, checkmark_callout, divider,
    // ruled_subheader, references, isi_block, dosing_timeline — no artifact slots
    default:
      break;
  }

  return { ...section, data };
}

// ── Main export ────────────────────────────────────────────────────────────────

/**
 * Walk generated pages and assign matching artifacts from the library.
 * Falls back gracefully when DB is unavailable or artifact library is empty.
 */
export async function assignArtifactsToPages(
  pages: FlashcardPage[],
  visualTone: string,
  keyMessage: string,
  brandId?: string,
): Promise<FlashcardPage[]> {
  // Graceful degradation: no DB → return as-is
  if (!isDbConfigured()) return pages;

  const toneKws = TONE_KEYWORDS[visualTone] || TONE_KEYWORDS['Warm & Hopeful'];
  const msgKws = extractKeywords(keyMessage);

  // ── Determine which categories we actually need ──────────────────────────
  const neededCategories = new Set<ArtifactCategory>();

  // Content pages need backgrounds
  for (const page of pages) {
    const role = page.foldRole;
    if (!role || role === 'content') {
      if (!page.backgroundArtifactId) neededCategories.add('background');
    }
    for (const sec of page.sections) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const d = sec.data as any;
      const cat = SECTION_CATEGORY[d.type];
      if (cat && !d.artifactId) neededCategories.add(cat);

      // Subtypes
      if (d.type === 'icon_flow' && Array.isArray(d.steps)) {
        if (d.steps.some((s: Record<string, unknown>) => !s.artifactId)) neededCategories.add('icon');
      }
      if (d.type === 'icon_row' && Array.isArray(d.icons)) {
        if (d.icons.some((i: Record<string, unknown>) => !i.artifactId)) neededCategories.add('icon');
      }
      if (d.type === 'image_block' && !d.artifactId) {
        neededCategories.add('photography');
        neededCategories.add('graphic');
      }
      if (d.type === 'footer') {
        if (!d.logoArtifactId || !d.corporateLogoArtifactId) neededCategories.add('logo');
      }
    }
  }

  if (neededCategories.size === 0) return pages;

  // ── Batch-fetch artifacts per category in parallel ─────────────────────────
  const categoryArtifacts = new Map<ArtifactCategory, Artifact[]>();

  await Promise.all(
    Array.from(neededCategories).map(async (cat) => {
      try {
        const result = await listArtifacts({ category: cat, limit: 50 });
        categoryArtifacts.set(cat, result.artifacts);
      } catch {
        categoryArtifacts.set(cat, []);
      }
    }),
  );

  // ── Build picker function ──────────────────────────────────────────────────
  const usedIds = new Set<string>();

  function pickBest(category: ArtifactCategory): { id: string; url: string } | null {
    const candidates = categoryArtifacts.get(category);
    if (!candidates || candidates.length === 0) return null;

    const scored = candidates
      .map((a) => ({ artifact: a, score: scoreArtifact(a, toneKws, msgKws, brandId) }))
      .sort((a, b) => b.score - a.score);

    // Prefer unused artifacts to avoid assigning the same one everywhere
    const pick = scored.find((s) => !usedIds.has(s.artifact.id)) || scored[0];
    if (pick) {
      usedIds.add(pick.artifact.id);
      return { id: pick.artifact.id, url: pick.artifact.fileUrl };
    }
    return null;
  }

  // ── Walk pages and enrich ──────────────────────────────────────────────────
  return pages.map((page) => {
    const role = page.foldRole;

    // Only assign backgrounds to content pages
    let bgId = page.backgroundArtifactId;
    let bgUrl = page.backgroundArtifactUrl;
    if (!bgId && (!role || role === 'content')) {
      const bg = pickBest('background') || pickBest('photography');
      if (bg) { bgId = bg.id; bgUrl = bg.url; }
    }

    return {
      ...page,
      backgroundArtifactId: bgId,
      backgroundArtifactUrl: bgUrl,
      sections: page.sections.map((sec) => enrichSection(sec, pickBest)),
    };
  });
}
