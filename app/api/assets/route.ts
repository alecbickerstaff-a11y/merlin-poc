import { NextRequest, NextResponse } from 'next/server';
import { isDbConfigured, listAssets, createAsset } from '../../../lib/db';
import { generateMetadata } from '../../../lib/metadata-utils';
import type { CampaignConfig, AssetMetadata } from '../../../lib/types';

// ── GET /api/assets — list assets with optional filters ─────────────────────

export async function GET(req: NextRequest) {
  if (!isDbConfigured()) {
    return NextResponse.json(
      { error: 'Database not configured. Add POSTGRES_URL to your environment.' },
      { status: 503 },
    );
  }

  try {
    const { searchParams } = new URL(req.url);
    const result = await listAssets({
      search: searchParams.get('search') || undefined,
      size: searchParams.get('size') || undefined,
      visualTone: searchParams.get('visualTone') || undefined,
      messagingType: searchParams.get('messagingType') || undefined,
      limit: searchParams.has('limit') ? parseInt(searchParams.get('limit')!, 10) : 50,
      offset: searchParams.has('offset') ? parseInt(searchParams.get('offset')!, 10) : 0,
    });

    return NextResponse.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Database error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// ── POST /api/assets — create a new asset ───────────────────────────────────

export async function POST(req: NextRequest) {
  if (!isDbConfigured()) {
    return NextResponse.json(
      { error: 'Database not configured. Add POSTGRES_URL to your environment.' },
      { status: 503 },
    );
  }

  try {
    const body = await req.json();
    const {
      name,
      config,
      html,
      thumbnailUrl,
      metadata: providedMetadata,
      visualTone,
      keyMessage,
      generationSource,
    } = body as {
      name?: string;
      config: CampaignConfig;
      html: string;
      thumbnailUrl?: string;
      metadata?: Partial<AssetMetadata>;
      visualTone?: string;
      keyMessage?: string;
      generationSource?: 'ai' | 'manual';
    };

    if (!config || !html) {
      return NextResponse.json(
        { error: 'config and html are required.' },
        { status: 400 },
      );
    }

    // Auto-generate metadata, merge with any provided overrides
    const autoMetadata = await generateMetadata(config, {
      visualTone,
      keyMessage,
      generationSource,
    });

    const metadata: AssetMetadata = {
      ...autoMetadata,
      ...providedMetadata,
      // Merge arrays rather than replace
      tags: [...(autoMetadata.tags || []), ...(providedMetadata?.tags || [])],
      claimsUsed: providedMetadata?.claimsUsed || autoMetadata.claimsUsed,
      imageryDescriptors: providedMetadata?.imageryDescriptors || autoMetadata.imageryDescriptors,
    };

    const sizeLabel = config.size.preset || `${config.size.width}x${config.size.height}`;
    const assetName = name || `${config.brand.name} — ${sizeLabel}`;

    const asset = await createAsset({
      name: assetName,
      config,
      html,
      thumbnailUrl,
      metadata,
    });

    return NextResponse.json(asset, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Database error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
