import { NextResponse } from 'next/server';
import { isDbConfigured, getTrackerData } from '../../../lib/db';

// ── GET /api/tracker — aggregated analytics data ─────────────────────────────

export async function GET() {
  if (!isDbConfigured()) {
    return NextResponse.json(
      { error: 'Database not configured. Add POSTGRES_URL to your environment.' },
      { status: 503 },
    );
  }

  try {
    const data = await getTrackerData();
    return NextResponse.json(data);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Database error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
