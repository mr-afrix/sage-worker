import type { EndpointDef } from "../types";
import { ok, requireParam, HttpError } from "../lib/response";
import { getJSON } from "../lib/fetch";

export const musicEndpoints: EndpointDef[] = [
  {
    path: "/api/music/lyrics", method: "GET", category: "music", name: "Lyrics",
    description: "Find song lyrics.",
    params: [
      { name: "artist", required: true, example: "Adele" },
      { name: "title", required: true, example: "Hello" },
    ],
    cacheTTL: 86400,
    handler: async (_r, env, _c, url) => {
      const t0 = Date.now();
      const artist = requireParam(url, "artist");
      const title = requireParam(url, "title");
      try {
        const j: any = await getJSON(`https://api.lyrics.ovh/v1/${encodeURIComponent(artist)}/${encodeURIComponent(title)}`);
        if (!j.lyrics) throw new Error();
        return ok(env, { artist, title, lyrics: j.lyrics }, Date.now() - t0);
      } catch {
        throw new HttpError(404, "Lyrics not found");
      }
    },
  },
  {
    path: "/api/music/spotify/search", method: "GET", category: "music", name: "Spotify Search",
    description: "Search Spotify tracks (no key needed via mirror).",
    params: [{ name: "q", required: true, example: "blinding lights" }],
    cacheTTL: 3600,
    handler: async (_r, env, _c, url) => {
      const t0 = Date.now();
      const q = requireParam(url, "q");
      const j: any = await getJSON(`https://itunes.apple.com/search?term=${encodeURIComponent(q)}&media=music&limit=15`);
      return ok(env, j.results, Date.now() - t0);
    },
  },
  {
    path: "/api/music/itunes", method: "GET", category: "music", name: "iTunes Search",
    description: "Search the iTunes catalog.",
    params: [{ name: "q", required: true, example: "taylor swift" }],
    cacheTTL: 3600,
    handler: async (_r, env, _c, url) => {
      const t0 = Date.now();
      const q = requireParam(url, "q");
      const j: any = await getJSON(`https://itunes.apple.com/search?term=${encodeURIComponent(q)}&limit=20`);
      return ok(env, j.results, Date.now() - t0);
    },
  },
  {
    path: "/api/music/deezer", method: "GET", category: "music", name: "Deezer Search",
    description: "Search Deezer tracks.",
    params: [{ name: "q", required: true, example: "drake" }],
    cacheTTL: 3600,
    handler: async (_r, env, _c, url) => {
      const t0 = Date.now();
      const q = requireParam(url, "q");
      const j: any = await getJSON(`https://api.deezer.com/search?q=${encodeURIComponent(q)}&limit=20`);
      return ok(env, j.data, Date.now() - t0);
    },
  },
];
