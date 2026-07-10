import { NextRequest, NextResponse } from "next/server";
import { getSeason } from "@/lib/tmdb";

export async function GET(
  request: NextRequest,
  { params }: { params: { tvId: string; season: string } }
) {
  try {
    const data = await getSeason(params.tvId, Number(params.season));
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json(
      { error: "TMDB request failed", detail: err instanceof Error ? err.message : String(err) },
      { status: 502 }
    );
  }
}
