"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import PosterCard from "@/components/PosterCard";
import { useLibrary } from "@/lib/useLibrary";
import type { LibraryItem } from "@/lib/types";

export default function MoviesPage() {
  const router = useRouter();
  const { items, watched, loading, removeFromLibrary } = useLibrary("movie");

  const upcoming = useMemo(() => items.filter((i) => i.status === "upcoming"), [items]);
  const toWatch = useMemo(() => items.filter((i) => i.status === "watchlist"), [items]);
  const seen = useMemo(() => items.filter((i) => i.status === "watched"), [items]);

  function isWatched(tmdbId: number) {
    return watched.some((w) => w.tmdb_id === tmdbId);
  }

  async function handleRemove(tmdbId: number, title: string) {
    if (window.confirm(`Remove "${title}" from your movies?`)) {
      await removeFromLibrary(tmdbId);
    }
  }

  return (
    <div className="flex flex-col gap-10">
      <header>
        <h1 className="font-display text-2xl">Movies</h1>
      </header>

      {loading ? (
        <p className="text-muted">Loading your movies…</p>
      ) : items.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          {upcoming.length > 0 && (
            <Section
              title="Upcoming"
              items={upcoming}
              isWatched={isWatched}
              onView={(id) => router.push(`/title/movie/${id}`)}
              onRemove={handleRemove}
            />
          )}
          <Section
            title="Watchlist"
            items={toWatch}
            isWatched={isWatched}
            onView={(id) => router.push(`/title/movie/${id}`)}
            onRemove={handleRemove}
          />
          <Section
            title="Watched"
            items={seen}
            isWatched={isWatched}
            onView={(id) => router.push(`/title/movie/${id}`)}
            onRemove={handleRemove}
          />
        </>
      )}
    </div>
  );
}

function Section({
  title,
  items,
  isWatched,
  onView,
  onRemove,
}: {
  title: string;
  items: LibraryItem[];
  isWatched: (id: number) => boolean;
  onView: (tmdbId: number) => void;
  onRemove: (tmdbId: number, title: string) => void;
}) {
  if (items.length === 0) return null;
  return (
    <section>
      <h2 className="mb-3 font-display text-lg text-muted">{title}</h2>
      <div className="grid grid-cols-3 gap-4 sm:grid-cols-4 md:grid-cols-6">
        {items.map((movie) => (
          <PosterCard
            key={movie.id}
            title={movie.title}
            posterPath={movie.poster_path}
            progress={isWatched(movie.tmdb_id) ? 1 : 0}
            accent="movie"
            onClick={() => onView(movie.tmdb_id)}
            onRemove={() => onRemove(movie.tmdb_id, movie.title)}
          />
        ))}
      </div>
    </section>
  );
}

function EmptyState() {
  return (
    <div className="rounded-card border border-dashed border-surface2 px-6 py-16 text-center">
      <p className="font-display text-lg text-ink">No movies tracked yet</p>
      <p className="mt-2 text-sm text-muted">
        Head to Discover to find a movie and add it to your watchlist.
      </p>
    </div>
  );
}
