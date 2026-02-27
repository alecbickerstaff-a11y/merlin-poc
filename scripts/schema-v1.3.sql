-- =============================================================================
-- MERLIN v1.3 — Schema Migrations
-- Run AFTER schema.sql. Adds artifact library + flashcard support.
-- =============================================================================

-- Add content_type and flashcard_config to assets table
ALTER TABLE assets ADD COLUMN IF NOT EXISTS content_type TEXT NOT NULL DEFAULT 'banner';
ALTER TABLE assets ADD COLUMN IF NOT EXISTS flashcard_config JSONB;

-- Index for content type filtering
CREATE INDEX IF NOT EXISTS idx_assets_content_type ON assets(content_type);

-- ─── Artifacts table ────────────────────────────────────────────────────────
-- Stores uploaded brand assets: icons, CTAs, chart PNGs, graphics, logos, etc.

CREATE TABLE IF NOT EXISTS artifacts (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name              TEXT NOT NULL,
  category          TEXT NOT NULL CHECK (category IN ('chart', 'icon', 'cta', 'graphic', 'logo', 'background', 'photography')),
  file_url          TEXT NOT NULL,
  mime_type         TEXT NOT NULL DEFAULT 'image/png',
  file_size         INTEGER NOT NULL DEFAULT 0,
  original_filename TEXT NOT NULL DEFAULT '',
  brand_id          TEXT,
  tags              JSONB NOT NULL DEFAULT '[]',
  meta              JSONB NOT NULL DEFAULT '{}',
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for artifacts
CREATE INDEX IF NOT EXISTS idx_artifacts_category ON artifacts(category);
CREATE INDEX IF NOT EXISTS idx_artifacts_brand_id ON artifacts(brand_id);
CREATE INDEX IF NOT EXISTS idx_artifacts_created_at ON artifacts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_artifacts_tags ON artifacts USING GIN (tags jsonb_path_ops);
