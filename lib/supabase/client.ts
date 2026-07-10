import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  // In demo mode there's no real Supabase project yet, so fall back to
  // placeholder values. No real network calls are made against these in
  // demo mode (see lib/useLibrary.ts and lib/demoData.ts).
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://demo.supabase.co";
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "demo-key";
  return createBrowserClient(url, key);
}
