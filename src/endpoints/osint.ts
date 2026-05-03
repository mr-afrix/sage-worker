import type { EndpointDef } from "../types";
import { ok, requireParam, HttpError } from "../lib/response";
import { getJSON, getText } from "../lib/fetch";

export const osintEndpoints: EndpointDef[] = [
  {
    path: "/api/stalk/github", method: "GET", category: "osint", name: "GitHub Stalker",
    description: "Look up a GitHub user profile.",
    params: [{ name: "username", required: true, example: "torvalds" }],
    cacheTTL: 600,
    handler: async (_r, env, _c, url) => {
      const t0 = Date.now();
      const u = requireParam(url, "username");
      const data = await getJSON<any>(`https://api.github.com/users/${encodeURIComponent(u)}`);
      return ok(env, data, Date.now() - t0);
    },
  },
  {
    path: "/api/stalk/instagram", method: "GET", category: "osint", name: "Instagram Stalker",
    description: "Public Instagram profile info.",
    params: [{ name: "username", required: true, example: "instagram" }],
    cacheTTL: 600,
    handler: async (_r, env, _c, url) => {
      const t0 = Date.now();
      const u = requireParam(url, "username");
      const r = await fetch(`https://www.instagram.com/api/v1/users/web_profile_info/?username=${encodeURIComponent(u)}`, {
        headers: { "x-ig-app-id": "936619743392459", "user-agent": "Mozilla/5.0" },
      });
      if (!r.ok) throw new HttpError(502, "IG upstream failed");
      const j: any = await r.json();
      const user = j.data?.user;
      if (!user) throw new HttpError(404, "User not found");
      return ok(env, {
        username: user.username, full_name: user.full_name, bio: user.biography,
        followers: user.edge_followed_by?.count, following: user.edge_follow?.count,
        posts: user.edge_owner_to_timeline_media?.count, verified: user.is_verified,
        private: user.is_private, profile_pic: user.profile_pic_url_hd,
        external_url: user.external_url, id: user.id,
      }, Date.now() - t0);
    },
  },
  {
    path: "/api/stalk/tiktok", method: "GET", category: "osint", name: "TikTok Stalker",
    description: "Public TikTok user info.",
    params: [{ name: "username", required: true, example: "tiktok" }],
    cacheTTL: 600,
    handler: async (_r, env, _c, url) => {
      const t0 = Date.now();
      const u = requireParam(url, "username");
      const j: any = await getJSON(`https://www.tikwm.com/api/user/info?unique_id=${encodeURIComponent(u)}`);
      if (j.code !== 0) throw new HttpError(404, j.msg || "Not found");
      return ok(env, j.data, Date.now() - t0);
    },
  },
  {
    path: "/api/stalk/npm", method: "GET", category: "osint", name: "NPM Package",
    description: "NPM package metadata.",
    params: [{ name: "package", required: true, example: "react" }],
    cacheTTL: 3600,
    handler: async (_r, env, _c, url) => {
      const t0 = Date.now();
      const p = requireParam(url, "package");
      const data = await getJSON(`https://registry.npmjs.org/${encodeURIComponent(p)}`);
      return ok(env, data, Date.now() - t0);
    },
  },
  {
    path: "/api/stalk/whois", method: "GET", category: "osint", name: "Whois Lookup",
    description: "Domain whois (RDAP).",
    params: [{ name: "domain", required: true, example: "google.com" }],
    cacheTTL: 86400,
    handler: async (_r, env, _c, url) => {
      const t0 = Date.now();
      const d = requireParam(url, "domain");
      const data = await getJSON(`https://rdap.org/domain/${encodeURIComponent(d)}`);
      return ok(env, data, Date.now() - t0);
    },
  },
  {
    path: "/api/stalk/ip", method: "GET", category: "osint", name: "IP Geolocation",
    description: "Geolocate an IP address.",
    params: [{ name: "ip", required: true, example: "8.8.8.8" }],
    cacheTTL: 86400,
    handler: async (_r, env, _c, url) => {
      const t0 = Date.now();
      const ip = requireParam(url, "ip");
      const data = await getJSON(`https://ipapi.co/${encodeURIComponent(ip)}/json/`);
      return ok(env, data, Date.now() - t0);
    },
  },
  {
    path: "/api/stalk/email", method: "GET", category: "osint", name: "Email Validator",
    description: "Validate an email address syntax + MX.",
    params: [{ name: "email", required: true, example: "test@gmail.com" }],
    cacheTTL: 3600,
    handler: async (_r, env, _c, url) => {
      const t0 = Date.now();
      const email = requireParam(url, "email");
      const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
      const domain = email.split("@")[1];
      let mx: any = null;
      if (valid && domain) {
        try {
          const r = await fetch(`https://dns.google/resolve?name=${encodeURIComponent(domain)}&type=MX`);
          mx = await r.json();
        } catch { /* ignore */ }
      }
      return ok(env, { email, valid_syntax: valid, domain, mx }, Date.now() - t0);
    },
  },
];
