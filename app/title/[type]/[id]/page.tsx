"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { ArrowLeft, Star, Clapperboard, Check, ChevronUp, ChevronDown, Plus, Heart } from "lucide-react";
import { TMDB_IMAGE_BASE } from "@/lib/types";
import type { LibraryStatus } from "@/lib/types";
import { useLibrary } from "@/lib/useLibrary";
import Button from "@/components/ui/Button";
import Pill from "@/components/ui/Pill";
import Card from "@/components/ui/Card";
import IconButton from "@/components/ui/IconButton";

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
  genres?: { id: number; name: string }[];
}

// "watched" now does double duty: it's both a library status and the
// trigger that logs watch-time history (see handleStatusChange).
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
      genre_ids: details.genres?.map((g) => g.id),
    });
  }

  // For movies, "Watched" is now a single control: picking the status pill
  // both updates the status AND logs the runtime to watch-time history.
  // Moving away from "Watched" un-logs it, keeping stats consistent.
  async function handleStatusChange(status: LibraryStatus) {
    await library.updateStatus(tmdbId, status);

    if (mediaType !== "movie" || !details) return;
    const alreadyWatched = library.watched.some((w) => w.tmdb_id === tmdbId);

    if (status === "watched" && !alreadyWatched) {
      await library.markEpisodeWatched({
        tmdb_id: tmdbId,
        runtime_minutes: details.runtime ?? 100,
      });
    } else if (status !== "watched" && alreadyWatched) {
      await library.unmarkEpisodeWatched({ tmdb_id: tmdbId });
    }
  }

  async function handleRemove() {
    if (window.confirm("Remove this from your library? This also clears its watch history.")) {
      await library.removeFromLibrary(tmdbId);
      router.back();
    }
  }

  async function handleToggleFavorite() {
    if (!details) return;
    if (!isInLibrary) {
      await handleAdd("watchlist");
    }
    await library.toggleFavorite(tmdbId, !libraryItem?.is_favorite);
  }

  async function ensureEpisodesLoaded(seasonNumber: number): Promise<Episode[]> {
    if (episodesBySeason[seasonNumber]) return episodesBySeason[seasonNumber];
    const res = await fetch(`/api/tmdb/season/${tmdbId}/${seasonNumber}`);
    const data = await res.json();
    const eps: Episode[] = data.episodes ?? [];
    setEpisodesBySeason((prev) => ({ ...prev, [seasonNumber]: eps }));
    return eps;
  }

  async function toggleSeason(seasonNumber: number) {
    if (openSeason === seasonNumber) {
      setOpenSeason(null);
      return;
    }
    setOpenSeason(seasonNumber);
    await ensureEpisodesLoaded(seasonNumber);
  }

  function isEpisodeWatched(seasonNumber: number, episodeNumber: number) {
    return library.watched.some(
      (w) => w.tmdb_id === tmdbId && w.season_number === seasonNumber && w.episode_number === episodeNumber
    );
  }

  function watchedCountForSeason(seasonNumber: number) {
    return library.watched.filter((w) => w.tmdb_id === tmdbId && w.season_number === seasonNumber).length;
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

  // Marks (or unmarks) every episode in a season in one bulk operation.
  async function markAllSeason(season: Season) {
    const eps = await ensureEpisodesLoaded(season.season_number);
    const allWatched =
      watchedCountForSeason(season.season_number) >= season.episode_count && eps.length > 0;

    if (!isInLibrary) await handleAdd("watching");

    if (allWatched) {
      await library.unmarkSeasonWatched(tmdbId, season.season_number);
    } else {
      await library.markSeasonWatched(
        tmdbId,
        season.season_number,
        eps.map((ep) => ({
          episode_number: ep.episode_number,
          runtime_minutes: ep.runtime ?? 40,
        }))
      );
    }
  }

  if (error) {
    return (
      <Card className="border border-surface3 bg-surface2 py-8 text-center shadow-none">
        <p className="text-ink">{error}</p>
        <p className="mt-2 text-body-sm text-muted">
          Check that TMDB_API_KEY is set correctly, then reload.
        </p>
      </Card>
    );
  }

  if (!details) {
    return <p className="text-muted">Loading…</p>;
  }

  const title = details.title ?? details.name ?? "Untitled";
  const year = (details.release_date ?? details.first_air_date ?? "").slice(0, 4);

  return (
    <div className="flex flex-col gap-6">
      <button
        onClick={() => router.back()}
        className="focus-ring flex w-fit items-center gap-1.5 text-body-sm text-muted hover:text-ink"
      >
        <ArrowLeft className="h-4 w-4" strokeWidth={2} />
        Back
      </button>

      <div className="flex flex-col gap-6 sm:flex-row">
        <div className="relative aspect-[2/3] w-40 shrink-0 overflow-hidden rounded-md bg-surface2 shadow-card sm:w-52">
          {details.poster_path ? (
            <Image
              src={`${TMDB_IMAGE_BASE}${details.poster_path}`}
              alt={title}
              fill
              sizes="200px"
              className="object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-muted">
              <Clapperboard className="h-10 w-10" strokeWidth={1.5} />
            </div>
          )}
        </div>

        <div className="flex flex-1 flex-col gap-3">
          <div className="flex items-start justify-between gap-3">
            <h1 className="font-display text-display-lg">
              {title} {year && <span className="text-muted">({year})</span>}
            </h1>
            <IconButton
              icon={Heart}
              label={libraryItem?.is_favorite ? "Remove from favorites" : "Add to favorites"}
              variant="outline"
              tone="favorite"
              filled={libraryItem?.is_favorite}
              onClick={handleToggleFavorite}
              className="shrink-0"
            />
          </div>
          {typeof details.vote_average === "number" && (
            <p className="flex items-center gap-1 text-body-sm text-ink">
              <Star className="h-4 w-4 fill-ink" strokeWidth={0} />
              {details.vote_average.toFixed(1)}
            </p>
          )}
          <p className="text-body-sm text-muted">{details.overview}</p>

          <div className="mt-2 flex flex-wrap items-center gap-2">
            {isInLibrary ? (
              <>
                {STATUS_OPTIONS.map((opt) => (
                  <Pill
                    key={opt.key}
                    active={libraryItem?.status === opt.key}
                    color={opt.key === "watched" ? "success" : "primary"}
                    onClick={() => handleStatusChange(opt.key)}
                  >
                    {opt.label}
                  </Pill>
                ))}
                <Pill color="danger" onClick={handleRemove}>
                  Remove
                </Pill>
              </>
            ) : (
              <Button
                variant="primary"
                size="sm"
                icon={Plus}
                className="rounded-full"
                onClick={() => handleAdd("watchlist")}
              >
                Add to my {mediaType === "movie" ? "movies" : "shows"}
              </Button>
            )}
          </div>
        </div>
      </div>

      {mediaType === "tv" && details.seasons && details.seasons.length > 0 && (
        <section className="flex flex-col gap-2">
          <h2 className="font-display text-display-md text-ink">Seasons</h2>
          {details.seasons
            .filter((s) => s.season_number > 0)
            .map((season) => {
              const watchedCount = watchedCountForSeason(season.season_number);
              const pct = season.episode_count > 0 ? Math.min(100, (watchedCount / season.episode_count) * 100) : 0;
              const fullyWatched = season.episode_count > 0 && watchedCount >= season.episode_count;
              const isOpen = openSeason === season.season_number;

              return (
                <Card key={season.id} padding="sm" className="!p-0 overflow-hidden">
                  <div className="flex items-center gap-3 px-4 py-3">
                    <button
                      onClick={() => toggleSeason(season.season_number)}
                      className="focus-ring flex flex-1 items-center justify-between gap-2 text-left"
                    >
                      <span className="text-body-md font-medium text-ink">{season.name}</span>
                      <span className="flex items-center gap-1 text-body-sm text-muted">
                        {watchedCount}/{season.episode_count}
                        {isOpen ? (
                          <ChevronUp className="h-4 w-4" strokeWidth={2} />
                        ) : (
                          <ChevronDown className="h-4 w-4" strokeWidth={2} />
                        )}
                      </span>
                    </button>
                    <IconButton
                      icon={Check}
                      label={fullyWatched ? `Mark all of ${season.name} unwatched` : `Mark all of ${season.name} watched`}
                      variant={fullyWatched ? "filled" : "outline"}
                      tone="success"
                      onClick={() => markAllSeason(season)}
                    />
                  </div>
                  <div className="h-1 w-full bg-surface2">
                    <div
                      className="h-full bg-success transition-all duration-300"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  {isOpen && (
                    <ul className="divide-y divide-surface2">
                      {(episodesBySeason[season.season_number] ?? []).map((ep) => {
                        const watched = isEpisodeWatched(season.season_number, ep.episode_number);
                        return (
                          <li key={ep.id} className="flex items-center justify-between gap-3 px-4 py-3">
                            <div>
                              <p className="text-body-md text-ink">
                                {ep.episode_number}. {ep.name}
                              </p>
                              {ep.air_date && <p className="text-body-sm text-muted">{ep.air_date}</p>}
                            </div>
                            <IconButton
                              icon={Check}
                              label={watched ? "Mark unwatched" : "Mark watched"}
                              variant={watched ? "filled" : "outline"}
                              tone="success"
                              onClick={() => toggleEpisode(ep, season.season_number)}
                            />
                          </li>
                        );
                      })}
                      {!episodesBySeason[season.season_number] && (
                        <li className="px-4 py-3 text-body-sm text-muted">Loading episodes…</li>
                      )}
                    </ul>
                  )}
                </Card>
              );
            })}
        </section>
      )}
    </div>
  );
}
