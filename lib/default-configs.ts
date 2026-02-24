// =============================================================================
// MERLIN — Preset Campaign Configs for Standard Banner Sizes
//
// Each preset is a complete, standalone CampaignConfig for VELARA with
// layout adjustments tuned to the specific ad size.
// =============================================================================

import type { CampaignConfig } from './types';
import { VELARA_BRAND } from './brand-data';

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

const velaraBrand: CampaignConfig['brand'] = {
  name: 'VELARA (celipruvant) 10mg tablets',
  colors: { ...VELARA_BRAND.colors },
  typography: { ...VELARA_BRAND.typography },
};

const velaraClickTags: CampaignConfig['clickTags'] = {
  clickTag: 'https://www.velara-hcp.com',
};

const placeholderImage = (w: number, h: number) =>
  `https://placehold.co/${w}x${h}/1A5276/2E86C1`;

// ---------------------------------------------------------------------------
// PRESET: 300x250 — Medium Rectangle
// ---------------------------------------------------------------------------

export const PRESET_300x250: CampaignConfig = {
  size: { width: 300, height: 250, preset: '300x250' },
  brand: velaraBrand,

  frames: [
    {
      id: 'frame-1',
      duration: 3000,
      headline: {
        text: 'Move Beyond the Pain',
        fontSize: '22px',
        color: '#FFFFFF',
        position: 'center',
      },
      bodyCopy: {
        text: 'VELARA (celipruvant) 10mg \u2014 for moderate-to-severe chronic inflammatory joint disease',
        fontSize: '10px',
        color: '#FFFFFF',
      },
      backgroundImageUrl: placeholderImage(600, 500),
      overlayOpacity: 0.55,
      transition: 'fade',
    },
    {
      id: 'frame-2',
      duration: 4000,
      headline: {
        text: 'Proven Joint Pain Relief',
        fontSize: '20px',
        color: '#FFFFFF',
        position: 'center',
      },
      bodyCopy: {
        text: '52% of patients achieved ACR20 response at Week 24',
        fontSize: '11px',
        color: '#FFFFFF',
      },
      cta: {
        text: 'Learn More',
        url: 'https://www.velara-hcp.com',
        backgroundColor: '#F39C12',
        textColor: '#FFFFFF',
        borderRadius: '4px',
      },
      backgroundImageUrl: placeholderImage(600, 500),
      overlayOpacity: 0.6,
      transition: 'fade',
    },
    {
      id: 'frame-3',
      duration: 4000,
      headline: {
        text: 'Once-Daily Oral Dosing',
        fontSize: '20px',
        color: '#FFFFFF',
        position: 'center',
      },
      bodyCopy: {
        text: 'Talk to your doctor about VELARA',
        fontSize: '11px',
        color: '#FFFFFF',
      },
      cta: {
        text: 'Learn More',
        url: 'https://www.velara-hcp.com',
        backgroundColor: '#F39C12',
        textColor: '#FFFFFF',
        borderRadius: '4px',
      },
      backgroundImageUrl: placeholderImage(600, 500),
      overlayOpacity: 0.6,
      transition: 'fade',
    },
  ],

  isi: {
    text: VELARA_BRAND.isiText,
    enabled: true,
    rules: {
      autoScroll: true,
      speed: 15,
      delay: 1000,
      hardStop: 15000,
      onHover: 'pause',
      stripHeight: '30%',
      expandable: true,
      expandedHeight: '70%',
      fontSize: '7px',
      lineHeight: '1.35',
      backgroundColor: 'rgba(0, 0, 0, 0.85)',
      textColor: '#FFFFFF',
    },
  },

  clickTags: velaraClickTags,
  animation: { totalDuration: 14000, loops: 3, autoplay: true },
};

// ---------------------------------------------------------------------------
// PRESET: 728x90 — Leaderboard
//
// Horizontal layout: image on the left third, text + CTA on the right.
// ISI runs in a narrow strip along the bottom.
// ---------------------------------------------------------------------------

export const PRESET_728x90: CampaignConfig = {
  size: { width: 728, height: 90, preset: '728x90' },
  brand: velaraBrand,

  frames: [
    {
      id: 'frame-1',
      duration: 3000,
      headline: {
        text: 'Move Beyond the Pain',
        fontSize: '16px',
        color: '#FFFFFF',
        position: 'center',
      },
      bodyCopy: {
        text: 'VELARA (celipruvant) 10mg',
        fontSize: '9px',
        color: '#FFFFFF',
      },
      backgroundImageUrl: placeholderImage(728, 90),
      overlayOpacity: 0.55,
      transition: 'fade',
    },
    {
      id: 'frame-2',
      duration: 4000,
      headline: {
        text: 'Proven Joint Pain Relief',
        fontSize: '15px',
        color: '#FFFFFF',
        position: 'center',
      },
      bodyCopy: {
        text: '52% of patients achieved ACR20 response at Week 24',
        fontSize: '9px',
        color: '#FFFFFF',
      },
      cta: {
        text: 'Learn More',
        url: 'https://www.velara-hcp.com',
        backgroundColor: '#F39C12',
        textColor: '#FFFFFF',
        borderRadius: '3px',
      },
      backgroundImageUrl: placeholderImage(728, 90),
      overlayOpacity: 0.6,
      transition: 'fade',
    },
    {
      id: 'frame-3',
      duration: 4000,
      headline: {
        text: 'Once-Daily Oral Dosing',
        fontSize: '15px',
        color: '#FFFFFF',
        position: 'center',
      },
      bodyCopy: {
        text: 'Talk to your doctor about VELARA',
        fontSize: '9px',
        color: '#FFFFFF',
      },
      cta: {
        text: 'Learn More',
        url: 'https://www.velara-hcp.com',
        backgroundColor: '#F39C12',
        textColor: '#FFFFFF',
        borderRadius: '3px',
      },
      backgroundImageUrl: placeholderImage(728, 90),
      overlayOpacity: 0.6,
      transition: 'fade',
    },
  ],

  isi: {
    text: VELARA_BRAND.isiText,
    enabled: true,
    rules: {
      autoScroll: true,
      speed: 12,
      delay: 1000,
      hardStop: 15000,
      onHover: 'pause',
      stripHeight: '30px',
      expandable: true,
      expandedHeight: '80%',
      fontSize: '6px',
      lineHeight: '1.3',
      backgroundColor: 'rgba(0, 0, 0, 0.85)',
      textColor: '#FFFFFF',
    },
  },

  clickTags: velaraClickTags,
  animation: { totalDuration: 14000, loops: 3, autoplay: true },
};

// ---------------------------------------------------------------------------
// PRESET: 300x600 — Half Page
//
// Tall format: generous space for imagery at top, larger text area,
// roomy ISI section at the bottom.
// ---------------------------------------------------------------------------

export const PRESET_300x600: CampaignConfig = {
  size: { width: 300, height: 600, preset: '300x600' },
  brand: velaraBrand,

  frames: [
    {
      id: 'frame-1',
      duration: 3000,
      headline: {
        text: 'Move Beyond the Pain',
        fontSize: '26px',
        color: '#FFFFFF',
        position: 'center',
      },
      bodyCopy: {
        text: 'VELARA (celipruvant) 10mg \u2014 for moderate-to-severe chronic inflammatory joint disease in adults',
        fontSize: '12px',
        color: '#FFFFFF',
      },
      backgroundImageUrl: placeholderImage(600, 1200),
      overlayOpacity: 0.5,
      transition: 'fade',
    },
    {
      id: 'frame-2',
      duration: 4000,
      headline: {
        text: 'Proven Joint Pain Relief',
        fontSize: '24px',
        color: '#FFFFFF',
        position: 'center',
      },
      bodyCopy: {
        text: 'VELARA significantly reduced joint pain vs. placebo at Week 12 (p<0.001). 52% of patients achieved ACR20 response at Week 24.',
        fontSize: '12px',
        color: '#FFFFFF',
      },
      cta: {
        text: 'Learn More',
        url: 'https://www.velara-hcp.com',
        backgroundColor: '#F39C12',
        textColor: '#FFFFFF',
        borderRadius: '4px',
      },
      backgroundImageUrl: placeholderImage(600, 1200),
      overlayOpacity: 0.55,
      transition: 'fade',
    },
    {
      id: 'frame-3',
      duration: 4000,
      headline: {
        text: 'Once-Daily Oral Dosing',
        fontSize: '24px',
        color: '#FFFFFF',
        position: 'center',
      },
      bodyCopy: {
        text: 'Simple, convenient treatment. Talk to your doctor about VELARA.',
        fontSize: '12px',
        color: '#FFFFFF',
      },
      cta: {
        text: 'Learn More',
        url: 'https://www.velara-hcp.com',
        backgroundColor: '#F39C12',
        textColor: '#FFFFFF',
        borderRadius: '4px',
      },
      backgroundImageUrl: placeholderImage(600, 1200),
      overlayOpacity: 0.55,
      transition: 'fade',
    },
  ],

  isi: {
    text: VELARA_BRAND.isiText,
    enabled: true,
    rules: {
      autoScroll: true,
      speed: 18,
      delay: 1000,
      hardStop: 15000,
      onHover: 'pause',
      stripHeight: '35%',
      expandable: true,
      expandedHeight: '75%',
      fontSize: '8px',
      lineHeight: '1.4',
      backgroundColor: 'rgba(0, 0, 0, 0.85)',
      textColor: '#FFFFFF',
    },
  },

  clickTags: velaraClickTags,
  animation: { totalDuration: 14000, loops: 3, autoplay: true },
};
