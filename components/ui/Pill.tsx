import type { ButtonHTMLAttributes, ReactNode } from "react";

type Color = "primary" | "secondary" | "success" | "danger";

interface PillProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean;
  color?: Color;
  children?: ReactNode;
}

const ACTIVE_CLASSES: Record<Color, string> = {
  primary: "bg-primary text-ink",
  secondary: "bg-secondary text-ink",
  success: "border border-success bg-successSoft text-success",
  danger: "border border-danger/40 text-danger hover:bg-danger/10",
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
      ? ACTIVE_CLASSES.danger
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
