// Fetch helpers with sane defaults for scrapers.
const DEFAULT_UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

export async function getText(url: string, init: RequestInit = {}): Promise<string> {
  const r = await fetch(url, withDefaults(init));
  if (!r.ok) throw new Error(`Upstream ${r.status} ${url}`);
  return r.text();
}

export async function getJSON<T = unknown>(url: string, init: RequestInit = {}): Promise<T> {
  const r = await fetch(url, withDefaults(init));
  if (!r.ok) throw new Error(`Upstream ${r.status} ${url}`);
  return r.json() as Promise<T>;
}

export function withDefaults(init: RequestInit = {}): RequestInit {
  const headers = new Headers(init.headers);
  if (!headers.has("user-agent")) headers.set("user-agent", DEFAULT_UA);
  if (!headers.has("accept-language")) headers.set("accept-language", "en-US,en;q=0.9");
  return { ...init, headers };
}
