// =============================================================================
// MERLIN — Hash Utilities
// SHA-256 hashing for ISI version tracking.
// =============================================================================

/**
 * Compute a SHA-256 hex digest of a string.
 * Works in both Node.js (via Web Crypto) and the browser.
 */
export async function sha256(text: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}
