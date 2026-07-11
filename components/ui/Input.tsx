import type { InputHTMLAttributes } from "react";
import { X } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  icon?: LucideIcon;
  onClear?: () => void;
}

export default function Input({ icon: Icon, onClear, className = "", ...rest }: InputProps) {
  const showClear = onClear && Boolean(rest.value);

  return (
    <div className="relative">
      {Icon && (
        <Icon
          className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
          strokeWidth={2}
        />
      )}
      <input
        className={`focus-ring w-full rounded-md border border-surface2 bg-surface text-body-md text-ink
          placeholder:text-muted ${Icon ? "pl-11" : "px-4"} ${showClear ? "pr-10" : "pr-4"} py-3 ${className}`}
        {...rest}
      />
      {showClear && (
        <button
          type="button"
          onClick={onClear}
          aria-label="Clear search"
          className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-muted
            hover:bg-surface2 hover:text-ink transition-colors"
        >
          <X className="h-4 w-4" strokeWidth={2} />
        </button>
      )}
    </div>
  );
}
