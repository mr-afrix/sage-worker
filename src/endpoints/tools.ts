import type { EndpointDef } from "../types";
import { ok, requireParam, HttpError } from "../lib/response";
import { getJSON } from "../lib/fetch";

export const toolsEndpoints: EndpointDef[] = [
  {
    path: "/api/tools/qrcode", method: "GET", category: "tools", name: "QR Code Generator",
    description: "Generate a QR code PNG URL.",
    params: [
      { name: "text", required: true, example: "Hello Sage" },
      { name: "size", required: false, example: "512" },
    ],
    cacheTTL: 86400,
    handler: async (_r, env, _c, url) => {
      const t0 = Date.now();
      const text = requireParam(url, "text");
      const size = url.searchParams.get("size") || "512";
      const qr = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(text)}`;
      return ok(env, { text, size: parseInt(size, 10), url: qr }, Date.now() - t0);
    },
  },
  {
    path: "/api/tools/shorten", method: "GET", category: "tools", name: "URL Shortener",
    description: "Shorten a URL via is.gd.",
    params: [{ name: "url", required: true, example: "https://example.com/very/long/path" }],
    cacheTTL: 0,
    handler: async (_r, env, _c, url) => {
      const t0 = Date.now();
      const long = requireParam(url, "url");
      const r = await fetch(`https://is.gd/create.php?format=simple&url=${encodeURIComponent(long)}`);
      const short = (await r.text()).trim();
      if (!short.startsWith("http")) throw new HttpError(400, short);
      return ok(env, { original: long, short }, Date.now() - t0);
    },
  },
  {
    path: "/api/tools/screenshot", method: "GET", category: "tools", name: "Website Screenshot",
    description: "Take a screenshot of any URL.",
    params: [{ name: "url", required: true, example: "https://github.com" }],
    cacheTTL: 3600,
    handler: async (_r, env, _c, url) => {
      const t0 = Date.now();
      const target = requireParam(url, "url");
      const img = `https://image.thum.io/get/width/1280/png/${target}`;
      return ok(env, { target, image: img }, Date.now() - t0);
    },
  },
  {
    path: "/api/tools/weather", method: "GET", category: "tools", name: "Weather",
    description: "Current weather by city.",
    params: [{ name: "city", required: true, example: "Tokyo" }],
    cacheTTL: 600,
    handler: async (_r, env, _c, url) => {
      const t0 = Date.now();
      const city = requireParam(url, "city");
      const geo: any = await getJSON(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1`);
      const place = geo.results?.[0];
      if (!place) throw new HttpError(404, "City not found");
      const w: any = await getJSON(`https://api.open-meteo.com/v1/forecast?latitude=${place.latitude}&longitude=${place.longitude}&current_weather=true`);
      return ok(env, { city: place.name, country: place.country, weather: w.current_weather }, Date.now() - t0);
    },
  },
  {
    path: "/api/tools/timezone", method: "GET", category: "tools", name: "Timezone",
    description: "Get current time in a timezone.",
    params: [{ name: "tz", required: true, example: "Asia/Tokyo" }],
    cacheTTL: 0,
    handler: async (_r, env, _c, url) => {
      const t0 = Date.now();
      const tz = requireParam(url, "tz");
      const data = await getJSON(`https://worldtimeapi.org/api/timezone/${encodeURIComponent(tz)}`);
      return ok(env, data, Date.now() - t0);
    },
  },
  {
    path: "/api/tools/base64/encode", method: "GET", category: "tools", name: "Base64 Encode",
    description: "Base64 encode text.",
    params: [{ name: "text", required: true, example: "hello" }],
    cacheTTL: 86400,
    handler: async (_r, env, _c, url) => {
      const t0 = Date.now();
      const text = requireParam(url, "text");
      return ok(env, { input: text, encoded: btoa(unescape(encodeURIComponent(text))) }, Date.now() - t0);
    },
  },
  {
    path: "/api/tools/base64/decode", method: "GET", category: "tools", name: "Base64 Decode",
    description: "Base64 decode text.",
    params: [{ name: "text", required: true, example: "aGVsbG8=" }],
    cacheTTL: 86400,
    handler: async (_r, env, _c, url) => {
      const t0 = Date.now();
      const text = requireParam(url, "text");
      try {
        return ok(env, { input: text, decoded: decodeURIComponent(escape(atob(text))) }, Date.now() - t0);
      } catch {
        throw new HttpError(400, "Invalid base64 input");
      }
    },
  },
  {
    path: "/api/tools/hash", method: "GET", category: "tools", name: "Hash Generator",
    description: "Hash text with SHA-1, SHA-256, SHA-384, SHA-512.",
    params: [
      { name: "text", required: true, example: "hello" },
      { name: "algo", required: false, example: "SHA-256" },
    ],
    cacheTTL: 86400,
    handler: async (_r, env, _c, url) => {
      const t0 = Date.now();
      const text = requireParam(url, "text");
      const algo = (url.searchParams.get("algo") || "SHA-256").toUpperCase();
      const buf = await crypto.subtle.digest(algo, new TextEncoder().encode(text));
      const hex = [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, "0")).join("");
      return ok(env, { input: text, algo, hash: hex }, Date.now() - t0);
    },
  },
  {
    path: "/api/tools/uuid", method: "GET", category: "tools", name: "UUID Generator",
    description: "Generate a v4 UUID.",
    params: [],
    cacheTTL: 0,
    handler: (_r, env, _c, _u) => ok(env, { uuid: crypto.randomUUID() }, 1),
  },
  {
    path: "/api/tools/password", method: "GET", category: "tools", name: "Password Generator",
    description: "Generate a strong random password.",
    params: [{ name: "length", required: false, example: "16" }],
    cacheTTL: 0,
    handler: (_r, env, _c, url) => {
      const len = Math.min(128, Math.max(4, parseInt(url.searchParams.get("length") || "16", 10)));
      const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=";
      const bytes = new Uint8Array(len);
      crypto.getRandomValues(bytes);
      const pw = Array.from(bytes, b => chars[b % chars.length]).join("");
      return ok(env, { length: len, password: pw }, 1);
    },
  },
  {
    path: "/api/tools/color", method: "GET", category: "tools", name: "Random Color Palette",
    description: "Generate a 5-color palette.",
    params: [],
    cacheTTL: 0,
    handler: (_r, env) => {
      const palette = Array.from({ length: 5 }, () =>
        "#" + [...crypto.getRandomValues(new Uint8Array(3))].map(b => b.toString(16).padStart(2, "0")).join(""));
      return ok(env, { palette }, 1);
    },
  },
];
