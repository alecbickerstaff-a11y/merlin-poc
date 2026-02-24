import { NextRequest, NextResponse } from 'next/server';

// ── POST /api/generate ──────────────────────────────────────────────────────
// Proxies the AI generation request to the n8n webhook.
// Expects: { keyMessage: string, visualTone: string, size: string }
// Returns:  the n8n response JSON (shape depends on the workflow)

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
    const { keyMessage, visualTone, size } = body;

    if (!keyMessage) {
      return NextResponse.json(
        { error: 'keyMessage is required.' },
        { status: 400 },
      );
    }

    // Call n8n webhook with a 60-second timeout (Leonardo image gen takes time)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60_000);

    const n8nResponse = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        keyMessage,
        visualTone: visualTone || 'Warm & Hopeful',
        size: size || '300x250',
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!n8nResponse.ok) {
      const errText = await n8nResponse.text().catch(() => 'Unknown error');
      return NextResponse.json(
        {
          error: `n8n webhook returned ${n8nResponse.status}: ${errText}`,
        },
        { status: 502 },
      );
    }

    const data = await n8nResponse.json();
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
