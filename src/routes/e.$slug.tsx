import { createFileRoute, notFound } from "@tanstack/react-router";
import { PartyPopper } from "lucide-react";
import { RequestForm } from "@/components/RequestForm";
import { Logo } from "@/components/Logo";
import { getPublicEvent } from "@/lib/requests.functions";

export const Route = createFileRoute("/e/$slug")({
  loader: async ({ params }) => {
    if (!/^[a-z0-9-]{4,40}$/.test(params.slug)) throw notFound();
    const ev = await getPublicEvent({ data: { slug: params.slug } });
    if (!ev) throw notFound();
    return ev;
  },
  head: ({ loaderData }) => {
    const t = loaderData ? `Request a song at ${loaderData.name} — Requestify` : "Party not found — Requestify";
    const d = "Send your song request straight to the DJ. No app needed.";
    return { meta: [{ title: t }, { name: "description", content: d }, { property: "og:title", content: t }, { property: "og:description", content: d }, { name: "robots", content: "noindex" }] };
  },
  notFoundComponent: () => (
    <Msg title="Party not found" body="This request link isn't valid. Ask the DJ for the QR code." />
  ),
  component: EventPage,
});

function EventPage() {
  const ev = Route.useLoaderData();
  const { slug } = Route.useParams();
  if (!ev.isOpen) return <Msg title="Requests are closed" body={`The DJ isn't taking requests for ${ev.name} right now.`} />;
  return <RequestForm slug={slug} eventName={ev.name} />;
}

function Msg({ title, body }: { title: string; body: string }) {
  return (
    <main className="stage-bg flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
      <Logo />
      <PartyPopper className="h-12 w-12 text-accent" />
      <h1 className="text-2xl font-bold">{title}</h1>
      <p className="max-w-sm text-muted-foreground">{body}</p>
    </main>
  );
}
