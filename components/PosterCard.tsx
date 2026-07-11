import Image from "next/image";
import { Clapperboard, Plus, X, Heart } from "lucide-react";
import { TMDB_IMAGE_BASE } from "@/lib/constants";
import IconButton from "./ui/IconButton";

interface PosterCardProps {
  title: string;
  posterPath: string | null;
  /** 0 to 1. Shown as a progress bar at the bottom of the poster. */
  progress?: number;
  subtitle?: string;
  favorite?: boolean; // shows a heart toggle overlay if defined (undefined = hidden)
  onClick?: () => void; // view details
  onAdd?: () => void; // shows a "+" button, does not navigate
  onRemove?: () => void; // shows a "×" button, does not navigate
  onToggleFavorite?: () => void; // shows a heart button, does not navigate
}

export default function PosterCard({
  title,
  posterPath,
  progress,
  subtitle,
  favorite,
  onClick,
  onAdd,
  onRemove,
  onToggleFavorite,
}: PosterCardProps) {
  const isComplete = typeof progress === "number" && progress >= 1;

  return (
    <div className="group flex w-full flex-col gap-2 rounded-md text-left">
      {/* Use a div + role="button" so action overlays are never nested
          inside a <button> — that would be invalid HTML. */}
      <div
        role={onClick ? "button" : undefined}
        tabIndex={onClick ? 0 : undefined}
        onClick={onClick}
        onKeyDown={
          onClick
            ? (e) => {
                if (e.key === "Enter" || e.key === " ") onClick();
              }
            : undefined
        }
        className={`focus-ring relative aspect-[2/3] w-full overflow-hidden rounded-md bg-surface2
          shadow-card transition-shadow duration-300 group-hover:shadow-glow
          ${onClick ? "cursor-pointer" : ""}`}
      >
        {posterPath ? (
          <Image
            src={`${TMDB_IMAGE_BASE}${posterPath}`}
            alt={title}
            fill
            sizes="(max-width: 768px) 33vw, 160px"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-muted">
            <Clapperboard className="h-9 w-9" strokeWidth={1.5} />
          </div>
        )}

        {/* Progress bar — replaces the ring. Yellow while in-progress, green when done. */}
        {typeof progress === "number" && progress > 0 && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/40">
            <div
              className={`h-full transition-all duration-300 ${isComplete ? "bg-success" : "bg-[#F4C430]"}`}
              style={{ width: `${Math.min(1, progress) * 100}%` }}
            />
          </div>
        )}

        {onToggleFavorite && (
          <div
            role="button"
            tabIndex={0}
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite();
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.stopPropagation();
                onToggleFavorite();
              }
            }}
            className="absolute left-2 top-2"
          >
            <IconButton
              icon={Heart}
              label={favorite ? `Remove ${title} from favorites` : `Add ${title} to favorites`}
              tone="favorite"
              filled={favorite}
            />
          </div>
        )}

        {onAdd && (
          <div
            role="button"
            tabIndex={0}
            onClick={(e) => {
              e.stopPropagation();
              onAdd();
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.stopPropagation();
                onAdd();
              }
            }}
            className="absolute right-2 top-2"
          >
            <IconButton icon={Plus} label={`Add ${title} to your library`} tone="ink" />
          </div>
        )}

        {onRemove && (
          <div
            role="button"
            tabIndex={0}
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.stopPropagation();
                onRemove();
              }
            }}
            className="absolute right-2 top-2 opacity-0 transition-opacity group-hover:opacity-100"
          >
            <IconButton icon={X} label={`Remove ${title} from your library`} tone="ink" />
          </div>
        )}
      </div>
      <div>
        <p className="line-clamp-1 font-body text-body-md font-medium text-ink">{title}</p>
        {subtitle && <p className="line-clamp-1 text-body-sm capitalize text-muted">{subtitle}</p>}
      </div>
    </div>
  );
}
