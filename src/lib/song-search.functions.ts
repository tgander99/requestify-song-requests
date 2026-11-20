import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { dedupeSuggestions, MIN_QUERY, type Suggestion } from "./song-search";

// Public catalogue lookup (no credentials). Deezer handles partial words well; iTunes (UK) is the fallback.
export const searchSongs = createServerFn({ method: "GET" })
  .inputValidator((d) => z.object({ q: z.string().trim().min(MIN_QUERY).max(80) }).parse(d))
  .handler(async ({ data }): Promise<{ results: Suggestion[]; error?: string }> => {
    const q = encodeURIComponent(data.q);
    const get = async (url: string) => {
      const r = await fetch(url, { signal: AbortSignal.timeout(4000) });
      if (!r.ok) throw new Error(String(r.status));
      return r.json() as Promise<Record<string, unknown>>;
    };
    try {
      const j = await get(`https://api.deezer.com/search/track?q=${q}&limit=15`);
      const rows = (j["data"] as { title?: string; artist?: { name?: string } }[] | undefined) ?? [];
      const res = dedupeSuggestions(rows.map((r) => ({ title: r.title ?? "", artist: r.artist?.name ?? "" })));
      if (res.length) return { results: res };
    } catch (e) { console.error("deezer search failed", e); }
    try {
      const j = await get(`https://itunes.apple.com/search?term=${q}&country=GB&media=music&entity=song&limit=15`);
      const rows = (j["results"] as { trackName?: string; artistName?: string }[] | undefined) ?? [];
      return { results: dedupeSuggestions(rows.map((r) => ({ title: r.trackName ?? "", artist: r.artistName ?? "" }))) };
    } catch (e) {
      console.error("itunes search failed", e);
      return { results: [], error: "unavailable" };
    }
  });
