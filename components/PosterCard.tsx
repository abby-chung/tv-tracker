import Image from "next/image";
import { Clapperboard, Plus, X, Heart } from "lucide-react";
import { TMDB_IMAGE_BASE } from "@/lib/types";
import ProgressRing from "./ProgressRing";
import IconButton from "./ui/IconButton";

interface PosterCardProps {
  title: string;
  posterPath: string | null;
  progress?: number; // 0 to 1, shown as a glow ring overlay if provided
  subtitle?: string;
  accent?: "primary" | "secondary";
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
  accent = "primary",
  favorite,
  onClick,
  onAdd,
  onRemove,
  onToggleFavorite,
}: PosterCardProps) {
  const ringColor = accent === "secondary" ? "#FF6B8B" : "#F4C430";

  return (
    <div className="group flex w-full flex-col gap-2 rounded-md text-left">
      <div className="relative aspect-[2/3] w-full">
        <button
          onClick={onClick}
          disabled={!onClick}
          className="focus-ring relative h-full w-full overflow-hidden rounded-md bg-surface2
            shadow-card transition-shadow duration-300 group-hover:shadow-glow-primary"
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

          {typeof progress === "number" && (
            <div className="absolute bottom-2 right-2">
              <ProgressRing progress={progress} size={34} strokeWidth={4} color={ringColor} />
            </div>
          )}
        </button>

        {onToggleFavorite && (
          <div className="absolute left-2 top-2 z-10">
            <IconButton
              icon={Heart}
              label={favorite ? `Remove ${title} from favorites` : `Add ${title} to favorites`}
              tone="danger"
              filled={favorite}
              onClick={(e) => {
                e.stopPropagation();
                onToggleFavorite();
              }}
            />
          </div>
        )}

        {onAdd && (
          <div className="absolute right-2 top-2 z-10">
            <IconButton
              icon={Plus}
              label={`Add ${title} to your library`}
              tone="primary"
              onClick={(e) => {
                e.stopPropagation();
                onAdd();
              }}
            />
          </div>
        )}

        {onRemove && (
          <div className="absolute right-2 top-2 z-10 opacity-0 transition-opacity group-hover:opacity-100">
            <IconButton
              icon={X}
              label={`Remove ${title} from your library`}
              tone="danger"
              onClick={(e) => {
                e.stopPropagation();
                onRemove();
              }}
            />
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
