const TMDB_BASE = "https://api.themoviedb.org/3";

function credential() {
  const key = process.env.TMDB_API_KEY;
  if (!key) throw new Error("TMDB_API_KEY is not set");
  return key;
}

// TMDB issues two different credential formats and it's an easy mix-up:
// - "API Key (v3 auth)" — a short string, sent as an api_key query param
// - "API Read Access Token" — a long JWT (starts with "eyJ"), sent as a
//   Bearer token in the Authorization header
// This helper supports whichever one was pasted into TMDB_API_KEY, so
// setup doesn't silently fail based on which the user copied.
function isBearerToken(key: string) {
  return key.startsWith("eyJ") && key.split(".").length === 3;
}

async function tmdbFetch(path: string, params: Record<string, string> = {}) {
  const key = credential();
  const url = new URL(`${TMDB_BASE}${path}`);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));

  const headers: Record<string, string> = {};
  if (isBearerToken(key)) {
    headers.Authorization = `Bearer ${key}`;
  } else {
    url.searchParams.set("api_key", key);
  }

  const res = await fetch(url.toString(), { headers, next: { revalidate: 3600 } });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`TMDB request failed: ${res.status} ${res.statusText} ${body}`);
  }
  return res.json();
}

export function searchMulti(query: string) {
  return tmdbFetch("/search/multi", { query, include_adult: "false" });
}

export function discover(mediaType: "tv" | "movie", genreId?: string) {
  return tmdbFetch(`/discover/${mediaType}`, {
    sort_by: "popularity.desc",
    ...(genreId ? { with_genres: genreId } : {}),
  });
}

export function trending(mediaType: "tv" | "movie" | "all" = "all") {
  return tmdbFetch(`/trending/${mediaType}/week`);
}

// TV credits work best via "aggregate_credits" (combines cast across every
// episode/season into one ranked list); movies use the plain "credits"
// endpoint. Both are normalized into the same shape by the API route.
export function getDetails(mediaType: "tv" | "movie", id: string) {
  const parts = [mediaType === "tv" ? "aggregate_credits" : "credits", "recommendations"];
  if (mediaType === "tv") parts.push("seasons");
  return tmdbFetch(`/${mediaType}/${id}`, {
    append_to_response: parts.join(","),
  });
}

export function getSeason(tvId: string, seasonNumber: number) {
  return tmdbFetch(`/tv/${tvId}/season/${seasonNumber}`);
}

export function getGenres(mediaType: "tv" | "movie") {
  return tmdbFetch(`/genre/${mediaType}/list`);
}
