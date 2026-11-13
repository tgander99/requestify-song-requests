import { createServerFn } from "@tanstack/react-start";
import { setResponseHeader } from "@tanstack/react-start/server";
import { z } from "zod";
import { requestSchema, normalizeSong, slugSchema } from "./request-validation";
import type { CooldownState } from "./cooldown";

type Result = ({ ok: true } | { ok: false; error: string }) & Partial<CooldownState>;

/** Public: only exposes an event's display name and open state — never requests. */
export const getPublicEvent = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) => z.object({ slug: slugSchema }).parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: ev } = await supabaseAdmin.from("events").select("name, is_open").eq("slug", data.slug).maybeSingle();
    return ev ? { name: ev.name, isOpen: ev.is_open } : null;
  });

export const submitSongRequest = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => requestSchema.extend({ slug: slugSchema }).parse(input))
  .handler(async ({ data }): Promise<Result> => {
    setResponseHeader("Cache-Control", "no-store");
    if (data.website) return { ok: true }; // silently drop bots
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { guestHash } = await import("./guest-identity.server");
    const { data: result, error } = await supabaseAdmin.rpc("submit_event_song_request", {
      p_slug: data.slug, p_guest_hash: await guestHash(), p_title: data.title,
      p_artist: data.artist, p_guest_name: data.guestName, p_message: data.message,
      p_normalized_key: normalizeSong(data.title, data.artist),
    });
    if (error) return { ok: false, error: "Couldn't send your request. Please try again." };
    return result as Result;
  });

/** Only this browser's cooldown is exposed, never queue data or guest identities. */
export const getGuestCooldown = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => z.object({ slug: slugSchema }).parse(input))
  .handler(async ({ data }): Promise<CooldownState> => {
    setResponseHeader("Cache-Control", "no-store");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { guestHash } = await import("./guest-identity.server");
    const hash = await guestHash();
    const { data: ev, error } = await supabaseAdmin.from("events").select("id, cooldown_minutes").eq("slug", data.slug).maybeSingle();
    if (error || !ev) throw new Error("Couldn't check the party cooldown.");
    const { data: activity, error: activityError } = await supabaseAdmin.from("guest_request_activity")
      .select("last_requested_at").eq("event_id", ev.id).eq("guest_hash", hash).maybeSingle();
    if (activityError) throw new Error("Couldn't check the party cooldown.");
    const remainingSeconds = !activity || ev.cooldown_minutes === 0 ? 0 : Math.max(0,
      Math.ceil((Date.parse(activity.last_requested_at) + ev.cooldown_minutes * 60_000 - Date.now()) / 1000));
    return { remainingSeconds, cooldownMinutes: ev.cooldown_minutes };
  });
