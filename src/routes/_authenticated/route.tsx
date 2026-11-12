import { createFileRoute, Navigate, Outlet } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

// Client-only gate. Redirecting via <Navigate> (instead of throwing during hydration)
// avoids a router hydration crash on hard reloads. Data is still protected server-side by RLS.
export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data } = await supabase.auth.getUser();
    return { user: data.user ?? null };
  },
  component: Gate,
});

function Gate() {
  const { user } = Route.useRouteContext();
  if (!user) return <Navigate to="/auth" replace />;
  return <Outlet />;
}
