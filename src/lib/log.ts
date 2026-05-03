import type { Env } from "../types";

export interface LogEntry {
  path: string;
  category: string;
  endpoint: string;
  status: number;
  took_ms: number;
  ip: string;
  ua: string | null;
  cache_hit: boolean;
  country: string | null;
}

export function logRequest(env: Env, ctx: ExecutionContext, entry: LogEntry) {
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) return;
  ctx.waitUntil((async () => {
    try {
      await fetch(`${env.SUPABASE_URL}/rest/v1/request_logs`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: env.SUPABASE_SERVICE_ROLE_KEY,
          Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
          Prefer: "return=minimal",
        },
        body: JSON.stringify(entry),
      });
    } catch { /* swallow */ }
  })());
}
