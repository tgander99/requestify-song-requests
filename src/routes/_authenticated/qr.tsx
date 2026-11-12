import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { Download, Printer, Copy } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { AdminNav } from "@/components/AdminNav";

export const Route = createFileRoute("/_authenticated/qr")({
  head: () => ({
    meta: [
      { title: "Party QR Code — Requestify" },
      { name: "description", content: "Print or download the QR code guests scan to request songs." },
      { property: "og:title", content: "Party QR Code — Requestify" },
      { property: "og:description", content: "Print or download the QR code guests scan to request songs." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: QrPage,
});

function QrPage() {
  const [url, setUrl] = useState("");
  const [img, setImg] = useState("");
  useEffect(() => {
    const u = `${window.location.origin}/`;
    setUrl(u);
    QRCode.toDataURL(u, { width: 1024, margin: 2, errorCorrectionLevel: "M" }).then(setImg);
  }, []);

  return (
    <div className="min-h-screen stage-bg">
      <AdminNav />
      <main className="mx-auto max-w-md px-4 py-8 text-center">
        <div className="rounded-3xl border border-border bg-card/70 p-6 backdrop-blur print:border-0 print:bg-transparent">
          <h1 className="text-3xl font-bold">Request a song!</h1>
          <p className="mt-2 text-muted-foreground">Scan with your phone camera — no app needed.</p>
          <div className="mx-auto mt-6 w-full max-w-xs rounded-2xl bg-foreground p-3 shadow-neon">
            {img ? <img src={img} alt="QR code to the song request page" className="w-full" /> : <div className="aspect-square" />}
          </div>
          <p className="mt-4 break-all text-sm text-muted-foreground">{url}</p>
        </div>
        <div className="no-print mt-6 grid grid-cols-3 gap-2">
          <Button variant="neon" asChild disabled={!img}><a href={img} download="requestify-qr.png"><Download />PNG</a></Button>
          <Button variant="glass" onClick={() => window.print()}><Printer />Print</Button>
          <Button variant="glass" onClick={() => { navigator.clipboard.writeText(url); toast.success("Link copied"); }}><Copy />Link</Button>
        </div>
        <p className="no-print mt-4 text-xs text-muted-foreground">Tip: publish the app first so the QR points to your live link, not the preview.</p>
      </main>
    </div>
  );
}
