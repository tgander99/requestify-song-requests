import { useServerFn } from "@tanstack/react-start";
import { Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { CheckCircle2, Music2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/Logo";
import { requestSchema } from "@/lib/request-validation";
import { getGuestCooldown, submitSongRequest } from "@/lib/requests.functions";
import { formatCooldown, type CooldownState } from "@/lib/cooldown";

type Errors = Partial<Record<"title" | "artist" | "guestName" | "message", string>>;

export function RequestForm({ slug, eventName }: { slug: string; eventName: string }) {
  const submit = useServerFn(submitSongRequest);
  const checkCooldown = useServerFn(getGuestCooldown);
  const [form, setForm] = useState({ title: "", artist: "", guestName: "", message: "", website: "" });
  const [errors, setErrors] = useState<Errors>({});
  const [serverError, setServerError] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<{ title: string; artist: string } | null>(null);
  const [remaining, setRemaining] = useState(0);
  const [ready, setReady] = useState(false);
  const deadline = useRef(0);
  const applyCooldown = (state: CooldownState) => {
    deadline.current = performance.now() + state.remainingSeconds * 1000;
    setRemaining(state.remainingSeconds);
  };

  useEffect(() => {
    let active = true;
    let checking = false;
    async function refresh() {
      if (checking) return;
      checking = true;
      try {
        const state = await checkCooldown({ data: { slug } });
        if (active) { applyCooldown(state); setReady(true); }
      } catch { /* Submission still checks server-side; retry on the next poll. */ }
      finally { checking = false; }
    }
    void refresh();
    const poll = window.setInterval(() => void refresh(), 10_000);
    const tick = window.setInterval(() => setRemaining(Math.max(0, Math.ceil((deadline.current - performance.now()) / 1000))), 1000);
    const focus = () => void refresh();
    window.addEventListener("focus", focus);
    return () => { active = false; clearInterval(poll); clearInterval(tick); window.removeEventListener("focus", focus); };
  }, [checkCooldown, slug]);

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
      const res = await submit({ data: { ...form, slug } });
      if (res.remainingSeconds !== undefined && res.cooldownMinutes !== undefined) applyCooldown({ remainingSeconds: res.remainingSeconds, cooldownMinutes: res.cooldownMinutes });
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
          <span className="truncate text-xs text-muted-foreground">{eventName}</span>
        </header>

        {done ? (
          <div className="rounded-3xl border border-border bg-card/70 p-8 text-center shadow-neon backdrop-blur">
            <CheckCircle2 className="mx-auto mb-4 h-14 w-14 text-success" />
            <h1 className="text-2xl font-bold">Request sent!</h1>
            <p className="mt-3 text-muted-foreground">
              <span className="text-foreground font-medium">{done.title}</span> by {done.artist} is on its way to the DJ.
              No promises — but keep your ears open 🎧
            </p>
            {remaining > 0 && <p role="status" className="mt-4 text-sm text-accent">You can request another song in {formatCooldown(remaining)}.</p>}
            <Button variant="glass" size="xl" className="mt-6 w-full" onClick={() => {
              setDone(null); setForm({ title: "", artist: "", guestName: "", message: "", website: "" });
            }}>Request another</Button>
          </div>
        ) : (
          <>
            <h1 className="text-4xl font-bold leading-tight">What should<br /><span className="text-gradient-neon">play next?</span></h1>
            <p className="mt-3 text-muted-foreground">Requests for <span className="font-medium text-foreground">{eventName}</span> — straight to the DJ booth.</p>

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
              {remaining > 0 && <p role="status" className="text-sm text-accent">You can request another song in {formatCooldown(remaining)}.</p>}
              <Button type="submit" variant="neon" size="xl" className="w-full" disabled={busy || !ready || remaining > 0}>
                {busy ? <Loader2 className="animate-spin" /> : <Music2 />} {busy ? "Sending…" : "Send request"}
              </Button>
            </form>
          </>
        )}
        <footer className="mt-10 text-center">
          <Link to="/auth" className="text-xs text-muted-foreground/70 underline-offset-4 hover:text-muted-foreground hover:underline">
            Are you the DJ? Sign in
          </Link>
        </footer>
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
