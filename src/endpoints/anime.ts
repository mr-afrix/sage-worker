import type { EndpointDef } from "../types";
import { ok, requireParam, HttpError } from "../lib/response";
import { getJSON } from "../lib/fetch";

const JIKAN = "https://api.jikan.moe/v4";

export const animeEndpoints: EndpointDef[] = [
  {
    path: "/api/anime/search", method: "GET", category: "anime", name: "Anime Search",
    description: "Search anime via MyAnimeList (Jikan).",
    params: [{ name: "q", required: true, example: "naruto" }],
    cacheTTL: 3600,
    handler: async (_r, env, _c, url) => {
      const t0 = Date.now();
      const q = requireParam(url, "q");
      const data = await getJSON<any>(`${JIKAN}/anime?q=${encodeURIComponent(q)}&limit=15`);
      return ok(env, data.data, Date.now() - t0);
    },
  },
  {
    path: "/api/anime/top", method: "GET", category: "anime", name: "Top Anime",
    description: "Top anime list.",
    params: [],
    cacheTTL: 3600,
    handler: async (_r, env, _c, _u) => {
      const t0 = Date.now();
      const data = await getJSON<any>(`${JIKAN}/top/anime?limit=25`);
      return ok(env, data.data, Date.now() - t0);
    },
  },
  {
    path: "/api/anime/random", method: "GET", category: "anime", name: "Random Anime",
    description: "Get a random anime.",
    params: [],
    cacheTTL: 0,
    handler: async (_r, env, _c, _u) => {
      const t0 = Date.now();
      const data = await getJSON<any>(`${JIKAN}/random/anime`);
      return ok(env, data.data, Date.now() - t0);
    },
  },
  {
    path: "/api/anime/manga/search", method: "GET", category: "anime", name: "Manga Search",
    description: "Search manga.",
    params: [{ name: "q", required: true, example: "berserk" }],
    cacheTTL: 3600,
    handler: async (_r, env, _c, url) => {
      const t0 = Date.now();
      const q = requireParam(url, "q");
      const data = await getJSON<any>(`${JIKAN}/manga?q=${encodeURIComponent(q)}&limit=15`);
      return ok(env, data.data, Date.now() - t0);
    },
  },
  {
    path: "/api/anime/character", method: "GET", category: "anime", name: "Character Search",
    description: "Search anime/manga characters.",
    params: [{ name: "q", required: true, example: "luffy" }],
    cacheTTL: 3600,
    handler: async (_r, env, _c, url) => {
      const t0 = Date.now();
      const q = requireParam(url, "q");
      const data = await getJSON<any>(`${JIKAN}/characters?q=${encodeURIComponent(q)}&limit=15`);
      return ok(env, data.data, Date.now() - t0);
    },
  },
  ...(["waifu","neko","shinobu","megumin","bully","cuddle","cry","hug","awoo","kiss","lick","pat","smug","bonk","yeet","blush","smile","wave","highfive","handhold","nom","bite","glomp","slap","kill","kick","happy","wink","poke","dance","cringe"] as const).map<EndpointDef>((cat) => ({
    path: `/api/anime/sfw/${cat}`, method: "GET", category: "anime",
    name: `Anime SFW ${cat}`,
    description: `Random SFW anime image — ${cat}.`,
    params: [],
    cacheTTL: 0,
    handler: async (_r, env, _c, _u) => {
      const t0 = Date.now();
      const data = await getJSON<any>(`https://api.waifu.pics/sfw/${cat}`);
      if (!data.url) throw new HttpError(502, "waifu.pics upstream failed");
      return ok(env, { category: cat, url: data.url }, Date.now() - t0);
    },
  })),
];
