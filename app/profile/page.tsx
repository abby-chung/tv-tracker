"use client";

import { useMemo, useState } from "react";
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
import EditProfileSheet from "@/components/EditProfileSheet";
import { TimeStatCard, CountStatCard, breakdownTime } from "@/components/StatCards";
import { useLibraryContext, useListsContext } from "@/lib/LibraryContext";
import { useProfile } from "@/lib/useProfile";
import { createClient } from "@/lib/supabase/client";
import { SHOW_FILTERS, MOVIE_FILTERS, isAnimation, showProgressFor } from "@/lib/libraryHelpers";
import type { LibraryItem, LibraryStatus } from "@/lib/types";

/** Each poster section on Profile shows at most this many titles; the arrow opens the full list. */
const SECTION_DISPLAY_LIMIT = 9;

export default function ProfilePage() {
  const router = useRouter();
  const { tv, movie } = useLibraryContext();
  const { lists, itemsFor, createList } = useListsContext();
  const { profile, updateProfile } = useProfile();
  const [showFilter, setShowFilter] = useState<LibraryStatus | "all">("all");
  const [movieFilter, setMovieFilter] = useState<LibraryStatus | "all">("all");
  const [editOpen, setEditOpen] = useState(false);

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

  const tvMinutes = useMemo(
    () => tv.watched.reduce((sum, w) => sum + (w.runtime_minutes || 0), 0),
    [tv.watched]
  );
  const movieMinutes = useMemo(
    () => movie.watched.reduce((sum, w) => sum + (w.runtime_minutes || 0), 0),
    [movie.watched]
  );

  // Animated titles get pulled into their own section below, so the main
  // Shows/Movies (and their Favorites) only ever show non-animated titles.
  const nonAnimationShows = useMemo(() => tv.items.filter((i) => !isAnimation(i)), [tv.items]);
  const nonAnimationMovies = useMemo(() => movie.items.filter((i) => !isAnimation(i)), [movie.items]);

  const animationShows = useMemo(() => tv.items.filter(isAnimation), [tv.items]);
  const animationMovies = useMemo(() => movie.items.filter(isAnimation), [movie.items]);

  const filteredShows = useMemo(
    () => (showFilter === "all" ? nonAnimationShows : nonAnimationShows.filter((i) => i.status === showFilter)),
    [nonAnimationShows, showFilter]
  );
  const filteredMovies = useMemo(
    () => (movieFilter === "all" ? nonAnimationMovies : nonAnimationMovies.filter((i) => i.status === movieFilter)),
    [nonAnimationMovies, movieFilter]
  );
  const favoriteShows = useMemo(() => nonAnimationShows.filter((i) => i.is_favorite), [nonAnimationShows]);
  const favoriteMovies = useMemo(() => nonAnimationMovies.filter((i) => i.is_favorite), [nonAnimationMovies]);

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
          <Avatar label={profile.displayName ?? profile.email ?? undefined} imageSrc={profile.avatarUrl} size="lg" />
          <div>
            <h1 className="font-display text-display-lg">{profile.displayName || "Profile"}</h1>
            <button
              onClick={() => setEditOpen(true)}
              className="focus-ring mt-1.5 rounded-full border border-surface2 px-3 py-1 text-caption uppercase text-muted transition-colors hover:border-ink hover:text-ink"
            >
              Edit
            </button>
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
          <SectionDivider />

          <PosterSection
            title="Shows"
            emptyMessage="No shows tracked yet. Head to Discover to find one."
            filters={SHOW_FILTERS}
            activeFilter={showFilter}
            onFilterChange={setShowFilter}
            items={filteredShows}
            getProgress={(item) => showProgressFor(item, tv.watched)}
            onView={(item) => router.push(`/title/tv/${item.tmdb_id}`)}
            onRemove={(item) => handleRemove("tv", item.tmdb_id, item.title)}
            onToggleFavorite={(item) => handleToggleFavorite("tv", item)}
            viewAllHref="/profile/section/shows"
          />

          {favoriteShows.length > 0 && (
            <PosterSection
              title="Favorite Shows"
              items={favoriteShows}
              getProgress={(item) => showProgressFor(item, tv.watched)}
              onView={(item) => router.push(`/title/tv/${item.tmdb_id}`)}
              onRemove={(item) => handleRemove("tv", item.tmdb_id, item.title)}
              onToggleFavorite={(item) => handleToggleFavorite("tv", item)}
              viewAllHref="/profile/section/favorite-shows"
            />
          )}

          <SectionDivider />

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
            viewAllHref="/profile/section/movies"
          />

          {favoriteMovies.length > 0 && (
            <PosterSection
              title="Favorite Movies"
              items={favoriteMovies}
              getProgress={(item) => (isMovieWatched(item.tmdb_id) ? 1 : 0)}
              onView={(item) => router.push(`/title/movie/${item.tmdb_id}`)}
              onRemove={(item) => handleRemove("movie", item.tmdb_id, item.title)}
              onToggleFavorite={(item) => handleToggleFavorite("movie", item)}
              viewAllHref="/profile/section/favorite-movies"
            />
          )}

          {animationShows.length > 0 && (
            <>
              <SectionDivider />
              <PosterSection
                title="Animation Shows"
                items={animationShows}
                getProgress={(item) => showProgressFor(item, tv.watched)}
                onView={(item) => router.push(`/title/tv/${item.tmdb_id}`)}
                onRemove={(item) => handleRemove("tv", item.tmdb_id, item.title)}
                onToggleFavorite={(item) => handleToggleFavorite("tv", item)}
                viewAllHref="/profile/section/animation-shows"
              />
            </>
          )}

          {animationMovies.length > 0 && (
            <>
              <SectionDivider />
              <PosterSection
                title="Animation Movies"
                items={animationMovies}
                getProgress={(item) => (isMovieWatched(item.tmdb_id) ? 1 : 0)}
                onView={(item) => router.push(`/title/movie/${item.tmdb_id}`)}
                onRemove={(item) => handleRemove("movie", item.tmdb_id, item.title)}
                onToggleFavorite={(item) => handleToggleFavorite("movie", item)}
                viewAllHref="/profile/section/animation-movies"
              />
            </>
          )}

          <SectionDivider />

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

      {/* Edit profile bottom sheet */}
      <EditProfileSheet
        open={editOpen}
        onClose={() => setEditOpen(false)}
        displayName={profile.displayName ?? ""}
        avatarUrl={profile.avatarUrl}
        onSave={async ({ displayName, avatarUrl }) => {
          await updateProfile({ displayName, avatarUrl });
        }}
      />
    </div>
  );
}

/** A hairline used to visually separate Shows / Movies / Animation / Lists on the profile page. */
function SectionDivider() {
  return <div className="border-t-2 border-surface3" aria-hidden="true" />;
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
  viewAllHref,
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
  viewAllHref?: string;
}) {
  const visibleItems = items.slice(0, SECTION_DISPLAY_LIMIT);
  const hasMore = items.length > SECTION_DISPLAY_LIMIT;

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
        <>
          <div className="grid grid-cols-3 gap-4 sm:grid-cols-4 md:grid-cols-6">
            {visibleItems.map((item) => (
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

          {hasMore && viewAllHref && (
            <Link
              href={viewAllHref}
              className="focus-ring mt-4 flex items-center justify-center gap-1.5 rounded-md border border-surface2 py-2.5
                text-body-sm text-muted transition-colors hover:border-ink hover:text-ink"
            >
              View all {items.length}
              <ChevronRight className="h-4 w-4" strokeWidth={2} />
            </Link>
          )}
        </>
      )}
    </section>
  );
}
