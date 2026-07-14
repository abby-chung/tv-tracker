"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import {
  ArrowLeft,
  Star,
  Clapperboard,
  Check,
  ChevronUp,
  ChevronDown,
  Plus,
  Heart,
  Calendar,
  Eye,
  Clock,
  X,
} from "lucide-react";
import { TMDB_IMAGE_BASE } from "@/lib/constants";
import type { LibraryStatus } from "@/lib/types";
import { useLibraryFor } from "@/lib/LibraryContext";
import Button from "@/components/ui/Button";
import Pill from "@/components/ui/Pill";
import Card from "@/components/ui/Card";
import Modal from "@/components/ui/Modal";
import IconButton from "@/components/ui/IconButton";
import Badge from "@/components/ui/Badge";

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
  still_path?: string | null;
  overview?: string;
  vote_average?: number;
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
  last_air_date?: string; // tv — used to compute an end year once the show has ended
  status?: string; // tv — e.g. "Ended", "Canceled", "Returning Series"
  vote_average?: number;
  genres?: { id: number; name: string }[];
  original_language?: string; // ISO 639-1 code, e.g. "en"
}

// STATUS_OPTIONS for TV shows and movies — "upcoming" is movie-only.
const TV_STATUS_OPTIONS: { key: LibraryStatus; label: string }[] = [
  { key: "watchlist", label: "Watchlist" },
  { key: "watching", label: "Watching" },
  { key: "watched", label: "Watched" },
];

const MOVIE_STATUS_OPTIONS: { key: LibraryStatus; label: string }[] = [
  { key: "upcoming", label: "Upcoming" },
  { key: "watchlist", label: "Watchlist" },
  { key: "watched", label: "Watched" },
];

/** "128" -> "2h 8m", "45" -> "45m". Returns null for missing/zero runtimes. */
function formatRuntime(minutes?: number | null): string | null {
  if (!minutes || minutes <= 0) return null;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

/** "en" -> "English". Falls back to the raw code if Intl can't resolve it. */
function languageName(code?: string): string | null {
  if (!code) return null;
  try {
    const dn = new Intl.DisplayNames(["en"], { type: "language" });
    return dn.of(code) ?? code.toUpperCase();
  } catch {
    return code.toUpperCase();
  }
}

export default function TitleDetailPage() {
  const params = useParams<{ type: string; id: string }>();
  const router = useRouter();
  const mediaType = params.type === "movie" ? "movie" : "tv";
  const tmdbId = Number(params.id);

  const library = useLibraryFor(mediaType);
  const [details, setDetails] = useState<Details | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [openSeason, setOpenSeason] = useState<number | null>(null);
  const [episodesBySeason, setEpisodesBySeason] = useState<Record<number, Episode[]>>({});
  const [removeOpen, setRemoveOpen] = useState(false);
  const [selectedEpisode, setSelectedEpisode] = useState<{
    episode: Episode;
    seasonNumber: number;
  } | null>(null);

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
    // For TV shows, sum episode counts across all non-special seasons so the
    // progress bar on the profile page has an accurate denominator.
    const totalEpisodes =
      mediaType === "tv"
        ? details.seasons
            ?.filter((s) => s.season_number > 0)
            .reduce((sum, s) => sum + s.episode_count, 0) ?? null
        : null;

    await library.addToLibrary({
      tmdb_id: tmdbId,
      title: details.title ?? details.name ?? "Untitled",
      poster_path: details.poster_path,
      status,
      genre_ids: details.genres?.map((g) => g.id),
      total_episodes: totalEpisodes,
    });
  }

  // For movies, "Watched" is a single control: picking the status pill both
  // updates the status AND logs the runtime to watch-time history. Moving
  // away from "Watched" un-logs it, keeping stats consistent.
  //
  // For TV shows, the status pill is a convenience: "Watched" checks off
  // every episode in every season (via markAllShowWatched), while moving
  // to Watchlist/Watching clears all watched state so the user can check
  // episodes off manually as they actually watch them.
  async function handleStatusChange(status: LibraryStatus) {
    await library.updateStatus(tmdbId, status);
    if (!details) return;

    if (mediaType === "movie") {
      const alreadyWatched = library.watched.some((w) => w.tmdb_id === tmdbId);
      if (status === "watched" && !alreadyWatched) {
        await library.markEpisodeWatched({
          tmdb_id: tmdbId,
          runtime_minutes: details.runtime ?? 100,
        });
      } else if (status !== "watched" && alreadyWatched) {
        await library.unmarkEpisodeWatched({ tmdb_id: tmdbId });
      }
      return;
    }

    if (status === "watched") {
      await markAllShowWatched(true);
    } else {
      await library.unmarkShowWatched(tmdbId);
    }
  }

  async function handleRemove() {
    await library.removeFromLibrary(tmdbId);
    router.back();
  }

  async function handleToggleFavorite() {
    if (!details) return;
    if (!isInLibrary) {
      await handleAdd("watchlist");
    }
    // Use the explicit desired state rather than reading libraryItem?.is_favorite,
    // which may still be undefined/stale if handleAdd hasn't refreshed yet.
    const nextFavorite = !libraryItem?.is_favorite;
    await library.toggleFavorite(tmdbId, nextFavorite);
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

  function watchedAtFor(seasonNumber: number, episodeNumber: number): string | null {
    const rec = library.watched.find(
      (w) => w.tmdb_id === tmdbId && w.season_number === seasonNumber && w.episode_number === episodeNumber
    );
    return rec?.watched_at ?? null;
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

  // Marks (or unmarks) every episode across every season in one pass.
  //
  // `forceWatched` lets callers skip the toggle-based inference and state
  // explicitly what they want:
  //  - undefined (default): toggle based on current state (used by the
  //    "Mark all seasons watched/unwatched" button)
  //  - true: always mark everything watched (used by the "Watched" status
  //    pill, regardless of what's currently checked)
  //
  // Unlike markAllSeason this spans multiple seasons, so it's written to
  // minimize round-trips rather than looping season-by-season:
  //  - season episode lists are fetched from TMDB in parallel (not one at a
  //    time), and only for seasons not already cached in episodesBySeason
  //  - the resulting watched rows are written in a single Supabase upsert
  //    instead of one upsert per season
  async function markAllShowWatched(forceWatched?: boolean) {
    if (!details?.seasons) return;
    const seasons = details.seasons.filter((s) => s.season_number > 0);
    if (seasons.length === 0) return;

    const allWatched = seasons.every(
      (s) => s.episode_count > 0 && watchedCountForSeason(s.season_number) >= s.episode_count
    );
    const shouldMarkWatched = forceWatched ?? !allWatched;

    if (!isInLibrary) await handleAdd("watching");

    if (!shouldMarkWatched) {
      // Single delete for the whole show instead of one per season.
      await library.unmarkShowWatched(tmdbId);
      return;
    }

    const episodeLists = await Promise.all(
      seasons.map((season) => ensureEpisodesLoaded(season.season_number))
    );

    const entries = seasons.flatMap((season, i) =>
      episodeLists[i].map((ep) => ({
        season_number: season.season_number,
        episode_number: ep.episode_number,
        runtime_minutes: ep.runtime ?? 40,
      }))
    );

    // Single upsert covering every episode in every season.
    await library.markEpisodesWatched(tmdbId, entries);
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
  const startYear = (details.release_date ?? details.first_air_date ?? "").slice(0, 4);
  const endYear = details.last_air_date ? details.last_air_date.slice(0, 4) : null;
  const isFinishedShow =
    mediaType === "tv" && (details.status === "Ended" || details.status === "Canceled");
  const yearLabel =
    isFinishedShow && endYear && endYear !== startYear ? `${startYear} - ${endYear}` : startYear;

  const movieRuntime = mediaType === "movie" ? formatRuntime(details.runtime) : null;
  const movieLanguage = mediaType === "movie" ? languageName(details.original_language) : null;
  const hasMetaRow = typeof details.vote_average === "number" || movieRuntime || movieLanguage;

  const numberedSeasons = details.seasons?.filter((s) => s.season_number > 0) ?? [];
  const allSeasonsWatched =
    numberedSeasons.length > 0 &&
    numberedSeasons.every(
      (s) => s.episode_count > 0 && watchedCountForSeason(s.season_number) >= s.episode_count
    );

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
              {title} {yearLabel && <span className="text-muted">({yearLabel})</span>}
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

          {hasMetaRow && (
            <div className="flex flex-wrap items-center gap-3 text-body-sm text-ink">
              {typeof details.vote_average === "number" && (
                <span className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-ink" strokeWidth={0} />
                  {details.vote_average.toFixed(1)}
                </span>
              )}
              {movieRuntime && (
                <span className="flex items-center gap-1 text-muted">
                  <Clock className="h-4 w-4" strokeWidth={2} />
                  {movieRuntime}
                </span>
              )}
              {movieLanguage && <span className="text-muted">{movieLanguage}</span>}
            </div>
          )}

          {details.genres && details.genres.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {details.genres.map((g) => (
                <Badge key={g.id}>{g.name}</Badge>
              ))}
            </div>
          )}

          <p className="text-body-sm text-muted">{details.overview}</p>

          <div className="mt-2 flex flex-wrap items-center gap-2">
            {isInLibrary ? (
              <>
                {(mediaType === "movie" ? MOVIE_STATUS_OPTIONS : TV_STATUS_OPTIONS).map((opt) => (
                  <Pill
                    key={opt.key}
                    active={libraryItem?.status === opt.key}
                    color={opt.key === "watched" ? "success" : "primary"}
                    onClick={() => handleStatusChange(opt.key)}
                  >
                    {opt.label}
                  </Pill>
                ))}
                <Pill color="danger" onClick={() => setRemoveOpen(true)}>
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
          <div className="flex items-center justify-between">
            <h2 className="font-display text-display-md text-ink">Seasons</h2>
            <IconButton
              icon={Check}
              label={allSeasonsWatched ? "Mark all seasons unwatched" : "Mark all seasons watched"}
              variant={allSeasonsWatched ? "filled" : "outline"}
              tone="success"
              onClick={() => markAllShowWatched()}
            />
          </div>
          {numberedSeasons.map((season) => {
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
                    className={`h-full transition-all duration-300 ${fullyWatched ? "bg-success" : "bg-[#F4C430]"}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                {isOpen && (
                  <ul className="divide-y divide-surface2">
                    {(episodesBySeason[season.season_number] ?? []).map((ep) => {
                      const watched = isEpisodeWatched(season.season_number, ep.episode_number);
                      return (
                        <li key={ep.id} className="flex items-center gap-3 px-4 py-3">
                          <button
                            onClick={() =>
                              setSelectedEpisode({ episode: ep, seasonNumber: season.season_number })
                            }
                            className="focus-ring flex flex-1 items-center gap-3 overflow-hidden text-left"
                          >
                            <div className="relative h-14 w-24 shrink-0 overflow-hidden rounded-sm bg-surface2">
                              {ep.still_path ? (
                                <Image
                                  src={`${TMDB_IMAGE_BASE}${ep.still_path}`}
                                  alt={ep.name}
                                  fill
                                  sizes="96px"
                                  className="object-cover"
                                />
                              ) : (
                                <div className="flex h-full items-center justify-center text-muted">
                                  <Clapperboard className="h-5 w-5" strokeWidth={1.5} />
                                </div>
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-body-sm font-semibold uppercase tracking-wide text-ink">
                                S{String(season.season_number).padStart(2, "0")} | E
                                {String(ep.episode_number).padStart(2, "0")}
                              </p>
                              <p className="line-clamp-1 text-body-md text-ink">{ep.name}</p>
                            </div>
                          </button>
                          <IconButton
                            icon={Check}
                            label={watched ? "Mark unwatched" : "Mark watched"}
                            variant={watched ? "filled" : "outline"}
                            tone="success"
                            onClick={() => toggleEpisode(ep, season.season_number)}
                            className="shrink-0"
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

      {/* Remove confirmation modal */}
      <Modal open={removeOpen} onClose={() => setRemoveOpen(false)} title="Remove from library">
        <p className="mb-6 text-body-sm text-muted">
          Remove &ldquo;{title}&rdquo; from your library? This also clears its watch history and
          can&apos;t be undone.
        </p>
        <div className="flex justify-end gap-3">
          <Button variant="ghost" size="sm" onClick={() => setRemoveOpen(false)}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" onClick={handleRemove}>
            Remove
          </Button>
        </div>
      </Modal>

      {/* Episode detail */}
      {selectedEpisode && (
        <EpisodeDetailModal
          episode={selectedEpisode.episode}
          seasonNumber={selectedEpisode.seasonNumber}
          showTitle={title}
          watchedAt={watchedAtFor(selectedEpisode.seasonNumber, selectedEpisode.episode.episode_number)}
          isWatched={isEpisodeWatched(selectedEpisode.seasonNumber, selectedEpisode.episode.episode_number)}
          onToggleWatched={() => toggleEpisode(selectedEpisode.episode, selectedEpisode.seasonNumber)}
          onClose={() => setSelectedEpisode(null)}
        />
      )}
    </div>
  );
}

function EpisodeDetailModal({
  episode,
  seasonNumber,
  showTitle,
  watchedAt,
  isWatched,
  onToggleWatched,
  onClose,
}: {
  episode: Episode;
  seasonNumber: number;
  showTitle: string;
  watchedAt: string | null;
  isWatched: boolean;
  onToggleWatched: () => void;
  onClose: () => void;
}) {
  // Bottom-sheet close is animated: flip to the exit keyframes, then let
  // onClose actually unmount once the animation has finished playing.
  const [closing, setClosing] = useState(false);

  function handleClose() {
    if (closing) return;
    setClosing(true);
    setTimeout(onClose, 250); // matches the slide-down/fade-out duration
  }

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const runtimeLabel = formatRuntime(episode.runtime);

  return (
    <div
      className={`fixed inset-0 z-50 flex items-end justify-center bg-black/60 ${
        closing ? "animate-fade-out" : "animate-fade-in"
      }`}
      onClick={handleClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="episode-modal-title"
    >
      <div
        className={`max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-t-lg bg-surface shadow-card ${
          closing ? "animate-slide-down" : "animate-slide-up"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag handle — signals "this sheet can be dismissed" the way a
            native bottom sheet does. */}
        <div className="flex justify-center pt-3">
          <div className="h-1 w-10 rounded-full bg-surface3" />
        </div>

        <div className="relative mt-2 aspect-video w-full shrink-0 bg-surface2">
          {episode.still_path ? (
            <Image
              src={`${TMDB_IMAGE_BASE}${episode.still_path}`}
              alt={episode.name}
              fill
              sizes="512px"
              className="object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-muted">
              <Clapperboard className="h-10 w-10" strokeWidth={1.5} />
            </div>
          )}
          <span className="absolute left-3 top-3 rounded-full border border-white/40 bg-base/70 px-3 py-1 text-caption uppercase text-ink backdrop-blur">
            {showTitle}
          </span>
          <button
            onClick={handleClose}
            aria-label="Close"
            className="focus-ring absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-base/70 text-ink backdrop-blur"
          >
            <X className="h-4 w-4" strokeWidth={2} />
          </button>
        </div>

        <div className="flex items-start justify-between gap-3 px-5 pt-4">
          <div className="min-w-0">
            <p className="text-body-sm font-semibold uppercase tracking-wide text-muted">
              S{String(seasonNumber).padStart(2, "0")} | E{String(episode.episode_number).padStart(2, "0")}
            </p>
            <h2 id="episode-modal-title" className="font-display text-display-md text-ink">
              {episode.name}
            </h2>
          </div>
          <IconButton
            icon={Check}
            label={isWatched ? "Mark unwatched" : "Mark watched"}
            variant={isWatched ? "filled" : "outline"}
            tone="success"
            onClick={onToggleWatched}
            className="mt-1 shrink-0"
          />
        </div>

        {(episode.air_date || watchedAt || runtimeLabel) && (
          <div className="flex flex-wrap items-center gap-4 px-5 pt-3 text-body-sm text-muted">
            {runtimeLabel && (
              <span className="flex items-center gap-1.5">
                <Clock className="h-4 w-4" strokeWidth={2} />
                {runtimeLabel}
              </span>
            )}
            {episode.air_date && (
              <span className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4" strokeWidth={2} />
                {episode.air_date}
              </span>
            )}
            {watchedAt && (
              <span className="flex items-center gap-1.5">
                <Eye className="h-4 w-4" strokeWidth={2} />
                {new Date(watchedAt).toLocaleDateString()}
              </span>
            )}
          </div>
        )}

        {episode.overview && (
          <div className="mt-4 border-t border-surface2 px-5 py-4">
            <h3 className="mb-2 font-display text-body-lg text-ink">Episode info</h3>
            {typeof episode.vote_average === "number" && episode.vote_average > 0 && (
              <p className="mb-2 flex items-center gap-1 text-body-sm text-ink">
                <Star className="h-4 w-4 fill-accent text-accent" strokeWidth={0} />
                {episode.vote_average.toFixed(1)}/10
              </p>
            )}
            <p className="text-body-sm text-muted">{episode.overview}</p>
          </div>
        )}

        <div className="h-5" />
      </div>
    </div>
  );
}
