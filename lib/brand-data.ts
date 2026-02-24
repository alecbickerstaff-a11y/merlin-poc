// =============================================================================
// MERLIN — VELARA Brand Data & Default Campaign Config
// =============================================================================

import type { BrandData, CampaignConfig } from './types';

// ---------------------------------------------------------------------------
// ISI full text (shared across configs)
// ---------------------------------------------------------------------------

const VELARA_ISI_TEXT = `IMPORTANT SAFETY INFORMATION

WARNING: SERIOUS INFECTIONS AND MALIGNANCIES

Patients treated with VELARA are at increased risk for developing serious infections that may lead to hospitalization or death. Most patients who developed these infections were taking concomitant immunosuppressants.

If a serious infection develops, interrupt VELARA until the infection is controlled. Lymphoma and other malignancies have been observed in patients treated with VELARA.

CONTRAINDICATIONS
VELARA is contraindicated in patients with known hypersensitivity to celipruvant or any component of the formulation.

WARNINGS AND PRECAUTIONS
Serious Infections: Do not start VELARA during an active infection. Monitor patients closely for signs and symptoms of infection during and after treatment.

Malignancies: Consider the risks and benefits of VELARA prior to initiating therapy in patients with a known malignancy.

Hepatotoxicity: VELARA treatment has been associated with elevated liver enzymes. Monitor liver function tests monthly for the first 6 months.

ADVERSE REACTIONS
The most common adverse reactions (\u22655%) are upper respiratory tract infections, nausea, headache, elevated ALT, and injection site reactions.

Please see Full Prescribing Information, including Boxed Warning, at www.velara-hcp.com.

VELARA is a registered trademark of [Fictional Pharma Corp]. \u00A9 2026 All rights reserved.`;

// ---------------------------------------------------------------------------
// VELARA_BRAND — full brand profile for AI prompt generation
// ---------------------------------------------------------------------------

export const VELARA_BRAND: BrandData = {
  brandName: 'VELARA',
  genericName: 'celipruvant',
  dosage: '10mg tablets',
  indication:
    'Moderate-to-severe chronic inflammatory joint disease in adults',
  tagline: 'Move Beyond the Pain',

  colors: {
    primary: '#1A5276',
    secondary: '#2E86C1',
    accent: '#F39C12',
    background: '#F8F9FA',
    textDark: '#1C2833',
    textLight: '#FFFFFF',
  },

  typography: {
    headlineFont: 'Montserrat',
    bodyFont: 'Open Sans',
    minBodySize: '8px',
    minIsiSize: '6px',
  },

  visualStyle: {
    mood: [
      'hopeful',
      'active',
      'warm light',
      'golden hour',
      'movement',
      'freedom',
      'nature',
    ],
    avoid: [
      'clinical settings',
      'needles',
      'wheelchairs',
      'dark/cold tones',
    ],
  },

  approvedClaims: [
    'VELARA significantly reduced joint pain vs. placebo at Week 12 (p<0.001)',
    '52% of patients achieved ACR20 response at Week 24',
    'Once-daily oral dosing',
    'VELARA \u2014 Move Beyond the Pain',
    'Talk to your doctor about VELARA',
  ],

  ctaOptions: [
    'Learn More',
    'Talk to Your Doctor',
    'See Full Prescribing Information',
    'Sign Up for Updates',
  ],

  isiText: VELARA_ISI_TEXT,
};

// ---------------------------------------------------------------------------
// Placeholder image URL builder
// ---------------------------------------------------------------------------

const placeholderImage = (w: number, h: number) =>
  `https://placehold.co/${w}x${h}/1A5276/2E86C1`;

// ---------------------------------------------------------------------------
// DEFAULT_CAMPAIGN_CONFIG — 300x250 Medium Rectangle
// ---------------------------------------------------------------------------

export const DEFAULT_CAMPAIGN_CONFIG: CampaignConfig = {
  size: {
    width: 300,
    height: 250,
    preset: '300x250',
  },

  brand: {
    name: 'VELARA (celipruvant) 10mg tablets',
    colors: { ...VELARA_BRAND.colors },
    typography: { ...VELARA_BRAND.typography },
  },

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
    text: VELARA_ISI_TEXT,
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

  clickTags: {
    clickTag: 'https://www.velara-hcp.com',
  },

  animation: {
    totalDuration: 14000,
    loops: 3,
    autoplay: true,
  },
};
