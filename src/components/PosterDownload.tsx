import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { FileDown, ImageDown, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { guestPath, type PartyEvent } from "@/lib/events";
import { renderPoster, posterPng, posterPdf, downloadBlob } from "@/lib/poster";

export function PosterDownload({ event }: { event: PartyEvent }) {
  const qc = useQueryClient();
  const [name, setName] = useState(event.dj_name ?? "");
  const [busy, setBusy] = useState<"pdf" | "png" | null>(null);
  useEffect(() => setName(event.dj_name ?? ""), [event.id, event.dj_name]);

  async function saveName() {
    const v = name.trim().slice(0, 60) || null;
    if (v === (event.dj_name ?? null)) return;
    const { error } = await supabase.from("events").update({ dj_name: v }).eq("id", event.id);
    if (error) toast.error("Couldn't save DJ name"); else qc.invalidateQueries({ queryKey: ["events"] });
  }
  async function download(kind: "pdf" | "png") {
    setBusy(kind);
    try {
      await saveName();
      const url = `${window.location.origin}${guestPath(event.slug)}`;
      const png = await posterPng(await renderPoster(name.trim() || "the DJ", url));
      const file = `requestify-${event.slug}-poster.${kind}`;
      downloadBlob(kind === "png" ? png : await posterPdf(png), file);
    } catch { toast.error("Couldn't create the poster"); } finally { setBusy(null); }
  }
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Input aria-label="DJ display name" placeholder="DJ name on poster" value={name} maxLength={60}
        onChange={(e) => setName(e.target.value)} onBlur={saveName} className="h-9 min-w-0 flex-1 basis-40" />
      <Button size="sm" variant="neon" onClick={() => download("pdf")} disabled={!!busy}>
        {busy === "pdf" ? <Loader2 className="animate-spin" /> : <FileDown />}Download poster (PDF)</Button>
      <Button size="sm" variant="glass" onClick={() => download("png")} disabled={!!busy}>
        {busy === "png" ? <Loader2 className="animate-spin" /> : <ImageDown />}PNG</Button>
    </div>
  );
}
