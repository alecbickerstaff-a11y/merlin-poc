import { NextRequest, NextResponse } from 'next/server';

// ── POST /api/generate ──────────────────────────────────────────────────────
// Supports both single-size and multi-size generation.
//
// Single-size (backward compatible):
//   { keyMessage, visualTone, size }  →  single n8n response JSON
//
// Multi-size:
//   { keyMessage, visualTone, sizes: ["300x250","728x90","300x600"] }
//   → { results: [{ size, status, data?, error? }, ...] }

export async function POST(req: NextRequest) {
  const webhookUrl = process.env.N8N_WEBHOOK_URL;

  if (!webhookUrl || webhookUrl === 'PASTE_YOUR_PRODUCTION_WEBHOOK_URL_HERE') {
    return NextResponse.json(
      {
        error:
          'N8N_WEBHOOK_URL is not configured. Set it in .env.local with your n8n production webhook URL.',
      },
      { status: 500 },
    );
  }

  try {
    const body = await req.json();
    const { keyMessage, visualTone, size, sizes } = body;

    if (!keyMessage) {
      return NextResponse.json(
        { error: 'keyMessage is required.' },
        { status: 400 },
      );
    }

    // ── Multi-size mode ──────────────────────────────────────────────────
    if (Array.isArray(sizes) && sizes.length > 0) {
      const results = await Promise.allSettled(
        sizes.map((s: string) => callN8N(webhookUrl, keyMessage, visualTone, s)),
      );

      const mapped = results.map((result, i) => {
        if (result.status === 'fulfilled') {
          return { size: sizes[i], status: 'complete' as const, data: result.value };
        }
        return {
          size: sizes[i],
          status: 'error' as const,
          error: result.reason?.message || 'Unknown error',
        };
      });

      return NextResponse.json({ results: mapped });
    }

    // ── Single-size mode (backward compatible) ───────────────────────────
    const data = await callN8N(webhookUrl, keyMessage, visualTone, size || '300x250');
    return NextResponse.json(data);
  } catch (err: unknown) {
    if (err instanceof Error && err.name === 'AbortError') {
      return NextResponse.json(
        {
          error:
            'Request timed out after 60 seconds. The n8n workflow may still be processing — try again in a moment.',
        },
        { status: 504 },
      );
    }

    const message =
      err instanceof Error ? err.message : 'An unexpected error occurred.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// ── Helper: call the n8n webhook for a single size ──────────────────────────

async function callN8N(
  webhookUrl: string,
  keyMessage: string,
  visualTone: string,
  size: string,
): Promise<Record<string, unknown>> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 60_000);

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        keyMessage,
        visualTone: visualTone || 'Warm & Hopeful',
        size,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errText = await response.text().catch(() => 'Unknown error');
      throw new Error(`n8n webhook returned ${response.status}: ${errText}`);
    }

    return await response.json();
  } catch (err) {
    clearTimeout(timeoutId);
    throw err;
  }
}
