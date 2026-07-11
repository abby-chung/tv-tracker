"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { LogOut, ChevronRight, Tv, Film, ListVideo, Clapperboard } from "lucide-react";
import PosterCard from "@/components/PosterCard";
import { ListCard, CreateListCard } from "@/components/ListCard";
import Button from "@/components/ui/Button";
import Avatar from "@/components/ui/Avatar";
import Pill from "@/components/ui/Pill";
import Card from "@/components/ui/Card";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import { TimeStatCard, CountStatCard, breakdownTime } from "@/components/StatCards";
import { useLibraryContext, useListsContext } from "@/lib/LibraryContext";
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
  const { tv, movie } = useLibraryContext();
  const { lists, itemsFor, createList } = useListsContext();
  const [email, setEmail] = useState<string | null>(null);
  const [showFilter, setShowFilter] = useState<LibraryStatus | "all">("all");
  const [movieFilter, setMovieFilter] = useState<LibraryStatus | "all">("all");

  // Modal state: remove confirmation
  const [removeTarget, setRemoveTarget] = useState<{
    mediaType: "tv" | "movie";
    tmdbId: number;
    title: string;
  } | null>(null);

  // Modal state: create list
  const [createListOpen, setCreateListOpen] = useState(false);
  const [newListName, setNewListName] = useState("");

  const supabase = useMemo(() => createClient(), []);

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

  function showProgressFor(item: LibraryItem): number {
    // Explicitly marked watched → always full green bar.
    if (item.status === "watched") return 1;
    const watchedCount = tv.watched.filter((w) => w.tmdb_id === item.tmdb_id).length;
    if (watchedCount === 0) return 0;
    // Use the stored total episode count for an accurate fraction when available.
    if (item.total_episodes && item.total_episodes > 0) {
      return Math.min(0.99, watchedCount / item.total_episodes);
    }
    // Fallback for older items added before total_episodes was stored: cap at
    // 0.99 so the bar stays yellow (in-progress) regardless of episode count.
    return Math.min(0.99, watchedCount / Math.max(watchedCount + 1, 10));
  }

  function isMovieWatched(tmdbId: number) {
    return movie.watched.some((w) => w.tmdb_id === tmdbId);
  }

  function handleRemove(mediaType: "tv" | "movie", tmdbId: number, title: string) {
    setRemoveTarget({ mediaType, tmdbId, title });
  }

  async function confirmRemove() {
    if (!removeTarget) return;
    await (removeTarget.mediaType === "tv" ? tv : movie).removeFromLibrary(removeTarget.tmdbId);
    setRemoveTarget(null);
  }

  async function handleToggleFavorite(mediaType: "tv" | "movie", item: LibraryItem) {
    await (mediaType === "tv" ? tv : movie).toggleFavorite(item.tmdb_id, !item.is_favorite);
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  async function handleCreateList() {
    setNewListName("");
    setCreateListOpen(true);
  }

  async function confirmCreateList() {
    if (!newListName.trim()) return;
    await createList(newListName.trim());
    setCreateListOpen(false);
    setNewListName("");
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

      {/* Stats: clean bordered cards, no donut — matches the reference design.
          Only the four requested metrics are shown; full breakdown (top
          genres, per-category totals) lives on /profile/stats. */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-display-lg text-ink">Stats</h2>
          <Link
            href="/profile/stats"
            aria-label="See detailed stats"
            className="focus-ring rounded-full p-1 text-ink hover:text-muted"
          >
            <ChevronRight className="h-5 w-5" strokeWidth={2} />
          </Link>
        </div>
        <div className="flex gap-3 overflow-x-auto scrollbar-thin pb-1">
          <TimeStatCard icon={Tv} label="TV time" {...breakdownTime(tvMinutes)} />
          <CountStatCard icon={ListVideo} label="Episodes watched" value={tv.watched.length} />
          <TimeStatCard icon={Clapperboard} label="Movie time" {...breakdownTime(movieMinutes)} />
          <CountStatCard icon={Film} label="Movies watched" value={movie.watched.length} />
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
            getProgress={(item) => showProgressFor(item)}
            onView={(item) => router.push(`/title/tv/${item.tmdb_id}`)}
            onRemove={(item) => handleRemove("tv", item.tmdb_id, item.title)}
            onToggleFavorite={(item) => handleToggleFavorite("tv", item)}
          />

          {favoriteShows.length > 0 && (
            <PosterSection
              title="Favorite Shows"
              items={favoriteShows}
              getProgress={(item) => showProgressFor(item)}
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
            getProgress={(item) => (isMovieWatched(item.tmdb_id) ? 1 : 0)}
            onView={(item) => router.push(`/title/movie/${item.tmdb_id}`)}
            onRemove={(item) => handleRemove("movie", item.tmdb_id, item.title)}
            onToggleFavorite={(item) => handleToggleFavorite("movie", item)}
          />

          {favoriteMovies.length > 0 && (
            <PosterSection
              title="Favorite Movies"
              items={favoriteMovies}
              getProgress={(item) => (isMovieWatched(item.tmdb_id) ? 1 : 0)}
              onView={(item) => router.push(`/title/movie/${item.tmdb_id}`)}
              onRemove={(item) => handleRemove("movie", item.tmdb_id, item.title)}
              onToggleFavorite={(item) => handleToggleFavorite("movie", item)}
            />
          )}

          {/* Lists */}
          <section>
            <h2 className="mb-3 font-display text-display-md text-ink">Lists</h2>
            <div className="flex gap-4 overflow-x-auto scrollbar-thin pb-2">
              <CreateListCard onClick={handleCreateList} />
              {lists.map((list) => (
                <ListCard key={list.id} id={list.id} name={list.name} items={itemsFor(list.id)} />
              ))}
            </div>
          </section>
        </>
      )}

      {/* Remove confirmation modal */}
      <Modal
        open={Boolean(removeTarget)}
        onClose={() => setRemoveTarget(null)}
        title="Remove from library"
      >
        <p className="mb-6 text-body-sm text-muted">
          Remove &ldquo;{removeTarget?.title}&rdquo; from your library? This also clears its watch
          history and can&apos;t be undone.
        </p>
        <div className="flex justify-end gap-3">
          <Button variant="ghost" size="sm" onClick={() => setRemoveTarget(null)}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" onClick={confirmRemove}>
            Remove
          </Button>
        </div>
      </Modal>

      {/* Create list modal */}
      <Modal open={createListOpen} onClose={() => setCreateListOpen(false)} title="New list">
        <Input
          value={newListName}
          onChange={(e) => setNewListName(e.target.value)}
          placeholder="List name…"
          onKeyDown={(e) => {
            if (e.key === "Enter") confirmCreateList();
          }}
        />
        <div className="mt-4 flex justify-end gap-3">
          <Button variant="ghost" size="sm" onClick={() => setCreateListOpen(false)}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={confirmCreateList}
            disabled={!newListName.trim()}
          >
            Create
          </Button>
        </div>
      </Modal>
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
              color={f.key === "watched" ? "success" : "primary"}
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
