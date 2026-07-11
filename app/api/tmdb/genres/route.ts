import { NextRequest, NextResponse } from "next/server";
import { getGenres } from "@/lib/tmdb";
import { DEMO_GENRES } from "@/lib/demoData";

export async function GET(request: NextRequest) {
  const mediaType = (request.nextUrl.searchParams.get("type") as "tv" | "movie") || "tv";

  if (!process.env.TMDB_API_KEY) {
    // No key configured yet (e.g. local preview) — use the static fallback map.
    return NextResponse.json({ genres: DEMO_GENRES[mediaType] });
  }

  try {
    const data = await getGenres(mediaType);
    return NextResponse.json(data);
  } catch (err) {
    console.error("TMDB genres fetch failed:", err);
    // Fall back to the static map rather than breaking the stats page.
    return NextResponse.json({ genres: DEMO_GENRES[mediaType] });
  }
}
