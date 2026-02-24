import { NextRequest, NextResponse } from 'next/server';
import { isDbConfigured, getAsset, updateAsset, deleteAsset } from '../../../../lib/db';

// ── GET /api/assets/[id] — get a single asset ──────────────────────────────

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!isDbConfigured()) {
    return NextResponse.json(
      { error: 'Database not configured.' },
      { status: 503 },
    );
  }

  try {
    const { id } = await params;
    const asset = await getAsset(id);
    if (!asset) {
      return NextResponse.json({ error: 'Asset not found.' }, { status: 404 });
    }
    return NextResponse.json(asset);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Database error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// ── PATCH /api/assets/[id] — update an asset ────────────────────────────────

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!isDbConfigured()) {
    return NextResponse.json(
      { error: 'Database not configured.' },
      { status: 503 },
    );
  }

  try {
    const { id } = await params;
    const body = await req.json();
    const asset = await updateAsset(id, body);
    if (!asset) {
      return NextResponse.json({ error: 'Asset not found.' }, { status: 404 });
    }
    return NextResponse.json(asset);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Database error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// ── DELETE /api/assets/[id] — delete an asset ───────────────────────────────

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!isDbConfigured()) {
    return NextResponse.json(
      { error: 'Database not configured.' },
      { status: 503 },
    );
  }

  try {
    const { id } = await params;
    const deleted = await deleteAsset(id);
    if (!deleted) {
      return NextResponse.json({ error: 'Asset not found.' }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Database error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
