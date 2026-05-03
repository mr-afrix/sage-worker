import type { Env } from "./types";
import { ALL_ENDPOINTS, CATEGORIES } from "./registry";
import { fail, json, ok, preflight, html, HttpError } from "./lib/response";
import { cached, cacheKey } from "./lib/cache";
import { rateLimit, clientIP } from "./lib/ratelimit";
import { logRequest } from "./lib/log";

// Build a fast path → endpoint lookup once per isolate.
const ROUTES = new Map(ALL_ENDPOINTS.map(e => [e.path, e]));

const startedAt = Date.now();

export default {
  async fetch(req: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    if (req.method === "OPTIONS") return preflight();

    const url = new URL(req.url);
    const t0 = Date.now();

    // ---------- Meta routes ----------
    if (url.pathname === "/" || url.pathname === "/index.html") {
      return html(landingPage(env));
    }
    if (url.pathname === "/api/meta") {
      return ok(env, {
        name: "Sage API",
        version: env.API_VERSION,
        creator: env.CREATOR,
        uptime_ms: Date.now() - startedAt,
        total_endpoints: ALL_ENDPOINTS.length,
        categories: CATEGORIES,
      }, Date.now() - t0);
    }
    if (url.pathname === "/api/endpoints") {
      // Rich catalog the frontend can render as cards.
      return ok(env, {
        categories: CATEGORIES,
        endpoints: ALL_ENDPOINTS.map(e => ({
          path: e.path, method: e.method, category: e.category,
          name: e.name, description: e.description, params: e.params,
          cacheTTL: e.cacheTTL ?? 0,
          example: buildExample(url, e),
        })),
      }, Date.now() - t0);
    }
    if (url.pathname === "/api/health") {
      return ok(env, { status: "online", uptime_ms: Date.now() - startedAt }, Date.now() - t0);
    }
    if (url.pathname === "/api/stats") {
      // Live stats from Supabase (best-effort).
      const stats = await fetchLiveStats(env).catch(() => null);
      return ok(env, stats || { total_requests: 0, last_24h: 0 }, Date.now() - t0);
    }

    // ---------- Endpoint routes ----------
    const ep = ROUTES.get(url.pathname);
    if (!ep) return fail(404, `Endpoint not found: ${url.pathname}. See /api/endpoints`, env);

    // Rate limit
    const ip = clientIP(req);
    const rl = await rateLimit(env, ip);
    if (!rl.ok) return fail(429, "Rate limit exceeded — please slow down.", env);

    try {
      const ttl = ep.cacheTTL ?? 0;
      const key = cacheKey(ep.path, url.searchParams);
      const { data, hit } = await cached(env, key, ttl, async () => {
        const res = await ep.handler(req, env, ctx, url);
        return await res.json();
      });

      const took = Date.now() - t0;
      logRequest(env, ctx, {
        path: ep.path, category: ep.category, endpoint: ep.name,
        status: 200, took_ms: took, ip,
        ua: req.headers.get("user-agent"),
        cache_hit: hit,
        country: req.headers.get("cf-ipcountry"),
      });

      // Re-pack cached payload with fresh meta
      return json({
        ...(data as object),
        creator: env.CREATOR,
        took: `${took}ms`,
        cache: hit ? "HIT" : "MISS",
      });
    } catch (e) {
      const code = e instanceof HttpError ? e.code : 500;
      const msg = e instanceof Error ? e.message : "Internal error";
      logRequest(env, ctx, {
        path: ep.path, category: ep.category, endpoint: ep.name,
        status: code, took_ms: Date.now() - t0, ip,
        ua: req.headers.get("user-agent"), cache_hit: false,
        country: req.headers.get("cf-ipcountry"),
      });
      return fail(code, msg, env);
    }
  },
};

function buildExample(url: URL, e: typeof ALL_ENDPOINTS[number]): string {
  const params = new URLSearchParams();
  for (const p of e.params) if (p.required || p.example) params.set(p.name, p.example);
  const qs = params.toString();
  return `https://${url.host}${e.path}${qs ? "?" + qs : ""}`;
}

async function fetchLiveStats(env: Env) {
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) return null;
  const headers = { apikey: env.SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}` };
  const totalRes = await fetch(`${env.SUPABASE_URL}/rest/v1/request_logs?select=count`, { headers: { ...headers, Prefer: "count=exact" } });
  const total = parseInt(totalRes.headers.get("content-range")?.split("/")[1] || "0", 10);
  const since = new Date(Date.now() - 86400_000).toISOString();
  const dayRes = await fetch(`${env.SUPABASE_URL}/rest/v1/request_logs?select=count&created_at=gte.${since}`, { headers: { ...headers, Prefer: "count=exact" } });
  const day = parseInt(dayRes.headers.get("content-range")?.split("/")[1] || "0", 10);
  return { total_requests: total, last_24h: day };
}

function landingPage(env: Env): string {
  return `<!doctype html>
<html lang="en"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Sage API — REST endpoints, free forever</title>
<meta name="description" content="Sage API — ${ALL_ENDPOINTS.length}+ free REST endpoints. No login, no key. Edge-fast on Cloudflare.">
<style>
  body{margin:0;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;background:#0a0a0f;color:#e6e6f0;padding:48px 20px;max-width:760px;margin-inline:auto}
  h1{font-size:42px;margin:0 0 8px;background:linear-gradient(90deg,#7c3aed,#06b6d4);-webkit-background-clip:text;background-clip:text;color:transparent}
  p{color:#a0a0b8;line-height:1.6}
  code{background:#1a1a25;padding:2px 8px;border-radius:6px;color:#7dd3fc}
  a{color:#7dd3fc} ul{padding-left:20px}
</style></head><body>
<h1>🌿 Sage API</h1>
<p>${ALL_ENDPOINTS.length}+ REST endpoints. No login, no key, free forever. Built for speed at the edge.</p>
<ul>
  <li><a href="/api/endpoints">/api/endpoints</a> — full catalog (JSON)</li>
  <li><a href="/api/meta">/api/meta</a> — server info</li>
  <li><a href="/api/health">/api/health</a> — uptime check</li>
  <li><a href="/api/stats">/api/stats</a> — live request stats</li>
</ul>
<p>Frontend lives at <a href="https://app.sage.dpdns.org">app.sage.dpdns.org</a>.</p>
<p><small>v${env.API_VERSION} · creator ${env.CREATOR}</small></p>
</body></html>`;
}
