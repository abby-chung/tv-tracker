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
  added_at timestamptz not null default now(),
  unique (user_id, tmdb_id, media_type)
);

-- If you already ran this schema before the favorites feature, apply this
-- migration once instead of recreating the table:
-- alter table library_items add column if not exists is_favorite boolean not null default false;

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

-- Custom, user-created lists (e.g. "Cozy Weekend Watches"). One row per list.
create table if not exists lists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  created_at timestamptz not null default now()
);

-- One row per title added to a custom list.
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

-- If you already ran this schema before the custom-lists feature, apply this
-- migration once instead of recreating everything:
-- create table if not exists lists ( ... ); -- see block above
-- create table if not exists list_items ( ... ); -- see block above

-- Row-level security: every user can only see/edit their own rows
alter table library_items enable row level security;
alter table watched_episodes enable row level security;
alter table lists enable row level security;
alter table list_items enable row level security;

create policy "Users manage their own library items"
  on library_items for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users manage their own watched episodes"
  on watched_episodes for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users manage their own lists"
  on lists for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users manage their own list items"
  on list_items for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists idx_library_items_user on library_items(user_id);
create index if not exists idx_watched_episodes_user on watched_episodes(user_id);
create index if not exists idx_lists_user on lists(user_id);
create index if not exists idx_list_items_list on list_items(list_id);
create index if not exists idx_list_items_user on list_items(user_id);
