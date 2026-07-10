import { NextRequest, NextResponse } from "next/server";
import { discover, trending } from "@/lib/tmdb";
import { DEMO_TRENDING } from "@/lib/demoData";

export async function GET(request: NextRequest) {
  if (!process.env.TMDB_API_KEY) {
    // No key configured yet (e.g. local preview) — return sample data.
    return NextResponse.json({ results: DEMO_TRENDING });
  }

  const mediaType = (request.nextUrl.searchParams.get("type") as "tv" | "movie") || "tv";
  const genreId = request.nextUrl.searchParams.get("genre") || undefined;
  const mode = request.nextUrl.searchParams.get("mode") || "discover";

  try {
    const data =
      mode === "trending" ? await trending(mediaType) : await discover(mediaType, genreId);
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: "TMDB request failed" }, { status: 502 });
  }
}
