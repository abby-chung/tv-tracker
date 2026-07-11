import Link from "next/link";
import Image from "next/image";
import { List, Plus } from "lucide-react";
import { TMDB_IMAGE_BASE } from "@/lib/types";
import type { LibraryItem } from "@/lib/types";

interface ListCardProps {
  id: string;
  name: string;
  items: LibraryItem[];
}

export function ListCard({ id, name, items }: ListCardProps) {
  const cover = items[0];

  return (
    <Link
      href={`/lists/${id}`}
      className="focus-ring group flex w-36 shrink-0 snap-start flex-col gap-2 rounded-md text-left sm:w-40"
    >
      <div className="relative aspect-[2/3] w-full overflow-hidden rounded-md bg-surface2 shadow-card transition-shadow duration-300 group-hover:shadow-glow-primary">
        {cover?.poster_path ? (
          <Image
            src={`${TMDB_IMAGE_BASE}${cover.poster_path}`}
            alt={name}
            fill
            sizes="(max-width: 768px) 33vw, 160px"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-muted">
            <List className="h-9 w-9" strokeWidth={1.5} />
          </div>
        )}
      </div>
      <div>
        <p className="line-clamp-1 font-body text-body-md font-medium text-ink">{name}</p>
        <p className="text-body-sm text-muted">
          {items.length} title{items.length === 1 ? "" : "s"}
        </p>
      </div>
    </Link>
  );
}

export function CreateListCard({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="focus-ring flex w-36 shrink-0 snap-start flex-col gap-2 rounded-md text-left sm:w-40"
    >
      <div
        className="flex aspect-[2/3] w-full flex-col items-center justify-center gap-2 rounded-md
          border border-dashed border-surface2 bg-surface text-muted transition-colors
          hover:border-ink hover:text-ink"
      >
        <Plus className="h-8 w-8" strokeWidth={1.5} />
        <span className="px-3 text-center text-caption uppercase">Create a new list</span>
      </div>
    </button>
  );
}
