export type MediaType = "tv" | "movie";

export type LibraryStatus = "watchlist" | "watching" | "watched" | "upcoming";

export interface TmdbResult {
  id: number;
  media_type?: MediaType | "person";
  title?: string; // movies
  name?: string; // tv shows
  poster_path: string | null;
  overview: string;
  vote_average: number;
  first_air_date?: string;
  release_date?: string;
  genre_ids?: number[];
}

export interface LibraryItem {
  id: string;
  user_id: string;
  tmdb_id: number;
  media_type: MediaType;
  title: string;
  poster_path: string | null;
  status: LibraryStatus;
  is_favorite: boolean;
  genre_ids?: number[]; // TMDB genre ids captured when the title was added
  total_episodes?: number | null; // total episode count for TV shows; null for movies / unknown
  added_at: string;
}

export interface WatchedEpisode {
  id: string;
  user_id: string;
  tmdb_id: number;
  media_type: MediaType;
  season_number: number | null;
  episode_number: number | null;
  runtime_minutes: number;
  watched_at: string;
}

export interface TmdbGenre {
  id: number;
  name: string;
}

export interface ListRow {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
}

export interface ListItemRow {
  id: string;
  list_id: string;
  user_id: string;
  tmdb_id: number;
  media_type: MediaType;
  title: string;
  poster_path: string | null;
  added_at: string;
}

export const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p/w342"; // re-exported from lib/constants — import from there for new code
