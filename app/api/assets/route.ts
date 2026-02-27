import { NextRequest, NextResponse } from 'next/server';
import { isDbConfigured, listAssets, createAsset } from '../../../lib/db';
import { generateMetadata } from '../../../lib/metadata-utils';
import type { CampaignConfig, AssetMetadata, ContentType, FlashcardConfig } from '../../../lib/types';

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
      contentType: (searchParams.get('contentType') as ContentType) || undefined,
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
// Supports both banner ads (config + html) and leave-behinds (flashcardConfig + html).

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
      contentType,
      config,
      flashcardConfig,
      html,
      thumbnailUrl,
      metadata: providedMetadata,
      visualTone,
      keyMessage,
      generationSource,
    } = body as {
      name?: string;
      contentType?: ContentType;
      config: CampaignConfig;
      flashcardConfig?: FlashcardConfig;
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

    // For leave-behinds with full metadata provided, skip auto-generation
    let metadata: AssetMetadata;

    if (contentType === 'leave_behind' && providedMetadata && providedMetadata.messagingType) {
      // Leave-behind path — use provided metadata directly
      metadata = {
        claimsUsed: providedMetadata.claimsUsed || [],
        imageryDescriptors: providedMetadata.imageryDescriptors || [],
        messagingType: providedMetadata.messagingType,
        visualTone: providedMetadata.visualTone || 'Professional',
        isiVersionHash: providedMetadata.isiVersionHash || '',
        generationSource: providedMetadata.generationSource || 'manual',
        tags: providedMetadata.tags || [],
      };
    } else {
      // Banner path — auto-generate metadata, merge with overrides
      const autoMetadata = await generateMetadata(config, {
        visualTone,
        keyMessage,
        generationSource,
      });

      metadata = {
        ...autoMetadata,
        ...providedMetadata,
        tags: [...(autoMetadata.tags || []), ...(providedMetadata?.tags || [])],
        claimsUsed: providedMetadata?.claimsUsed || autoMetadata.claimsUsed,
        imageryDescriptors: providedMetadata?.imageryDescriptors || autoMetadata.imageryDescriptors,
      };
    }

    const resolvedContentType = contentType || 'banner';

    let assetName = name;
    if (!assetName) {
      if (resolvedContentType === 'leave_behind') {
        assetName = `${config.brand.name} — Leave Behind`;
      } else {
        const sizeLabel = config.size.preset || `${config.size.width}x${config.size.height}`;
        assetName = `${config.brand.name} — ${sizeLabel}`;
      }
    }

    const asset = await createAsset({
      name: assetName,
      contentType: resolvedContentType,
      config,
      flashcardConfig,
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
