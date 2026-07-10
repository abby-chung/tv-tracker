"use client";

import { useMemo, useState } from "react";
import { useEffect } from "react";
import ProgressRing from "@/components/ProgressRing";
import { useLibrary } from "@/lib/useLibrary";
import { createClient } from "@/lib/supabase/client";

export default function ProfilePage() {
  const { watched: tvWatched, items: tvItems } = useLibrary("tv");
  const { watched: movieWatched, items: movieItems } = useLibrary("movie");
  const [email, setEmail] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? null));
  }, [supabase]);

  const tvMinutes = useMemo(
    () => tvWatched.reduce((sum, w) => sum + (w.runtime_minutes || 0), 0),
    [tvWatched]
  );
  const movieMinutes = useMemo(
    () => movieWatched.reduce((sum, w) => sum + (w.runtime_minutes || 0), 0),
    [movieWatched]
  );
  const totalMinutes = tvMinutes + movieMinutes;
  const totalHours = Math.floor(totalMinutes / 60);
  const totalDays = (totalHours / 24).toFixed(1);

  // Weekly-target style ring just for visual interest: fills as total hours
  // climb toward a rolling 1000-hour milestone, wrapping around.
  const ringProgress = (totalHours % 1000) / 1000;

  async function handleSignOut() {
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  return (
    <div className="flex flex-col gap-10">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl">Profile</h1>
          {email && <p className="mt-1 text-sm text-muted">{email}</p>}
        </div>
        <button
          onClick={handleSignOut}
          className="focus-ring rounded-card border border-surface2 px-3 py-1.5 text-sm text-muted hover:text-ink"
        >
          Sign out
        </button>
      </header>

      {/* Hero: the watch-time clock, the signature glow ring at large scale */}
      <section className="flex flex-col items-center gap-6 rounded-card border border-surface2 bg-surface py-10">
        <ProgressRing progress={ringProgress} size={180} strokeWidth={10}>
          <div className="flex flex-col items-center">
            <span className="font-mono text-3xl text-ink">{totalHours}</span>
            <span className="text-xs text-muted">hours watched</span>
          </div>
        </ProgressRing>
        <p className="font-body text-sm text-muted">
          That&apos;s about <span className="text-glow">{totalDays} days</span> of your life
        </p>
      </section>

      {/* Split stats */}
      <section className="grid grid-cols-2 gap-4">
        <StatCard
          label="TV Time"
          value={`${Math.floor(tvMinutes / 60)}h`}
          detail={`${tvWatched.length} episodes · ${tvItems.length} shows`}
          color="#F2A93B"
        />
        <StatCard
          label="Movie Time"
          value={`${Math.floor(movieMinutes / 60)}h`}
          detail={`${movieWatched.length} watched · ${movieItems.length} tracked`}
          color="#5B8DEF"
        />
      </section>

      <section>
        <h2 className="mb-3 font-display text-lg text-muted">Library totals</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <MiniStat label="Shows tracked" value={tvItems.length} />
          <MiniStat label="Movies tracked" value={movieItems.length} />
          <MiniStat label="Episodes watched" value={tvWatched.length} />
          <MiniStat label="Movies watched" value={movieWatched.length} />
        </div>
      </section>
    </div>
  );
}

function StatCard({
  label,
  value,
  detail,
  color,
}: {
  label: string;
  value: string;
  detail: string;
  color: string;
}) {
  return (
    <div className="rounded-card border border-surface2 bg-surface p-5">
      <p className="text-xs uppercase tracking-wide text-muted">{label}</p>
      <p className="mt-1 font-mono text-2xl" style={{ color }}>
        {value}
      </p>
      <p className="mt-1 text-xs text-muted">{detail}</p>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-card border border-surface2 bg-surface p-4 text-center">
      <p className="font-mono text-xl text-ink">{value}</p>
      <p className="mt-1 text-xs text-muted">{label}</p>
    </div>
  );
}
