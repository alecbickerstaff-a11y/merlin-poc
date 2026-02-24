-- =============================================================================
-- MERLIN — Database Schema
-- Run this against your Vercel Postgres database to create the tables.
-- =============================================================================

-- Assets table — stores saved banners with their config and metadata
CREATE TABLE IF NOT EXISTS assets (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL DEFAULT 'Untitled Banner',
  config        JSONB NOT NULL,
  html          TEXT NOT NULL,
  thumbnail_url TEXT,
  metadata      JSONB NOT NULL DEFAULT '{}',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Generation logs — tracks each AI generation event
CREATE TABLE IF NOT EXISTS generation_logs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id      UUID REFERENCES assets(id) ON DELETE SET NULL,
  key_message   TEXT NOT NULL,
  visual_tone   TEXT NOT NULL DEFAULT 'Warm & Hopeful',
  size          TEXT NOT NULL,
  brand         TEXT,
  claims_used   JSONB DEFAULT '[]',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_assets_created_at ON assets(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_assets_metadata_size ON assets USING GIN (metadata jsonb_path_ops);
CREATE INDEX IF NOT EXISTS idx_generation_logs_asset_id ON generation_logs(asset_id);
CREATE INDEX IF NOT EXISTS idx_generation_logs_created_at ON generation_logs(created_at DESC);
