import type { ButtonHTMLAttributes, ReactNode } from "react";

type Color = "primary" | "secondary" | "success" | "danger";

interface PillProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean;
  color?: Color;
  children?: ReactNode;
}

// "success" is the one color left in — it marks a "watched" state, which is
// the explicitly allowed structural-accent use case. Everything else is
// strictly monochrome (white/gray), including "danger" (destructive actions
// are conveyed by icon + copy, not hue).
const ACTIVE_CLASSES: Record<Color, string> = {
  primary: "bg-ink text-base",
  secondary: "bg-ink text-base",
  success: "border border-success bg-successSoft text-success",
  danger: "border border-surface3 text-ink",
};

export default function Pill({
  active = false,
  color = "primary",
  children,
  className = "",
  ...rest
}: PillProps) {
  const inactiveClasses =
    color === "danger"
      ? "border border-surface2 text-muted hover:text-ink hover:border-ink"
      : "border border-surface2 text-muted hover:text-ink";

  return (
    <button
      className={`focus-ring inline-flex shrink-0 items-center gap-1.5 rounded-full px-4 py-1.5
        text-body-sm transition-colors ${active ? ACTIVE_CLASSES[color] : inactiveClasses} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}
