"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const searchParams = useSearchParams();
  const linkExpired = searchParams.get("error") === "link_expired";
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
      <Card padding="lg" className="w-full max-w-sm rounded-lg">
        <div className="mb-8 text-center">
          <Sparkles className="mx-auto h-8 w-8 text-ink" strokeWidth={2} />
          <h1 className="mt-3 font-display text-display-lg">WatchReel</h1>
          <p className="mt-1 text-body-sm text-muted">Track every show and movie you watch.</p>
        </div>

        {linkExpired && (
          <p className="mb-4 rounded-md border border-surface3 bg-surface2 px-4 py-3 text-center text-body-sm text-ink">
            That sign-in link has expired. Enter your email to get a new one.
          </p>
        )}

        {status === "sent" ? (
          <p className="text-center text-body-sm text-ink">
            Check <span className="font-medium text-ink">{email}</span> for a sign-in link.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <label className="text-body-sm text-muted" htmlFor="email">
              Email address
            </label>
            <Input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
            <Button type="submit" disabled={status === "sending"} className="w-full">
              {status === "sending" ? "Sending link…" : "Send sign-in link"}
            </Button>
            {status === "error" && (
              <p className="text-body-sm text-muted">Something went wrong. Try again.</p>
            )}
          </form>
        )}
      </Card>
    </div>
  );
}
