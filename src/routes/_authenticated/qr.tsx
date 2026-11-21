import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { Download, Printer, Copy } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { AdminNav } from "@/components/AdminNav";
import { Link } from "@tanstack/react-router";
import { PosterDownload } from "@/components/PosterDownload";
import { useEvents, guestPath } from "@/lib/events";
import { printQr, qrOptions, saveQrPng } from "@/lib/qr-actions";

export const Route = createFileRoute("/_authenticated/qr")({
  validateSearch: (s: Record<string, unknown>): { event?: string } =>
    typeof s["event"] === "string" ? { event: s["event"] } : {},
  head: () => ({
    meta: [
      { title: "Party QR Code — Requestify" },
      { name: "description", content: "Print or download the QR code guests scan to request songs." },
      { property: "og:title", content: "Party QR Code — Requestify" },
      { property: "og:description", content: "Print or download the QR code guests scan to request songs." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: QrPage,
});

function QrPage() {
  const { event } = Route.useSearch();
  const navigate = Route.useNavigate();
  const evs = useEvents();
  const list = evs.data ?? [];
  const current = list.find((e) => e.id === event) ?? list[0];
  const [url, setUrl] = useState("");
  const [img, setImg] = useState("");
  useEffect(() => {
    let active = true;
    setImg("");
    if (!current) { setUrl(""); return; }
    const u = `${window.location.origin}${guestPath(current.slug)}`;
    setUrl(u);
    QRCode.toDataURL(u, qrOptions).then((value) => { if (active) setImg(value); })
      .catch(() => { if (active) toast.error("Couldn't generate QR code"); });
    return () => { active = false; };
  }, [current?.id, current?.slug]);
  async function exportQr(kind: "png" | "print") {
    if (!current) return;
    const destination = `${window.location.origin}${guestPath(current.slug)}`;
    try {
      if (kind === "png") await saveQrPng(destination, current.slug);
      else await printQr(destination, current.name);
    } catch (error) { toast.error(error instanceof Error ? error.message : "Couldn't export QR code"); }
  }
  if (evs.isLoading) return <div className="min-h-screen stage-bg"><AdminNav /></div>;
  if (!current) return (
    <div className="min-h-screen stage-bg"><AdminNav />
      <main className="mx-auto max-w-md px-4 py-16 text-center">
        <h1 className="text-2xl font-bold">No parties yet</h1>
        <p className="mt-2 text-muted-foreground">Create a party first — each one gets its own QR code.</p>
        <Button asChild variant="neon" className="mt-6"><Link to="/dashboard">Create a party</Link></Button>
      </main></div>
  );

  return (
    <div className="min-h-screen stage-bg">
      <AdminNav />
      <main className="mx-auto max-w-md px-4 py-8 text-center">
        <select aria-label="Select party" value={current.id} onChange={(e) => navigate({ search: { event: e.target.value }, replace: true })}
          className="no-print mb-4 h-10 w-full rounded-md border border-input bg-background px-3 text-sm font-medium">
          {list.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
        </select>
        <div className="rounded-3xl border border-border bg-card/70 p-6 backdrop-blur print:border-0 print:bg-transparent">
          <h1 className="text-3xl font-bold">Request a song!</h1>
          <p className="mt-1 font-display text-lg text-gradient-neon">{current.name}</p>
          <p className="mt-2 text-muted-foreground">Scan with your phone camera — no app needed.</p>
          <div className="mx-auto mt-6 w-full max-w-xs rounded-2xl bg-foreground p-3 shadow-neon">
            {img ? <img src={img} alt="QR code to the song request page" className="w-full" /> : <div className="aspect-square" />}
          </div>
          <p className="mt-4 break-all text-sm text-muted-foreground">{url}</p>
        </div>
        <div className="no-print mt-6 grid grid-cols-3 gap-2">
          <Button variant="neon" disabled={!img} onClick={() => void exportQr("png")}><Download />Save PNG</Button>
          <Button variant="glass" disabled={!img} onClick={() => void exportQr("print")}><Printer />Print</Button>
          <Button variant="glass" onClick={() => { navigator.clipboard.writeText(url); toast.success("Link copied"); }}><Copy />Link</Button>
        </div>
        <div className="no-print mt-4"><PosterDownload event={current} /></div>
        <p className="no-print mt-4 text-xs text-muted-foreground">Tip: publish the app first so the QR points to your live link, not the preview.</p>
      </main>
    </div>
  );
}
