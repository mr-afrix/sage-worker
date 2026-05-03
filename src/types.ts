export interface Env {
  CACHE: KVNamespace;
  CREATOR: string;
  API_VERSION: string;
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
}

export type Handler = (
  req: Request,
  env: Env,
  ctx: ExecutionContext,
  url: URL
) => Promise<Response> | Response;

export interface EndpointDef {
  path: string;            // /api/dl/youtube
  method: "GET";
  category: string;        // downloader
  name: string;            // YouTube
  description: string;
  params: { name: string; required: boolean; example: string; description?: string }[];
  cacheTTL?: number;       // seconds
  handler: Handler;
}
