import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");

  if (!code) {
    // No code param — likely a direct navigation; just send to login.
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const supabase = createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    // Exchange failed (expired link, replay attempt, etc.) — redirect to
    // login with an error flag so the page can show a helpful message.
    const url = new URL("/login", request.url);
    url.searchParams.set("error", "link_expired");
    return NextResponse.redirect(url);
  }

  return NextResponse.redirect(new URL("/profile", request.url));
}
