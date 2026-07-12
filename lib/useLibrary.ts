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

  /** Returns the user ID, fetching it from Supabase on first call. */
  async function getUserId(): Promise<string | null> {
    if (!userIdRef.current) {
      const { data } = await supabase.auth.getUser();
      userIdRef.current = data.user?.id ?? null;
    }
    return userIdRef.current;
  }

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
    await getUserId();

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

  // Only fetch on mount. Every mutation below applies an optimistic local
  // update and then writes to Supabase — since the write mirrors exactly
  // what the optimistic update already did, there's no need to re-fetch the
  // whole library afterward (that used to cost 2 extra queries per click).
  // If a write fails, the error is logged and the optimistic state may
  // drift from the server until the next full refresh (e.g. next page load).
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
    const userId = await getUserId();
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
  }

  async function markEpisodeWatched(params: {
    tmdb_id: number;
    season_number?: number | null;
    episode_number?: number | null;
    runtime_minutes: number;
  }) {
    if (DEMO_MODE) return;
    const userId = await getUserId();
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
  }

  /**
   * Bulk-mark episodes across one or more seasons of the same show in a
   * single upsert. Used for "mark whole show watched" so a multi-season
   * show costs one write instead of one per season.
   */
  async function markEpisodesWatched(
    tmdbId: number,
    entries: { season_number: number; episode_number: number; runtime_minutes: number }[]
  ) {
    if (DEMO_MODE || entries.length === 0) return;
    const userId = await getUserId();
    if (!userId) return;

    const now = new Date().toISOString();
    const newRows: WatchedEpisode[] = entries.map((e) => ({
      id: `optimistic-${tmdbId}-${e.season_number}-${e.episode_number}`,
      user_id: userId,
      tmdb_id: tmdbId,
      media_type: mediaType,
      season_number: e.season_number,
      episode_number: e.episode_number,
      runtime_minutes: e.runtime_minutes,
      watched_at: now,
    }));

    // Optimistic update — replace any existing rows for these episodes,
    // then add the full new set in one state update.
    setWatched((prev) => {
      const key = (w: { tmdb_id: number; season_number: number | null; episode_number: number | null }) =>
        `${w.tmdb_id}-${w.season_number}-${w.episode_number}`;
      const newKeys = new Set(newRows.map(key));
      const filtered = prev.filter((w) => w.tmdb_id !== tmdbId || !newKeys.has(key(w)));
      return [...filtered, ...newRows];
    });

    const rows = entries.map((e) => ({
      user_id: userId,
      tmdb_id: tmdbId,
      media_type: mediaType,
      season_number: e.season_number,
      episode_number: e.episode_number,
      runtime_minutes: e.runtime_minutes,
    }));

    const { error } = await supabase
      .from("watched_episodes")
      .upsert(rows, { onConflict: "user_id,tmdb_id,media_type,season_number,episode_number" });
    if (error) console.error("Failed to mark episodes watched:", error.message);
  }

  /** Removes every watched row for a show in one delete — the unmark side of markEpisodesWatched. */
  async function unmarkShowWatched(tmdbId: number) {
    if (DEMO_MODE) return;
    const userId = await getUserId();
    if (!userId) return;

    setWatched((prev) => prev.filter((w) => w.tmdb_id !== tmdbId));

    const { error } = await supabase
      .from("watched_episodes")
      .delete()
      .eq("user_id", userId)
      .eq("tmdb_id", tmdbId)
      .eq("media_type", mediaType);
    if (error) console.error("Failed to unmark show watched:", error.message);
  }

  async function updateStatus(tmdbId: number, status: LibraryStatus) {
    if (DEMO_MODE) return;
    const userId = await getUserId();
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
  }

  async function toggleFavorite(tmdbId: number, isFavorite: boolean) {
    if (DEMO_MODE) return;
    const userId = await getUserId();
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
  }

  async function removeFromLibrary(tmdbId: number) {
    if (DEMO_MODE) return;
    const userId = await getUserId();
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
  }

  async function unmarkEpisodeWatched(params: {
    tmdb_id: number;
    season_number?: number | null;
    episode_number?: number | null;
  }) {
    if (DEMO_MODE) return;
    const userId = await getUserId();
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
  }

  /**
   * Bulk-mark every episode in a season in a single upsert, replacing the
   * N sequential per-episode round-trips the naive approach would take.
   */
  async function markSeasonWatched(
    tmdbId: number,
    seasonNumber: number,
    episodes: { episode_number: number; runtime_minutes: number }[]
  ) {
    if (DEMO_MODE) return;
    const userId = await getUserId();
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
  }

  /**
   * Bulk-delete every watched record for a season in a single delete.
   */
  async function unmarkSeasonWatched(tmdbId: number, seasonNumber: number) {
    if (DEMO_MODE) return;
    const userId = await getUserId();
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
  }

  return {
    items,
    watched,
    loading,
    addToLibrary,
    markEpisodeWatched,
    markEpisodesWatched,
    unmarkEpisodeWatched,
    unmarkShowWatched,
    markSeasonWatched,
    unmarkSeasonWatched,
    updateStatus,
    toggleFavorite,
    removeFromLibrary,
    refresh,
  };
}
