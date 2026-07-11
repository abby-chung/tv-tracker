import type { ButtonHTMLAttributes, ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

type Variant = "primary" | "secondary" | "ghost" | "destructive";
type Size = "sm" | "md";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  icon?: LucideIcon;
  children?: ReactNode;
}

// Strictly monochrome: "primary" and "secondary" render identically (solid
// white on black) since color is no longer used to distinguish tv/movie —
// that distinction now lives in icon/copy only, not hue.
const VARIANT_CLASSES: Record<Variant, string> = {
  primary: "bg-ink text-base hover:shadow-glow",
  secondary: "bg-ink text-base hover:shadow-glow",
  ghost: "text-muted hover:text-ink",
  destructive: "border border-surface3 text-muted hover:text-ink hover:border-ink",
};

const SIZE_CLASSES: Record<Size, string> = {
  sm: "px-3 py-1.5 text-body-sm gap-1.5",
  md: "px-5 py-2.5 text-body-md gap-2",
};

export default function Button({
  variant = "primary",
  size = "md",
  icon: Icon,
  children,
  className = "",
  ...rest
}: ButtonProps) {
  return (
    <button
      className={`focus-ring inline-flex items-center justify-center rounded-md font-display font-medium
        transition-all duration-150 disabled:opacity-60 disabled:hover:shadow-none
        ${VARIANT_CLASSES[variant]} ${SIZE_CLASSES[size]} ${className}`}
      {...rest}
    >
      {Icon && <Icon className="h-4 w-4" strokeWidth={2} />}
      {children}
    </button>
  );
}
