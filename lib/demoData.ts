import type { LibraryItem, TmdbGenre, TmdbResult, WatchedEpisode } from "./types";

// Real TMDB poster paths so the demo looks like the real thing.
// Only the CDN image loads (image.tmdb.org needs no API key) — no live
// TMDB or Supabase calls happen in demo mode.

export const DEMO_SHOWS: LibraryItem[] = [
  { id: "d1", user_id: "demo", tmdb_id: 1396, media_type: "tv", title: "Breaking Bad", poster_path: "/ggFHVNu6YYI5L9pCfOacjizRGt.jpg", status: "watching", is_favorite: true, genre_ids: [18, 80], added_at: "" },
  { id: "d2", user_id: "demo", tmdb_id: 1399, media_type: "tv", title: "Game of Thrones", poster_path: "/1XS1oqL89opfnbLl8WnZY1O1uJx.jpg", status: "watched", is_favorite: true, genre_ids: [10765, 18], added_at: "" },
  { id: "d3", user_id: "demo", tmdb_id: 66732, media_type: "tv", title: "Stranger Things", poster_path: "/49WJfeN0moxb9IPfGn8AIqMGskD.jpg", status: "watching", is_favorite: false, genre_ids: [18, 10765, 9648], added_at: "" },
  { id: "d4", user_id: "demo", tmdb_id: 60625, media_type: "tv", title: "Rick and Morty", poster_path: "/gdIrmf2DdY5mgN6ycVP0XlzKzbE.jpg", status: "watchlist", is_favorite: false, genre_ids: [16, 35, 10765], added_at: "" },
  { id: "d5", user_id: "demo", tmdb_id: 1668, media_type: "tv", title: "Friends", poster_path: "/2koX1xLkpTQM4IZebYtjot0k7Ea.jpg", status: "watched", is_favorite: false, genre_ids: [35], added_at: "" },
  { id: "d6", user_id: "demo", tmdb_id: 94997, media_type: "tv", title: "House of the Dragon", poster_path: "/z2yahl2uefxDCl0nogcRBstwruJ.jpg", status: "watchlist", is_favorite: false, genre_ids: [10765, 18], added_at: "" },
];

export const DEMO_MOVIES: LibraryItem[] = [
  { id: "m1", user_id: "demo", tmdb_id: 27205, media_type: "movie", title: "Inception", poster_path: "/9gk7adHYeDvHkCSEqAvQNLV5Uge.jpg", status: "watched", is_favorite: true, genre_ids: [28, 878, 12], added_at: "" },
  { id: "m2", user_id: "demo", tmdb_id: 155, media_type: "movie", title: "The Dark Knight", poster_path: "/qJ2tW6WMUDux911r6m7haRef0WH.jpg", status: "watched", is_favorite: false, genre_ids: [18, 28, 80, 53], added_at: "" },
  { id: "m3", user_id: "demo", tmdb_id: 603692, media_type: "movie", title: "John Wick: Chapter 4", poster_path: "/vZloFAK7NmvMGKE7VkF5UHaz0I.jpg", status: "watchlist", is_favorite: false, genre_ids: [28, 53], added_at: "" },
  { id: "m4", user_id: "demo", tmdb_id: 693134, media_type: "movie", title: "Dune: Part Two", poster_path: "/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg", status: "upcoming", is_favorite: false, genre_ids: [878, 12], added_at: "" },
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
  { id: 1396, media_type: "tv", name: "Breaking Bad", poster_path: "/ggFHVNu6YYI5L9pCfOacjizRGt.jpg", overview: "", vote_average: 8.9, genre_ids: [18, 80] },
  { id: 27205, media_type: "movie", title: "Inception", poster_path: "/9gk7adHYeDvHkCSEqAvQNLV5Uge.jpg", overview: "", vote_average: 8.4, genre_ids: [28, 878, 12] },
  { id: 94997, media_type: "tv", name: "House of the Dragon", poster_path: "/z2yahl2uefxDCl0nogcRBstwruJ.jpg", overview: "", vote_average: 8.4, genre_ids: [10765, 18] },
  { id: 603692, media_type: "movie", title: "John Wick: Chapter 4", poster_path: "/vZloFAK7NmvMGKE7VkF5UHaz0I.jpg", overview: "", vote_average: 7.9, genre_ids: [28, 53] },
  { id: 66732, media_type: "tv", name: "Stranger Things", poster_path: "/49WJfeN0moxb9IPfGn8AIqMGskD.jpg", overview: "", vote_average: 8.6, genre_ids: [18, 10765, 9648] },
  { id: 693134, media_type: "movie", title: "Dune: Part Two", poster_path: "/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg", overview: "", vote_average: 8.2, genre_ids: [878, 12] },
];

// Fallback genre id → name maps, used both in demo mode and as a safety net
// if a real TMDB call for /genre/{type}/list ever fails.
export const DEMO_GENRES: Record<"tv" | "movie", TmdbGenre[]> = {
  tv: [
    { id: 10759, name: "Action & Adventure" },
    { id: 16, name: "Animation" },
    { id: 35, name: "Comedy" },
    { id: 80, name: "Crime" },
    { id: 99, name: "Documentary" },
    { id: 18, name: "Drama" },
    { id: 10751, name: "Family" },
    { id: 10762, name: "Kids" },
    { id: 9648, name: "Mystery" },
    { id: 10763, name: "News" },
    { id: 10764, name: "Reality" },
    { id: 10765, name: "Sci-Fi & Fantasy" },
    { id: 10766, name: "Soap" },
    { id: 10767, name: "Talk" },
    { id: 10768, name: "War & Politics" },
    { id: 37, name: "Western" },
  ],
  movie: [
    { id: 28, name: "Action" },
    { id: 12, name: "Adventure" },
    { id: 16, name: "Animation" },
    { id: 35, name: "Comedy" },
    { id: 80, name: "Crime" },
    { id: 99, name: "Documentary" },
    { id: 18, name: "Drama" },
    { id: 10751, name: "Family" },
    { id: 14, name: "Fantasy" },
    { id: 36, name: "History" },
    { id: 27, name: "Horror" },
    { id: 10402, name: "Music" },
    { id: 9648, name: "Mystery" },
    { id: 10749, name: "Romance" },
    { id: 878, name: "Science Fiction" },
    { id: 10770, name: "TV Movie" },
    { id: 53, name: "Thriller" },
    { id: 10752, name: "War" },
    { id: 37, name: "Western" },
  ],
};

export const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === "true";
