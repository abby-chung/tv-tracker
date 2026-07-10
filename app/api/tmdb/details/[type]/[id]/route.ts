import { NextRequest, NextResponse } from "next/server";
import { getDetails } from "@/lib/tmdb";

export async function GET(
  request: NextRequest,
  { params }: { params: { type: string; id: string } }
) {
  const mediaType = params.type === "movie" ? "movie" : "tv";
  try {
    const data = await getDetails(mediaType, params.id);
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: "TMDB request failed" }, { status: 502 });
  }
}
