/**
 * Simple in-memory rate limiter for API routes.
 * For production at scale, replace with Redis/Upstash.
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

// Periodically clean expired entries to prevent memory leaks
const CLEANUP_INTERVAL = 60_000; // 1 minute
let lastCleanup = Date.now();

function cleanup() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;
  lastCleanup = now;
  for (const [key, entry] of store) {
    if (now > entry.resetAt) {
      store.delete(key);
    }
  }
}

interface RateLimitOptions {
  /** Max requests allowed in the window */
  limit?: number;
  /** Window duration in seconds */
  windowSeconds?: number;
}

interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetAt: number;
}

/**
 * Check rate limit for a given identifier (e.g., IP or user ID).
 *
 * Usage in API route:
 * ```ts
 * const ip = request.headers.get('x-forwarded-for') ?? 'unknown';
 * const { success, remaining } = rateLimit(ip, { limit: 10, windowSeconds: 60 });
 * if (!success) {
 *   return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
 * }
 * ```
 */
export function rateLimit(
  identifier: string,
  options: RateLimitOptions = {}
): RateLimitResult {
  const { limit = 30, windowSeconds = 60 } = options;
  const now = Date.now();

  cleanup();

  const entry = store.get(identifier);

  if (!entry || now > entry.resetAt) {
    store.set(identifier, { count: 1, resetAt: now + windowSeconds * 1000 });
    return { success: true, remaining: limit - 1, resetAt: now + windowSeconds * 1000 };
  }

  entry.count += 1;

  if (entry.count > limit) {
    return { success: false, remaining: 0, resetAt: entry.resetAt };
  }

  return { success: true, remaining: limit - entry.count, resetAt: entry.resetAt };
}

/**
 * Stricter rate limit preset for financial operations.
 * 5 requests per 60 seconds.
 */
export function financialRateLimit(identifier: string): RateLimitResult {
  return rateLimit(`financial:${identifier}`, { limit: 5, windowSeconds: 60 });
}

/**
 * Auth rate limit preset.
 * 10 requests per 5 minutes.
 */
export function authRateLimit(identifier: string): RateLimitResult {
  return rateLimit(`auth:${identifier}`, { limit: 10, windowSeconds: 300 });
}
