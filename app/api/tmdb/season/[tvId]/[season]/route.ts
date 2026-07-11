import { NextRequest, NextResponse } from "next/server";
import { getSeason } from "@/lib/tmdb";

export async function GET(
  request: NextRequest,
  { params }: { params: { tvId: string; season: string } }
) {
  const seasonNumber = Number(params.season);
  if (!Number.isInteger(seasonNumber) || seasonNumber < 0) {
    return NextResponse.json({ error: "Invalid season number" }, { status: 400 });
  }

  try {
    const data = await getSeason(params.tvId, seasonNumber);
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json(
      { error: "TMDB request failed", detail: err instanceof Error ? err.message : String(err) },
      { status: 502 }
    );
  }
}
