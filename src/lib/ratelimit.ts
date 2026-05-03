import type { Env } from "../types";

// Simple sliding window IP rate limit using KV.
// Default: 60 requests / minute per IP. Generous; tweak per-endpoint if needed.
export async function rateLimit(env: Env, ip: string, limit = 60, windowSec = 60): Promise<{ ok: boolean; remaining: number }> {
  const key = `rl:${ip}:${Math.floor(Date.now() / (windowSec * 1000))}`;
  const cur = parseInt((await env.CACHE.get(key)) || "0", 10);
  if (cur >= limit) return { ok: false, remaining: 0 };
  await env.CACHE.put(key, String(cur + 1), { expirationTtl: windowSec * 2 });
  return { ok: true, remaining: limit - cur - 1 };
}

export function clientIP(req: Request): string {
  return req.headers.get("cf-connecting-ip")
    || req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    || "0.0.0.0";
}
