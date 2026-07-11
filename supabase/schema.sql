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
  added_at timestamptz not null default now(),
  unique (user_id, tmdb_id, media_type)
);

-- If you already ran this schema before the favorites feature, apply this
-- migration once instead of recreating the table:
-- alter table library_items add column if not exists is_favorite boolean not null default false;

-- If you already ran this schema before the genre-stats feature, apply this
-- migration once instead of recreating the table:
-- alter table library_items add column if not exists genre_ids integer[] not null default '{}';

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
