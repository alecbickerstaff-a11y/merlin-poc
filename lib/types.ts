// =============================================================================
// MERLIN — Campaign Config Types
// The master schema that drives the entire banner template engine.
// AI fills in this config; the engine reads it and renders the banner.
// =============================================================================

// ---------------------------------------------------------------------------
// CampaignConfig — the top-level object that describes a complete banner ad
// ---------------------------------------------------------------------------

export interface CampaignConfig {
  /** Banner dimensions */
  size: BannerSize;

  /** Brand identity: colors, fonts, logo */
  brand: BrandSettings;

  /** Ordered list of animation frames (slides) */
  frames: FrameConfig[];

  /** Important Safety Information strip */
  isi: ISIConfig;

  /** Ad-server click-tracking URLs */
  clickTags: ClickTags;

  /** Global animation settings */
  animation: AnimationSettings;

  /** Optional — Leonardo AI image-generation settings */
  imageGeneration?: ImageGenerationSettings;
}

// ---------------------------------------------------------------------------
// Sub-types
// ---------------------------------------------------------------------------

export type BannerPreset =
  | '300x250'
  | '728x90'
  | '160x600'
  | '300x600'
  | '320x50'
  | 'custom';

export interface BannerSize {
  width: number;
  height: number;
  preset?: BannerPreset;
}

export interface BrandColors {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  textDark: string;
  textLight: string;
}

export interface BrandTypography {
  headlineFont: string;
  bodyFont: string;
  minBodySize: string;
  minIsiSize: string;
}

export interface BrandSettings {
  name: string;
  colors: BrandColors;
  typography: BrandTypography;
  logoUrl?: string;
}

export interface FrameHeadline {
  text: string;
  fontSize?: string;
  color?: string;
  position?: 'top' | 'center' | 'bottom';
}

export interface FrameBodyCopy {
  text: string;
  fontSize?: string;
  color?: string;
}

export interface FrameCTA {
  text: string;
  url: string;
  backgroundColor?: string;
  textColor?: string;
  borderRadius?: string;
}

export type FrameTransition = 'fade' | 'slide' | 'none';

export interface FrameConfig {
  id: string;
  /** Duration this frame is visible, in milliseconds */
  duration: number;
  headline: FrameHeadline;
  bodyCopy?: FrameBodyCopy;
  cta?: FrameCTA;
  backgroundImageUrl?: string;
  /** 0-1 — gradient overlay opacity for text legibility */
  overlayOpacity?: number;
  transition?: FrameTransition;
}

export interface ISIRules {
  autoScroll: boolean;
  /** Scroll speed in pixels per second */
  speed: number;
  /** Delay in ms before scroll starts */
  delay: number;
  /** Hard stop time in ms — scrolling stops here */
  hardStop: number;
  onHover: 'pause' | 'expand' | 'none';
  /** Height of the ISI strip, e.g. '33%' or '80px' */
  stripHeight: string;
  expandable: boolean;
  /** Height when expanded */
  expandedHeight?: string;
  fontSize: string;
  lineHeight: string;
  backgroundColor: string;
  textColor: string;
}

export interface ISIConfig {
  text: string;
  enabled: boolean;
  rules: ISIRules;
}

export interface ClickTags {
  clickTag: string;
  clickTag2?: string;
  clickTag3?: string;
}

export interface AnimationSettings {
  /** Total animation length in ms */
  totalDuration: number;
  /** Number of loops (0 = infinite) */
  loops: number;
  autoplay: boolean;
}

export type ImageStyle =
  | 'dynamic'
  | 'cinematic'
  | 'illustration'
  | 'photography';

export type ImageAspectRatio = '1:1' | '2:3' | '16:9' | '4:3' | 'custom';

export interface ImageGenerationSettings {
  model: string;
  style: ImageStyle;
  aspectRatio: ImageAspectRatio;
  numberOfImages: number;
  prompt?: string;
  negativePrompt?: string;
  seed?: number;
  guidanceScale?: number;
}

// ---------------------------------------------------------------------------
// BannerParams — the subset of data the template engine needs to render
// ---------------------------------------------------------------------------

export interface BannerParams {
  config: CampaignConfig;
  /** Optional override HTML for each frame (e.g. from a visual editor) */
  frameOverrides?: Record<string, string>;
  /** When true, render in "preview" mode with editing affordances */
  preview?: boolean;
}

// ---------------------------------------------------------------------------
// BrandData — extended brand profile (used by AI to generate configs)
// ---------------------------------------------------------------------------

export interface BrandData {
  brandName: string;
  genericName: string;
  dosage: string;
  indication: string;
  tagline: string;

  colors: BrandColors;
  typography: BrandTypography;

  visualStyle: {
    mood: string[];
    avoid: string[];
  };

  approvedClaims: string[];
  ctaOptions: string[];

  isiText: string;
  logoUrl?: string;
}
