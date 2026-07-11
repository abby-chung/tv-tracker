import type { LibraryItem, ListItemRow, ListRow, TmdbResult, WatchedEpisode } from "./types";

// Real TMDB poster paths so the demo looks like the real thing.
// Only the CDN image loads (image.tmdb.org needs no API key) — no live
// TMDB or Supabase calls happen in demo mode.

export const DEMO_SHOWS: LibraryItem[] = [
  { id: "d1", user_id: "demo", tmdb_id: 1396, media_type: "tv", title: "Breaking Bad", poster_path: "/ggFHVNu6YYI5L9pCfOacjizRGt.jpg", status: "watching", is_favorite: true, added_at: "" },
  { id: "d2", user_id: "demo", tmdb_id: 1399, media_type: "tv", title: "Game of Thrones", poster_path: "/1XS1oqL89opfnbLl8WnZY1O1uJx.jpg", status: "watched", is_favorite: true, added_at: "" },
  { id: "d3", user_id: "demo", tmdb_id: 66732, media_type: "tv", title: "Stranger Things", poster_path: "/49WJfeN0moxb9IPfGn8AIqMGskD.jpg", status: "watching", is_favorite: false, added_at: "" },
  { id: "d4", user_id: "demo", tmdb_id: 60625, media_type: "tv", title: "Rick and Morty", poster_path: "/gdIrmf2DdY5mgN6ycVP0XlzKzbE.jpg", status: "watchlist", is_favorite: false, added_at: "" },
  { id: "d5", user_id: "demo", tmdb_id: 1668, media_type: "tv", title: "Friends", poster_path: "/2koX1xLkpTQM4IZebYtjot0k7Ea.jpg", status: "watched", is_favorite: false, added_at: "" },
  { id: "d6", user_id: "demo", tmdb_id: 94997, media_type: "tv", title: "House of the Dragon", poster_path: "/z2yahl2uefxDCl0nogcRBstwruJ.jpg", status: "watchlist", is_favorite: false, added_at: "" },
];

export const DEMO_MOVIES: LibraryItem[] = [
  { id: "m1", user_id: "demo", tmdb_id: 27205, media_type: "movie", title: "Inception", poster_path: "/9gk7adHYeDvHkCSEqAvQNLV5Uge.jpg", status: "watched", is_favorite: true, added_at: "" },
  { id: "m2", user_id: "demo", tmdb_id: 155, media_type: "movie", title: "The Dark Knight", poster_path: "/qJ2tW6WMUDux911r6m7haRef0WH.jpg", status: "watched", is_favorite: false, added_at: "" },
  { id: "m3", user_id: "demo", tmdb_id: 603692, media_type: "movie", title: "John Wick: Chapter 4", poster_path: "/vZloFAK7NmvMGKE7VkF5UHaz0I.jpg", status: "watchlist", is_favorite: false, added_at: "" },
  { id: "m4", user_id: "demo", tmdb_id: 693134, media_type: "movie", title: "Dune: Part Two", poster_path: "/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg", status: "upcoming", is_favorite: false, added_at: "" },
];

export const DEMO_TV_WATCHED: WatchedEpisode[] = Array.from({ length: 34 }).map((_, i) => ({
  id: `dw${i}`,
  user_id: "demo",
  tmdb_id: i < 20 ? 1396 : i < 30 ? 66732 : 1668,
  media_type: "tv",
  season_number: 1,
  episode_number: (i % 10) + 1,
  runtime_minutes: 48,
  watched_at: "",
}));

export const DEMO_MOVIE_WATCHED: WatchedEpisode[] = [
  { id: "dm1", user_id: "demo", tmdb_id: 27205, media_type: "movie", season_number: null, episode_number: null, runtime_minutes: 148, watched_at: "" },
  { id: "dm2", user_id: "demo", tmdb_id: 155, media_type: "movie", season_number: null, episode_number: null, runtime_minutes: 152, watched_at: "" },
];

export const DEMO_TRENDING: TmdbResult[] = [
  { id: 1396, media_type: "tv", name: "Breaking Bad", poster_path: "/ggFHVNu6YYI5L9pCfOacjizRGt.jpg", overview: "", vote_average: 8.9 },
  { id: 27205, media_type: "movie", title: "Inception", poster_path: "/9gk7adHYeDvHkCSEqAvQNLV5Uge.jpg", overview: "", vote_average: 8.4 },
  { id: 94997, media_type: "tv", name: "House of the Dragon", poster_path: "/z2yahl2uefxDCl0nogcRBstwruJ.jpg", overview: "", vote_average: 8.4 },
  { id: 603692, media_type: "movie", title: "John Wick: Chapter 4", poster_path: "/vZloFAK7NmvMGKE7VkF5UHaz0I.jpg", overview: "", vote_average: 7.9 },
  { id: 66732, media_type: "tv", name: "Stranger Things", poster_path: "/49WJfeN0moxb9IPfGn8AIqMGskD.jpg", overview: "", vote_average: 8.6 },
  { id: 693134, media_type: "movie", title: "Dune: Part Two", poster_path: "/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg", overview: "", vote_average: 8.2 },
];

// Sample custom lists, shown only in demo mode. Adding/removing titles from
// these doesn't persist — see the DEMO_MODE short-circuits in useLists.ts.
export const DEMO_LISTS: ListRow[] = [
  { id: "l1", user_id: "demo", name: "Cozy Weekend Watches", created_at: "" },
  { id: "l2", user_id: "demo", name: "Sci-Fi Favorites", created_at: "" },
];

export const DEMO_LIST_ITEMS: ListItemRow[] = [
  { id: "li1", list_id: "l1", user_id: "demo", tmdb_id: 1668, media_type: "tv", title: "Friends", poster_path: "/2koX1xLkpTQM4IZebYtjot0k7Ea.jpg", added_at: "" },
  { id: "li2", list_id: "l2", user_id: "demo", tmdb_id: 27205, media_type: "movie", title: "Inception", poster_path: "/9gk7adHYeDvHkCSEqAvQNLV5Uge.jpg", added_at: "" },
  { id: "li3", list_id: "l2", user_id: "demo", tmdb_id: 66732, media_type: "tv", title: "Stranger Things", poster_path: "/49WJfeN0moxb9IPfGn8AIqMGskD.jpg", added_at: "" },
];

export const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === "true";
