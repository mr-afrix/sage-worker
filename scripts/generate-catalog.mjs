// Generates a static endpoints.json (same payload as /api/endpoints)
// so your frontend can read the catalog at build time.
//   cd worker && node scripts/generate-catalog.mjs > endpoints.json
import { ALL_ENDPOINTS, CATEGORIES } from "../src/registry.ts";

const host = process.env.HOST || "api.sage.dpdns.org";
const out = {
  categories: CATEGORIES,
  endpoints: ALL_ENDPOINTS.map(e => {
    const params = new URLSearchParams();
    for (const p of e.params) if (p.required || p.example) params.set(p.name, p.example);
    const qs = params.toString();
    return {
      path: e.path, method: e.method, category: e.category,
      name: e.name, description: e.description, params: e.params,
      cacheTTL: e.cacheTTL ?? 0,
      example: `https://${host}${e.path}${qs ? "?" + qs : ""}`,
    };
  }),
};
process.stdout.write(JSON.stringify(out, null, 2));
