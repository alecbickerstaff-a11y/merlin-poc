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

// =============================================================================
// v1.3 — Content Types, Artifacts & Flashcard Config
// =============================================================================

// ---------------------------------------------------------------------------
// ContentType — the type of deliverable being created
// ---------------------------------------------------------------------------

export type ContentType = 'banner' | 'leave_behind';

// ---------------------------------------------------------------------------
// Artifact — an approved brand asset (icon, CTA, chart image, graphic)
// Uploaded by users and stored in the database for reuse across content.
// ---------------------------------------------------------------------------

export type ArtifactCategory = 'chart' | 'icon' | 'cta' | 'graphic' | 'logo' | 'background' | 'photography';

export interface Artifact {
  id: string;
  name: string;
  category: ArtifactCategory;
  /** URL to the uploaded file (PNG, SVG, etc.) */
  fileUrl: string;
  /** MIME type of the file */
  mimeType: string;
  /** File size in bytes */
  fileSize: number;
  /** Original filename */
  originalFilename: string;
  /** Brand this artifact belongs to (null = shared across brands) */
  brandId: string | null;
  /** Optional descriptive tags */
  tags: string[];
  /** Extra metadata (e.g., CTA copy text, chart data source, icon label) */
  meta: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// FlashcardConfig — the top-level object for a leave-behind / flashcard
// ---------------------------------------------------------------------------

export type PageSize = 'letter-landscape' | 'letter-portrait' | 'a4-landscape' | 'a4-portrait' | 'custom';

export type SystemGraphicPreset =
  | 'none'
  | 'graphic-dominant'
  | 'balanced'
  | 'content-dominant'
  | 'left-accent'
  | 'right-accent';

export interface FlashcardConfig {
  /** Document page size */
  pageSize: PageSize;
  /** Custom dimensions (only used when pageSize === 'custom') */
  customSize?: { width: number; height: number; unit: 'px' | 'in' | 'mm' };
  /** Brand identity */
  brand: BrandSettings;
  /** System graphic arrangement for background */
  systemGraphic: SystemGraphicPreset;
  /** Ordered list of pages */
  pages: FlashcardPage[];
  /** ISI configuration */
  isi: ISIConfig;
  /** Footnotes / references */
  references: string[];
}

export interface FlashcardPage {
  id: string;
  /** Page label (e.g., "Front", "Inside Left", "Back") */
  label: string;
  /** Ordered list of sections on this page */
  sections: FlashcardSection[];
}

// ---------------------------------------------------------------------------
// FlashcardSection — a content block placed on a page
// ---------------------------------------------------------------------------

export type SectionType =
  | 'hero'
  | 'headline'
  | 'body_text'
  | 'stat_callout'
  | 'icon_row'
  | 'icon_flow'
  | 'bar_chart'
  | 'line_chart'
  | 'donut_chart'
  | 'data_table'
  | 'dosing_timeline'
  | 'image_block'
  | 'cta_block'
  | 'isi_block'
  | 'references'
  | 'footer'
  | 'divider';

export interface FlashcardSection {
  id: string;
  type: SectionType;
  /** Grid column span (out of 12) */
  colSpan: number;
  /** Grid column start (1-12) */
  colStart: number;
  /** Section-specific data (varies by type) */
  data: SectionData;
}

// ---------------------------------------------------------------------------
// SectionData — type-specific data for each section type
// ---------------------------------------------------------------------------

export type SectionData =
  | HeroSectionData
  | HeadlineSectionData
  | BodyTextSectionData
  | StatCalloutSectionData
  | IconRowSectionData
  | IconFlowSectionData
  | BarChartSectionData
  | LineChartSectionData
  | DonutChartSectionData
  | DataTableSectionData
  | DosingTimelineSectionData
  | ImageBlockSectionData
  | CTABlockSectionData
  | ISIBlockSectionData
  | ReferencesSectionData
  | FooterSectionData
  | DividerSectionData;

export interface HeroSectionData {
  type: 'hero';
  eyebrow?: string;
  headline: string;
  subheadline?: string;
  badgeText?: string;
  backgroundArtifactId?: string;
  photographyArtifactId?: string;
}

export interface HeadlineSectionData {
  type: 'headline';
  eyebrow?: string;
  text: string;
  level: 'h1' | 'h2' | 'h3';
}

export interface BodyTextSectionData {
  type: 'body_text';
  text: string;
  bullets?: boolean;
}

export interface StatCalloutSectionData {
  type: 'stat_callout';
  stats: Array<{
    value: string;
    label: string;
    sublabel?: string;
    style: 'circle' | 'large-number' | 'fraction';
  }>;
}

export interface IconRowSectionData {
  type: 'icon_row';
  icons: Array<{
    artifactId?: string;
    label: string;
    sublabel?: string;
  }>;
}

export interface IconFlowSectionData {
  type: 'icon_flow';
  steps: Array<{
    artifactId?: string;
    title: string;
    description?: string;
  }>;
  /** Show connecting arrows between steps */
  showConnectors: boolean;
}

export interface BarChartSectionData {
  type: 'bar_chart';
  title: string;
  orientation: 'vertical' | 'horizontal';
  yAxisLabel?: string;
  xAxisLabel?: string;
  groups: Array<{
    label: string;
    bars: Array<{
      label: string;
      value: number;
      isProduct: boolean;
    }>;
  }>;
  /** Use an uploaded PNG instead of rendering */
  artifactId?: string;
}

export interface LineChartSectionData {
  type: 'line_chart';
  title: string;
  yAxisLabel?: string;
  xAxisLabel?: string;
  lines: Array<{
    label: string;
    isProduct: boolean;
    dataPoints: Array<{ x: string; y: number }>;
  }>;
  /** Use an uploaded PNG instead of rendering */
  artifactId?: string;
}

export interface DonutChartSectionData {
  type: 'donut_chart';
  title?: string;
  charts: Array<{
    label: string;
    value: number;
    total: number;
    isProduct: boolean;
  }>;
  /** Use an uploaded PNG instead of rendering */
  artifactId?: string;
}

export interface DataTableSectionData {
  type: 'data_table';
  title: string;
  headers: string[];
  rows: Array<{
    cells: string[];
    isProduct?: boolean;
    isHighlighted?: boolean;
  }>;
  /** Use an uploaded PNG instead of rendering */
  artifactId?: string;
}

export interface DosingTimelineSectionData {
  type: 'dosing_timeline';
  title: string;
  phases: Array<{
    label: string;
    duration: string;
    frequency: string;
    iconArtifactId?: string;
  }>;
}

export interface ImageBlockSectionData {
  type: 'image_block';
  artifactId?: string;
  caption?: string;
  alt: string;
}

export interface CTABlockSectionData {
  type: 'cta_block';
  text: string;
  style: 'button' | 'banner' | 'callout';
  url?: string;
  artifactId?: string;
}

export interface ISIBlockSectionData {
  type: 'isi_block';
  variant: 'full' | 'selected';
  text?: string;
}

export interface ReferencesSectionData {
  type: 'references';
  items: string[];
}

export interface FooterSectionData {
  type: 'footer';
  logoArtifactId?: string;
  corporateLogoArtifactId?: string;
  jobCode?: string;
  date?: string;
  legalLine?: string;
}

export interface DividerSectionData {
  type: 'divider';
  style: 'line' | 'space' | 'accent';
}

// =============================================================================
// Workspace & Asset Management Types
// =============================================================================

// ---------------------------------------------------------------------------
// WorkspaceView — the top-level navigation tabs
// ---------------------------------------------------------------------------

export type WorkspaceView = 'editor' | 'assets' | 'tracker' | 'artifacts';

// ---------------------------------------------------------------------------
// Asset — a saved banner with metadata, stored in the database
// ---------------------------------------------------------------------------

export interface AssetMetadata {
  /** Which approved claims are used in this banner */
  claimsUsed: string[];
  /** Descriptors of imagery, e.g. "woman patient", "outdoor", "golden hour" */
  imageryDescriptors: string[];
  /** Classification of messaging approach */
  messagingType: 'efficacy' | 'awareness' | 'brand' | 'hcp' | 'other';
  /** Visual tone used during generation */
  visualTone: string;
  /** SHA-256 hash of ISI text for version tracking */
  isiVersionHash: string;
  /** Whether this was AI-generated or manually created */
  generationSource: 'ai' | 'manual';
  /** Freeform user-defined tags */
  tags: string[];
}

export interface Asset {
  id: string;
  name: string;
  /** Content type: banner or leave_behind */
  contentType: ContentType;
  /** Banner config (when contentType === 'banner') */
  config: CampaignConfig;
  /** Flashcard config (when contentType === 'leave_behind') */
  flashcardConfig?: FlashcardConfig;
  html: string;
  thumbnailUrl?: string;
  metadata: AssetMetadata;
  createdAt: string;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// GenerationJob — tracks a multi-size generation request
// ---------------------------------------------------------------------------

export type GenerationStatus = 'pending' | 'generating' | 'complete' | 'error';

export interface GenerationJob {
  id: string;
  size: string;
  status: GenerationStatus;
  config?: CampaignConfig;
  html?: string;
  error?: string;
}

export interface GenerationRequest {
  keyMessage: string;
  visualTone: string;
  sizes: string[];
}

// ---------------------------------------------------------------------------
// WorkspaceState — centralised app state managed by WorkspaceContext
// ---------------------------------------------------------------------------

export interface WorkspaceState {
  /** Which top-level view is active */
  activeView: WorkspaceView;

  /** Which content type is being created */
  activeContentType: ContentType;

  /** Current banner config being edited */
  editorConfig: CampaignConfig;

  /** Current flashcard config being edited */
  flashcardConfig: FlashcardConfig;

  /** Active generation jobs (multi-size) */
  generationJobs: GenerationJob[];

  /** Whether any generation is in progress */
  isGenerating: boolean;

  /** Saved assets loaded from the database */
  assets: Asset[];

  /** Uploaded artifacts (icons, CTAs, charts, graphics) */
  artifacts: Artifact[];

  /** Filters for the asset gallery */
  assetFilters: AssetFilters;

  /** Tracker dashboard data */
  trackerData: TrackerData | null;
}

// ---------------------------------------------------------------------------
// AssetFilters — filters for the asset gallery view
// ---------------------------------------------------------------------------

export interface AssetFilters {
  search: string;
  size: string | null;
  visualTone: string | null;
  messagingType: string | null;
  dateRange: { from: string | null; to: string | null };
}

// ---------------------------------------------------------------------------
// TrackerData — aggregated analytics for the tracker dashboard
// ---------------------------------------------------------------------------

export interface TrackerData {
  totalAssets: number;
  sizeDistribution: Record<string, number>;
  toneDistribution: Record<string, number>;
  claimsUsage: Record<string, number>;
  imageryTypes: Record<string, number>;
  messagingTypes: Record<string, number>;
  recentActivity: Asset[];
  generationTimeline: Array<{ date: string; count: number }>;
}
