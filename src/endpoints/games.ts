import type { EndpointDef } from "../types";
import { ok } from "../lib/response";
import { getJSON } from "../lib/fetch";

const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

const TRUTH = [
  "What's the most embarrassing thing you've done in public?",
  "Have you ever lied to your best friend?",
  "What's a secret you've never told anyone?",
  "Who was your first crush?",
  "What's the weirdest dream you've had?",
];
const DARE = [
  "Sing your favorite song out loud.",
  "Do 20 pushups right now.",
  "Text the 5th contact in your phone something random.",
  "Speak in an accent for the next 10 minutes.",
  "Show your last 3 selfies.",
];
const RIDDLES = [
  { q: "What has keys but can't open locks?", a: "A piano" },
  { q: "The more of me you take, the more you leave behind. What am I?", a: "Footsteps" },
  { q: "I'm tall when I'm young and short when I'm old. What am I?", a: "A candle" },
];
const WYR = [
  "Would you rather be invisible or be able to fly?",
  "Would you rather always be 10 minutes late or 20 minutes early?",
  "Would you rather never use the internet again or never watch TV again?",
];

export const gamesEndpoints: EndpointDef[] = [
  { path: "/api/fun/truth", method: "GET", category: "games", name: "Truth", description: "Random truth question.", params: [], cacheTTL: 0,
    handler: (_r, env) => ok(env, { type: "truth", question: pick(TRUTH) }, 1) },
  { path: "/api/fun/dare", method: "GET", category: "games", name: "Dare", description: "Random dare.", params: [], cacheTTL: 0,
    handler: (_r, env) => ok(env, { type: "dare", challenge: pick(DARE) }, 1) },
  { path: "/api/fun/riddle", method: "GET", category: "games", name: "Riddle", description: "Random riddle with answer.", params: [], cacheTTL: 0,
    handler: (_r, env) => ok(env, pick(RIDDLES), 1) },
  { path: "/api/fun/wyr", method: "GET", category: "games", name: "Would You Rather", description: "Would-you-rather question.", params: [], cacheTTL: 0,
    handler: (_r, env) => ok(env, { question: pick(WYR) }, 1) },
  { path: "/api/fun/8ball", method: "GET", category: "games", name: "Magic 8-Ball", description: "Ask the 8-ball.", params: [{ name: "q", required: false, example: "Will I win?" }], cacheTTL: 0,
    handler: (_r, env, _c, url) => ok(env, { question: url.searchParams.get("q"), answer: pick(["It is certain","Without a doubt","Yes definitely","Reply hazy try again","Ask again later","Don't count on it","Outlook not so good","Very doubtful"]) }, 1) },
  { path: "/api/fun/dice", method: "GET", category: "games", name: "Roll Dice", description: "Roll N d-sided dice.", params: [{ name: "sides", required: false, example: "6" },{ name: "count", required: false, example: "2" }], cacheTTL: 0,
    handler: (_r, env, _c, url) => {
      const sides = Math.max(2, Math.min(1000, parseInt(url.searchParams.get("sides") || "6", 10)));
      const count = Math.max(1, Math.min(50, parseInt(url.searchParams.get("count") || "1", 10)));
      const rolls = Array.from({ length: count }, () => Math.floor(Math.random() * sides) + 1);
      return ok(env, { sides, count, rolls, total: rolls.reduce((a, b) => a + b, 0) }, 1);
    } },
  { path: "/api/fun/joke", method: "GET", category: "games", name: "Joke", description: "Random joke.", params: [], cacheTTL: 0,
    handler: async (_r, env) => { const t0 = Date.now(); const j: any = await getJSON("https://official-joke-api.appspot.com/random_joke"); return ok(env, j, Date.now() - t0); } },
  { path: "/api/fun/meme", method: "GET", category: "games", name: "Meme", description: "Random Reddit meme.", params: [], cacheTTL: 0,
    handler: async (_r, env) => { const t0 = Date.now(); const j: any = await getJSON("https://meme-api.com/gimme"); return ok(env, j, Date.now() - t0); } },
  { path: "/api/fun/quote", method: "GET", category: "games", name: "Quote", description: "Inspirational quote.", params: [], cacheTTL: 0,
    handler: async (_r, env) => { const t0 = Date.now(); const j: any = await getJSON("https://zenquotes.io/api/random"); return ok(env, j[0], Date.now() - t0); } },
  { path: "/api/fun/advice", method: "GET", category: "games", name: "Advice", description: "Random advice.", params: [], cacheTTL: 0,
    handler: async (_r, env) => { const t0 = Date.now(); const j: any = await getJSON("https://api.adviceslip.com/advice"); return ok(env, j.slip, Date.now() - t0); } },
  { path: "/api/fun/fact", method: "GET", category: "games", name: "Useless Fact", description: "Random useless fact.", params: [], cacheTTL: 0,
    handler: async (_r, env) => { const t0 = Date.now(); const j: any = await getJSON("https://uselessfacts.jsph.pl/api/v2/facts/random?language=en"); return ok(env, j, Date.now() - t0); } },
  { path: "/api/fun/cat", method: "GET", category: "games", name: "Random Cat", description: "Random cat image.", params: [], cacheTTL: 0,
    handler: async (_r, env) => { const t0 = Date.now(); const j: any = await getJSON("https://api.thecatapi.com/v1/images/search"); return ok(env, j[0], Date.now() - t0); } },
  { path: "/api/fun/dog", method: "GET", category: "games", name: "Random Dog", description: "Random dog image.", params: [], cacheTTL: 0,
    handler: async (_r, env) => { const t0 = Date.now(); const j: any = await getJSON("https://dog.ceo/api/breeds/image/random"); return ok(env, j, Date.now() - t0); } },
];
