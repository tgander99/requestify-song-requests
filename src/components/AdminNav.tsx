import { Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { LogOut, QrCode, ListMusic } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Logo } from "./Logo";

export function AdminNav() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  async function signOut() {
    await qc.cancelQueries(); qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }
  return (
    <header className="no-print sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-2 px-4 py-3">
        <Logo />
        <nav className="flex items-center gap-1">
          <Button asChild variant="ghost" size="sm"><Link to="/dashboard" activeProps={{ className: "text-accent" }}><ListMusic />Queue</Link></Button>
          <Button asChild variant="ghost" size="sm"><Link to="/qr" activeProps={{ className: "text-accent" }}><QrCode />QR</Link></Button>
          <Button variant="ghost" size="sm" onClick={signOut} aria-label="Sign out"><LogOut /></Button>
        </nav>
      </div>
    </header>
  );
}
