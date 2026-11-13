import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, QrCode, Loader2, Lock, Unlock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createEvent, type PartyEvent } from "@/lib/events";

export function CreateEventForm({ onCreated, autoFocus }: { onCreated: (e: PartyEvent) => void; autoFocus?: boolean }) {
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const n = name.trim();
    if (!n || n.length > 80) { toast.error("Give the party a name (max 80 characters)"); return; }
    setBusy(true);
    try {
      const ev = await createEvent(n);
      await qc.invalidateQueries({ queryKey: ["events"] });
      setName("");
      onCreated(ev);
    } catch { toast.error("Couldn't create the party"); } finally { setBusy(false); }
  }
  return (
    <form onSubmit={submit} className="flex gap-2">
      <Input aria-label="Party name" placeholder="e.g. Sam's 30th" value={name} onChange={(e) => setName(e.target.value)} maxLength={80} autoFocus={autoFocus} className="h-11" />
      <Button type="submit" variant="neon" className="h-11" disabled={busy}>{busy ? <Loader2 className="animate-spin" /> : <Plus />}Create</Button>
    </form>
  );
}

export function EventBar({ events, current, onSelect }: { events: PartyEvent[]; current: PartyEvent; onSelect: (id: string) => void }) {
  const qc = useQueryClient();
  const [adding, setAdding] = useState(false);
  async function toggleOpen() {
    const { error } = await supabase.from("events").update({ is_open: !current.is_open }).eq("id", current.id);
    if (error) toast.error("Couldn't update"); else qc.invalidateQueries({ queryKey: ["events"] });
  }
  return (
    <div className="mb-5 space-y-3 rounded-2xl border border-border bg-card/60 p-3 backdrop-blur">
      <div className="flex flex-wrap items-center gap-2">
        <select aria-label="Select party" value={current.id} onChange={(e) => onSelect(e.target.value)}
          className="h-10 min-w-0 flex-1 rounded-md border border-input bg-background px-3 text-sm font-medium">
          {events.map((e) => <option key={e.id} value={e.id}>{e.name}{e.is_open ? "" : " (closed)"}</option>)}
        </select>
        <Button variant="glass" size="sm" className="h-10" onClick={() => setAdding((a) => !a)}><Plus />New party</Button>
      </div>
      {adding && <CreateEventForm autoFocus onCreated={(e) => { setAdding(false); onSelect(e.id); toast.success(`${e.name} created`); }} />}
      <div className="flex flex-wrap items-center gap-2">
        <span className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${current.is_open ? "border-success/40 bg-success/15 text-success" : "border-muted-foreground/40 text-muted-foreground"}`}>
          {current.is_open ? "Taking requests" : "Requests closed"}
        </span>
        <Button variant="ghost" size="sm" onClick={toggleOpen}>{current.is_open ? <><Lock />Close requests</> : <><Unlock />Reopen</>}</Button>
        <Button asChild variant="ghost" size="sm" className="ml-auto"><Link to="/qr" search={{ event: current.id }}><QrCode />Guest QR</Link></Button>
      </div>
    </div>
  );
}
