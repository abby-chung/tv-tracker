"use client";

/**
 * LibraryContext lifts the two useLibrary instances (tv + movie) and the
 * useLists instance out of individual pages and into the layout tree.
 *
 * Benefits:
 * - Profile, Stats, Discover, and Title Detail all reuse the same data —
 *   no duplicate DB fetches when navigating between those pages.
 * - A single refresh() call updates every consumer at once.
 */

import { createContext, useContext, type ReactNode } from "react";
import { useLibrary } from "@/lib/useLibrary";
import { useLists } from "@/lib/useLists";
import type { MediaType } from "@/lib/types";

type LibraryHook = ReturnType<typeof useLibrary>;
type ListsHook = ReturnType<typeof useLists>;

interface LibraryContextValue {
  tv: LibraryHook;
  movie: LibraryHook;
  lists: ListsHook;
}

const LibraryContext = createContext<LibraryContextValue | null>(null);

export function LibraryProvider({ children }: { children: ReactNode }) {
  const tv = useLibrary("tv");
  const movie = useLibrary("movie");
  const lists = useLists();

  return (
    <LibraryContext.Provider value={{ tv, movie, lists }}>
      {children}
    </LibraryContext.Provider>
  );
}

/** Returns the full context. Use the typed helpers below when possible. */
export function useLibraryContext(): LibraryContextValue {
  const ctx = useContext(LibraryContext);
  if (!ctx) throw new Error("useLibraryContext must be used inside <LibraryProvider>");
  return ctx;
}

/** Convenience hook — same API as the old useLibrary(mediaType) call. */
export function useLibraryFor(mediaType: MediaType): LibraryHook {
  const { tv, movie } = useLibraryContext();
  return mediaType === "tv" ? tv : movie;
}

/** Convenience hook — same API as the old useLists() call. */
export function useListsContext(): ListsHook {
  return useLibraryContext().lists;
}
