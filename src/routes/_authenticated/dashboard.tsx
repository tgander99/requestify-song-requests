import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Check, X, Disc3, Trash2, Bell, BellOff, Loader2, AlertTriangle, Inbox, ShieldAlert } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { AdminNav } from "@/components/AdminNav";
import { useIsAdmin } from "@/lib/use-is-admin";
import { useEvents, type PartyEvent } from "@/lib/events";
import { EventBar, CreateEventForm } from "@/components/EventBar";

type Req = Database["public"]["Tables"]["song_requests"]["Row"];
type Status = Req["status"];

export const Route = createFileRoute("/_authenticated/dashboard")({
  validateSearch: (s: Record<string, unknown>): { event?: string } =>
    typeof s.event === "string" ? { event: s.event } : {},
  head: () => ({
    meta: [
      { title: "DJ Dashboard — Requestify" },
      { name: "description", content: "Live song request queue for the DJ." },
      { property: "og:title", content: "DJ Dashboard — Requestify" },
      { property: "og:description", content: "Live song request queue for the DJ." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Dashboard,
});

const TABS: { key: Status; label: string }[] = [
  { key: "pending", label: "Incoming" },
  { key: "approved", label: "Queue" },
  { key: "played", label: "Played" },
  { key: "rejected", label: "Rejected" },
];

const BADGE: Record<Status, string> = {
  pending: "bg-warning/15 text-warning border-warning/40",
  approved: "bg-accent/15 text-accent border-accent/40",
  played: "bg-success/15 text-success border-success/40",
  rejected: "bg-destructive/15 text-destructive border-destructive/40",
};
const LABEL: Record<Status, string> = { pending: "New", approved: "In queue", played: "Played", rejected: "Rejected" };

function Dashboard() {
  const admin = useIsAdmin();
  return (
    <div className="min-h-screen stage-bg">
      <AdminNav />
      <main className="mx-auto max-w-5xl px-4 py-6">
        {admin.isLoading ? <Center><Loader2 className="h-8 w-8 animate-spin text-primary" /></Center>
          : admin.isError ? <Center><AlertTriangle className="h-8 w-8 text-destructive" /><p>Couldn't verify your access.</p></Center>
          : !admin.data ? (
            <Center>
              <ShieldAlert className="h-10 w-10 text-warning" />
              <h1 className="text-xl font-bold">Not a DJ account</h1>
              <p className="max-w-sm text-muted-foreground">You're signed in, but this account doesn't have DJ access. Only the admin can see requests.</p>
            </Center>
          ) : <Events />}
      </main>
    </div>
  );
}

function Events() {
  const { event } = Route.useSearch();
  const navigate = Route.useNavigate();
  const ev = useEvents();
  const select = (id: string) => navigate({ search: { event: id }, replace: true });
  if (ev.isLoading) return <Center><Loader2 className="h-8 w-8 animate-spin text-primary" /></Center>;
  if (ev.isError) return <Center><AlertTriangle className="h-8 w-8 text-destructive" /><p>Couldn't load your parties.</p><Button variant="glass" onClick={() => ev.refetch()}>Retry</Button></Center>;
  const list = ev.data ?? [];
  if (list.length === 0) return (
    <Center>
      <h1 className="text-2xl font-bold">Create your first party</h1>
      <p className="max-w-sm text-muted-foreground">Each party gets its own guest QR code and its own request queue.</p>
      <div className="w-full max-w-sm"><CreateEventForm autoFocus onCreated={(e) => select(e.id)} /></div>
    </Center>
  );
  const current = list.find((e) => e.id === event) ?? list[0]!;
  return (<><EventBar events={list} current={current} onSelect={select} /><Queue key={current.id} ev={current} /></>);
}

function Queue({ ev }: { ev: PartyEvent }) {
  const qc = useQueryClient();
  const [tab, setTab] = useState<Status>("pending");
  const [live, setLive] = useState(false);
  const [notif, setNotif] = useState<NotificationPermission | "unsupported">("default");
  const notifRef = useRef(notif);
  notifRef.current = notif;

  const q = useQuery({
    queryKey: ["requests", ev.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("song_requests").select("*").eq("event_id", ev.id).order("created_at", { ascending: true }).limit(500);
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    setNotif(typeof Notification === "undefined" ? "unsupported" : Notification.permission);
    const ch = supabase
      .channel(`requests-${Math.random().toString(36).slice(2)}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "song_requests", filter: `event_id=eq.${ev.id}` }, (payload) => {
        qc.invalidateQueries({ queryKey: ["requests", ev.id] });
        if (payload.eventType === "INSERT") {
          const r = payload.new as Req;
          toast(`🎵 ${r.title}`, { description: `${r.artist}${r.guest_name ? ` · from ${r.guest_name}` : ""}` });
          if (notifRef.current === "granted" && document.hidden) {
            try { new Notification("New request", { body: `${r.title} — ${r.artist}` }); } catch { /* some browsers only allow via service worker */ }
          }
        }
      })
      .subscribe((s) => setLive(s === "SUBSCRIBED"));
    return () => { supabase.removeChannel(ch); };
  }, [qc, ev.id]);

  async function update(id: string, status: Status) {
    const { error } = await supabase.from("song_requests").update({ status }).eq("id", id);
    if (error) toast.error("Update failed"); else qc.invalidateQueries({ queryKey: ["requests", ev.id] });
  }
  async function remove(id: string) {
    const { error } = await supabase.from("song_requests").delete().eq("id", id);
    if (error) toast.error("Delete failed"); else qc.invalidateQueries({ queryKey: ["requests", ev.id] });
  }
  async function askNotif() {
    if (typeof Notification === "undefined") return;
    setNotif(await Notification.requestPermission());
  }

  const all = q.data ?? [];
  const items = all.filter((r) => r.status === tab);
  if (tab === "played" || tab === "rejected") items.reverse();
  const counts = Object.fromEntries(TABS.map((t) => [t.key, all.filter((r) => r.status === t.key).length])) as Record<Status, number>;

  return (
    <>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{ev.name}</h1>
          <p className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
            <span className={`h-2 w-2 rounded-full ${live ? "bg-success animate-pulse" : "bg-muted-foreground"}`} />
            {live ? "Live — updates instantly" : "Connecting…"}
          </p>
        </div>
        {notif !== "unsupported" && notif !== "granted" && (
          <Button variant="glass" size="sm" onClick={askNotif} disabled={notif === "denied"}>
            {notif === "denied" ? <><BellOff />Notifications blocked</> : <><Bell />Enable notifications</>}
          </Button>
        )}
      </div>

      <div className="mb-5 grid grid-cols-4 gap-1 rounded-xl border border-border bg-card/60 p-1">
        {TABS.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`rounded-lg px-2 py-2 text-sm font-medium transition ${tab === t.key ? "bg-gradient-neon text-primary-foreground shadow-neon" : "text-muted-foreground hover:text-foreground"}`}>
            {t.label} <span className="opacity-70">{counts[t.key]}</span>
          </button>
        ))}
      </div>

      {q.isLoading ? <Center><Loader2 className="h-8 w-8 animate-spin text-primary" /></Center>
        : q.isError ? (
          <Center><AlertTriangle className="h-8 w-8 text-destructive" /><p>Couldn't load requests.</p>
            <Button variant="glass" onClick={() => q.refetch()}>Retry</Button></Center>
        ) : items.length === 0 ? (
          <Center><Inbox className="h-10 w-10 text-muted-foreground" />
            <p className="text-muted-foreground">{tab === "pending" ? "No new requests yet. Share the QR code!" : "Nothing here yet."}</p></Center>
        ) : (
          <ul className="space-y-3">
            {items.map((r, i) => (
              <li key={r.id} className="rounded-2xl border border-border bg-card/70 p-4 backdrop-blur">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      {tab === "approved" && <span className="font-display text-sm text-accent">#{i + 1}</span>}
                      <h3 className="truncate text-base font-semibold">{r.title}</h3>
                    </div>
                    <p className="truncate text-sm text-muted-foreground">{r.artist}</p>
                    {(r.guest_name || r.message) && (
                      <p className="mt-2 text-sm">
                        {r.guest_name && <span className="font-medium text-primary">{r.guest_name}</span>}
                        {r.guest_name && r.message && ": "}
                        {r.message && <span className="text-foreground/90">"{r.message}"</span>}
                      </p>
                    )}
                    <p className="mt-2 text-xs text-muted-foreground">{new Date(r.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p>
                  </div>
                  <span className={`shrink-0 rounded-full border px-2.5 py-0.5 text-xs font-medium ${BADGE[r.status]}`}>{LABEL[r.status]}</span>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {r.status === "pending" && <>
                    <Button size="sm" variant="neon" onClick={() => update(r.id, "approved")}><Check />Approve</Button>
                    <Button size="sm" variant="glass" onClick={() => update(r.id, "rejected")}><X />Reject</Button>
                  </>}
                  {r.status === "approved" && <>
                    <Button size="sm" variant="neon" onClick={() => update(r.id, "played")}><Disc3 />Mark played</Button>
                    <Button size="sm" variant="glass" onClick={() => update(r.id, "pending")}>Back to incoming</Button>
                  </>}
                  {(r.status === "rejected" || r.status === "played") &&
                    <Button size="sm" variant="glass" onClick={() => update(r.id, "approved")}>Re-queue</Button>}
                  <Button size="sm" variant="ghost" className="ml-auto text-destructive" onClick={() => remove(r.id)} aria-label="Remove request"><Trash2 />Remove</Button>
                </div>
              </li>
            ))}
          </ul>
        )}
    </>
  );
}

function Center({ children }: { children: React.ReactNode }) {
  return <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-center">{children}</div>;
}
