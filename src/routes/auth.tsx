import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/Logo";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "DJ Login — Requestify" },
      { name: "description", content: "Sign in to the Requestify DJ booth." },
      { property: "og:title", content: "DJ Login — Requestify" },
      { property: "og:description", content: "Sign in to the Requestify DJ booth." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ kind: "err" | "ok"; text: string } | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    if (password.length < 8) return setMsg({ kind: "err", text: "Password must be at least 8 characters." });
    setBusy(true);
    if (mode === "in") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      setBusy(false);
      if (error) return setMsg({ kind: "err", text: error.message });
      navigate({ to: "/dashboard" });
    } else {
      const { data, error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: `${window.location.origin}/dashboard` } });
      setBusy(false);
      if (error) return setMsg({ kind: "err", text: error.message });
      if (data.session) navigate({ to: "/dashboard" });
      else setMsg({ kind: "ok", text: "Check your email to confirm your account, then sign in." });
    }
  }

  return (
    <main className="stage-bg flex min-h-screen items-center justify-center px-5">
      <form onSubmit={onSubmit} className="w-full max-w-sm space-y-5 rounded-3xl border border-border bg-card/70 p-7 backdrop-blur">
        <Logo />
        <div>
          <h1 className="text-2xl font-bold">{mode === "in" ? "DJ booth" : "Create DJ account"}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {mode === "in" ? "Sign in to manage requests." : "The first account created becomes the DJ admin."}
          </p>
        </div>
        <div className="space-y-2"><Label htmlFor="email">Email</Label>
          <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="h-11" /></div>
        <div className="space-y-2"><Label htmlFor="password">Password</Label>
          <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="h-11" /></div>
        {msg && <p role="alert" className={msg.kind === "err" ? "text-sm text-destructive" : "text-sm text-success"}>{msg.text}</p>}
        <Button type="submit" variant="neon" size="xl" className="w-full" disabled={busy}>
          {busy && <Loader2 className="animate-spin" />}{mode === "in" ? "Sign in" : "Sign up"}
        </Button>
        <button type="button" className="w-full text-center text-sm text-muted-foreground hover:text-foreground"
          onClick={() => { setMode(mode === "in" ? "up" : "in"); setMsg(null); }}>
          {mode === "in" ? "No account yet? Sign up" : "Have an account? Sign in"}
        </button>
      </form>
    </main>
  );
}
