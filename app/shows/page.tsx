"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import PosterCard from "@/components/PosterCard";
import { useLibrary } from "@/lib/useLibrary";
import type { LibraryStatus } from "@/lib/types";

const FILTERS: { key: LibraryStatus | "all"; label: string }[] = [
  { key: "all", label: "All" },
  { key: "watching", label: "Watching" },
  { key: "watchlist", label: "Watchlist" },
  { key: "watched", label: "Watched" },
];

export default function ShowsPage() {
  const router = useRouter();
  const { items, watched, loading, removeFromLibrary } = useLibrary("tv");
  const [filter, setFilter] = useState<LibraryStatus | "all">("all");

  const filtered = useMemo(
    () => (filter === "all" ? items : items.filter((i) => i.status === filter)),
    [items, filter]
  );

  function progressFor(tmdbId: number) {
    const count = watched.filter((w) => w.tmdb_id === tmdbId).length;
    // Without full season/episode counts from TMDB cached locally, show
    // watched-episode count as a soft progress indicator capped at 1.
    return Math.min(1, count / 10);
  }

  async function handleRemove(tmdbId: number, title: string) {
    if (window.confirm(`Remove "${title}" from your shows? This also clears its watch history.`)) {
      await removeFromLibrary(tmdbId);
    }
  }

  return (
    <div>
      <header className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-2xl">Shows</h1>
      </header>

      <div className="mb-6 flex gap-2 overflow-x-auto scrollbar-thin">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`focus-ring shrink-0 rounded-full px-4 py-1.5 text-sm transition-colors ${
              filter === f.key
                ? "bg-glow text-base"
                : "border border-surface2 text-muted hover:text-ink"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-muted">Loading your shows…</p>
      ) : filtered.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="grid grid-cols-3 gap-4 sm:grid-cols-4 md:grid-cols-6">
          {filtered.map((show) => (
            <PosterCard
              key={show.id}
              title={show.title}
              posterPath={show.poster_path}
              progress={progressFor(show.tmdb_id)}
              subtitle={show.status}
              onClick={() => router.push(`/title/tv/${show.tmdb_id}`)}
              onRemove={() => handleRemove(show.tmdb_id, show.title)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-card border border-dashed border-surface2 px-6 py-16 text-center">
      <p className="font-display text-lg text-ink">Nothing here yet</p>
      <p className="mt-2 text-sm text-muted">
        Head to Discover to find a show and add it to your watchlist.
      </p>
    </div>
  );
}
