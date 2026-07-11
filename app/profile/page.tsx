"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import ProgressRing from "@/components/ProgressRing";
import PosterCard from "@/components/PosterCard";
import { ListCard, CreateListCard } from "@/components/ListCard";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import Avatar from "@/components/ui/Avatar";
import Pill from "@/components/ui/Pill";
import { useLibrary } from "@/lib/useLibrary";
import { useLists } from "@/lib/useLists";
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
  const lists = useLists();
  const [email, setEmail] = useState<string | null>(null);
  const [showFilter, setShowFilter] = useState<LibraryStatus | "all">("all");
  const [movieFilter, setMovieFilter] = useState<LibraryStatus | "all">("all");
  const [showCreateList, setShowCreateList] = useState(false);
  const [newListName, setNewListName] = useState("");
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

  async function handleCreateList(e: React.FormEvent) {
    e.preventDefault();
    if (!newListName.trim()) return;
    await lists.createList(newListName.trim());
    setNewListName("");
    setShowCreateList(false);
  }

  const loading = tv.loading || movie.loading;

  return (
    <div className="flex flex-col gap-8">
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

      {/* Stats: a horizontal-scrolling carousel so it stays out of the way
          and Lists/Shows/Movies are visible as soon as you land on Profile. */}
      <section>
        <h2 className="mb-3 font-display text-display-md text-ink">Stats</h2>
        <div
          className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2
            scrollbar-thin sm:-mx-8 sm:px-8"
        >
          <Card padding="sm" className="flex w-40 shrink-0 snap-start flex-col items-center gap-2 rounded-lg text-center">
            <ProgressRing progress={ringProgress} size={72} strokeWidth={6}>
              <span className="font-mono text-stat-md text-ink">{totalHours}</span>
            </ProgressRing>
            <div>
              <p className="text-body-sm text-ink">Hours watched</p>
              <p className="text-caption text-muted">{totalDays} days</p>
            </div>
          </Card>
          <CarouselStat label="TV time" value={`${Math.floor(tvMinutes / 60)}h`} detail={`${tv.watched.length} episodes`} color="primary" />
          <CarouselStat label="Movie time" value={`${Math.floor(movieMinutes / 60)}h`} detail={`${movie.watched.length} watched`} color="secondary" />
          <CarouselStat label="Shows tracked" value={String(tv.items.length)} />
          <CarouselStat label="Movies tracked" value={String(movie.items.length)} />
          <CarouselStat label="Episodes watched" value={String(tv.watched.length)} />
          <CarouselStat label="Movies watched" value={String(movie.watched.length)} />
        </div>
      </section>

      <section>
        <h2 className="mb-3 font-display text-display-md text-ink">Lists</h2>
        <div
          className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2
            scrollbar-thin sm:-mx-8 sm:px-8"
        >
          <CreateListCard onClick={() => setShowCreateList(true)} />
          {lists.lists.map((l) => (
            <ListCard key={l.id} id={l.id} name={l.name} items={lists.itemsFor(l.id)} />
          ))}
        </div>
      </section>

      <Modal open={showCreateList} onClose={() => setShowCreateList(false)} title="New list">
        <form onSubmit={handleCreateList} className="flex flex-col gap-4">
          <Input
            autoFocus
            value={newListName}
            onChange={(e) => setNewListName(e.target.value)}
            placeholder="e.g. Cozy Weekend Watches"
          />
          <Button type="submit" className="w-full">
            Create list
          </Button>
        </form>
      </Modal>

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

function CarouselStat({
  label,
  value,
  detail,
  color,
}: {
  label: string;
  value: string;
  detail?: string;
  color?: "primary" | "secondary";
}) {
  return (
    <Card padding="sm" className="flex w-36 shrink-0 snap-start flex-col justify-center gap-1 rounded-lg">
      <p className="text-caption text-muted">{label}</p>
      <p
        className={`font-mono text-stat-md ${
          color === "primary" ? "text-primary" : color === "secondary" ? "text-secondary" : "text-ink"
        }`}
      >
        {value}
      </p>
      {detail && <p className="text-body-sm text-muted">{detail}</p>}
    </Card>
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
