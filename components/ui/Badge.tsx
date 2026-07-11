import type { ReactNode } from "react";

type Color = "primary" | "secondary" | "success";

interface BadgeProps {
  color?: Color;
  children: ReactNode;
  className?: string;
}

const COLOR_CLASSES: Record<Color, string> = {
  primary: "bg-surface2 text-ink",
  secondary: "bg-surface2 text-ink",
  success: "bg-successSoft text-success",
};

export default function Badge({ color = "primary", children, className = "" }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-sm px-2 py-0.5 text-caption uppercase
        ${COLOR_CLASSES[color]} ${className}`}
    >
      {children}
    </span>
  );
}
