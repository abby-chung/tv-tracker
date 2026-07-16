-- WatchReel database schema
-- Run this in Supabase: Dashboard > SQL Editor > New query > paste > Run

-- One row per show or movie a user has added to their library
create table if not exists library_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  tmdb_id integer not null,
  media_type text not null check (media_type in ('tv', 'movie')),
  title text not null,
  poster_path text,
  status text not null default 'watchlist' check (status in ('watchlist', 'watching', 'watched', 'upcoming')),
  is_favorite boolean not null default false,
  genre_ids integer[] not null default '{}',
  total_episodes integer,          -- null until known; populated when a TV show is added
  added_at timestamptz not null default now(),
  unique (user_id, tmdb_id, media_type)
);

-- If you already ran this schema before the favorites feature, apply this
-- migration once instead of recreating the table:
-- alter table library_items add column if not exists is_favorite boolean not null default false;

-- If you already ran this schema before the genre-stats feature, apply this
-- migration once instead of recreating the table:
-- alter table library_items add column if not exists genre_ids integer[] not null default '{}';

-- If you already ran this schema before the total-episodes feature, apply this
-- migration once instead of recreating the table:
-- alter table library_items add column if not exists total_episodes integer;

-- One row per episode a user has marked watched (movies use a single implicit "episode")
create table if not exists watched_episodes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  tmdb_id integer not null,        -- the show's tmdb id (or movie's tmdb id)
  media_type text not null check (media_type in ('tv', 'movie')),
  season_number integer,           -- null for movies
  episode_number integer,          -- null for movies
  runtime_minutes integer not null default 0,
  watched_at timestamptz not null default now(),
  unique (user_id, tmdb_id, media_type, season_number, episode_number)
);

-- Row-level security: every user can only see/edit their own rows
alter table library_items enable row level security;
alter table watched_episodes enable row level security;

create policy "Users manage their own library items"
  on library_items for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users manage their own watched episodes"
  on watched_episodes for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists idx_library_items_user on library_items(user_id);
create index if not exists idx_watched_episodes_user on watched_episodes(user_id);

-- ─── Lists ────────────────────────────────────────────────────────────────────

-- A user-created named list (e.g. "Want to watch with Sarah")
create table if not exists lists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  created_at timestamptz not null default now()
);

-- Items inside a list — one row per title added to a list
create table if not exists list_items (
  id uuid primary key default gen_random_uuid(),
  list_id uuid references lists(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  tmdb_id integer not null,
  media_type text not null check (media_type in ('tv', 'movie')),
  title text not null,
  poster_path text,
  added_at timestamptz not null default now(),
  unique (list_id, tmdb_id, media_type)
);

alter table lists enable row level security;
alter table list_items enable row level security;

create policy "Users manage their own lists"
  on lists for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users manage their own list items"
  on list_items for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists idx_lists_user on lists(user_id);
create index if not exists idx_list_items_list on list_items(list_id);

-- ─── Profile (display name + avatar) ──────────────────────────────────────────
-- IMPORTANT: this data must NOT live in auth.users.raw_user_meta_data —
-- Supabase embeds user_metadata directly inside the session JWT, which is
-- sent as a cookie on every request. An avatar photo there quickly exceeds
-- browser/Node HTTP header size limits and breaks the app with a
-- "431 Request Header Fields Too Large" error. A normal table has no such
-- limit and is only fetched when needed.

create table if not exists profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  updated_at timestamptz not null default now()
);

alter table profiles enable row level security;

create policy "Users manage their own profile"
  on profiles for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- If you already tried the profile-picture feature before this fix, run this
-- once to remove the oversized data that got stuck in your session cookie:
-- update auth.users
-- set raw_user_meta_data = raw_user_meta_data - 'avatar_url' - 'display_name'
-- where raw_user_meta_data ? 'avatar_url';
