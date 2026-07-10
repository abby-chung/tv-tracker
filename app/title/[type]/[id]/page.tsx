"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { TMDB_IMAGE_BASE } from "@/lib/types";
import type { LibraryStatus } from "@/lib/types";
import { useLibrary } from "@/lib/useLibrary";

interface Season {
  id: number;
  season_number: number;
  name: string;
  episode_count: number;
}

interface Episode {
  id: number;
  episode_number: number;
  name: string;
  runtime: number | null;
  air_date: string | null;
}

interface Details {
  id: number;
  name?: string;
  title?: string;
  overview: string;
  poster_path: string | null;
  runtime?: number; // movies
  episode_run_time?: number[]; // shows, legacy field
  seasons?: Season[];
  first_air_date?: string;
  release_date?: string;
  vote_average?: number;
}

const STATUS_OPTIONS: { key: LibraryStatus; label: string }[] = [
  { key: "watchlist", label: "Watchlist" },
  { key: "watching", label: "Watching" },
  { key: "watched", label: "Watched" },
];

export default function TitleDetailPage() {
  const params = useParams<{ type: string; id: string }>();
  const router = useRouter();
  const mediaType = params.type === "movie" ? "movie" : "tv";
  const tmdbId = Number(params.id);

  const library = useLibrary(mediaType);
  const [details, setDetails] = useState<Details | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [openSeason, setOpenSeason] = useState<number | null>(null);
  const [episodesBySeason, setEpisodesBySeason] = useState<Record<number, Episode[]>>({});

  useEffect(() => {
    fetch(`/api/tmdb/details/${mediaType}/${tmdbId}`)
      .then(async (r) => {
        const data = await r.json();
        if (!r.ok) throw new Error(data.error || "Failed to load details");
        setDetails(data);
      })
      .catch((e) => setError(e.message));
  }, [mediaType, tmdbId]);

  const libraryItem = library.items.find((i) => i.tmdb_id === tmdbId);
  const isInLibrary = Boolean(libraryItem);

  async function handleAdd(status: LibraryStatus = "watchlist") {
    if (!details) return;
    await library.addToLibrary({
      tmdb_id: tmdbId,
      title: details.title ?? details.name ?? "Untitled",
      poster_path: details.poster_path,
      status,
    });
  }

  async function handleStatusChange(status: LibraryStatus) {
    await library.updateStatus(tmdbId, status);
  }

  async function handleRemove() {
    if (window.confirm("Remove this from your library? This also clears its watch history.")) {
      await library.removeFromLibrary(tmdbId);
      router.back();
    }
  }

  async function toggleSeason(seasonNumber: number) {
    if (openSeason === seasonNumber) {
      setOpenSeason(null);
      return;
    }
    setOpenSeason(seasonNumber);
    if (!episodesBySeason[seasonNumber]) {
      const res = await fetch(`/api/tmdb/season/${tmdbId}/${seasonNumber}`);
      const data = await res.json();
      setEpisodesBySeason((prev) => ({ ...prev, [seasonNumber]: data.episodes ?? [] }));
    }
  }

  function isEpisodeWatched(seasonNumber: number, episodeNumber: number) {
    return library.watched.some(
      (w) => w.tmdb_id === tmdbId && w.season_number === seasonNumber && w.episode_number === episodeNumber
    );
  }

  async function toggleEpisode(episode: Episode, seasonNumber: number) {
    if (!isInLibrary) await handleAdd("watching");
    if (isEpisodeWatched(seasonNumber, episode.episode_number)) {
      await library.unmarkEpisodeWatched({
        tmdb_id: tmdbId,
        season_number: seasonNumber,
        episode_number: episode.episode_number,
      });
    } else {
      await library.markEpisodeWatched({
        tmdb_id: tmdbId,
        season_number: seasonNumber,
        episode_number: episode.episode_number,
        runtime_minutes: episode.runtime ?? 40,
      });
    }
  }

  async function toggleMovieWatched() {
    if (!details) return;
    const watched = library.watched.some((w) => w.tmdb_id === tmdbId);
    if (!isInLibrary) await handleAdd("watched");
    if (watched) {
      await library.unmarkEpisodeWatched({ tmdb_id: tmdbId });
    } else {
      await library.markEpisodeWatched({
        tmdb_id: tmdbId,
        runtime_minutes: details.runtime ?? 100,
      });
      await library.updateStatus(tmdbId, "watched");
    }
  }

  if (error) {
    return (
      <div className="rounded-card border border-danger/40 bg-danger/10 px-6 py-8 text-center">
        <p className="text-danger">{error}</p>
        <p className="mt-2 text-sm text-muted">
          Check that TMDB_API_KEY is set correctly, then reload.
        </p>
      </div>
    );
  }

  if (!details) {
    return <p className="text-muted">Loading…</p>;
  }

  const title = details.title ?? details.name ?? "Untitled";
  const year = (details.release_date ?? details.first_air_date ?? "").slice(0, 4);
  const movieWatched = mediaType === "movie" && library.watched.some((w) => w.tmdb_id === tmdbId);

  return (
    <div className="flex flex-col gap-6">
      <button onClick={() => router.back()} className="focus-ring w-fit text-sm text-muted hover:text-ink">
        ← Back
      </button>

      <div className="flex flex-col gap-6 sm:flex-row">
        <div className="relative aspect-[2/3] w-40 shrink-0 overflow-hidden rounded-card bg-surface2 sm:w-52">
          {details.poster_path ? (
            <Image
              src={`${TMDB_IMAGE_BASE}${details.poster_path}`}
              alt={title}
              fill
              sizes="200px"
              className="object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-muted">🎞</div>
          )}
        </div>

        <div className="flex flex-1 flex-col gap-3">
          <h1 className="font-display text-2xl">
            {title} {year && <span className="text-muted">({year})</span>}
          </h1>
          {typeof details.vote_average === "number" && (
            <p className="text-sm text-glow">★ {details.vote_average.toFixed(1)}</p>
          )}
          <p className="text-sm text-muted">{details.overview}</p>

          <div className="mt-2 flex flex-wrap items-center gap-2">
            {isInLibrary ? (
              <>
                {STATUS_OPTIONS.map((opt) => (
                  <button
                    key={opt.key}
                    onClick={() => handleStatusChange(opt.key)}
                    className={`focus-ring rounded-full px-4 py-1.5 text-sm transition-colors ${
                      libraryItem?.status === opt.key
                        ? "bg-glow text-base"
                        : "border border-surface2 text-muted hover:text-ink"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
                <button
                  onClick={handleRemove}
                  className="focus-ring rounded-full border border-danger/40 px-4 py-1.5 text-sm text-danger hover:bg-danger/10"
                >
                  Remove
                </button>
              </>
            ) : (
              <button
                onClick={() => handleAdd("watchlist")}
                className="focus-ring rounded-full bg-glow px-5 py-2 text-sm font-medium text-base"
              >
                + Add to my {mediaType === "movie" ? "movies" : "shows"}
              </button>
            )}
          </div>

          {mediaType === "movie" && (
            <button
              onClick={toggleMovieWatched}
              className={`focus-ring mt-2 w-fit rounded-card border px-4 py-2 text-sm ${
                movieWatched
                  ? "border-movie bg-movie/10 text-movie"
                  : "border-surface2 text-muted hover:text-ink"
              }`}
            >
              {movieWatched ? "✓ Watched" : "Mark as watched"}
            </button>
          )}
        </div>
      </div>

      {mediaType === "tv" && details.seasons && details.seasons.length > 0 && (
        <section className="flex flex-col gap-2">
          <h2 className="font-display text-lg text-muted">Seasons</h2>
          {details.seasons
            .filter((s) => s.season_number > 0)
            .map((season) => (
              <div key={season.id} className="rounded-card border border-surface2 bg-surface">
                <button
                  onClick={() => toggleSeason(season.season_number)}
                  className="focus-ring flex w-full items-center justify-between px-4 py-3 text-left"
                >
                  <span className="text-sm font-medium text-ink">{season.name}</span>
                  <span className="text-xs text-muted">
                    {season.episode_count} episodes {openSeason === season.season_number ? "▲" : "▼"}
                  </span>
                </button>
                {openSeason === season.season_number && (
                  <ul className="divide-y divide-surface2 border-t border-surface2">
                    {(episodesBySeason[season.season_number] ?? []).map((ep) => {
                      const watched = isEpisodeWatched(season.season_number, ep.episode_number);
                      return (
                        <li key={ep.id} className="flex items-center justify-between gap-3 px-4 py-3">
                          <div>
                            <p className="text-sm text-ink">
                              {ep.episode_number}. {ep.name}
                            </p>
                            {ep.air_date && <p className="text-xs text-muted">{ep.air_date}</p>}
                          </div>
                          <button
                            onClick={() => toggleEpisode(ep, season.season_number)}
                            className={`focus-ring shrink-0 rounded-full border px-3 py-1 text-xs ${
                              watched
                                ? "border-glow bg-glow/10 text-glow"
                                : "border-surface2 text-muted hover:text-ink"
                            }`}
                          >
                            {watched ? "✓ Watched" : "Mark watched"}
                          </button>
                        </li>
                      );
                    })}
                    {!episodesBySeason[season.season_number] && (
                      <li className="px-4 py-3 text-sm text-muted">Loading episodes…</li>
                    )}
                  </ul>
                )}
              </div>
            ))}
        </section>
      )}
    </div>
  );
}
