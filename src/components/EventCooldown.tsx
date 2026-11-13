import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Clock3, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Label } from "@/components/ui/label";
import { cooldownMinutesSchema } from "@/lib/cooldown";
import type { PartyEvent } from "@/lib/events";

export function EventCooldown({ event }: { event: PartyEvent }) {
  const qc = useQueryClient();
  const [saving, setSaving] = useState(false);
  async function change(value: string) {
    const parsed = cooldownMinutesSchema.safeParse(Number(value));
    if (!parsed.success) return;
    setSaving(true);
    try {
      const { data, error } = await supabase.from("events").update({ cooldown_minutes: parsed.data })
        .eq("id", event.id).select("id").single();
      if (error || !data) throw error;
      await qc.invalidateQueries({ queryKey: ["events"] });
      toast.success("Guest cooldown saved");
    } catch { toast.error("Couldn't save the cooldown"); }
    finally { setSaving(false); }
  }
  return (
    <div className="mb-5 flex flex-wrap items-center gap-3 border-b border-border pb-4">
      <Label htmlFor="guest-cooldown" className="flex items-center gap-2"><Clock3 className="h-4 w-4 text-accent" />Guest request cooldown</Label>
      <select id="guest-cooldown" value={event.cooldown_minutes} disabled={saving}
        onChange={(e) => void change(e.target.value)}
        className="h-10 rounded-md border border-input bg-background px-3 text-sm">
        {Array.from({ length: 61 }, (_, minutes) => <option key={minutes} value={minutes}>{minutes === 0 ? "Off" : `${minutes} ${minutes === 1 ? "minute" : "minutes"}`}</option>)}
      </select>
      {saving && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" aria-label="Saving cooldown" />}
    </div>
  );
}