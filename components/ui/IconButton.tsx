import type { ButtonHTMLAttributes } from "react";
import type { LucideIcon } from "lucide-react";

type Variant = "solid" | "ghost" | "outline" | "filled";
type Tone = "ink" | "primary" | "danger" | "success" | "favorite";

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: LucideIcon;
  label: string; // required for aria-label — these are icon-only controls
  variant?: Variant;
  tone?: Tone;
  filled?: boolean; // fills the icon glyph itself (e.g. a heart), independent of variant
}

const TONE_TEXT: Record<Tone, string> = {
  ink: "text-ink",
  primary: "text-ink",
  danger: "text-muted",
  success: "text-success",
  favorite: "text-red-500",
};

const FILLED_BG: Record<Tone, string> = {
  ink: "bg-ink text-base",
  primary: "bg-ink text-base",
  danger: "bg-ink text-base",
  success: "bg-success text-base",
  favorite: "bg-red-500 text-base",
};

function variantClasses(variant: Variant, tone: Tone): string {
  switch (variant) {
    case "solid":
      return `bg-base/80 backdrop-blur hover:bg-base ${TONE_TEXT[tone]}`;
    case "outline":
      return "border border-surface2 text-muted hover:text-ink hover:border-ink";
    case "filled":
      return FILLED_BG[tone];
    case "ghost":
    default:
      return `hover:bg-surface2 ${TONE_TEXT[tone]}`;
  }
}

export default function IconButton({
  icon: Icon,
  label,
  variant = "solid",
  tone = "ink",
  filled = false,
  className = "",
  ...rest
}: IconButtonProps) {
  return (
    <button
      aria-label={label}
      className={`focus-ring flex h-7 w-7 items-center justify-center rounded-full
        transition-colors ${variantClasses(variant, tone)} ${className}`}
      {...rest}
    >
      <Icon className="h-4 w-4" strokeWidth={2} fill={filled ? "currentColor" : "none"} />
    </button>
  );
}
