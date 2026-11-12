import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type PartyEvent = Database["public"]["Tables"]["events"]["Row"];

export function useEvents() {
  return useQuery({
    queryKey: ["events"],
    queryFn: async () => {
      const { data, error } = await supabase.from("events").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export async function createEvent(name: string) {
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) throw new Error("Not signed in");
  const { data, error } = await supabase.from("events").insert({ name: name.trim(), owner_id: u.user.id }).select().single();
  if (error) throw error;
  return data;
}

export const guestPath = (slug: string) => `/e/${slug}`;
