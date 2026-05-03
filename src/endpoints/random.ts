import type { EndpointDef } from "../types";
import { ok } from "../lib/response";
import { getJSON } from "../lib/fetch";

export const randomEndpoints: EndpointDef[] = [
  {
    path: "/api/random/user", method: "GET", category: "random", name: "Random User",
    description: "Generate a fake user profile.",
    params: [], cacheTTL: 0,
    handler: async (_r, env) => {
      const t0 = Date.now();
      const j: any = await getJSON("https://randomuser.me/api/");
      return ok(env, j.results[0], Date.now() - t0);
    },
  },
  {
    path: "/api/random/number", method: "GET", category: "random", name: "Random Number",
    description: "Random integer in [min, max].",
    params: [
      { name: "min", required: false, example: "1" },
      { name: "max", required: false, example: "100" },
    ],
    cacheTTL: 0,
    handler: (_r, env, _c, url) => {
      const min = parseInt(url.searchParams.get("min") || "1", 10);
      const max = parseInt(url.searchParams.get("max") || "100", 10);
      return ok(env, { min, max, value: Math.floor(Math.random() * (max - min + 1)) + min }, 1);
    },
  },
  {
    path: "/api/random/coin", method: "GET", category: "random", name: "Coin Flip",
    description: "Flip a coin.",
    params: [], cacheTTL: 0,
    handler: (_r, env) => ok(env, { result: Math.random() < 0.5 ? "heads" : "tails" }, 1),
  },
  {
    path: "/api/random/word", method: "GET", category: "random", name: "Random Word",
    description: "Get a random English word.",
    params: [], cacheTTL: 0,
    handler: async (_r, env) => {
      const t0 = Date.now();
      const j: any = await getJSON("https://random-word-api.herokuapp.com/word");
      return ok(env, { word: j[0] }, Date.now() - t0);
    },
  },
  {
    path: "/api/random/activity", method: "GET", category: "random", name: "Bored? Activity",
    description: "Random activity to fight boredom.",
    params: [], cacheTTL: 0,
    handler: async (_r, env) => {
      const t0 = Date.now();
      const j = await getJSON("https://www.boredapi.com/api/activity");
      return ok(env, j, Date.now() - t0);
    },
  },
];
