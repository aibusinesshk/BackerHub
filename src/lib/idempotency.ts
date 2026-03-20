/**
 * Simple in-memory idempotency check for financial operations.
 * Prevents duplicate submissions (e.g., double-click on invest/withdraw).
 *
 * For production at scale, replace with Redis or database-backed store.
 */

interface IdempotencyEntry {
  response: { status: number; body: unknown };
  expiresAt: number;
}

const store = new Map<string, IdempotencyEntry>();

const TTL_MS = 5 * 60 * 1000; // 5 minutes
const CLEANUP_INTERVAL = 60_000;
let lastCleanup = Date.now();

function cleanup() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;
  lastCleanup = now;
  for (const [key, entry] of store) {
    if (now > entry.expiresAt) {
      store.delete(key);
    }
  }
}

// Track in-flight requests to prevent concurrent duplicates
const inFlight = new Set<string>();

/**
 * Check if a request with this idempotency key has already been processed.
 * Returns the cached response if found, or null if this is a new request.
 */
export function getIdempotentResponse(key: string): { status: number; body: unknown } | null {
  cleanup();
  const entry = store.get(key);
  if (entry && Date.now() < entry.expiresAt) {
    return entry.response;
  }
  return null;
}

/**
 * Store the response for an idempotency key.
 */
export function setIdempotentResponse(
  key: string,
  response: { status: number; body: unknown }
): void {
  store.set(key, { response, expiresAt: Date.now() + TTL_MS });
}

/**
 * Check if a request is currently in-flight (prevents concurrent duplicates).
 * Returns true if this is the first request, false if a duplicate is in progress.
 */
export function acquireInFlight(key: string): boolean {
  if (inFlight.has(key)) return false;
  inFlight.add(key);
  return true;
}

/**
 * Release the in-flight lock for a key.
 */
export function releaseInFlight(key: string): void {
  inFlight.delete(key);
}
