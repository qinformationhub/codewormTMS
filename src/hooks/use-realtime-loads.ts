import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSessionProfile } from "./use-session";
import { useMyOrg } from "./use-session";
import type { Database } from "@/integrations/supabase/types";

type Load = Database["public"]["Tables"]["loads"]["Row"];

export function useRealtimeLoads(loadId?: string) {
  const queryClient = useQueryClient();
  const { data: profile } = useSessionProfile();
  const { data: myOrg } = useMyOrg(profile?.role, profile?.id);

  useEffect(() => {
    if (!profile) return;

    let filter = undefined;
    if (loadId) {
      filter = `id=eq.${loadId}`;
    } else if (profile.role === "shipper" && myOrg) {
      filter = `shipper_id=eq.${myOrg.id}`;
    } else if (profile.role === "carrier" && myOrg) {
      filter = `carrier_id=eq.${myOrg.id}`;
    }

    const channel = (supabase as any)
      .channel(`loads-realtime-${loadId || "all"}-${profile.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "loads",
          filter: filter,
        },
        (payload: any) => {
          const updatedLoad = payload.new as Load;
          
          if (updatedLoad && updatedLoad.id) {
            void queryClient.invalidateQueries({ queryKey: ["load", updatedLoad.id] });
          }
          void queryClient.invalidateQueries({ queryKey: ["loads"] });
        }
      )
      .subscribe();

    return () => {
      void (supabase as any).removeChannel(channel);
    };
  }, [profile, myOrg, loadId, queryClient]);
}
