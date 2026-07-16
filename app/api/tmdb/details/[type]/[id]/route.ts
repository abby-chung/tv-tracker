import { NextRequest, NextResponse } from "next/server";
import { getDetails } from "@/lib/tmdb";
import type { CastMember } from "@/lib/types";

// Loose shapes for the raw TMDB response fields we normalize below —
// TMDB's aggregate_credits cast entries carry roles/character info nested
// differently than the plain movie credits endpoint does.
interface RawMovieCastMember {
  id: number;
  name: string;
  character?: string;
  profile_path: string | null;
}
interface RawAggregateCastMember {
  id: number;
  name: string;
  profile_path: string | null;
  roles?: { character: string }[];
}

export async function GET(
  request: NextRequest,
  { params }: { params: { type: string; id: string } }
) {
  const mediaType = params.type === "movie" ? "movie" : "tv";
  try {
    const data = await getDetails(mediaType, params.id);

    // Normalize whichever credits field TMDB returned into a single
    // `credits.cast` shape the client always reads from, capped to a
    // reasonable number for a horizontal-scroll row.
    let cast: CastMember[] = [];
    if (mediaType === "tv" && Array.isArray(data.aggregate_credits?.cast)) {
      cast = (data.aggregate_credits.cast as RawAggregateCastMember[])
        .slice(0, 12)
        .map((c) => ({
          id: c.id,
          name: c.name,
          character: c.roles?.[0]?.character ?? "",
          profile_path: c.profile_path ?? null,
        }));
    } else if (Array.isArray(data.credits?.cast)) {
      cast = (data.credits.cast as RawMovieCastMember[]).slice(0, 12).map((c) => ({
        id: c.id,
        name: c.name,
        character: c.character ?? "",
        profile_path: c.profile_path ?? null,
      }));
    }
    data.credits = { cast };
    delete data.aggregate_credits;

    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json(
      { error: "TMDB request failed", detail: err instanceof Error ? err.message : String(err) },
      { status: 502 }
    );
  }
}
