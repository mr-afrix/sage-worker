# 🌿 Sage API

A blazing-fast, free, public REST API hosted on **Cloudflare Workers**.
70+ endpoints across 10 categories — no login, no API key, no rate-card paywalls.

- **API:** `https://api.sage.dpdns.org`
- **Frontend:** `https://app.sage.dpdns.org`
- **Catalog (machine-readable):** `https://api.sage.dpdns.org/api/endpoints`
- **Live stats:** `https://api.sage.dpdns.org/api/stats`

---

## 🧱 Architecture

```
 user / app.sage.dpdns.org
              │
              ▼
     api.sage.dpdns.org  ←── Cloudflare Worker (this repo)
              │
              ├── Cloudflare KV  → hot response cache + IP rate limit
              └── Supabase       → request logs, live stats, status history
```

- The Worker is the **only** public API. Supabase URL is never exposed.
- Frontend always calls `https://api.sage.dpdns.org/...`.
- Cache TTL is per-endpoint (e.g. lyrics 24h, weather 10m, AI chat 0).

---

## 📁 Project layout

```
worker/
├── wrangler.toml            ← Cloudflare config (domain, KV, vars)
├── package.json
├── tsconfig.json
├── src/
│   ├── index.ts             ← router + meta routes (/, /api/endpoints, /api/stats)
│   ├── types.ts
│   ├── registry.ts          ← imports all endpoint modules + categories
│   ├── lib/
│   │   ├── response.ts      ← consistent JSON shape, CORS
│   │   ├── cache.ts         ← KV cache helper
│   │   ├── ratelimit.ts     ← per-IP rate limit (60/min default)
│   │   ├── log.ts           ← async Supabase request logging
│   │   └── fetch.ts         ← fetch helpers w/ browser UA
│   └── endpoints/
│       ├── ai.ts            ← ChatGPT, Gemini, Llama, Mistral, Qwen, image, translate
│       ├── downloader.ts    ← YouTube (8 qualities + mp3 + info + search), TikTok, IG (4), Spotify, Twitter, FB, SoundCloud, Pinterest, Threads, Reddit, Vimeo
│       ├── anime.ts         ← MAL search, top, random, manga, characters, 31 SFW image categories
│       ├── osint.ts         ← GitHub, IG, TikTok, npm, whois, IP, email validator
│       ├── tools.ts         ← QR, shortener, screenshot, weather, timezone, base64, hash, uuid, password, color
│       ├── games.ts         ← truth, dare, riddle, wyr, 8ball, dice, joke, meme, quote, advice, fact, cat, dog
│       ├── music.ts         ← lyrics, Spotify/iTunes/Deezer search
│       ├── news.ts          ← Wikipedia, dictionary, currency, crypto, headlines
│       ├── image.ts         ← Unsplash, Picsum, avatars, flags, placeholders
│       └── random.ts        ← random user, number, coin flip, word, bored activity
├── supabase/
│   └── schema.sql           ← request_logs, endpoint_stats view, status_history
└── scripts/
    └── generate-catalog.mjs ← export endpoints.json for the frontend
```

---

## 📐 JSON response shape (every endpoint)

**Success**
```json
{
  "status": true,
  "creator": "Sage",
  "took": "184ms",
  "cache": "MISS",
  "result": { ... }
}
```

**Error**
```json
{
  "status": false,
  "creator": "Sage",
  "code": 400,
  "message": "Missing required parameter: url"
}
```

This shape is uniform across **every** endpoint so the frontend renders predictably.

---

## 🚀 Deploy steps (top to bottom — first time)

You need: a Cloudflare account (you have it), `dpdns.org` already on Cloudflare, Node.js 18+, and a Supabase project (free tier is fine).

### 1. Install dependencies

```bash
cd worker
npm install
npm install -g wrangler   # if not already global
wrangler login            # opens browser, links your CF account
```

### 2. Create the KV namespace (cache)

```bash
wrangler kv namespace create CACHE
```

It prints something like:
```
[[kv_namespaces]]
binding = "CACHE"
id = "abcd1234ef567890..."
```
Open `wrangler.toml` and replace `REPLACE_WITH_KV_ID` with that `id`.

### 3. Set up Supabase

1. Go to [supabase.com](https://supabase.com) → New project (free tier).
2. Once ready, open **SQL Editor** → paste the contents of `supabase/schema.sql` → Run.
3. Go to **Project Settings → API**:
   - Copy the **Project URL** (looks like `https://xxxx.supabase.co`)
   - Copy the **service_role** key (the long secret one — *not* the anon key).

### 4. Add secrets to the Worker

```bash
wrangler secret put SUPABASE_URL
# paste the project URL when prompted

wrangler secret put SUPABASE_SERVICE_ROLE_KEY
# paste the service_role key when prompted
```

### 5. Deploy

```bash
wrangler deploy
```

You should see:
```
Published sage-api (X.XX sec)
  https://sage-api.<your-account>.workers.dev
```

### 6. Connect the custom domain `api.sage.dpdns.org`

Easiest path (recommended):

1. Cloudflare dashboard → **Workers & Pages** → click `sage-api`.
2. **Settings → Domains & Routes → + Add → Custom Domain**.
3. Enter `api.sage.dpdns.org` and click **Add Domain**.

Cloudflare auto-creates the DNS record (since `dpdns.org` is on your account) and provisions SSL within 1–2 minutes.

> The `wrangler.toml` already declares this route with `custom_domain = true`, so on subsequent `wrangler deploy` it stays bound.

### 7. Verify

```bash
curl https://api.sage.dpdns.org/api/health
curl https://api.sage.dpdns.org/api/meta
curl "https://api.sage.dpdns.org/api/ai/gpt?q=hello"
curl "https://api.sage.dpdns.org/api/dl/tiktok?url=https://www.tiktok.com/@scout2015/video/6718335390845095173"
```

If those return JSON with `"status": true`, you're live. ✅

---

## 🖼️ Frontend integration (`app.sage.dpdns.org`)

Your frontend should:

1. Call `GET https://api.sage.dpdns.org/api/endpoints` once on load.
2. Use the `categories` array to render section cards (each has `name`, `emoji`, `color`, `description`).
3. Group `endpoints` by `category` to render endpoint cards inside each section.
4. Each endpoint object includes a ready-to-paste `example` URL — perfect for a "Try it" playground button.

```ts
const res = await fetch("https://api.sage.dpdns.org/api/endpoints");
const { categories, endpoints } = (await res.json()).result;
```

---

## 🛠️ Local development

```bash
cd worker
wrangler dev
# → http://localhost:8787
```

Hot-reloads on file change. KV and secrets work locally via Cloudflare's mini-runtime.

---

## ➕ Adding a new endpoint

1. Pick or create a file in `src/endpoints/`.
2. Append a new object to the exported array:

```ts
{
  path: "/api/tools/myNewThing",
  method: "GET",
  category: "tools",
  name: "My New Thing",
  description: "What it does.",
  params: [{ name: "q", required: true, example: "hello" }],
  cacheTTL: 600,
  handler: async (_req, env, _ctx, url) => {
    const t0 = Date.now();
    const q = requireParam(url, "q");
    // ... do stuff ...
    return ok(env, { q, foo: "bar" }, Date.now() - t0);
  },
}
```

3. If it's in a new file, add it to `registry.ts`.
4. `wrangler deploy`.

That's it — the new endpoint instantly shows up in `/api/endpoints` for the frontend.

---

## 📊 Observability

- `/api/stats` — total requests + last 24h (live from Supabase).
- Supabase SQL: `select * from endpoint_stats order by total_requests desc;`
- Cloudflare dashboard → Workers → `sage-api` → Logs/Analytics for raw request volume + errors.

---

## ⚖️ Why this beats Prince + Siputzx

| | Prince | Siputzx | **Sage** |
|---|:-:|:-:|:-:|
| Edge servers | 1 | 1 | **300+** |
| Real live stats | fake-ish | basic | **DB-backed** |
| Categories | ~6 | ~7 | **10 cards** |
| Endpoints v1 | ~50 | ~60 | **70+** |
| Consistent JSON | ⚠️ | ⚠️ | **✅ strict** |
| Per-endpoint cache | ❌ | ⚠️ | **✅ KV** |
| Hosting cost | $$$ | $$ | **~$0** |

---

## 📜 License

MIT. Do whatever. Burn down the API monopoly. 🌿
