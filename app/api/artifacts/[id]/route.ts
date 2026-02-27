import { NextRequest, NextResponse } from 'next/server';
import { isDbConfigured, getArtifact, updateArtifact, deleteArtifact } from '../../../../lib/db';

// ── GET /api/artifacts/[id] — get a single artifact ─────────────────────────

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
    const artifact = await getArtifact(id);
    if (!artifact) {
      return NextResponse.json({ error: 'Artifact not found.' }, { status: 404 });
    }
    return NextResponse.json(artifact);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Database error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// ── PATCH /api/artifacts/[id] — update artifact metadata ────────────────────

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
    const artifact = await updateArtifact(id, body);

    if (!artifact) {
      return NextResponse.json({ error: 'Artifact not found.' }, { status: 404 });
    }

    return NextResponse.json(artifact);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Database error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// ── DELETE /api/artifacts/[id] — remove an artifact ─────────────────────────

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
    const deleted = await deleteArtifact(id);
    if (!deleted) {
      return NextResponse.json({ error: 'Artifact not found.' }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Database error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
