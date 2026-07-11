"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import PosterCard from "@/components/PosterCard";
import Input from "@/components/ui/Input";
import { Search } from "lucide-react";
import { useLibraryContext } from "@/lib/LibraryContext";
import type { TmdbResult } from "@/lib/types";

export default function DiscoverPage() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<TmdbResult[]>([]);
  const [trending, setTrending] = useState<TmdbResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());

  const { tv: tvLibrary, movie: movieLibrary } = useLibraryContext();

  function isInLibrary(item: TmdbResult): boolean {
    const mediaType = item.media_type === "movie" ? "movie" : "tv";
    const library = mediaType === "movie" ? movieLibrary : tvLibrary;
    return library.items.some((i) => i.tmdb_id === item.id) || addedIds.has(`${mediaType}-${item.id}`);
  }

  // Fetch trending TV and movies in parallel, then interleave them so the
  // grid shows a mix rather than all TV followed by all movies.
  useEffect(() => {
    Promise.all([
      fetch("/api/tmdb/discover?type=tv&mode=trending").then((r) => r.json()),
      fetch("/api/tmdb/discover?type=movie&mode=trending").then((r) => r.json()),
    ])
      .then(([tvData, movieData]) => {
        const tvResults: TmdbResult[] = (tvData.results ?? []).map((r: TmdbResult) => ({
          ...r,
          media_type: "tv" as const,
        }));
        const movieResults: TmdbResult[] = (movieData.results ?? []).map((r: TmdbResult) => ({
          ...r,
          media_type: "movie" as const,
        }));
        // Interleave: tv, movie, tv, movie…
        const interleaved: TmdbResult[] = [];
        const len = Math.max(tvResults.length, movieResults.length);
        for (let i = 0; i < len; i++) {
          if (tvResults[i]) interleaved.push(tvResults[i]);
          if (movieResults[i]) interleaved.push(movieResults[i]);
        }
        setTrending(interleaved);
      })
      .catch(() => setTrending([]));
  }, []);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setError(null);
      return;
    }
    const timeout = setTimeout(async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/tmdb/search?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        if (!res.ok) {
          setError(data.detail || data.error || "Search failed. Check your TMDB API key.");
          setResults([]);
        } else {
          setResults((data.results ?? []).filter((r: TmdbResult) => r.media_type !== "person"));
        }
      } catch {
        setError("Could not reach the search service.");
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 400);
    return () => clearTimeout(timeout);
  }, [query]);

  async function handleAdd(item: TmdbResult) {
    const mediaType = item.media_type === "movie" ? "movie" : "tv";
    const title = item.title ?? item.name ?? "Untitled";
    const library = mediaType === "movie" ? movieLibrary : tvLibrary;
    await library.addToLibrary({
      tmdb_id: item.id,
      title,
      poster_path: item.poster_path,
      genre_ids: item.genre_ids,
    });
    setAddedIds((prev) => new Set(prev).add(`${mediaType}-${item.id}`));
  }

  function handleView(item: TmdbResult) {
    const mediaType = item.media_type === "movie" ? "movie" : "tv";
    router.push(`/title/${mediaType}/${item.id}`);
  }

  const listToShow = query.trim() ? results : trending;

  return (
    <div>
      <header className="mb-6">
        <h1 className="mb-4 font-display text-display-lg">Discover</h1>
        <Input
          icon={Search}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search shows and movies…"
        />
      </header>

      {!query.trim() && (
        <h2 className="mb-3 font-display text-display-md text-ink">Trending this week</h2>
      )}

      {error && (
        <p className="mb-4 rounded-md border border-surface3 bg-surface2 px-4 py-3 text-body-sm text-ink">
          {error}
        </p>
      )}

      {loading ? (
        <p className="text-muted">Searching…</p>
      ) : listToShow.length === 0 && query.trim() && !error ? (
        <p className="text-muted">No results for &ldquo;{query}&rdquo;.</p>
      ) : (
        <div className="grid grid-cols-3 gap-4 sm:grid-cols-4 md:grid-cols-6">
          {listToShow.map((item) => {
            const mediaType = item.media_type === "movie" ? "movie" : "tv";
            const key = `${mediaType}-${item.id}`;
            return (
              <PosterCard
                key={key}
                title={item.title ?? item.name ?? "Untitled"}
                posterPath={item.poster_path}
                subtitle={mediaType === "movie" ? "Movie" : "Show"}
                onClick={() => handleView(item)}
                onAdd={isInLibrary(item) ? undefined : () => handleAdd(item)}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
