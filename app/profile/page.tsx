"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import ProgressRing from "@/components/ProgressRing";
import PosterCard from "@/components/PosterCard";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Avatar from "@/components/ui/Avatar";
import Pill from "@/components/ui/Pill";
import { useLibrary } from "@/lib/useLibrary";
import { createClient } from "@/lib/supabase/client";
import type { LibraryItem, LibraryStatus } from "@/lib/types";

const SHOW_FILTERS: { key: LibraryStatus | "all"; label: string }[] = [
  { key: "all", label: "All" },
  { key: "watching", label: "Watching" },
  { key: "watchlist", label: "Watchlist" },
  { key: "watched", label: "Watched" },
];

const MOVIE_FILTERS: { key: LibraryStatus | "all"; label: string }[] = [
  { key: "all", label: "All" },
  { key: "upcoming", label: "Upcoming" },
  { key: "watchlist", label: "Watchlist" },
  { key: "watched", label: "Watched" },
];

export default function ProfilePage() {
  const router = useRouter();
  const tv = useLibrary("tv");
  const movie = useLibrary("movie");
  const [email, setEmail] = useState<string | null>(null);
  const [showFilter, setShowFilter] = useState<LibraryStatus | "all">("all");
  const [movieFilter, setMovieFilter] = useState<LibraryStatus | "all">("all");
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? null));
  }, [supabase]);

  const tvMinutes = useMemo(
    () => tv.watched.reduce((sum, w) => sum + (w.runtime_minutes || 0), 0),
    [tv.watched]
  );
  const movieMinutes = useMemo(
    () => movie.watched.reduce((sum, w) => sum + (w.runtime_minutes || 0), 0),
    [movie.watched]
  );
  const totalMinutes = tvMinutes + movieMinutes;
  const totalHours = Math.floor(totalMinutes / 60);
  const totalDays = (totalHours / 24).toFixed(1);
  const ringProgress = (totalHours % 1000) / 1000;

  const filteredShows = useMemo(
    () => (showFilter === "all" ? tv.items : tv.items.filter((i) => i.status === showFilter)),
    [tv.items, showFilter]
  );
  const filteredMovies = useMemo(
    () => (movieFilter === "all" ? movie.items : movie.items.filter((i) => i.status === movieFilter)),
    [movie.items, movieFilter]
  );
  const favoriteShows = useMemo(() => tv.items.filter((i) => i.is_favorite), [tv.items]);
  const favoriteMovies = useMemo(() => movie.items.filter((i) => i.is_favorite), [movie.items]);

  function showProgressFor(tmdbId: number) {
    const count = tv.watched.filter((w) => w.tmdb_id === tmdbId).length;
    return Math.min(1, count / 10);
  }

  function isMovieWatched(tmdbId: number) {
    return movie.watched.some((w) => w.tmdb_id === tmdbId);
  }

  async function handleRemove(mediaType: "tv" | "movie", tmdbId: number, title: string) {
    if (window.confirm(`Remove "${title}" from your library? This also clears its watch history.`)) {
      await (mediaType === "tv" ? tv : movie).removeFromLibrary(tmdbId);
    }
  }

  async function handleToggleFavorite(mediaType: "tv" | "movie", item: LibraryItem) {
    await (mediaType === "tv" ? tv : movie).toggleFavorite(item.tmdb_id, !item.is_favorite);
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  const loading = tv.loading || movie.loading;

  return (
    <div className="flex flex-col gap-10">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Avatar label={email ?? undefined} size="lg" />
          <div>
            <h1 className="font-display text-display-lg">Profile</h1>
            {email && <p className="mt-1 text-body-sm text-muted">{email}</p>}
          </div>
        </div>
        <Button variant="ghost" size="sm" icon={LogOut} onClick={handleSignOut}>
          Sign out
        </Button>
      </header>

      {/* Hero: the watch-time clock, the signature glow ring at large scale */}
      <Card padding="lg" className="flex flex-col items-center gap-6 rounded-lg py-10">
        <ProgressRing progress={ringProgress} size={180} strokeWidth={10}>
          <div className="flex flex-col items-center">
            <span className="font-mono text-stat-lg text-ink">{totalHours}</span>
            <span className="text-caption text-muted">hours watched</span>
          </div>
        </ProgressRing>
        <p className="font-body text-body-sm text-muted">
          That&apos;s about <span className="text-primary">{totalDays} days</span> of your life
        </p>
      </Card>

      <section className="grid grid-cols-2 gap-4">
        <StatCard
          label="TV Time"
          value={`${Math.floor(tvMinutes / 60)}h`}
          detail={`${tv.watched.length} episodes · ${tv.items.length} shows`}
          color="primary"
        />
        <StatCard
          label="Movie Time"
          value={`${Math.floor(movieMinutes / 60)}h`}
          detail={`${movie.watched.length} watched · ${movie.items.length} tracked`}
          color="secondary"
        />
      </section>

      <section>
        <h2 className="mb-3 font-display text-display-md text-ink">Library totals</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <MiniStat label="Shows tracked" value={tv.items.length} />
          <MiniStat label="Movies tracked" value={movie.items.length} />
          <MiniStat label="Episodes watched" value={tv.watched.length} />
          <MiniStat label="Movies watched" value={movie.watched.length} />
        </div>
      </section>

      {loading ? (
        <p className="text-muted">Loading your library…</p>
      ) : (
        <>
          <PosterSection
            title="Shows"
            emptyMessage="No shows tracked yet. Head to Discover to find one."
            filters={SHOW_FILTERS}
            activeFilter={showFilter}
            onFilterChange={setShowFilter}
            items={filteredShows}
            accent="primary"
            getProgress={(item) => showProgressFor(item.tmdb_id)}
            onView={(item) => router.push(`/title/tv/${item.tmdb_id}`)}
            onRemove={(item) => handleRemove("tv", item.tmdb_id, item.title)}
            onToggleFavorite={(item) => handleToggleFavorite("tv", item)}
          />

          {favoriteShows.length > 0 && (
            <PosterSection
              title="Favorite Shows"
              items={favoriteShows}
              accent="primary"
              getProgress={(item) => showProgressFor(item.tmdb_id)}
              onView={(item) => router.push(`/title/tv/${item.tmdb_id}`)}
              onRemove={(item) => handleRemove("tv", item.tmdb_id, item.title)}
              onToggleFavorite={(item) => handleToggleFavorite("tv", item)}
            />
          )}

          <PosterSection
            title="Movies"
            emptyMessage="No movies tracked yet. Head to Discover to find one."
            filters={MOVIE_FILTERS}
            activeFilter={movieFilter}
            onFilterChange={setMovieFilter}
            items={filteredMovies}
            accent="secondary"
            getProgress={(item) => (isMovieWatched(item.tmdb_id) ? 1 : 0)}
            onView={(item) => router.push(`/title/movie/${item.tmdb_id}`)}
            onRemove={(item) => handleRemove("movie", item.tmdb_id, item.title)}
            onToggleFavorite={(item) => handleToggleFavorite("movie", item)}
          />

          {favoriteMovies.length > 0 && (
            <PosterSection
              title="Favorite Movies"
              items={favoriteMovies}
              accent="secondary"
              getProgress={(item) => (isMovieWatched(item.tmdb_id) ? 1 : 0)}
              onView={(item) => router.push(`/title/movie/${item.tmdb_id}`)}
              onRemove={(item) => handleRemove("movie", item.tmdb_id, item.title)}
              onToggleFavorite={(item) => handleToggleFavorite("movie", item)}
            />
          )}
        </>
      )}
    </div>
  );
}

function PosterSection({
  title,
  emptyMessage,
  filters,
  activeFilter,
  onFilterChange,
  items,
  accent,
  getProgress,
  onView,
  onRemove,
  onToggleFavorite,
}: {
  title: string;
  emptyMessage?: string;
  filters?: { key: LibraryStatus | "all"; label: string }[];
  activeFilter?: LibraryStatus | "all";
  onFilterChange?: (key: LibraryStatus | "all") => void;
  items: LibraryItem[];
  accent: "primary" | "secondary";
  getProgress: (item: LibraryItem) => number;
  onView: (item: LibraryItem) => void;
  onRemove: (item: LibraryItem) => void;
  onToggleFavorite: (item: LibraryItem) => void;
}) {
  return (
    <section>
      <h2 className="mb-3 font-display text-display-md text-ink">{title}</h2>

      {filters && activeFilter && onFilterChange && (
        <div className="mb-4 flex gap-2 overflow-x-auto scrollbar-thin">
          {filters.map((f) => (
            <Pill
              key={f.key}
              active={activeFilter === f.key}
              color={f.key === "watched" ? "success" : accent}
              onClick={() => onFilterChange(f.key)}
            >
              {f.label}
            </Pill>
          ))}
        </div>
      )}

      {items.length === 0 ? (
        emptyMessage ? (
          <Card className="border border-dashed border-surface2 py-16 text-center shadow-none">
            <p className="text-body-sm text-muted">{emptyMessage}</p>
          </Card>
        ) : null
      ) : (
        <div className="grid grid-cols-3 gap-4 sm:grid-cols-4 md:grid-cols-6">
          {items.map((item) => (
            <PosterCard
              key={item.id}
              title={item.title}
              posterPath={item.poster_path}
              progress={getProgress(item)}
              subtitle={item.status}
              accent={accent}
              favorite={item.is_favorite}
              onClick={() => onView(item)}
              onRemove={() => onRemove(item)}
              onToggleFavorite={() => onToggleFavorite(item)}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function StatCard({
  label,
  value,
  detail,
  color,
}: {
  label: string;
  value: string;
  detail: string;
  color: "primary" | "secondary";
}) {
  return (
    <Card>
      <p className="text-caption text-muted">{label}</p>
      <p className={`mt-1 font-mono text-stat-md ${color === "primary" ? "text-primary" : "text-secondary"}`}>
        {value}
      </p>
      <p className="mt-1 text-body-sm text-muted">{detail}</p>
    </Card>
  );
}

function MiniStat({ label, value }: { label: string; value: number }) {
  return (
    <Card padding="sm" className="text-center">
      <p className="font-mono text-stat-md text-ink">{value}</p>
      <p className="mt-1 text-body-sm text-muted">{label}</p>
    </Card>
  );
}
