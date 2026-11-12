import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { CheckCircle2, Music2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/Logo";
import { requestSchema } from "@/lib/request-validation";
import { submitSongRequest } from "@/lib/requests.functions";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Request a Song — Requestify" },
      { name: "description", content: "Send your song request straight to the DJ. No app needed." },
      { property: "og:title", content: "Request a Song — Requestify" },
      { property: "og:description", content: "Send your song request straight to the DJ. No app needed." },
    ],
  }),
  component: GuestPage,
});

type Errors = Partial<Record<"title" | "artist" | "guestName" | "message", string>>;

function GuestPage() {
  const submit = useServerFn(submitSongRequest);
  const [form, setForm] = useState({ title: "", artist: "", guestName: "", message: "", website: "" });
  const [errors, setErrors] = useState<Errors>({});
  const [serverError, setServerError] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<{ title: string; artist: string } | null>(null);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setServerError("");
    const parsed = requestSchema.safeParse(form);
    if (!parsed.success) {
      const errs: Errors = {};
      for (const i of parsed.error.issues) errs[i.path[0] as keyof Errors] ??= i.message;
      setErrors(errs);
      return;
    }
    setErrors({});
    setBusy(true);
    try {
      const res = await submit({ data: form });
      if (res.ok) setDone({ title: parsed.data.title, artist: parsed.data.artist });
      else setServerError(res.error);
    } catch {
      setServerError("Connection hiccup. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="stage-bg min-h-screen px-5 py-8">
      <div className="mx-auto max-w-md">
        <header className="mb-8 flex items-center justify-between">
          <Logo />
          <Link to="/auth" className="text-xs text-muted-foreground hover:text-foreground">DJ login</Link>
        </header>

        {done ? (
          <div className="rounded-3xl border border-border bg-card/70 p-8 text-center shadow-neon backdrop-blur">
            <CheckCircle2 className="mx-auto mb-4 h-14 w-14 text-success" />
            <h1 className="text-2xl font-bold">Request sent!</h1>
            <p className="mt-3 text-muted-foreground">
              <span className="text-foreground font-medium">{done.title}</span> by {done.artist} is on its way to the DJ.
              No promises — but keep your ears open 🎧
            </p>
            <Button variant="glass" size="xl" className="mt-6 w-full" onClick={() => {
              setDone(null); setForm({ title: "", artist: "", guestName: "", message: "", website: "" });
            }}>Request another</Button>
          </div>
        ) : (
          <>
            <h1 className="text-4xl font-bold leading-tight">What should<br /><span className="text-gradient-neon">play next?</span></h1>
            <p className="mt-3 text-muted-foreground">Drop your request — it goes straight to the DJ booth.</p>

            <form onSubmit={onSubmit} noValidate className="mt-8 space-y-5 rounded-3xl border border-border bg-card/70 p-6 backdrop-blur">
              <Field id="title" label="Song title *" error={errors.title}>
                <Input id="title" value={form.title} onChange={set("title")} maxLength={120} placeholder="e.g. Mr. Brightside" className="h-12 text-base" />
              </Field>
              <Field id="artist" label="Artist *" error={errors.artist}>
                <Input id="artist" value={form.artist} onChange={set("artist")} maxLength={120} placeholder="e.g. The Killers" className="h-12 text-base" />
              </Field>
              <Field id="guestName" label="Your name (optional)" error={errors.guestName}>
                <Input id="guestName" value={form.guestName} onChange={set("guestName")} maxLength={60} className="h-12 text-base" />
              </Field>
              <Field id="message" label="Dedication / message (optional)" error={errors.message}>
                <Textarea id="message" value={form.message} onChange={set("message")} maxLength={280} rows={3} placeholder="For the birthday girl! 🎉" className="text-base" />
              </Field>
              <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true"
                value={form.website} onChange={set("website")} className="absolute -left-[9999px] h-0 w-0 opacity-0" />
              {serverError && <p role="alert" className="rounded-lg border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">{serverError}</p>}
              <Button type="submit" variant="neon" size="xl" className="w-full" disabled={busy}>
                {busy ? <Loader2 className="animate-spin" /> : <Music2 />} {busy ? "Sending…" : "Send request"}
              </Button>
            </form>
          </>
        )}
      </div>
    </main>
  );
}

function Field({ id, label, error, children }: { id: string; label: string; error?: string | undefined; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
