export type Suggestion = { title: string; artist: string };
export const MIN_QUERY = 2;
export const MAX_RESULTS = 6;

/** Remove duplicates (same title+artist, case-insensitive) and cap the list. */
export function dedupeSuggestions(list: Suggestion[], max = MAX_RESULTS): Suggestion[] {
  const seen = new Set<string>();
  const out: Suggestion[] = [];
  for (const s of list) {
    const t = s.title.trim(), a = s.artist.trim();
    if (!t || !a) continue;
    const k = `${t}|${a}`.toLowerCase();
    if (seen.has(k)) continue;
    seen.add(k); out.push({ title: t.slice(0, 120), artist: a.slice(0, 120) });
    if (out.length >= max) break;
  }
  return out;
}
