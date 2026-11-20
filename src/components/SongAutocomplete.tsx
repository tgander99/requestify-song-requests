import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, Music } from "lucide-react";
import { Input } from "@/components/ui/input";
import { searchSongs } from "@/lib/song-search.functions";
import { MIN_QUERY, type Suggestion } from "@/lib/song-search";

export function SongAutocomplete({ value, onChange, onPick }: { value: string; onChange: (v: string) => void; onPick: (s: Suggestion) => void }) {
  const search = useServerFn(searchSongs);
  const [items, setItems] = useState<Suggestion[]>([]);
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const reqId = useRef(0);
  const picked = useRef(false);

  useEffect(() => {
    const q = value.trim();
    const id = ++reqId.current;
    if (picked.current || q.length < MIN_QUERY) { picked.current = false; setItems([]); setState("idle"); return; }
    setState("loading");
    const t = window.setTimeout(async () => {
      try {
        const r = await search({ data: { q } });
        if (id !== reqId.current) return; // stale
        setItems(r.results); setActive(-1); setState(r.error ? "error" : "done");
      } catch { if (id === reqId.current) { setItems([]); setState("error"); } }
    }, 300);
    return () => clearTimeout(t);
  }, [value, search]);

  function pick(s: Suggestion) { picked.current = true; onPick(s); setOpen(false); setItems([]); }
  const show = open && state !== "idle";

  return (
    <div className="relative">
      <Input id="title" value={value} maxLength={120} placeholder="Start typing, e.g. Mr. Brightside" className="h-12 text-base"
        role="combobox" aria-expanded={show} aria-controls="song-suggestions" aria-autocomplete="list" autoComplete="off"
        aria-activedescendant={active >= 0 ? `song-opt-${active}` : undefined}
        onChange={(e) => { onChange(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)} onBlur={() => setTimeout(() => setOpen(false), 150)}
        onKeyDown={(e) => {
          if (!show || !items.length) return;
          if (e.key === "ArrowDown") { e.preventDefault(); setActive((a) => (a + 1) % items.length); }
          else if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => (a <= 0 ? items.length - 1 : a - 1)); }
          else if (e.key === "Enter" && active >= 0) { e.preventDefault(); const s = items[active]; if (s) pick(s); }
          else if (e.key === "Escape") setOpen(false);
        }} />
      {show && (
        <div className="absolute left-0 right-0 top-full z-20 mt-1 overflow-hidden rounded-xl border border-border bg-popover/95 shadow-neon backdrop-blur">
          {state === "loading" && !items.length && <p className="flex items-center gap-2 px-3 py-3 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />Searching…</p>}
          {state === "error" && <p role="status" className="px-3 py-3 text-sm text-muted-foreground">Song search is unavailable — just type the song and artist.</p>}
          {state === "done" && !items.length && <p role="status" className="px-3 py-3 text-sm text-muted-foreground">No matches — type it in manually.</p>}
          {items.length > 0 && (
            <ul id="song-suggestions" role="listbox" aria-label="Song suggestions">
              {items.map((s, i) => (
                <li key={`${s.title}|${s.artist}`} id={`song-opt-${i}`} role="option" aria-selected={i === active}
                  onMouseDown={(e) => { e.preventDefault(); pick(s); }}
                  className={`flex cursor-pointer items-center gap-3 px-3 py-2.5 ${i === active ? "bg-primary/20" : "hover:bg-muted/60"}`}>
                  <Music className="h-4 w-4 shrink-0 text-accent" />
                  <span className="min-w-0"><span className="block truncate text-sm font-medium">{s.title}</span>
                    <span className="block truncate text-xs text-muted-foreground">{s.artist}</span></span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
