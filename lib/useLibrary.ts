"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { LibraryItem, LibraryStatus, MediaType, WatchedEpisode } from "@/lib/types";
import {
  DEMO_MODE,
  DEMO_SHOWS,
  DEMO_MOVIES,
  DEMO_TV_WATCHED,
  DEMO_MOVIE_WATCHED,
} from "@/lib/demoData";

export function useLibrary(mediaType: MediaType) {
  const supabase = createClient();
  const [items, setItems] = useState<LibraryItem[]>(
    DEMO_MODE ? (mediaType === "tv" ? DEMO_SHOWS : DEMO_MOVIES) : []
  );
  const [watched, setWatched] = useState<WatchedEpisode[]>(
    DEMO_MODE ? (mediaType === "tv" ? DEMO_TV_WATCHED : DEMO_MOVIE_WATCHED) : []
  );
  const [loading, setLoading] = useState(!DEMO_MODE);

  const refresh = useCallback(async () => {
    if (DEMO_MODE) return; // demo data is static, nothing to fetch
    setLoading(true);
    const { data: libraryData } = await supabase
      .from("library_items")
      .select("*")
      .eq("media_type", mediaType)
      .order("added_at", { ascending: false });

    const { data: watchedData } = await supabase
      .from("watched_episodes")
      .select("*")
      .eq("media_type", mediaType);

    setItems(libraryData ?? []);
    setWatched(watchedData ?? []);
    setLoading(false);
  }, [mediaType, supabase]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function addToLibrary(item: {
    tmdb_id: number;
    title: string;
    poster_path: string | null;
    status?: LibraryStatus;
    genre_ids?: number[];
  }) {
    if (DEMO_MODE) return; // preview mode doesn't persist changes
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return;

    await supabase.from("library_items").upsert(
      {
        user_id: userData.user.id,
        tmdb_id: item.tmdb_id,
        media_type: mediaType,
        title: item.title,
        poster_path: item.poster_path,
        status: item.status ?? "watchlist",
        genre_ids: item.genre_ids ?? [],
      },
      { onConflict: "user_id,tmdb_id,media_type" }
    );
    await refresh();
  }

  async function markEpisodeWatched(params: {
    tmdb_id: number;
    season_number?: number | null;
    episode_number?: number | null;
    runtime_minutes: number;
  }) {
    if (DEMO_MODE) return; // preview mode doesn't persist changes
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return;

    await supabase.from("watched_episodes").upsert(
      {
        user_id: userData.user.id,
        tmdb_id: params.tmdb_id,
        media_type: mediaType,
        season_number: params.season_number ?? null,
        episode_number: params.episode_number ?? null,
        runtime_minutes: params.runtime_minutes,
      },
      { onConflict: "user_id,tmdb_id,media_type,season_number,episode_number" }
    );
    await refresh();
  }

  async function updateStatus(tmdbId: number, status: LibraryStatus) {
    if (DEMO_MODE) return; // preview mode doesn't persist changes
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return;

    await supabase
      .from("library_items")
      .update({ status })
      .eq("user_id", userData.user.id)
      .eq("tmdb_id", tmdbId)
      .eq("media_type", mediaType);
    await refresh();
  }

  async function toggleFavorite(tmdbId: number, isFavorite: boolean) {
    if (DEMO_MODE) return; // preview mode doesn't persist changes
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return;

    await supabase
      .from("library_items")
      .update({ is_favorite: isFavorite })
      .eq("user_id", userData.user.id)
      .eq("tmdb_id", tmdbId)
      .eq("media_type", mediaType);
    await refresh();
  }

  async function removeFromLibrary(tmdbId: number) {
    if (DEMO_MODE) return; // preview mode doesn't persist changes
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return;

    await supabase
      .from("library_items")
      .delete()
      .eq("user_id", userData.user.id)
      .eq("tmdb_id", tmdbId)
      .eq("media_type", mediaType);

    // Also clear watch history for this title so re-adding starts fresh.
    await supabase
      .from("watched_episodes")
      .delete()
      .eq("user_id", userData.user.id)
      .eq("tmdb_id", tmdbId)
      .eq("media_type", mediaType);

    await refresh();
  }

  async function unmarkEpisodeWatched(params: {
    tmdb_id: number;
    season_number?: number | null;
    episode_number?: number | null;
  }) {
    if (DEMO_MODE) return; // preview mode doesn't persist changes
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return;

    let query = supabase
      .from("watched_episodes")
      .delete()
      .eq("user_id", userData.user.id)
      .eq("tmdb_id", params.tmdb_id)
      .eq("media_type", mediaType);

    query =
      params.season_number == null
        ? query.is("season_number", null)
        : query.eq("season_number", params.season_number);
    query =
      params.episode_number == null
        ? query.is("episode_number", null)
        : query.eq("episode_number", params.episode_number);

    await query;
    await refresh();
  }

  /**
   * Bulk-mark every episode in a season watched in a single upsert, then
   * refresh once. Avoids N sequential round-trips from the per-episode path.
   */
  async function markSeasonWatched(
    tmdbId: number,
    seasonNumber: number,
    episodes: { episode_number: number; runtime_minutes: number }[]
  ) {
    if (DEMO_MODE) return;
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return;

    // Optimistic update — add all episode rows to local state immediately
    const now = new Date().toISOString();
    const newRows: WatchedEpisode[] = episodes.map((ep) => ({
      id: `optimistic-${tmdbId}-${seasonNumber}-${ep.episode_number}`,
      user_id: userData.user!.id,
      tmdb_id: tmdbId,
      media_type: mediaType,
      season_number: seasonNumber,
      episode_number: ep.episode_number,
      runtime_minutes: ep.runtime_minutes,
      watched_at: now,
    }));
    setWatched((prev) => {
      // Remove any existing rows for this season first, then add all new ones
      const filtered = prev.filter(
        (w) => !(w.tmdb_id === tmdbId && w.season_number === seasonNumber)
      );
      return [...filtered, ...newRows];
    });

    const rows = episodes.map((ep) => ({
      user_id: userData.user!.id,
      tmdb_id: tmdbId,
      media_type: mediaType,
      season_number: seasonNumber,
      episode_number: ep.episode_number,
      runtime_minutes: ep.runtime_minutes,
    }));

    await supabase
      .from("watched_episodes")
      .upsert(rows, { onConflict: "user_id,tmdb_id,media_type,season_number,episode_number" });

    await refresh();
  }

  /**
   * Bulk-delete every watched record for a season in a single delete, then
   * refresh once.
   */
  async function unmarkSeasonWatched(tmdbId: number, seasonNumber: number) {
    if (DEMO_MODE) return;
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return;

    // Optimistic update — remove all episode rows for this season immediately
    setWatched((prev) =>
      prev.filter((w) => !(w.tmdb_id === tmdbId && w.season_number === seasonNumber))
    );

    await supabase
      .from("watched_episodes")
      .delete()
      .eq("user_id", userData.user.id)
      .eq("tmdb_id", tmdbId)
      .eq("media_type", mediaType)
      .eq("season_number", seasonNumber);

    await refresh();
  }

  return {
    items,
    watched,
    loading,
    addToLibrary,
    markEpisodeWatched,
    unmarkEpisodeWatched,
    markSeasonWatched,
    unmarkSeasonWatched,
    updateStatus,
    toggleFavorite,
    removeFromLibrary,
    refresh,
  };
}
