import type { EndpointDef } from "./types";
import { aiEndpoints } from "./endpoints/ai";
import { downloaderEndpoints } from "./endpoints/downloader";
import { animeEndpoints } from "./endpoints/anime";
import { osintEndpoints } from "./endpoints/osint";
import { toolsEndpoints } from "./endpoints/tools";
import { gamesEndpoints } from "./endpoints/games";
import { musicEndpoints } from "./endpoints/music";
import { newsEndpoints } from "./endpoints/news";
import { imageEndpoints } from "./endpoints/image";
import { randomEndpoints } from "./endpoints/random";

export const ALL_ENDPOINTS: EndpointDef[] = [
  ...aiEndpoints,
  ...downloaderEndpoints,
  ...animeEndpoints,
  ...osintEndpoints,
  ...toolsEndpoints,
  ...gamesEndpoints,
  ...musicEndpoints,
  ...newsEndpoints,
  ...imageEndpoints,
  ...randomEndpoints,
];

export const CATEGORIES = [
  { id: "ai",         name: "Artificial Intelligence", emoji: "🤖", color: "#7c3aed", description: "Chat, image gen, translate." },
  { id: "downloader", name: "Media Downloaders",        emoji: "⬇️", color: "#06b6d4", description: "YouTube, TikTok, IG, Spotify, Twitter, FB, more." },
  { id: "anime",      name: "Anime & Manga",            emoji: "🎌", color: "#ec4899", description: "Search, top, characters, SFW pics." },
  { id: "osint",      name: "OSINT & Stalker",          emoji: "🔍", color: "#f59e0b", description: "GitHub, IG, TikTok, npm, whois, IP, email." },
  { id: "tools",      name: "Tools & Utilities",        emoji: "🛠️", color: "#10b981", description: "QR, shortener, screenshot, weather, hash, password." },
  { id: "games",      name: "Games & Fun",              emoji: "🎮", color: "#ef4444", description: "Truth/dare, jokes, memes, dice, riddles." },
  { id: "music",      name: "Music & Lyrics",           emoji: "🎵", color: "#8b5cf6", description: "Lyrics, Spotify/iTunes/Deezer search." },
  { id: "news",       name: "News & Info",              emoji: "📰", color: "#3b82f6", description: "Wikipedia, dictionary, currency, crypto, headlines." },
  { id: "image",      name: "Image Tools",              emoji: "🖼️", color: "#14b8a6", description: "Unsplash, Picsum, avatars, flags, placeholders." },
  { id: "random",     name: "Random / Misc",            emoji: "🎲", color: "#f97316", description: "Random user, number, word, activity, coin flip." },
];
