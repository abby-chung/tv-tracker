import type { InputHTMLAttributes } from "react";
import type { LucideIcon } from "lucide-react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  icon?: LucideIcon;
}

export default function Input({ icon: Icon, className = "", ...rest }: InputProps) {
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
          placeholder:text-muted ${Icon ? "pl-11 pr-4" : "px-4"} py-3 ${className}`}
        {...rest}
      />
    </div>
  );
}
