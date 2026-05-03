import type { EndpointDef } from "../types";
import { ok, requireParam, HttpError } from "../lib/response";
import { getJSON, getText } from "../lib/fetch";

export const newsEndpoints: EndpointDef[] = [
  {
    path: "/api/info/wikipedia", method: "GET", category: "news", name: "Wikipedia",
    description: "Wikipedia summary for a topic.",
    params: [{ name: "q", required: true, example: "Albert Einstein" }],
    cacheTTL: 86400,
    handler: async (_r, env, _c, url) => {
      const t0 = Date.now();
      const q = requireParam(url, "q");
      const data = await getJSON(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(q)}`);
      return ok(env, data, Date.now() - t0);
    },
  },
  {
    path: "/api/info/dictionary", method: "GET", category: "news", name: "Dictionary",
    description: "English dictionary lookup.",
    params: [{ name: "word", required: true, example: "ephemeral" }],
    cacheTTL: 86400,
    handler: async (_r, env, _c, url) => {
      const t0 = Date.now();
      const word = requireParam(url, "word");
      const r = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`);
      if (!r.ok) throw new HttpError(404, "Word not found");
      return ok(env, await r.json(), Date.now() - t0);
    },
  },
  {
    path: "/api/info/currency", method: "GET", category: "news", name: "Currency Convert",
    description: "Convert currency at the latest rate.",
    params: [
      { name: "from", required: true, example: "USD" },
      { name: "to", required: true, example: "EUR" },
      { name: "amount", required: false, example: "100" },
    ],
    cacheTTL: 600,
    handler: async (_r, env, _c, url) => {
      const t0 = Date.now();
      const from = requireParam(url, "from").toLowerCase();
      const to = requireParam(url, "to").toLowerCase();
      const amount = parseFloat(url.searchParams.get("amount") || "1");
      const j: any = await getJSON(`https://cdn.jsdelivr.net/npm/@fawazahmed/currency-api@latest/v1/currencies/${from}.json`);
      const rate = j[from]?.[to];
      if (rate == null) throw new HttpError(400, "Invalid currency code");
      return ok(env, { from, to, amount, rate, converted: amount * rate }, Date.now() - t0);
    },
  },
  {
    path: "/api/info/crypto", method: "GET", category: "news", name: "Crypto Price",
    description: "Live crypto price (CoinGecko).",
    params: [
      { name: "id", required: true, example: "bitcoin" },
      { name: "vs", required: false, example: "usd" },
    ],
    cacheTTL: 60,
    handler: async (_r, env, _c, url) => {
      const t0 = Date.now();
      const id = requireParam(url, "id");
      const vs = url.searchParams.get("vs") || "usd";
      const j: any = await getJSON(`https://api.coingecko.com/api/v3/simple/price?ids=${id}&vs_currencies=${vs}`);
      if (!j[id]) throw new HttpError(404, "Coin not found");
      return ok(env, { id, vs, price: j[id][vs] }, Date.now() - t0);
    },
  },
  {
    path: "/api/info/news", method: "GET", category: "news", name: "Top Headlines",
    description: "Top world news headlines (Google News RSS).",
    params: [{ name: "topic", required: false, example: "technology" }],
    cacheTTL: 600,
    handler: async (_r, env, _c, url) => {
      const t0 = Date.now();
      const topic = url.searchParams.get("topic");
      const u = topic
        ? `https://news.google.com/rss/headlines/section/topic/${encodeURIComponent(topic.toUpperCase())}?hl=en-US&gl=US&ceid=US:en`
        : `https://news.google.com/rss?hl=en-US&gl=US&ceid=US:en`;
      const xml = await getText(u);
      const items = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].slice(0, 20).map(m => {
        const block = m[1];
        const get = (tag: string) => (block.match(new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`))?.[1] || "").replace(/<!\[CDATA\[|\]\]>/g, "");
        return { title: get("title"), link: get("link"), pubDate: get("pubDate"), source: get("source") };
      });
      return ok(env, items, Date.now() - t0);
    },
  },
];
