import type { EndpointDef } from "../types";
import { ok, requireParam } from "../lib/response";
import { getJSON } from "../lib/fetch";

export const imageEndpoints: EndpointDef[] = [
  {
    path: "/api/image/unsplash", method: "GET", category: "image", name: "Unsplash Photo",
    description: "Get a random Unsplash photo URL.",
    params: [{ name: "q", required: false, example: "mountains" }],
    cacheTTL: 0,
    handler: (_r, env, _c, url) => {
      const q = url.searchParams.get("q") || "";
      const seed = Math.floor(Math.random() * 1e6);
      const u = `https://source.unsplash.com/1600x900/?${encodeURIComponent(q || "nature")}&sig=${seed}`;
      return ok(env, { query: q || "nature", url: u }, 1);
    },
  },
  {
    path: "/api/image/picsum", method: "GET", category: "image", name: "Random Picsum",
    description: "Random Lorem Picsum image.",
    params: [
      { name: "w", required: false, example: "1200" },
      { name: "h", required: false, example: "800" },
    ],
    cacheTTL: 0,
    handler: (_r, env, _c, url) => {
      const w = url.searchParams.get("w") || "1200";
      const h = url.searchParams.get("h") || "800";
      return ok(env, { url: `https://picsum.photos/${w}/${h}?random=${Math.random()}` }, 1);
    },
  },
  {
    path: "/api/image/avatar", method: "GET", category: "image", name: "Avatar Generator",
    description: "Generate a DiceBear avatar.",
    params: [
      { name: "seed", required: true, example: "sage" },
      { name: "style", required: false, example: "adventurer" },
    ],
    cacheTTL: 86400,
    handler: (_r, env, _c, url) => {
      const seed = requireParam(url, "seed");
      const style = url.searchParams.get("style") || "adventurer";
      return ok(env, { seed, style, url: `https://api.dicebear.com/7.x/${style}/svg?seed=${encodeURIComponent(seed)}` }, 1);
    },
  },
  {
    path: "/api/image/flag", method: "GET", category: "image", name: "Country Flag",
    description: "Country flag image.",
    params: [{ name: "code", required: true, example: "us" }],
    cacheTTL: 86400,
    handler: (_r, env, _c, url) => {
      const code = requireParam(url, "code").toLowerCase();
      return ok(env, { code, url: `https://flagcdn.com/w640/${code}.png` }, 1);
    },
  },
  {
    path: "/api/image/placeholder", method: "GET", category: "image", name: "Placeholder",
    description: "Placeholder image with custom size + text.",
    params: [
      { name: "w", required: false, example: "600" },
      { name: "h", required: false, example: "400" },
      { name: "text", required: false, example: "Sage API" },
    ],
    cacheTTL: 86400,
    handler: (_r, env, _c, url) => {
      const w = url.searchParams.get("w") || "600";
      const h = url.searchParams.get("h") || "400";
      const text = url.searchParams.get("text") || "Sage";
      return ok(env, { url: `https://placehold.co/${w}x${h}?text=${encodeURIComponent(text)}` }, 1);
    },
  },
];
