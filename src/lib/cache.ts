import type { Env } from "../types";

export async function cached<T>(
  env: Env,
  key: string,
  ttl: number,
  fn: () => Promise<T>
): Promise<{ data: T; hit: boolean }> {
  if (ttl <= 0) return { data: await fn(), hit: false };
  const raw = await env.CACHE.get(key);
  if (raw) {
    try { return { data: JSON.parse(raw) as T, hit: true }; } catch { /* fall through */ }
  }
  const data = await fn();
  // Fire-and-forget cache write
  env.CACHE.put(key, JSON.stringify(data), { expirationTtl: ttl }).catch(() => {});
  return { data, hit: false };
}

export function cacheKey(path: string, params: URLSearchParams): string {
  const sorted = [...params.entries()].sort(([a], [b]) => a.localeCompare(b));
  return `v1:${path}?${new URLSearchParams(sorted).toString()}`;
}
