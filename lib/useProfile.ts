"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { DEMO_MODE } from "@/lib/demoData";

export interface Profile {
  displayName: string | null;
  avatarUrl: string | null;
  email: string | null;
}

const EMPTY_PROFILE: Profile = { displayName: null, avatarUrl: null, email: null };

/**
 * Display name + avatar are stored directly on the Supabase auth user
 * (user_metadata), not a separate table — no schema migration needed.
 * Because that record lives on your Supabase account rather than the
 * browser, it's the same on every device you sign into.
 */
export function useProfile() {
  const [profile, setProfile] = useState<Profile>(EMPTY_PROFILE);
  const [loading, setLoading] = useState(!DEMO_MODE);

  const load = useCallback(async () => {
    if (DEMO_MODE) {
      setProfile({ displayName: "Demo User", avatarUrl: null, email: "demo@example.com" });
      setLoading(false);
      return;
    }
    setLoading(true);
    const supabase = createClient();
    const { data } = await supabase.auth.getUser();
    setProfile({
      displayName: (data.user?.user_metadata?.display_name as string | undefined) ?? null,
      avatarUrl: (data.user?.user_metadata?.avatar_url as string | undefined) ?? null,
      email: data.user?.email ?? null,
    });
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function updateProfile(update: { displayName?: string; avatarUrl?: string | null }) {
    // Preview mode is read-only, same as every other library/list mutation
    // in demo mode — no backend to actually save to yet.
    if (DEMO_MODE) return;

    setProfile((prev) => ({
      ...prev,
      displayName: update.displayName !== undefined ? update.displayName : prev.displayName,
      avatarUrl: update.avatarUrl !== undefined ? update.avatarUrl : prev.avatarUrl,
    }));

    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({
      data: {
        ...(update.displayName !== undefined ? { display_name: update.displayName } : {}),
        ...(update.avatarUrl !== undefined ? { avatar_url: update.avatarUrl } : {}),
      },
    });
    if (error) console.error("Failed to update profile:", error.message);
  }

  return { profile, loading, updateProfile, refresh: load };
}
