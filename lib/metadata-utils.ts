// =============================================================================
// MERLIN — Metadata Utilities
// Auto-extract rich metadata from a CampaignConfig for compliance tracking.
// =============================================================================

import type { CampaignConfig, AssetMetadata } from './types';
import { VELARA_BRAND } from './brand-data';
import { sha256 } from './hash-utils';

// ── Messaging type classification keywords ──────────────────────────────────

const MESSAGING_KEYWORDS: Record<string, string[]> = {
  efficacy: ['acr20', 'acr50', 'response', 'reduction', 'improved', 'efficacy', 'clinical', 'trial', 'study', 'data', 'week', 'placebo', 'significant', 'p<', 'outcome'],
  awareness: ['awareness', 'learn', 'understand', 'recognize', 'condition', 'disease', 'symptoms', 'living with', 'affects', 'million'],
  brand: ['velara', 'celipruvant', 'once-daily', 'oral', 'dosing', 'convenient', 'simple', 'new'],
  hcp: ['prescribe', 'prescribing', 'healthcare', 'provider', 'physician', 'doctor', 'dosage', 'indication', 'contraindication'],
};

// ── Imagery descriptor extraction keywords ──────────────────────────────────

const IMAGERY_KEYWORDS: Record<string, string[]> = {
  'woman patient': ['woman', 'she', 'her', 'female', 'mother', 'mom'],
  'man patient': ['man', 'he', 'him', 'male', 'father', 'dad'],
  'outdoor': ['outdoor', 'outside', 'park', 'garden', 'walk', 'nature', 'green'],
  'indoor': ['indoor', 'inside', 'home', 'room', 'kitchen', 'living'],
  'golden hour': ['golden', 'sunset', 'sunrise', 'warm light', 'sun-drenched', 'golden hour'],
  'active lifestyle': ['active', 'exercise', 'yoga', 'running', 'sport', 'movement', 'energetic'],
  'family': ['family', 'children', 'kids', 'together', 'loved ones', 'grandchildren'],
  'clinical setting': ['hospital', 'clinic', 'doctor', 'medical', 'white coat', 'stethoscope'],
  'hopeful': ['hope', 'hopeful', 'smile', 'happy', 'joy', 'relief', 'bright', 'optimistic'],
  'calm': ['calm', 'serene', 'peaceful', 'relaxed', 'gentle', 'soft', 'quiet'],
};

// ── Extract claims used ─────────────────────────────────────────────────────

function extractClaimsUsed(config: CampaignConfig): string[] {
  // Collect all text from frames
  const allText = config.frames
    .map((f) => {
      const parts = [f.headline.text];
      if (f.bodyCopy?.text) parts.push(f.bodyCopy.text);
      if (f.cta?.text) parts.push(f.cta.text);
      return parts.join(' ');
    })
    .join(' ')
    .toLowerCase();

  // Match against approved claims
  return VELARA_BRAND.approvedClaims.filter((claim) => {
    const claimLower = claim.toLowerCase();
    // Check if key phrases from the claim appear in the banner text
    const keyPhrases = claimLower.split(/[,;]/).map((s) => s.trim());
    return keyPhrases.some((phrase) => {
      // Match on meaningful substrings (at least 8 chars)
      if (phrase.length < 8) return allText.includes(phrase);
      // For longer phrases, check for partial match (first 20 chars)
      const partial = phrase.slice(0, 20);
      return allText.includes(partial);
    });
  });
}

// ── Classify messaging type ─────────────────────────────────────────────────

function classifyMessagingType(config: CampaignConfig): AssetMetadata['messagingType'] {
  const allText = config.frames
    .map((f) => {
      const parts = [f.headline.text];
      if (f.bodyCopy?.text) parts.push(f.bodyCopy.text);
      return parts.join(' ');
    })
    .join(' ')
    .toLowerCase();

  const scores: Record<string, number> = { efficacy: 0, awareness: 0, brand: 0, hcp: 0 };

  for (const [type, keywords] of Object.entries(MESSAGING_KEYWORDS)) {
    for (const keyword of keywords) {
      if (allText.includes(keyword)) {
        scores[type]++;
      }
    }
  }

  const sorted = Object.entries(scores).sort(([, a], [, b]) => b - a);
  if (sorted[0][1] === 0) return 'other';
  return sorted[0][0] as AssetMetadata['messagingType'];
}

// ── Extract imagery descriptors ─────────────────────────────────────────────

function extractImageryDescriptors(
  config: CampaignConfig,
  keyMessage?: string,
): string[] {
  // Combine frame text + key message for broader matching
  const allText = [
    keyMessage || '',
    ...config.frames.map((f) => {
      const parts = [f.headline.text];
      if (f.bodyCopy?.text) parts.push(f.bodyCopy.text);
      return parts.join(' ');
    }),
  ]
    .join(' ')
    .toLowerCase();

  const descriptors: string[] = [];

  for (const [descriptor, keywords] of Object.entries(IMAGERY_KEYWORDS)) {
    if (keywords.some((kw) => allText.includes(kw))) {
      descriptors.push(descriptor);
    }
  }

  return descriptors;
}

// ── Main: generate full metadata for a config ───────────────────────────────

export async function generateMetadata(
  config: CampaignConfig,
  options?: {
    visualTone?: string;
    keyMessage?: string;
    generationSource?: 'ai' | 'manual';
  },
): Promise<AssetMetadata> {
  const claimsUsed = extractClaimsUsed(config);
  const messagingType = classifyMessagingType(config);
  const imageryDescriptors = extractImageryDescriptors(config, options?.keyMessage);
  const isiVersionHash = config.isi.text ? await sha256(config.isi.text) : '';

  return {
    claimsUsed,
    imageryDescriptors,
    messagingType,
    visualTone: options?.visualTone || 'Unknown',
    isiVersionHash,
    generationSource: options?.generationSource || 'manual',
    tags: [],
  };
}
