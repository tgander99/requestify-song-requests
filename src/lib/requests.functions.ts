import { createServerFn } from "@tanstack/react-start";
import { getRequestHeader } from "@tanstack/react-start/server";
import { requestSchema, normalizeSong, RATE_LIMIT, DUPLICATE_WINDOW_HOURS } from "./request-validation";

type Result = { ok: true } | { ok: false; error: string };

async function sha256(s: string) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

export const submitSongRequest = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => requestSchema.parse(input))
  .handler(async ({ data }): Promise<Result> => {
    if (data.website) return { ok: true }; // silently drop bots
    const ip =
      getRequestHeader("cf-connecting-ip") ??
      getRequestHeader("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
    const ua = getRequestHeader("user-agent") ?? "";
    const clientHash = await sha256(`${ip}|${ua}`);
    const key = normalizeSong(data.title, data.artist);

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const since = new Date(Date.now() - RATE_LIMIT.windowMinutes * 60_000).toISOString();
    const { count, error: cErr } = await supabaseAdmin
      .from("song_requests").select("id", { count: "exact", head: true })
      .eq("client_hash", clientHash).gte("created_at", since);
    if (cErr) return { ok: false, error: "Couldn't reach the DJ booth. Try again in a moment." };
    if ((count ?? 0) >= RATE_LIMIT.max)
      return { ok: false, error: `Easy there! Max ${RATE_LIMIT.max} requests every ${RATE_LIMIT.windowMinutes} minutes.` };

    const dupSince = new Date(Date.now() - DUPLICATE_WINDOW_HOURS * 3600_000).toISOString();
    const { data: dup } = await supabaseAdmin
      .from("song_requests").select("id, status").eq("normalized_key", key)
      .in("status", ["pending", "approved"]).gte("created_at", dupSince).limit(1);
    if (dup && dup.length) return { ok: false, error: "Someone already requested this one — it's in the queue!" };

    const { error } = await supabaseAdmin.from("song_requests").insert({
      title: data.title, artist: data.artist,
      guest_name: data.guestName || null, message: data.message || null,
      normalized_key: key, client_hash: clientHash,
    });
    if (error) return { ok: false, error: "Couldn't send your request. Please try again." };
    return { ok: true };
  });
