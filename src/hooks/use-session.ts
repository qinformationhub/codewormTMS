import { useQuery } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";
import type { AppRole } from "@/lib/tms";

export interface SessionProfile {
  id: string;
  full_name: string;
  email: string;
  role: AppRole;
}

export function useSessionProfile() {
  return useQuery({
    queryKey: ["session-profile"],
    staleTime: 60_000,
    queryFn: async (): Promise<SessionProfile | null> => {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData.user;
      if (!user) return null;
      const { data } = await supabase
        .from("profiles")
        .select("id, full_name, email, role")
        .eq("id", user.id)
        .maybeSingle();
      if (!data) {
        return {
          id: user.id,
          full_name: (user.user_metadata?.["full_name"] as string) ?? user.email ?? "Operator",
          email: user.email ?? "",
          role: "shipper",
        };
      }
      return data as SessionProfile;
    },
  });
}

export function useMyOrg(role: AppRole | undefined, userId: string | undefined) {
  return useQuery({
    queryKey: ["my-org", role, userId],
    enabled: Boolean(role && userId && role !== "admin"),
    queryFn: async () => {
      if (!userId || !role) return null;
      const table = role === "shipper" ? "shippers" : "carriers";
      const { data } = await supabase
        .from(table)
        .select("*")
        .eq("portal_user_id", userId)
        .maybeSingle();
      return data;
    },
  });
}