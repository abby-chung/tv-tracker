import { ANIMATION_GENRE_ID } from "@/lib/constants";
import type { LibraryItem, LibraryStatus, WatchedEpisode } from "@/lib/types";

export const SHOW_FILTERS: { key: LibraryStatus | "all"; label: string }[] = [
  { key: "all", label: "All" },
  { key: "watching", label: "Watching" },
  { key: "watchlist", label: "Watchlist" },
  { key: "watched", label: "Watched" },
];

export const MOVIE_FILTERS: { key: LibraryStatus | "all"; label: string }[] = [
  { key: "all", label: "All" },
  { key: "upcoming", label: "Upcoming" },
  { key: "watchlist", label: "Watchlist" },
  { key: "watched", label: "Watched" },
];

export function isAnimation(item: LibraryItem): boolean {
  return (item.genre_ids ?? []).includes(ANIMATION_GENRE_ID);
}

/**
 * Fraction (0–1) of a TV show watched so far. Explicitly-marked "watched"
 * always reports full. Falls back to a capped estimate for older items
 * added before total_episodes was stored.
 */
export function showProgressFor(item: LibraryItem, watched: WatchedEpisode[]): number {
  if (item.status === "watched") return 1;
  const watchedCount = watched.filter((w) => w.tmdb_id === item.tmdb_id).length;
  if (watchedCount === 0) return 0;
  if (item.total_episodes && item.total_episodes > 0) {
    return Math.min(0.99, watchedCount / item.total_episodes);
  }
  return Math.min(0.99, watchedCount / Math.max(watchedCount + 1, 10));
}
