// =============================================================================
// MERLIN — Database Helpers
// CRUD operations for assets using pg (node-postgres).
// =============================================================================

import { Pool } from 'pg';
import type { Asset, AssetMetadata, Artifact, ArtifactCategory, CampaignConfig, ContentType, FlashcardConfig } from './types';

// ── Connection pool (lazy init) ─────────────────────────────────────────────

let pool: Pool | null = null;

function getPool(): Pool {
  if (!pool) {
    // Strip sslmode from the connection string — we handle SSL ourselves
    const connStr = (process.env.POSTGRES_URL || '')
      .replace(/[?&]sslmode=[^&]*/g, '')
      .replace(/[?&]supa=[^&]*/g, '')
      .replace(/\?$/, '');

    pool = new Pool({
      connectionString: connStr,
      ssl: process.env.POSTGRES_URL?.includes('supabase')
        ? { rejectUnauthorized: false }
        : false,
      max: 5,
    });
  }
  return pool;
}

// ── Check if database is configured ─────────────────────────────────────────

export function isDbConfigured(): boolean {
  return !!process.env.POSTGRES_URL;
}

// ── Row → Asset mapper ──────────────────────────────────────────────────────

interface AssetRow {
  id: string;
  name: string;
  content_type: ContentType;
  config: CampaignConfig;
  flashcard_config: FlashcardConfig | null;
  html: string;
  thumbnail_url: string | null;
  metadata: AssetMetadata;
  created_at: string;
  updated_at: string;
}

function rowToAsset(row: AssetRow): Asset {
  const fc = row.flashcard_config;
  return {
    id: row.id,
    name: row.name,
    contentType: row.content_type || 'banner',
    config: typeof row.config === 'string' ? JSON.parse(row.config) : row.config,
    flashcardConfig: fc ? (typeof fc === 'string' ? JSON.parse(fc) : fc) : undefined,
    html: row.html,
    thumbnailUrl: row.thumbnail_url || undefined,
    metadata: typeof row.metadata === 'string' ? JSON.parse(row.metadata) : row.metadata,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// ── Row → Artifact mapper ───────────────────────────────────────────────────

interface ArtifactRow {
  id: string;
  name: string;
  category: ArtifactCategory;
  file_url: string;
  mime_type: string;
  file_size: number;
  original_filename: string;
  brand_id: string | null;
  tags: string[];
  meta: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

function rowToArtifact(row: ArtifactRow): Artifact {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    fileUrl: row.file_url,
    mimeType: row.mime_type,
    fileSize: row.file_size,
    originalFilename: row.original_filename,
    brandId: row.brand_id,
    tags: typeof row.tags === 'string' ? JSON.parse(row.tags) : (row.tags || []),
    meta: typeof row.meta === 'string' ? JSON.parse(row.meta) : (row.meta || {}),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// ── List assets (with optional filters + pagination) ────────────────────────

export interface ListAssetsOptions {
  search?: string;
  size?: string;
  visualTone?: string;
  messagingType?: string;
  contentType?: ContentType;
  limit?: number;
  offset?: number;
}

export async function listAssets(opts: ListAssetsOptions = {}): Promise<{
  assets: Asset[];
  total: number;
}> {
  const db = getPool();
  const limit = opts.limit || 50;
  const offset = opts.offset || 0;

  // Build WHERE clauses dynamically
  const conditions: string[] = [];
  const values: unknown[] = [];
  let paramIndex = 1;

  if (opts.search) {
    conditions.push(`(name ILIKE $${paramIndex} OR config::text ILIKE $${paramIndex})`);
    values.push(`%${opts.search}%`);
    paramIndex++;
  }

  if (opts.size) {
    conditions.push(`config->'size'->>'preset' = $${paramIndex}`);
    values.push(opts.size);
    paramIndex++;
  }

  if (opts.visualTone) {
    conditions.push(`metadata->>'visualTone' = $${paramIndex}`);
    values.push(opts.visualTone);
    paramIndex++;
  }

  if (opts.messagingType) {
    conditions.push(`metadata->>'messagingType' = $${paramIndex}`);
    values.push(opts.messagingType);
    paramIndex++;
  }

  if (opts.contentType) {
    conditions.push(`content_type = $${paramIndex}`);
    values.push(opts.contentType);
    paramIndex++;
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const countResult = await db.query(
    `SELECT COUNT(*) as total FROM assets ${whereClause}`,
    values,
  );

  const dataResult = await db.query(
    `SELECT * FROM assets ${whereClause} ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
    [...values, limit, offset],
  );

  return {
    assets: dataResult.rows.map((row) => rowToAsset(row as unknown as AssetRow)),
    total: parseInt(countResult.rows[0].total, 10),
  };
}

// ── Get single asset ────────────────────────────────────────────────────────

export async function getAsset(id: string): Promise<Asset | null> {
  const db = getPool();
  const result = await db.query('SELECT * FROM assets WHERE id = $1', [id]);
  if (result.rows.length === 0) return null;
  return rowToAsset(result.rows[0] as unknown as AssetRow);
}

// ── Create asset ────────────────────────────────────────────────────────────

export async function createAsset(data: {
  name: string;
  contentType?: ContentType;
  config: CampaignConfig;
  flashcardConfig?: FlashcardConfig;
  html: string;
  thumbnailUrl?: string;
  metadata: AssetMetadata;
}): Promise<Asset> {
  const db = getPool();
  const result = await db.query(
    `INSERT INTO assets (name, content_type, config, flashcard_config, html, thumbnail_url, metadata)
     VALUES ($1, $2, $3::jsonb, $4::jsonb, $5, $6, $7::jsonb)
     RETURNING *`,
    [
      data.name,
      data.contentType || 'banner',
      JSON.stringify(data.config),
      data.flashcardConfig ? JSON.stringify(data.flashcardConfig) : null,
      data.html,
      data.thumbnailUrl || null,
      JSON.stringify(data.metadata),
    ],
  );
  return rowToAsset(result.rows[0] as unknown as AssetRow);
}

// ── Update asset ────────────────────────────────────────────────────────────

export async function updateAsset(
  id: string,
  data: {
    name?: string;
    config?: CampaignConfig;
    html?: string;
    thumbnailUrl?: string;
    metadata?: AssetMetadata;
  },
): Promise<Asset | null> {
  const db = getPool();
  const sets: string[] = ['updated_at = NOW()'];
  const values: unknown[] = [];
  let paramIndex = 1;

  if (data.name !== undefined) {
    sets.push(`name = $${paramIndex}`);
    values.push(data.name);
    paramIndex++;
  }
  if (data.config !== undefined) {
    sets.push(`config = $${paramIndex}::jsonb`);
    values.push(JSON.stringify(data.config));
    paramIndex++;
  }
  if (data.html !== undefined) {
    sets.push(`html = $${paramIndex}`);
    values.push(data.html);
    paramIndex++;
  }
  if (data.thumbnailUrl !== undefined) {
    sets.push(`thumbnail_url = $${paramIndex}`);
    values.push(data.thumbnailUrl);
    paramIndex++;
  }
  if (data.metadata !== undefined) {
    sets.push(`metadata = $${paramIndex}::jsonb`);
    values.push(JSON.stringify(data.metadata));
    paramIndex++;
  }

  values.push(id);

  const result = await db.query(
    `UPDATE assets SET ${sets.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
    values,
  );

  if (result.rows.length === 0) return null;
  return rowToAsset(result.rows[0] as unknown as AssetRow);
}

// ── Delete asset ────────────────────────────────────────────────────────────

export async function deleteAsset(id: string): Promise<boolean> {
  const db = getPool();
  const result = await db.query('DELETE FROM assets WHERE id = $1', [id]);
  return (result.rowCount ?? 0) > 0;
}

// ── Log a generation event ──────────────────────────────────────────────────

export async function logGeneration(data: {
  assetId?: string;
  keyMessage: string;
  visualTone: string;
  size: string;
  brand?: string;
  claimsUsed?: string[];
}): Promise<void> {
  const db = getPool();
  await db.query(
    `INSERT INTO generation_logs (asset_id, key_message, visual_tone, size, brand, claims_used)
     VALUES ($1, $2, $3, $4, $5, $6::jsonb)`,
    [
      data.assetId || null,
      data.keyMessage,
      data.visualTone,
      data.size,
      data.brand || null,
      JSON.stringify(data.claimsUsed || []),
    ],
  );
}

// ── Tracker aggregation queries ─────────────────────────────────────────────

export async function getTrackerData(): Promise<{
  totalAssets: number;
  sizeDistribution: Record<string, number>;
  toneDistribution: Record<string, number>;
  claimsUsage: Record<string, number>;
  imageryTypes: Record<string, number>;
  messagingTypes: Record<string, number>;
  recentActivity: Asset[];
  generationTimeline: Array<{ date: string; count: number }>;
}> {
  const db = getPool();

  const [
    totalResult,
    sizeResult,
    toneResult,
    messagingResult,
    recentResult,
    timelineResult,
  ] = await Promise.all([
    db.query('SELECT COUNT(*) as total FROM assets'),
    db.query(`SELECT config->'size'->>'preset' as size, COUNT(*) as count FROM assets GROUP BY config->'size'->>'preset'`),
    db.query(`SELECT metadata->>'visualTone' as tone, COUNT(*) as count FROM assets GROUP BY metadata->>'visualTone'`),
    db.query(`SELECT metadata->>'messagingType' as type, COUNT(*) as count FROM assets GROUP BY metadata->>'messagingType'`),
    db.query('SELECT * FROM assets ORDER BY created_at DESC LIMIT 10'),
    db.query(`SELECT DATE(created_at) as date, COUNT(*) as count FROM assets GROUP BY DATE(created_at) ORDER BY date DESC LIMIT 30`),
  ]);

  // Claims usage — unnest JSONB array
  let claimsUsage: Record<string, number> = {};
  try {
    const claimsResult = await db.query(`
      SELECT claim, COUNT(*) as count
      FROM assets, jsonb_array_elements_text(metadata->'claimsUsed') AS claim
      GROUP BY claim
      ORDER BY count DESC
    `);
    claimsUsage = Object.fromEntries(
      claimsResult.rows.map((r) => [r.claim, parseInt(r.count as string, 10)]),
    );
  } catch {
    // If no assets have claims, this query may fail
  }

  // Imagery types — unnest
  let imageryTypes: Record<string, number> = {};
  try {
    const imageryResult = await db.query(`
      SELECT descriptor, COUNT(*) as count
      FROM assets, jsonb_array_elements_text(metadata->'imageryDescriptors') AS descriptor
      GROUP BY descriptor
      ORDER BY count DESC
    `);
    imageryTypes = Object.fromEntries(
      imageryResult.rows.map((r) => [r.descriptor, parseInt(r.count as string, 10)]),
    );
  } catch {
    // If no assets have descriptors, this query may fail
  }

  return {
    totalAssets: parseInt(totalResult.rows[0].total as string, 10),
    sizeDistribution: Object.fromEntries(
      sizeResult.rows.map((r) => [r.size || 'unknown', parseInt(r.count as string, 10)]),
    ),
    toneDistribution: Object.fromEntries(
      toneResult.rows.map((r) => [r.tone || 'unknown', parseInt(r.count as string, 10)]),
    ),
    claimsUsage,
    imageryTypes,
    messagingTypes: Object.fromEntries(
      messagingResult.rows.map((r) => [r.type || 'other', parseInt(r.count as string, 10)]),
    ),
    recentActivity: recentResult.rows.map((row) => rowToAsset(row as unknown as AssetRow)),
    generationTimeline: timelineResult.rows.map((r) => ({
      date: r.date as string,
      count: parseInt(r.count as string, 10),
    })),
  };
}

// =============================================================================
// ARTIFACT CRUD
// =============================================================================

// ── List artifacts (with optional filters) ───────────────────────────────────

export interface ListArtifactsOptions {
  category?: ArtifactCategory;
  brandId?: string;
  search?: string;
  tags?: string[];
  limit?: number;
  offset?: number;
}

export async function listArtifacts(opts: ListArtifactsOptions = {}): Promise<{
  artifacts: Artifact[];
  total: number;
}> {
  const db = getPool();
  const limit = opts.limit || 50;
  const offset = opts.offset || 0;

  const conditions: string[] = [];
  const values: unknown[] = [];
  let paramIndex = 1;

  if (opts.category) {
    conditions.push(`category = $${paramIndex}`);
    values.push(opts.category);
    paramIndex++;
  }

  if (opts.brandId) {
    conditions.push(`brand_id = $${paramIndex}`);
    values.push(opts.brandId);
    paramIndex++;
  }

  if (opts.search) {
    conditions.push(`(name ILIKE $${paramIndex} OR original_filename ILIKE $${paramIndex})`);
    values.push(`%${opts.search}%`);
    paramIndex++;
  }

  if (opts.tags && opts.tags.length > 0) {
    conditions.push(`tags @> $${paramIndex}::jsonb`);
    values.push(JSON.stringify(opts.tags));
    paramIndex++;
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const countResult = await db.query(
    `SELECT COUNT(*) as total FROM artifacts ${whereClause}`,
    values,
  );

  const dataResult = await db.query(
    `SELECT * FROM artifacts ${whereClause} ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
    [...values, limit, offset],
  );

  return {
    artifacts: dataResult.rows.map((row) => rowToArtifact(row as unknown as ArtifactRow)),
    total: parseInt(countResult.rows[0].total, 10),
  };
}

// ── Get single artifact ──────────────────────────────────────────────────────

export async function getArtifact(id: string): Promise<Artifact | null> {
  const db = getPool();
  const result = await db.query('SELECT * FROM artifacts WHERE id = $1', [id]);
  if (result.rows.length === 0) return null;
  return rowToArtifact(result.rows[0] as unknown as ArtifactRow);
}

// ── Create artifact ──────────────────────────────────────────────────────────

export async function createArtifact(data: {
  name: string;
  category: ArtifactCategory;
  fileUrl: string;
  mimeType: string;
  fileSize: number;
  originalFilename: string;
  brandId?: string;
  tags?: string[];
  meta?: Record<string, unknown>;
}): Promise<Artifact> {
  const db = getPool();
  const result = await db.query(
    `INSERT INTO artifacts (name, category, file_url, mime_type, file_size, original_filename, brand_id, tags, meta)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb, $9::jsonb)
     RETURNING *`,
    [
      data.name,
      data.category,
      data.fileUrl,
      data.mimeType,
      data.fileSize,
      data.originalFilename,
      data.brandId || null,
      JSON.stringify(data.tags || []),
      JSON.stringify(data.meta || {}),
    ],
  );
  return rowToArtifact(result.rows[0] as unknown as ArtifactRow);
}

// ── Update artifact ──────────────────────────────────────────────────────────

export async function updateArtifact(
  id: string,
  data: {
    name?: string;
    category?: ArtifactCategory;
    tags?: string[];
    meta?: Record<string, unknown>;
    brandId?: string | null;
  },
): Promise<Artifact | null> {
  const db = getPool();
  const sets: string[] = ['updated_at = NOW()'];
  const values: unknown[] = [];
  let paramIndex = 1;

  if (data.name !== undefined) {
    sets.push(`name = $${paramIndex}`);
    values.push(data.name);
    paramIndex++;
  }
  if (data.category !== undefined) {
    sets.push(`category = $${paramIndex}`);
    values.push(data.category);
    paramIndex++;
  }
  if (data.tags !== undefined) {
    sets.push(`tags = $${paramIndex}::jsonb`);
    values.push(JSON.stringify(data.tags));
    paramIndex++;
  }
  if (data.meta !== undefined) {
    sets.push(`meta = $${paramIndex}::jsonb`);
    values.push(JSON.stringify(data.meta));
    paramIndex++;
  }
  if (data.brandId !== undefined) {
    sets.push(`brand_id = $${paramIndex}`);
    values.push(data.brandId);
    paramIndex++;
  }

  values.push(id);

  const result = await db.query(
    `UPDATE artifacts SET ${sets.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
    values,
  );

  if (result.rows.length === 0) return null;
  return rowToArtifact(result.rows[0] as unknown as ArtifactRow);
}

// ── Delete artifact ──────────────────────────────────────────────────────────

export async function deleteArtifact(id: string): Promise<boolean> {
  const db = getPool();
  const result = await db.query('DELETE FROM artifacts WHERE id = $1', [id]);
  return (result.rowCount ?? 0) > 0;
}
