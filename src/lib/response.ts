import type { Env } from "../types";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export function ok(env: Env, result: unknown, took: number, extra: Record<string, unknown> = {}) {
  return json({
    status: true,
    creator: env.CREATOR,
    took: `${took}ms`,
    ...extra,
    result,
  }, 200);
}

export function fail(code: number, message: string, env?: Env) {
  return json({
    status: false,
    creator: env?.CREATOR ?? "Sage",
    code,
    message,
  }, code);
}

export function json(data: unknown, status = 200, headers: Record<string, string> = {}) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", ...CORS, ...headers },
  });
}

export function preflight() {
  return new Response(null, { status: 204, headers: CORS });
}

export function html(body: string, status = 200) {
  return new Response(body, {
    status,
    headers: { "Content-Type": "text/html; charset=utf-8", ...CORS },
  });
}

export function requireParam(url: URL, name: string): string {
  const v = url.searchParams.get(name);
  if (!v) throw new HttpError(400, `Missing required parameter: ${name}`);
  return v;
}

export class HttpError extends Error {
  constructor(public code: number, message: string) {
    super(message);
  }
}
