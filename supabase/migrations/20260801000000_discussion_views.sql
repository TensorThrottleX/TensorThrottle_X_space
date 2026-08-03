-- ─────────────────────────────────────────────────────────────────────────────
-- DISCUSSION VIEWS — real engagement metric for the Feed Command Center.
--
-- Design rationale:
--   * One row per (post_slug, visitor_key, view_date): counts are DAILY-UNIQUE
--     per visitor, which matches "the user has not already been counted
--     recently" and enables future weekly/monthly windows via date-range
--     queries on the SAME table — no redesign for time-based uniqueness.
--   * `visitor_key` carries the browser fingerprint for anonymous users today
--     and a user_id for authenticated users later — one column, both cases,
--     no schema change when auth arrives.
--   * Purely additive: no existing table is touched; everything else in the
--     app is backward compatible and fail-soft if this table is absent.
--
-- Apply: run this once in the Supabase SQL editor (or via migration tooling).
-- Until it runs, view counts read 0 and recording no-ops (graceful).
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists public.discussion_views (
  id          uuid primary key default gen_random_uuid(),
  post_slug   text not null,
  visitor_key text not null,
  view_date   date not null,
  created_at  timestamptz not null default now()
);

-- Server-side daily dedup: at most one counted view per post per visitor per day.
create unique index if not exists discussion_views_daily_unique
  on public.discussion_views (post_slug, visitor_key, view_date);

-- Popular posts are read far more often than written; index for count queries.
create index if not exists discussion_views_post_idx
  on public.discussion_views (post_slug);

-- Mirrors the anonymous-key access the rest of the app uses (comments, likes).
-- Permissive policies keep behavior identical to tables with RLS disabled,
-- while still being production-safe by default.
alter table public.discussion_views enable row level security;

create policy "discussion_views_anon_insert"
  on public.discussion_views for insert to anon with check (true);

create policy "discussion_views_anon_select"
  on public.discussion_views for select to anon using (true);
