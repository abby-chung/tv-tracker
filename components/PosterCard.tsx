import Image from "next/image";
import { TMDB_IMAGE_BASE } from "@/lib/types";
import ProgressRing from "./ProgressRing";

interface PosterCardProps {
  title: string;
  posterPath: string | null;
  progress?: number; // 0 to 1, shown as a glow ring overlay if provided
  subtitle?: string;
  accent?: "glow" | "movie";
  onClick?: () => void; // view details
  onAdd?: () => void; // shows a "+" button, does not navigate
  onRemove?: () => void; // shows a "×" button, does not navigate
}

export default function PosterCard({
  title,
  posterPath,
  progress,
  subtitle,
  accent = "glow",
  onClick,
  onAdd,
  onRemove,
}: PosterCardProps) {
  const ringColor = accent === "movie" ? "#5B8DEF" : "#F2A93B";

  return (
    <div className="group flex w-full flex-col gap-2 rounded-card text-left">
      <button
        onClick={onClick}
        disabled={!onClick}
        className="focus-ring relative aspect-[2/3] w-full overflow-hidden rounded-card bg-surface2"
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
            <span className="text-3xl">🎞</span>
          </div>
        )}

        {typeof progress === "number" && (
          <div className="absolute bottom-2 right-2">
            <ProgressRing progress={progress} size={34} strokeWidth={4} color={ringColor} />
          </div>
        )}

        {onAdd && (
          <span
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
            className="focus-ring absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-base/80 text-lg text-glow backdrop-blur hover:bg-base"
            aria-label={`Add ${title} to your library`}
          >
            +
          </span>
        )}

        {onRemove && (
          <span
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
            className="focus-ring absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-base/80 text-sm text-danger opacity-0 backdrop-blur transition-opacity hover:bg-base group-hover:opacity-100"
            aria-label={`Remove ${title} from your library`}
          >
            ✕
          </span>
        )}
      </button>
      <div>
        <p className="line-clamp-1 font-body text-sm font-medium text-ink">{title}</p>
        {subtitle && <p className="line-clamp-1 text-xs capitalize text-muted">{subtitle}</p>}
      </div>
    </div>
  );
}
