import { createFileRoute, Link } from "@tanstack/react-router";
import { QrCode } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Requestify — Song requests for your party" },
      { name: "description", content: "Guests scan a QR code and send song requests straight to the DJ. No app needed." },
      { property: "og:title", content: "Requestify — Song requests for your party" },
      { property: "og:description", content: "Guests scan a QR code and send song requests straight to the DJ. No app needed." },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <main className="stage-bg flex min-h-screen flex-col px-6 py-8">
      <header className="flex items-center justify-between"><Logo /></header>
      <div className="mx-auto flex max-w-md flex-1 flex-col justify-center text-center">
        <QrCode className="mx-auto mb-6 h-16 w-16 text-accent" />
        <h1 className="text-4xl font-bold leading-tight">Got a song<br /><span className="text-gradient-neon">in mind?</span></h1>
        <p className="mt-4 text-muted-foreground">Scan the QR code at your party to send a request to the DJ.</p>
        <Button asChild variant="glass" size="xl" className="mt-10"><Link to="/auth">I'm the DJ</Link></Button>
      </div>
    </main>
  );
}
