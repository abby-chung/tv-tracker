import type { LucideIcon } from "lucide-react";

interface TimeStatCardProps {
  icon: LucideIcon;
  label: string;
  months: number;
  days: number;
  hours: number;
}

/** A bordered card showing a duration broken into months / days / hours. */
export function TimeStatCard({ icon: Icon, label, months, days, hours }: TimeStatCardProps) {
  return (
    <div className="min-w-[240px] shrink-0 rounded-md border border-surface2">
      <div className="flex items-center gap-2 border-b border-surface2 px-4 py-3">
        <Icon className="h-4 w-4 text-ink" strokeWidth={2} />
        <span className="text-body-md font-medium text-ink">{label}</span>
      </div>
      <div className="grid grid-cols-3 gap-2 px-4 py-5 text-center">
        <TimeUnit value={months} label="Months" />
        <TimeUnit value={days} label="Days" />
        <TimeUnit value={hours} label="Hours" />
      </div>
    </div>
  );
}

function TimeUnit({ value, label }: { value: number; label: string }) {
  return (
    <div>
      <p className="font-mono text-stat-lg text-ink">{value}</p>
      <p className="mt-1 text-caption text-muted">{label}</p>
    </div>
  );
}

interface CountStatCardProps {
  icon: LucideIcon;
  label: string;
  value: number;
}

/** A bordered card showing a single large count. */
export function CountStatCard({ icon: Icon, label, value }: CountStatCardProps) {
  return (
    <div className="min-w-[200px] shrink-0 rounded-md border border-surface2">
      <div className="flex items-center gap-2 border-b border-surface2 px-4 py-3">
        <Icon className="h-4 w-4 text-ink" strokeWidth={2} />
        <span className="text-body-md font-medium text-ink">{label}</span>
      </div>
      <div className="flex items-center justify-center px-4 py-5">
        <p className="font-mono text-stat-lg text-ink">{value.toLocaleString()}</p>
      </div>
    </div>
  );
}

/** Breaks total minutes down into whole months / remaining days / remaining hours. */
export function breakdownTime(totalMinutes: number) {
  const totalHours = Math.floor(totalMinutes / 60);
  const totalFullDays = Math.floor(totalHours / 24);
  const months = Math.floor(totalFullDays / 30);
  const days = totalFullDays % 30;
  const hours = totalHours % 24;
  return { months, days, hours };
}
