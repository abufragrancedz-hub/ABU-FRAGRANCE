/**
 * Rate Limiter using Cloudflare KV
 * Prevents abuse on public endpoints (order creation)
 */

import { Env } from '../types';

const RATE_LIMIT_PREFIX = '__ratelimit:';

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

/**
 * Check if a request should be rate limited
 * @param identifier - IP address or other unique identifier
 * @param maxRequests - Maximum requests allowed in the window
 * @param windowSeconds - Time window in seconds
 * @returns true if the request should be BLOCKED
 */
export async function isRateLimited(
  env: Env,
  identifier: string,
  maxRequests: number = 10,
  windowSeconds: number = 3600
): Promise<boolean> {
  const key = `${RATE_LIMIT_PREFIX}${identifier}`;
  const now = Date.now();

  try {
    const stored = await env.PRODUCTS_KV.get(key);
    let entry: RateLimitEntry;

    if (stored) {
      entry = JSON.parse(stored);

      // Window expired, reset
      if (now > entry.resetAt) {
        entry = { count: 1, resetAt: now + windowSeconds * 1000 };
      } else if (entry.count >= maxRequests) {
        return true; // BLOCKED
      } else {
        entry.count++;
      }
    } else {
      entry = { count: 1, resetAt: now + windowSeconds * 1000 };
    }

    // Save updated count (TTL matches the window)
    await env.PRODUCTS_KV.put(key, JSON.stringify(entry), {
      expirationTtl: windowSeconds + 60, // slight buffer
    });

    return false; // ALLOWED
  } catch {
    // If KV fails, allow the request (fail open)
    return false;
  }
}

/**
 * Get client IP from request
 */
export function getClientIP(request: Request): string {
  return request.headers.get('CF-Connecting-IP') ||
    request.headers.get('X-Forwarded-For')?.split(',')[0]?.trim() ||
    'unknown';
}
