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

    // ── Multi-size mode (sequential to avoid API rate limits) ───────────
    if (Array.isArray(sizes) && sizes.length > 0) {
      const mapped: Array<{
        size: string;
        status: 'complete' | 'error';
        data?: Record<string, unknown>;
        error?: string;
      }> = [];

      for (const s of sizes as string[]) {
        try {
          const data = await callN8N(webhookUrl, keyMessage, visualTone, s);
          mapped.push({ size: s, status: 'complete', data });
        } catch (err: unknown) {
          mapped.push({
            size: s,
            status: 'error',
            error: err instanceof Error ? err.message : 'Unknown error',
          });
        }
      }

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
            'Request timed out after 120 seconds. The n8n workflow may still be processing — try again in a moment.',
        },
        { status: 504 },
      );
    }

    const message =
      err instanceof Error ? err.message : 'An unexpected error occurred.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// ── Helper: call the n8n webhook for a single size (with retry) ─────────────

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 5_000; // 5 seconds between retries

async function callN8N(
  webhookUrl: string,
  keyMessage: string,
  visualTone: string,
  size: string,
): Promise<Record<string, unknown>> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 120_000);

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
        lastError = new Error(`n8n webhook returned ${response.status}: ${errText}`);

        // Retry on 500/502/503/529 (server errors / overloaded)
        if ([500, 502, 503, 529].includes(response.status) && attempt < MAX_RETRIES) {
          console.log(`[generate] Attempt ${attempt}/${MAX_RETRIES} failed for ${size}, retrying in ${RETRY_DELAY_MS / 1000}s...`);
          await new Promise((r) => setTimeout(r, RETRY_DELAY_MS * attempt));
          continue;
        }

        throw lastError;
      }

      return await response.json();
    } catch (err) {
      clearTimeout(timeoutId);
      lastError = err instanceof Error ? err : new Error(String(err));

      // Don't retry on abort (timeout) or if last attempt
      if (lastError.name === 'AbortError' || attempt >= MAX_RETRIES) {
        throw lastError;
      }

      console.log(`[generate] Attempt ${attempt}/${MAX_RETRIES} error for ${size}, retrying in ${RETRY_DELAY_MS / 1000}s...`);
      await new Promise((r) => setTimeout(r, RETRY_DELAY_MS * attempt));
    }
  }

  throw lastError || new Error('All retry attempts failed');
}
