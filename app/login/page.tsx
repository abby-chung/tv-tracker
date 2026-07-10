"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const supabase = createClient();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    setStatus(error ? "error" : "sent");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-base px-4">
      <div className="w-full max-w-sm rounded-card border border-surface2 bg-surface p-8">
        <div className="mb-8 text-center">
          <span className="font-display text-3xl text-glow">◈</span>
          <h1 className="mt-3 font-display text-2xl">WatchReel</h1>
          <p className="mt-1 text-sm text-muted">Track every show and movie you watch.</p>
        </div>

        {status === "sent" ? (
          <p className="text-center text-sm text-ink">
            Check <span className="text-glow">{email}</span> for a sign-in link.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <label className="text-sm text-muted" htmlFor="email">
              Email address
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="focus-ring rounded-card border border-surface2 bg-base px-4 py-3 text-ink placeholder:text-muted"
            />
            <button
              type="submit"
              disabled={status === "sending"}
              className="focus-ring rounded-card bg-glow px-4 py-3 font-display text-base font-medium text-base disabled:opacity-60"
            >
              {status === "sending" ? "Sending link…" : "Send sign-in link"}
            </button>
            {status === "error" && (
              <p className="text-sm text-danger">Something went wrong. Try again.</p>
            )}
          </form>
        )}
      </div>
    </div>
  );
}
