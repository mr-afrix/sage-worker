import type { EndpointDef } from "../types";
import { ok, requireParam, HttpError } from "../lib/response";
import { getJSON, getText, withDefaults } from "../lib/fetch";

// ---------- helpers ----------
async function ytdownloaderApi(videoUrl: string, type: "mp3" | "mp4", quality: string) {
  // Uses cobalt.tools (open-source, free).
  const r = await fetch("https://api.cobalt.tools/api/json", withDefaults({
    method: "POST",
    headers: { "Content-Type": "application/json", "Accept": "application/json" },
    body: JSON.stringify({
      url: videoUrl,
      vQuality: quality,
      aFormat: type === "mp3" ? "mp3" : "best",
      isAudioOnly: type === "mp3",
    }),
  }));
  if (!r.ok) throw new HttpError(502, `cobalt upstream ${r.status}`);
  const data: any = await r.json();
  if (data.status === "error") throw new HttpError(400, data.text || "Download failed");
  return data;
}

// ---------- endpoints ----------
export const downloaderEndpoints: EndpointDef[] = [
  // YouTube — multiple flavors (matches user request: "all YouTube downloaders")
  ...(["144","240","360","480","720","1080","1440","2160"] as const).map<EndpointDef>((q) => ({
    path: `/api/dl/youtube/mp4/${q}`,
    method: "GET", category: "downloader",
    name: `YouTube MP4 ${q}p`,
    description: `Download a YouTube video as MP4 in ${q}p (max available).`,
    params: [{ name: "url", required: true, example: "https://youtu.be/dQw4w9WgXcQ" }],
    cacheTTL: 600,
    handler: async (_r, env, _c, url) => {
      const t0 = Date.now();
      const link = requireParam(url, "url");
      const data = await ytdownloaderApi(link, "mp4", q);
      return ok(env, { source: link, quality: `${q}p`, type: "mp4", download: data.url, raw: data }, Date.now() - t0);
    },
  })),
  {
    path: "/api/dl/youtube/mp3", method: "GET", category: "downloader", name: "YouTube MP3",
    description: "Extract audio from a YouTube video as MP3.",
    params: [{ name: "url", required: true, example: "https://youtu.be/dQw4w9WgXcQ" }],
    cacheTTL: 600,
    handler: async (_r, env, _c, url) => {
      const t0 = Date.now();
      const link = requireParam(url, "url");
      const data = await ytdownloaderApi(link, "mp3", "1080");
      return ok(env, { source: link, type: "mp3", download: data.url, raw: data }, Date.now() - t0);
    },
  },
  {
    path: "/api/dl/youtube/info", method: "GET", category: "downloader", name: "YouTube Info",
    description: "Get YouTube video metadata via oEmbed.",
    params: [{ name: "url", required: true, example: "https://youtu.be/dQw4w9WgXcQ" }],
    cacheTTL: 86400,
    handler: async (_r, env, _c, url) => {
      const t0 = Date.now();
      const link = requireParam(url, "url");
      const meta = await getJSON<any>(`https://www.youtube.com/oembed?url=${encodeURIComponent(link)}&format=json`);
      return ok(env, meta, Date.now() - t0);
    },
  },
  {
    path: "/api/dl/youtube/search", method: "GET", category: "downloader", name: "YouTube Search",
    description: "Search YouTube and return top results.",
    params: [{ name: "q", required: true, example: "lofi hip hop" }],
    cacheTTL: 600,
    handler: async (_r, env, _c, url) => {
      const t0 = Date.now();
      const q = requireParam(url, "q");
      const html = await getText(`https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`);
      const m = html.match(/var ytInitialData = (\{.*?\});<\/script>/s);
      if (!m) throw new HttpError(502, "Failed to parse YouTube");
      const data = JSON.parse(m[1]);
      const items: any[] = [];
      const sections = data?.contents?.twoColumnSearchResultsRenderer?.primaryContents?.sectionListRenderer?.contents || [];
      for (const sec of sections) {
        const it = sec?.itemSectionRenderer?.contents || [];
        for (const v of it) {
          const r = v.videoRenderer;
          if (!r) continue;
          items.push({
            id: r.videoId,
            title: r.title?.runs?.[0]?.text,
            url: `https://youtu.be/${r.videoId}`,
            thumbnail: r.thumbnail?.thumbnails?.slice(-1)?.[0]?.url,
            duration: r.lengthText?.simpleText,
            channel: r.ownerText?.runs?.[0]?.text,
            views: r.viewCountText?.simpleText,
          });
          if (items.length >= 15) break;
        }
        if (items.length >= 15) break;
      }
      return ok(env, items, Date.now() - t0);
    },
  },

  // TikTok
  {
    path: "/api/dl/tiktok", method: "GET", category: "downloader", name: "TikTok (no watermark)",
    description: "Download TikTok video without watermark + metadata.",
    params: [{ name: "url", required: true, example: "https://www.tiktok.com/@user/video/123" }],
    cacheTTL: 600,
    handler: async (_r, env, _c, url) => {
      const t0 = Date.now();
      const link = requireParam(url, "url");
      const r = await fetch(`https://www.tikwm.com/api/?url=${encodeURIComponent(link)}`, withDefaults());
      const j: any = await r.json();
      if (j.code !== 0) throw new HttpError(400, j.msg || "TikTok failed");
      return ok(env, {
        title: j.data.title,
        author: j.data.author,
        no_watermark: `https://www.tikwm.com${j.data.play}`,
        with_watermark: `https://www.tikwm.com${j.data.wmplay}`,
        music: `https://www.tikwm.com${j.data.music}`,
        cover: j.data.cover,
        duration: j.data.duration,
      }, Date.now() - t0);
    },
  },

  // Instagram (cobalt handles reels/posts/stories)
  ...(["reel","post","story","igtv"] as const).map<EndpointDef>((kind) => ({
    path: `/api/dl/instagram/${kind}`, method: "GET", category: "downloader",
    name: `Instagram ${kind[0].toUpperCase()+kind.slice(1)}`,
    description: `Download an Instagram ${kind}.`,
    params: [{ name: "url", required: true, example: `https://www.instagram.com/${kind === "post" ? "p" : kind}/abc/` }],
    cacheTTL: 600,
    handler: async (_r, env, _c, url) => {
      const t0 = Date.now();
      const link = requireParam(url, "url");
      const r = await fetch("https://api.cobalt.tools/api/json", withDefaults({
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ url: link }),
      }));
      const data: any = await r.json();
      if (data.status === "error") throw new HttpError(400, data.text);
      return ok(env, data, Date.now() - t0);
    },
  })),

  // Spotify (track info + downloadable mp3 via spotify-downloader mirror)
  {
    path: "/api/dl/spotify", method: "GET", category: "downloader", name: "Spotify",
    description: "Download Spotify track as MP3.",
    params: [{ name: "url", required: true, example: "https://open.spotify.com/track/..." }],
    cacheTTL: 86400,
    handler: async (_r, env, _c, url) => {
      const t0 = Date.now();
      const link = requireParam(url, "url");
      const api = `https://api.spotifydown.com/download/${encodeURIComponent(link.split("/track/")[1]?.split("?")[0] || "")}`;
      const r = await fetch(api, withDefaults({ headers: { Origin: "https://spotifydown.com", Referer: "https://spotifydown.com/" } }));
      if (!r.ok) throw new HttpError(502, "spotify upstream failed");
      const j: any = await r.json();
      return ok(env, { title: j.metadata?.title, artists: j.metadata?.artists, cover: j.metadata?.cover, download: j.link }, Date.now() - t0);
    },
  },

  // Twitter/X (cobalt)
  {
    path: "/api/dl/twitter", method: "GET", category: "downloader", name: "Twitter/X",
    description: "Download videos from a Twitter / X post.",
    params: [{ name: "url", required: true, example: "https://x.com/user/status/123" }],
    cacheTTL: 600,
    handler: async (_r, env, _c, url) => {
      const t0 = Date.now();
      const link = requireParam(url, "url");
      const r = await fetch("https://api.cobalt.tools/api/json", withDefaults({
        method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ url: link }),
      }));
      const data: any = await r.json();
      if (data.status === "error") throw new HttpError(400, data.text);
      return ok(env, data, Date.now() - t0);
    },
  },

  // Facebook (cobalt)
  {
    path: "/api/dl/facebook", method: "GET", category: "downloader", name: "Facebook",
    description: "Download a Facebook video.",
    params: [{ name: "url", required: true, example: "https://www.facebook.com/.../videos/..." }],
    cacheTTL: 600,
    handler: async (_r, env, _c, url) => {
      const t0 = Date.now();
      const link = requireParam(url, "url");
      const r = await fetch("https://api.cobalt.tools/api/json", withDefaults({
        method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ url: link }),
      }));
      const data: any = await r.json();
      if (data.status === "error") throw new HttpError(400, data.text);
      return ok(env, data, Date.now() - t0);
    },
  },

  // SoundCloud (cobalt)
  {
    path: "/api/dl/soundcloud", method: "GET", category: "downloader", name: "SoundCloud",
    description: "Download a SoundCloud track.",
    params: [{ name: "url", required: true, example: "https://soundcloud.com/artist/track" }],
    cacheTTL: 600,
    handler: async (_r, env, _c, url) => {
      const t0 = Date.now();
      const link = requireParam(url, "url");
      const r = await fetch("https://api.cobalt.tools/api/json", withDefaults({
        method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ url: link, isAudioOnly: true }),
      }));
      const data: any = await r.json();
      if (data.status === "error") throw new HttpError(400, data.text);
      return ok(env, data, Date.now() - t0);
    },
  },

  // Pinterest (cobalt)
  {
    path: "/api/dl/pinterest", method: "GET", category: "downloader", name: "Pinterest",
    description: "Download a Pinterest pin (image or video).",
    params: [{ name: "url", required: true, example: "https://pin.it/abc" }],
    cacheTTL: 3600,
    handler: async (_r, env, _c, url) => {
      const t0 = Date.now();
      const link = requireParam(url, "url");
      const r = await fetch("https://api.cobalt.tools/api/json", withDefaults({
        method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ url: link }),
      }));
      const data: any = await r.json();
      if (data.status === "error") throw new HttpError(400, data.text);
      return ok(env, data, Date.now() - t0);
    },
  },

  // Threads (cobalt)
  {
    path: "/api/dl/threads", method: "GET", category: "downloader", name: "Threads",
    description: "Download media from a Threads post.",
    params: [{ name: "url", required: true, example: "https://www.threads.net/@user/post/abc" }],
    cacheTTL: 600,
    handler: async (_r, env, _c, url) => {
      const t0 = Date.now();
      const link = requireParam(url, "url");
      const r = await fetch("https://api.cobalt.tools/api/json", withDefaults({
        method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ url: link }),
      }));
      const data: any = await r.json();
      if (data.status === "error") throw new HttpError(400, data.text);
      return ok(env, data, Date.now() - t0);
    },
  },

  // Reddit (cobalt)
  {
    path: "/api/dl/reddit", method: "GET", category: "downloader", name: "Reddit",
    description: "Download a Reddit video / image.",
    params: [{ name: "url", required: true, example: "https://www.reddit.com/r/sub/comments/.../" }],
    cacheTTL: 600,
    handler: async (_r, env, _c, url) => {
      const t0 = Date.now();
      const link = requireParam(url, "url");
      const r = await fetch("https://api.cobalt.tools/api/json", withDefaults({
        method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ url: link }),
      }));
      const data: any = await r.json();
      if (data.status === "error") throw new HttpError(400, data.text);
      return ok(env, data, Date.now() - t0);
    },
  },

  // Vimeo (cobalt)
  {
    path: "/api/dl/vimeo", method: "GET", category: "downloader", name: "Vimeo",
    description: "Download a Vimeo video.",
    params: [{ name: "url", required: true, example: "https://vimeo.com/123456" }],
    cacheTTL: 600,
    handler: async (_r, env, _c, url) => {
      const t0 = Date.now();
      const link = requireParam(url, "url");
      const r = await fetch("https://api.cobalt.tools/api/json", withDefaults({
        method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ url: link }),
      }));
      const data: any = await r.json();
      if (data.status === "error") throw new HttpError(400, data.text);
      return ok(env, data, Date.now() - t0);
    },
  },
];
