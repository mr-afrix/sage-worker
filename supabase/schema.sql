create extension if not exists "pgcrypto";

create table if not exists public.request_logs (
  id           bigserial primary key,
  created_at   timestamptz not null default now(),
  path         text        not null,
  category     text        not null,
  endpoint     text        not null,
  status       int         not null,
  took_ms      int         not null,
  ip           text,
  ua           text,
  cache_hit    boolean     not null default false,
  country      text
);

create index if not exists request_logs_created_idx on public.request_logs (created_at desc);
create index if not exists request_logs_path_idx    on public.request_logs (path);
create index if not exists request_logs_category_idx on public.request_logs (category);

-- Aggregated stats per endpoint (refreshable view)
create or replace view public.endpoint_stats as
select
  path,
  category,
  endpoint,
  count(*)                          as total_requests,
  count(*) filter (where status < 400) as successes,
  count(*) filter (where status >= 400) as errors,
  avg(took_ms)::int                  as avg_ms,
  percentile_cont(0.95) within group (order by took_ms)::int as p95_ms,
  max(created_at)                    as last_seen
from public.request_logs
group by 1,2,3;

-- Optional uptime ping table (worker can write here from a cron trigger later)
create table if not exists public.status_history (
  id          bigserial primary key,
  checked_at  timestamptz not null default now(),
  endpoint    text        not null,
  ok          boolean     not null,
  ms          int
);

-- RLS: writes happen with the service-role key from the Worker, so RLS is fine.
alter table public.request_logs enable row level security;
alter table public.status_history enable row level security;

-- Allow public read of aggregate view via PostgREST (read-only)
grant select on public.endpoint_stats to anon, authenticated;
