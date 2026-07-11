"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Tv, Film, ListVideo, Clapperboard } from "lucide-react";
import { useLibraryContext } from "@/lib/LibraryContext";
import { TimeStatCard, CountStatCard, breakdownTime } from "@/components/StatCards";
import Pill from "@/components/ui/Pill";
import type { TmdbGenre } from "@/lib/types";

type Tab = "tv" | "movie";

interface GenreCount {
  name: string;
  count: number;
}

function topGenres(items: { genre_ids?: number[] }[], options: TmdbGenre[]): GenreCount[] {
  const counts = new Map<number, number>();
  items.forEach((item) => {
    (item.genre_ids ?? []).forEach((id) => counts.set(id, (counts.get(id) ?? 0) + 1));
  });
  const nameFor = (id: number) => options.find((o) => o.id === id)?.name ?? `Genre ${id}`;
  return Array.from(counts.entries())
    .map(([id, count]) => ({ name: nameFor(id), count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);
}

export default function StatsDetailPage() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("tv");
  const { tv, movie } = useLibraryContext();
  const [tvGenres, setTvGenres] = useState<TmdbGenre[]>([]);
  const [movieGenres, setMovieGenres] = useState<TmdbGenre[]>([]);

  // Fetch both genre lists in parallel
  useEffect(() => {
    Promise.all([
      fetch("/api/tmdb/genres?type=tv").then((r) => r.json()),
      fetch("/api/tmdb/genres?type=movie").then((r) => r.json()),
    ])
      .then(([tvData, movieData]) => {
        setTvGenres(tvData.genres ?? []);
        setMovieGenres(movieData.genres ?? []);
      })
      .catch(() => {
        // Leave genres empty — UI handles the fallback message
      });
  }, []);

  const tvMinutes = useMemo(
    () => tv.watched.reduce((sum, w) => sum + (w.runtime_minutes || 0), 0),
    [tv.watched]
  );
  const movieMinutes = useMemo(
    () => movie.watched.reduce((sum, w) => sum + (w.runtime_minutes || 0), 0),
    [movie.watched]
  );

  const showGenreCounts = useMemo(() => topGenres(tv.items, tvGenres), [tv.items, tvGenres]);
  const movieGenreCounts = useMemo(() => topGenres(movie.items, movieGenres), [movie.items, movieGenres]);

  const isShows = tab === "tv";

  return (
    <div className="flex flex-col gap-6">
      <button
        onClick={() => router.back()}
        className="focus-ring flex w-fit items-center gap-1.5 text-body-sm text-muted hover:text-ink"
      >
        <ArrowLeft className="h-4 w-4" strokeWidth={2} />
        Back
      </button>

      <h1 className="font-display text-display-lg text-ink">Stats</h1>

      <div className="flex gap-2">
        <Pill active={isShows} onClick={() => setTab("tv")}>
          Shows
        </Pill>
        <Pill active={!isShows} onClick={() => setTab("movie")}>
          Movies
        </Pill>
      </div>

      {isShows ? (
        <StatsTabContent
          timeLabel="Time spent watching episodes"
          timeIcon={Tv}
          minutes={tvMinutes}
          countLabel="Total episodes watched"
          countIcon={ListVideo}
          countValue={tv.watched.length}
          addedLabel="Added shows"
          addedIcon={Tv}
          addedValue={tv.items.length}
          genreCounts={showGenreCounts}
          emptyGenreMessage="Add some shows to see your top genres."
        />
      ) : (
        <StatsTabContent
          timeLabel="Time spent watching movies"
          timeIcon={Clapperboard}
          minutes={movieMinutes}
          countLabel="Total movies watched"
          countIcon={Film}
          countValue={movie.watched.length}
          addedLabel="Added movies"
          addedIcon={Clapperboard}
          addedValue={movie.items.length}
          genreCounts={movieGenreCounts}
          emptyGenreMessage="Add some movies to see your top genres."
        />
      )}
    </div>
  );
}

function StatsTabContent({
  timeLabel,
  timeIcon,
  minutes,
  countLabel,
  countIcon,
  countValue,
  addedLabel,
  addedIcon,
  addedValue,
  genreCounts,
  emptyGenreMessage,
}: {
  timeLabel: string;
  timeIcon: typeof Tv;
  minutes: number;
  countLabel: string;
  countIcon: typeof Tv;
  countValue: number;
  addedLabel: string;
  addedIcon: typeof Tv;
  addedValue: number;
  genreCounts: GenreCount[];
  emptyGenreMessage: string;
}) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex gap-3 overflow-x-auto scrollbar-thin pb-1">
        <TimeStatCard icon={timeIcon} label={timeLabel} {...breakdownTime(minutes)} />
        <CountStatCard icon={countIcon} label={countLabel} value={countValue} />
        <CountStatCard icon={addedIcon} label={addedLabel} value={addedValue} />
      </div>

      <section>
        <h2 className="mb-3 font-display text-display-md text-ink">Top genres</h2>
        {genreCounts.length === 0 ? (
          <p className="text-body-sm text-muted">{emptyGenreMessage}</p>
        ) : (
          <GenreList genres={genreCounts} />
        )}
      </section>
    </div>
  );
}

function GenreList({ genres }: { genres: GenreCount[] }) {
  const max = Math.max(...genres.map((g) => g.count), 1);
  return (
    <div className="flex flex-col gap-3">
      {genres.map((g) => (
        <div key={g.name} className="flex items-center gap-3">
          <span className="w-32 shrink-0 truncate text-body-sm text-ink">{g.name}</span>
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface2">
            <div
              className="h-full rounded-full bg-ink/50"
              style={{ width: `${(g.count / max) * 100}%` }}
            />
          </div>
          <span className="w-6 shrink-0 text-right text-body-sm text-muted">{g.count}</span>
        </div>
      ))}
    </div>
  );
}
