import { NextRequest, NextResponse } from "next/server";
import { searchMulti } from "@/lib/tmdb";
import { DEMO_TRENDING } from "@/lib/demoData";

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q");
  if (!query) {
    return NextResponse.json({ results: [] });
  }

  if (!process.env.TMDB_API_KEY) {
    // No key configured yet (e.g. local preview) — search the sample set.
    const q = query.toLowerCase();
    const results = DEMO_TRENDING.filter((r) =>
      (r.title ?? r.name ?? "").toLowerCase().includes(q)
    );
    return NextResponse.json({ results });
  }

  try {
    const data = await searchMulti(query);
    return NextResponse.json(data);
  } catch (err) {
    console.error("TMDB search failed:", err);
    return NextResponse.json(
      { error: "TMDB search failed", detail: err instanceof Error ? err.message : String(err) },
      { status: 502 }
    );
  }
}
