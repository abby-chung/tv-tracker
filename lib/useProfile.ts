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
 * Display name + avatar live in a dedicated `profiles` table — NOT Supabase
 * auth user_metadata. user_metadata gets embedded directly inside the
 * session JWT (and therefore the session cookie sent on every request), so
 * an avatar photo there quickly exceeds browser/Node HTTP header size
 * limits and can break the whole app with a
 * "431 Request Header Fields Too Large" error. A normal table has no such
 * limit and is only fetched when needed — it still lives on your Supabase
 * account, so it syncs across devices the same way.
 */
export function useProfile() {
  const [profile, setProfile] = useState<Profile>(EMPTY_PROFILE);
  const [loading, setLoading] = useState(!DEMO_MODE);
  const [userId, setUserId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (DEMO_MODE) {
      setProfile({ displayName: "Demo User", avatarUrl: null, email: "demo@example.com" });
      setLoading(false);
      return;
    }
    setLoading(true);
    const supabase = createClient();
    const { data: userData } = await supabase.auth.getUser();
    const uid = userData.user?.id ?? null;
    setUserId(uid);

    if (!uid) {
      setProfile(EMPTY_PROFILE);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("profiles")
      .select("display_name, avatar_url")
      .eq("user_id", uid)
      .maybeSingle();

    if (error) console.error("Failed to load profile:", error.message);

    setProfile({
      displayName: data?.display_name ?? null,
      avatarUrl: data?.avatar_url ?? null,
      email: userData.user?.email ?? null,
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
    if (!userId) return;

    setProfile((prev) => ({
      ...prev,
      displayName: update.displayName !== undefined ? update.displayName : prev.displayName,
      avatarUrl: update.avatarUrl !== undefined ? update.avatarUrl : prev.avatarUrl,
    }));

    const supabase = createClient();
    const { error } = await supabase.from("profiles").upsert(
      {
        user_id: userId,
        ...(update.displayName !== undefined ? { display_name: update.displayName } : {}),
        ...(update.avatarUrl !== undefined ? { avatar_url: update.avatarUrl } : {}),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    );
    if (error) console.error("Failed to update profile:", error.message);
  }

  return { profile, loading, updateProfile, refresh: load };
}
