"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
  // Memoize the client so it's created once, not on every render.
  // Without this, `supabase` ending up in `refresh`'s dep array would
  // recreate the callback on every render, re-triggering the useEffect.
  const supabase = useMemo(() => createClient(), []);

  // Cache the authenticated user ID so mutations don't each make a
  // separate auth.getUser() round-trip.
  const userIdRef = useRef<string | null>(null);

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

    // Ensure we have the user ID cached for subsequent mutations.
    if (!userIdRef.current) {
      const { data } = await supabase.auth.getUser();
      userIdRef.current = data.user?.id ?? null;
    }

    const [{ data: libraryData, error: libErr }, { data: watchedData, error: watchErr }] =
      await Promise.all([
        supabase
          .from("library_items")
          .select("*")
          .eq("media_type", mediaType)
          .order("added_at", { ascending: false }),
        supabase.from("watched_episodes").select("*").eq("media_type", mediaType),
      ]);

    if (libErr) console.error("Failed to load library:", libErr.message);
    if (watchErr) console.error("Failed to load watch history:", watchErr.message);

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
    total_episodes?: number | null;
  }) {
    if (DEMO_MODE) return;
    const userId = userIdRef.current;
    if (!userId) return;

    // Optimistic update — add to local items immediately
    const optimisticItem: LibraryItem = {
      id: `optimistic-${item.tmdb_id}`,
      user_id: userId,
      tmdb_id: item.tmdb_id,
      media_type: mediaType,
      title: item.title,
      poster_path: item.poster_path,
      status: item.status ?? "watchlist",
      is_favorite: false,
      genre_ids: item.genre_ids ?? [],
      total_episodes: item.total_episodes ?? null,
      added_at: new Date().toISOString(),
    };
    setItems((prev) => {
      const exists = prev.some((i) => i.tmdb_id === item.tmdb_id);
      return exists ? prev : [optimisticItem, ...prev];
    });

    const { error } = await supabase.from("library_items").upsert(
      {
        user_id: userId,
        tmdb_id: item.tmdb_id,
        media_type: mediaType,
        title: item.title,
        poster_path: item.poster_path,
        status: item.status ?? "watchlist",
        genre_ids: item.genre_ids ?? [],
        total_episodes: item.total_episodes ?? null,
      },
      { onConflict: "user_id,tmdb_id,media_type" }
    );
    if (error) console.error("Failed to add to library:", error.message);
    await refresh();
  }

  async function markEpisodeWatched(params: {
    tmdb_id: number;
    season_number?: number | null;
    episode_number?: number | null;
    runtime_minutes: number;
  }) {
    if (DEMO_MODE) return;
    const userId = userIdRef.current;
    if (!userId) return;

    // Optimistic update
    const optimisticRow: WatchedEpisode = {
      id: `optimistic-${params.tmdb_id}-${params.season_number ?? "null"}-${params.episode_number ?? "null"}`,
      user_id: userId,
      tmdb_id: params.tmdb_id,
      media_type: mediaType,
      season_number: params.season_number ?? null,
      episode_number: params.episode_number ?? null,
      runtime_minutes: params.runtime_minutes,
      watched_at: new Date().toISOString(),
    };
    setWatched((prev) => {
      const key = (w: WatchedEpisode) =>
        `${w.tmdb_id}-${w.season_number}-${w.episode_number}`;
      const exists = prev.some((w) => key(w) === key(optimisticRow));
      return exists ? prev : [...prev, optimisticRow];
    });

    const { error } = await supabase.from("watched_episodes").upsert(
      {
        user_id: userId,
        tmdb_id: params.tmdb_id,
        media_type: mediaType,
        season_number: params.season_number ?? null,
        episode_number: params.episode_number ?? null,
        runtime_minutes: params.runtime_minutes,
      },
      { onConflict: "user_id,tmdb_id,media_type,season_number,episode_number" }
    );
    if (error) console.error("Failed to mark episode watched:", error.message);
    await refresh();
  }

  async function updateStatus(tmdbId: number, status: LibraryStatus) {
    if (DEMO_MODE) return;
    const userId = userIdRef.current;
    if (!userId) return;

    // Optimistic update
    setItems((prev) =>
      prev.map((i) => (i.tmdb_id === tmdbId ? { ...i, status } : i))
    );

    const { error } = await supabase
      .from("library_items")
      .update({ status })
      .eq("user_id", userId)
      .eq("tmdb_id", tmdbId)
      .eq("media_type", mediaType);
    if (error) console.error("Failed to update status:", error.message);
    await refresh();
  }

  async function toggleFavorite(tmdbId: number, isFavorite: boolean) {
    if (DEMO_MODE) return;
    const userId = userIdRef.current;
    if (!userId) return;

    // Optimistic update
    setItems((prev) =>
      prev.map((i) => (i.tmdb_id === tmdbId ? { ...i, is_favorite: isFavorite } : i))
    );

    const { error } = await supabase
      .from("library_items")
      .update({ is_favorite: isFavorite })
      .eq("user_id", userId)
      .eq("tmdb_id", tmdbId)
      .eq("media_type", mediaType);
    if (error) console.error("Failed to toggle favorite:", error.message);
    await refresh();
  }

  async function removeFromLibrary(tmdbId: number) {
    if (DEMO_MODE) return;
    const userId = userIdRef.current;
    if (!userId) return;

    // Optimistic update — remove from both collections immediately
    setItems((prev) => prev.filter((i) => i.tmdb_id !== tmdbId));
    setWatched((prev) => prev.filter((w) => w.tmdb_id !== tmdbId));

    const [{ error: libErr }, { error: watchErr }] = await Promise.all([
      supabase
        .from("library_items")
        .delete()
        .eq("user_id", userId)
        .eq("tmdb_id", tmdbId)
        .eq("media_type", mediaType),
      // Also clear watch history so re-adding starts fresh.
      supabase
        .from("watched_episodes")
        .delete()
        .eq("user_id", userId)
        .eq("tmdb_id", tmdbId)
        .eq("media_type", mediaType),
    ]);
    if (libErr) console.error("Failed to remove from library:", libErr.message);
    if (watchErr) console.error("Failed to clear watch history:", watchErr.message);
    await refresh();
  }

  async function unmarkEpisodeWatched(params: {
    tmdb_id: number;
    season_number?: number | null;
    episode_number?: number | null;
  }) {
    if (DEMO_MODE) return;
    const userId = userIdRef.current;
    if (!userId) return;

    // Optimistic update
    setWatched((prev) =>
      prev.filter(
        (w) =>
          !(
            w.tmdb_id === params.tmdb_id &&
            w.season_number === (params.season_number ?? null) &&
            w.episode_number === (params.episode_number ?? null)
          )
      )
    );

    let query = supabase
      .from("watched_episodes")
      .delete()
      .eq("user_id", userId)
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

    const { error } = await query;
    if (error) console.error("Failed to unmark episode:", error.message);
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
    const userId = userIdRef.current;
    if (!userId) return;

    // Optimistic update — add all episode rows to local state immediately
    const now = new Date().toISOString();
    const newRows: WatchedEpisode[] = episodes.map((ep) => ({
      id: `optimistic-${tmdbId}-${seasonNumber}-${ep.episode_number}`,
      user_id: userId,
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
      user_id: userId,
      tmdb_id: tmdbId,
      media_type: mediaType,
      season_number: seasonNumber,
      episode_number: ep.episode_number,
      runtime_minutes: ep.runtime_minutes,
    }));

    const { error } = await supabase
      .from("watched_episodes")
      .upsert(rows, { onConflict: "user_id,tmdb_id,media_type,season_number,episode_number" });
    if (error) console.error("Failed to mark season watched:", error.message);

    await refresh();
  }

  /**
   * Bulk-delete every watched record for a season in a single delete, then
   * refresh once.
   */
  async function unmarkSeasonWatched(tmdbId: number, seasonNumber: number) {
    if (DEMO_MODE) return;
    const userId = userIdRef.current;
    if (!userId) return;

    // Optimistic update — remove all episode rows for this season immediately
    setWatched((prev) =>
      prev.filter((w) => !(w.tmdb_id === tmdbId && w.season_number === seasonNumber))
    );

    const { error } = await supabase
      .from("watched_episodes")
      .delete()
      .eq("user_id", userId)
      .eq("tmdb_id", tmdbId)
      .eq("media_type", mediaType)
      .eq("season_number", seasonNumber);
    if (error) console.error("Failed to unmark season watched:", error.message);

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
