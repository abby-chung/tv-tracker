"use client";

import { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import PosterCard from "@/components/PosterCard";
import Pill from "@/components/ui/Pill";
import Card from "@/components/ui/Card";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import { useLibraryContext } from "@/lib/LibraryContext";
import { SHOW_FILTERS, MOVIE_FILTERS, isAnimation, showProgressFor } from "@/lib/libraryHelpers";
import type { LibraryItem, LibraryStatus } from "@/lib/types";

type SectionKey =
  | "shows"
  | "favorite-shows"
  | "movies"
  | "favorite-movies"
  | "animation-shows"
  | "animation-movies";

interface SectionConfig {
  title: string;
  mediaType: "tv" | "movie";
  animationOnly: boolean;
  favoritesOnly: boolean;
  filterable: boolean;
  emptyMessage: string;
}

const SECTION_CONFIG: Record<SectionKey, SectionConfig> = {
  shows: {
    title: "Shows",
    mediaType: "tv",
    animationOnly: false,
    favoritesOnly: false,
    filterable: true,
    emptyMessage: "No shows tracked yet.",
  },
  "favorite-shows": {
    title: "Favorite Shows",
    mediaType: "tv",
    animationOnly: false,
    favoritesOnly: true,
    filterable: false,
    emptyMessage: "No favorite shows yet.",
  },
  movies: {
    title: "Movies",
    mediaType: "movie",
    animationOnly: false,
    favoritesOnly: false,
    filterable: true,
    emptyMessage: "No movies tracked yet.",
  },
  "favorite-movies": {
    title: "Favorite Movies",
    mediaType: "movie",
    animationOnly: false,
    favoritesOnly: true,
    filterable: false,
    emptyMessage: "No favorite movies yet.",
  },
  "animation-shows": {
    title: "Animation Shows",
    mediaType: "tv",
    animationOnly: true,
    favoritesOnly: false,
    filterable: false,
    emptyMessage: "No animated shows yet.",
  },
  "animation-movies": {
    title: "Animation Movies",
    mediaType: "movie",
    animationOnly: true,
    favoritesOnly: false,
    filterable: false,
    emptyMessage: "No animated movies yet.",
  },
};

export default function LibrarySectionPage() {
  const params = useParams<{ key: string }>();
  const router = useRouter();
  const { tv, movie } = useLibraryContext();

  const config = SECTION_CONFIG[params.key as SectionKey] as SectionConfig | undefined;
  const library = config ? (config.mediaType === "tv" ? tv : movie) : null;

  const [filter, setFilter] = useState<LibraryStatus | "all">("all");
  const [removeTarget, setRemoveTarget] = useState<{
    mediaType: "tv" | "movie";
    tmdbId: number;
    title: string;
  } | null>(null);

  const items = useMemo(() => {
    if (!config || !library) return [];
    let list = config.animationOnly
      ? library.items.filter(isAnimation)
      : library.items.filter((i) => !isAnimation(i));
    if (config.favoritesOnly) {
      list = list.filter((i) => i.is_favorite);
    }
    if (config.filterable && filter !== "all") {
      list = list.filter((i) => i.status === filter);
    }
    return list;
  }, [config, library, filter]);

  if (!config || !library) {
    return (
      <div className="flex flex-col gap-4">
        <p className="text-muted">Section not found.</p>
        <Link
          href="/profile"
          className="focus-ring flex w-fit items-center gap-1.5 text-body-sm text-muted hover:text-ink"
        >
          <ArrowLeft className="h-4 w-4" strokeWidth={2} />
          Back to Profile
        </Link>
      </div>
    );
  }

  function getProgress(item: LibraryItem): number {
    if (config!.mediaType === "movie") {
      return movie.watched.some((w) => w.tmdb_id === item.tmdb_id) ? 1 : 0;
    }
    return showProgressFor(item, tv.watched);
  }

  function handleRemove(item: LibraryItem) {
    setRemoveTarget({ mediaType: config!.mediaType, tmdbId: item.tmdb_id, title: item.title });
  }

  async function confirmRemove() {
    if (!removeTarget) return;
    await (removeTarget.mediaType === "tv" ? tv : movie).removeFromLibrary(removeTarget.tmdbId);
    setRemoveTarget(null);
  }

  async function handleToggleFavorite(item: LibraryItem) {
    await library!.toggleFavorite(item.tmdb_id, !item.is_favorite);
  }

  const filters = config.filterable ? (config.mediaType === "tv" ? SHOW_FILTERS : MOVIE_FILTERS) : null;

  return (
    <div className="flex flex-col gap-6">
      <button
        onClick={() => router.back()}
        className="focus-ring flex w-fit items-center gap-1.5 text-body-sm text-muted hover:text-ink"
      >
        <ArrowLeft className="h-4 w-4" strokeWidth={2} />
        Back
      </button>

      <h1 className="font-display text-display-lg">{config.title}</h1>

      {filters && (
        <div className="flex gap-2 overflow-x-auto scrollbar-thin">
          {filters.map((f) => (
            <Pill
              key={f.key}
              active={filter === f.key}
              color={f.key === "watched" ? "success" : "primary"}
              onClick={() => setFilter(f.key)}
            >
              {f.label}
            </Pill>
          ))}
        </div>
      )}

      {library.loading ? (
        <p className="text-muted">Loading…</p>
      ) : items.length === 0 ? (
        <Card className="border border-dashed border-surface2 py-16 text-center shadow-none">
          <p className="text-body-sm text-muted">{config.emptyMessage}</p>
        </Card>
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
              onClick={() => router.push(`/title/${config.mediaType}/${item.tmdb_id}`)}
              onRemove={() => handleRemove(item)}
              onToggleFavorite={() => handleToggleFavorite(item)}
            />
          ))}
        </div>
      )}

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
    </div>
  );
}
