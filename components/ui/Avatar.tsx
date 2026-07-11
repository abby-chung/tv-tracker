import { CircleUserRound } from "lucide-react";

interface AvatarProps {
  label?: string; // email or display name — first letter used as initial
  size?: "sm" | "lg";
}

export default function Avatar({ label, size = "sm" }: AvatarProps) {
  const dimension = size === "lg" ? "h-16 w-16 text-display-md" : "h-9 w-9 text-body-sm";
  const initial = label?.trim()?.[0]?.toUpperCase();

  return (
    <div
      className={`flex ${dimension} shrink-0 items-center justify-center rounded-full
        bg-primarySoft font-display text-primary`}
    >
      {initial ?? <CircleUserRound className="h-1/2 w-1/2" strokeWidth={2} />}
    </div>
  );
}
