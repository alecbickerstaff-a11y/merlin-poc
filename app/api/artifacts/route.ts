import { NextRequest, NextResponse } from 'next/server';
import { isDbConfigured, listArtifacts, createArtifact } from '../../../lib/db';
import type { ArtifactCategory } from '../../../lib/types';

// ── GET /api/artifacts — list artifacts with optional filters ────────────────

export async function GET(req: NextRequest) {
  if (!isDbConfigured()) {
    return NextResponse.json(
      { error: 'Database not configured. Add POSTGRES_URL to your environment.' },
      { status: 503 },
    );
  }

  try {
    const { searchParams } = new URL(req.url);
    const result = await listArtifacts({
      category: (searchParams.get('category') as ArtifactCategory) || undefined,
      brandId: searchParams.get('brandId') || undefined,
      search: searchParams.get('search') || undefined,
      tags: searchParams.get('tags') ? searchParams.get('tags')!.split(',') : undefined,
      limit: searchParams.has('limit') ? parseInt(searchParams.get('limit')!, 10) : 50,
      offset: searchParams.has('offset') ? parseInt(searchParams.get('offset')!, 10) : 0,
    });

    return NextResponse.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Database error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// ── POST /api/artifacts — create a new artifact ──────────────────────────────
// Accepts multipart form data (file + metadata fields) OR JSON with a fileUrl.

export async function POST(req: NextRequest) {
  if (!isDbConfigured()) {
    return NextResponse.json(
      { error: 'Database not configured. Add POSTGRES_URL to your environment.' },
      { status: 503 },
    );
  }

  try {
    const contentType = req.headers.get('content-type') || '';

    // ── Multipart upload (file + fields) ───────────────────────────────────
    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      const file = formData.get('file') as File | null;

      if (!file) {
        return NextResponse.json({ error: 'file is required.' }, { status: 400 });
      }

      const name = (formData.get('name') as string) || file.name.replace(/\.[^.]+$/, '');
      const category = (formData.get('category') as ArtifactCategory) || 'graphic';

      // Convert file to base64 data URL for storage
      // In production, this would upload to S3/Supabase Storage and return a URL
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const base64 = buffer.toString('base64');
      const mimeType = file.type || 'image/png';
      const fileUrl = `data:${mimeType};base64,${base64}`;

      const tags = formData.get('tags')
        ? JSON.parse(formData.get('tags') as string)
        : [];
      const meta = formData.get('meta')
        ? JSON.parse(formData.get('meta') as string)
        : {};

      const artifact = await createArtifact({
        name,
        category,
        fileUrl,
        mimeType,
        fileSize: file.size,
        originalFilename: file.name,
        brandId: (formData.get('brandId') as string) || undefined,
        tags,
        meta,
      });

      return NextResponse.json(artifact, { status: 201 });
    }

    // ── JSON body (with external fileUrl) ──────────────────────────────────
    const body = await req.json();
    const { name, category, fileUrl, mimeType, fileSize, originalFilename, brandId, tags, meta } = body;

    if (!name || !category || !fileUrl) {
      return NextResponse.json(
        { error: 'name, category, and fileUrl are required.' },
        { status: 400 },
      );
    }

    const artifact = await createArtifact({
      name,
      category,
      fileUrl,
      mimeType: mimeType || 'image/png',
      fileSize: fileSize || 0,
      originalFilename: originalFilename || name,
      brandId,
      tags,
      meta,
    });

    return NextResponse.json(artifact, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Database error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
