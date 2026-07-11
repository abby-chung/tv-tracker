"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Search, Trash2 } from "lucide-react";
import PosterCard from "@/components/PosterCard";
import Input from "@/components/ui/Input";
import Card from "@/components/ui/Card";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import { useLists } from "@/lib/useLists";
import type { TmdbResult } from "@/lib/types";

export default function ListDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { lists, itemsFor, deleteList, addItemToList, removeItemFromList, loading } = useLists();

  const list = lists.find((l) => l.id === params.id);
  const items = itemsFor(params.id);

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<TmdbResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    const timeout = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(`/api/tmdb/search?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        setResults((data.results ?? []).filter((r: TmdbResult) => r.media_type !== "person"));
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 400);
    return () => clearTimeout(timeout);
  }, [query]);

  async function confirmDeleteList() {
    if (!list) return;
    await deleteList(list.id);
    router.push("/profile");
  }

  async function handleAdd(item: TmdbResult) {
    const mediaType = item.media_type === "movie" ? "movie" : "tv";
    await addItemToList(params.id, {
      tmdb_id: item.id,
      media_type: mediaType,
      title: item.title ?? item.name ?? "Untitled",
      poster_path: item.poster_path,
    });
  }

  if (loading) {
    return <p className="text-muted">Loading…</p>;
  }

  if (!list) {
    return (
      <div className="flex flex-col gap-4">
        <p className="text-muted">List not found.</p>
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

  return (
    <div className="flex flex-col gap-6">
      <button
        onClick={() => router.back()}
        className="focus-ring flex w-fit items-center gap-1.5 text-body-sm text-muted hover:text-ink"
      >
        <ArrowLeft className="h-4 w-4" strokeWidth={2} />
        Back
      </button>

      <header className="flex items-center justify-between gap-3">
        <h1 className="font-display text-display-lg">{list.name}</h1>
        <button
          onClick={() => setDeleteOpen(true)}
          className="focus-ring flex shrink-0 items-center gap-1.5 rounded-md border border-danger/40
            px-3 py-1.5 text-body-sm text-danger hover:bg-danger/10"
        >
          <Trash2 className="h-4 w-4" strokeWidth={2} />
          Delete list
        </button>
      </header>

      <Input
        icon={Search}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search to add shows and movies…"
      />

      {query.trim() ? (
        <div className="grid grid-cols-3 gap-4 sm:grid-cols-4 md:grid-cols-6">
          {searching ? (
            <p className="col-span-full text-muted">Searching…</p>
          ) : results.length === 0 ? (
            <p className="col-span-full text-muted">No results for &ldquo;{query}&rdquo;.</p>
          ) : (
            results.map((item) => {
              const mediaType = item.media_type === "movie" ? "movie" : "tv";
              const already = items.some((i) => i.tmdb_id === item.id && i.media_type === mediaType);
              return (
                <PosterCard
                  key={`${mediaType}-${item.id}`}
                  title={item.title ?? item.name ?? "Untitled"}
                  posterPath={item.poster_path}
                  subtitle={mediaType === "movie" ? "Movie" : "Show"}
                  onAdd={already ? undefined : () => handleAdd(item)}
                />
              );
            })
          )}
        </div>
      ) : items.length === 0 ? (
        <Card className="border border-dashed border-surface2 py-16 text-center shadow-none">
          <p className="text-body-sm text-muted">No titles yet. Search above to add some.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-3 gap-4 sm:grid-cols-4 md:grid-cols-6">
          {items.map((item) => (
            <PosterCard
              key={item.id}
              title={item.title}
              posterPath={item.poster_path}
              subtitle={item.media_type === "movie" ? "Movie" : "Show"}
              onClick={() => router.push(`/title/${item.media_type}/${item.tmdb_id}`)}
              onRemove={() => removeItemFromList(item.id)}
            />
          ))}
        </div>
      )}

      {/* Delete list confirmation modal */}
      <Modal open={deleteOpen} onClose={() => setDeleteOpen(false)} title="Delete list">
        <p className="mb-6 text-body-sm text-muted">
          Delete &ldquo;{list.name}&rdquo;? This can&apos;t be undone.
        </p>
        <div className="flex justify-end gap-3">
          <Button variant="ghost" size="sm" onClick={() => setDeleteOpen(false)}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" onClick={confirmDeleteList}>
            Delete
          </Button>
        </div>
      </Modal>
    </div>
  );
}
