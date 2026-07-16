import { CircleUserRound } from "lucide-react";

interface AvatarProps {
  label?: string; // display name or email — first letter used as initial
  imageSrc?: string | null; // optional photo (incl. data URLs); takes priority over initials
  size?: "sm" | "lg";
}

export default function Avatar({ label, imageSrc, size = "sm" }: AvatarProps) {
  const dimension = size === "lg" ? "h-16 w-16 text-display-md" : "h-9 w-9 text-body-sm";
  const initial = label?.trim()?.[0]?.toUpperCase();

  return (
    <div
      className={`relative flex ${dimension} shrink-0 items-center justify-center overflow-hidden rounded-full
        border border-surface3 bg-surface2 font-display text-ink`}
    >
      {imageSrc ? (
        // A plain <img> is intentional here: avatars are stored as data
        // URLs (see lib/imageResize.ts), which next/image doesn't optimize.
        // eslint-disable-next-line @next/next/no-img-element
        <img src={imageSrc} alt="" className="h-full w-full object-cover" />
      ) : initial ? (
        initial
      ) : (
        <CircleUserRound className="h-1/2 w-1/2" strokeWidth={2} />
      )}
    </div>
  );
}
