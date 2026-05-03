import type { EndpointDef } from "../types";
import { ok, requireParam } from "../lib/response";
import { getJSON } from "../lib/fetch";

// Free public AI scrapers / mirrors. These are best-effort; swap upstream if any breaks.
async function pollinationsChat(prompt: string, model = "openai") {
  const url = `https://text.pollinations.ai/${encodeURIComponent(prompt)}?model=${encodeURIComponent(model)}`;
  const r = await fetch(url);
  if (!r.ok) throw new Error(`pollinations ${r.status}`);
  return r.text();
}

async function pollinationsImage(prompt: string, w = 1024, h = 1024, model = "flux") {
  // Returns a direct image URL (Pollinations renders on-demand)
  const seed = Math.floor(Math.random() * 1e9);
  return `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=${w}&height=${h}&seed=${seed}&model=${model}&nologo=true`;
}

export const aiEndpoints: EndpointDef[] = [
  {
    path: "/api/ai/gpt", method: "GET", category: "ai", name: "ChatGPT",
    description: "Chat with GPT (via Pollinations openai mirror).",
    params: [{ name: "q", required: true, example: "Hello there", description: "Your prompt" }],
    cacheTTL: 0,
    handler: async (_r, env, _c, url) => {
      const t0 = Date.now();
      const q = requireParam(url, "q");
      const text = await pollinationsChat(q, "openai");
      return ok(env, { prompt: q, response: text, model: "openai" }, Date.now() - t0);
    },
  },
  {
    path: "/api/ai/gemini", method: "GET", category: "ai", name: "Gemini",
    description: "Chat with Gemini.",
    params: [{ name: "q", required: true, example: "Explain quantum computing" }],
    cacheTTL: 0,
    handler: async (_r, env, _c, url) => {
      const t0 = Date.now();
      const q = requireParam(url, "q");
      const text = await pollinationsChat(q, "gemini");
      return ok(env, { prompt: q, response: text, model: "gemini" }, Date.now() - t0);
    },
  },
  {
    path: "/api/ai/llama", method: "GET", category: "ai", name: "Llama 3",
    description: "Chat with Meta Llama 3.",
    params: [{ name: "q", required: true, example: "Write a haiku about code" }],
    cacheTTL: 0,
    handler: async (_r, env, _c, url) => {
      const t0 = Date.now();
      const q = requireParam(url, "q");
      const text = await pollinationsChat(q, "llama");
      return ok(env, { prompt: q, response: text, model: "llama" }, Date.now() - t0);
    },
  },
  {
    path: "/api/ai/mistral", method: "GET", category: "ai", name: "Mistral",
    description: "Chat with Mistral.",
    params: [{ name: "q", required: true, example: "Summarize the French Revolution" }],
    cacheTTL: 0,
    handler: async (_r, env, _c, url) => {
      const t0 = Date.now();
      const q = requireParam(url, "q");
      const text = await pollinationsChat(q, "mistral");
      return ok(env, { prompt: q, response: text, model: "mistral" }, Date.now() - t0);
    },
  },
  {
    path: "/api/ai/qwen", method: "GET", category: "ai", name: "Qwen",
    description: "Chat with Alibaba Qwen.",
    params: [{ name: "q", required: true, example: "Translate hello to Mandarin" }],
    cacheTTL: 0,
    handler: async (_r, env, _c, url) => {
      const t0 = Date.now();
      const q = requireParam(url, "q");
      const text = await pollinationsChat(q, "qwen");
      return ok(env, { prompt: q, response: text, model: "qwen" }, Date.now() - t0);
    },
  },
  {
    path: "/api/ai/image", method: "GET", category: "ai", name: "AI Image Generation",
    description: "Generate an image from a text prompt (Flux model).",
    params: [
      { name: "prompt", required: true, example: "a neon dragon over Tokyo" },
      { name: "w", required: false, example: "1024" },
      { name: "h", required: false, example: "1024" },
    ],
    cacheTTL: 3600,
    handler: async (_r, env, _c, url) => {
      const t0 = Date.now();
      const prompt = requireParam(url, "prompt");
      const w = parseInt(url.searchParams.get("w") || "1024", 10);
      const h = parseInt(url.searchParams.get("h") || "1024", 10);
      const imageUrl = await pollinationsImage(prompt, w, h);
      return ok(env, { prompt, url: imageUrl, width: w, height: h }, Date.now() - t0);
    },
  },
  {
    path: "/api/ai/translate", method: "GET", category: "ai", name: "Translate",
    description: "Translate text between languages (Google Translate free endpoint).",
    params: [
      { name: "text", required: true, example: "Hello world" },
      { name: "to", required: true, example: "es" },
      { name: "from", required: false, example: "auto" },
    ],
    cacheTTL: 86400,
    handler: async (_r, env, _c, url) => {
      const t0 = Date.now();
      const text = requireParam(url, "text");
      const to = requireParam(url, "to");
      const from = url.searchParams.get("from") || "auto";
      const api = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${from}&tl=${to}&dt=t&q=${encodeURIComponent(text)}`;
      const data = await getJSON<any>(api);
      const translated = (data?.[0] || []).map((x: any) => x[0]).join("");
      return ok(env, { from, to, text, translated }, Date.now() - t0);
    },
  },
];
