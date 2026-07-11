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

const VARIANT_CLASSES: Record<Variant, string> = {
  primary: "bg-primary text-ink hover:shadow-glow-primary",
  secondary: "bg-secondary text-ink hover:shadow-glow-secondary",
  ghost: "text-muted hover:text-ink",
  destructive: "border border-danger/40 text-danger hover:bg-danger/10",
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
