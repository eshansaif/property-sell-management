// Minimal in-memory rate limiter for the public inquiry endpoint.
// Good enough for a single serverless instance / low-to-medium traffic.
// For multi-region Vercel deployments at scale, swap this for
// Upstash Redis (@upstash/ratelimit) — same call signature.

const hits = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(key: string, limit = 5, windowMs = 60_000): { ok: boolean; remaining: number } {
  const now = Date.now();
  const entry = hits.get(key);

  if (!entry || now > entry.resetAt) {
    hits.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, remaining: limit - 1 };
  }

  if (entry.count >= limit) {
    return { ok: false, remaining: 0 };
  }

  entry.count += 1;
  return { ok: true, remaining: limit - entry.count };
}
