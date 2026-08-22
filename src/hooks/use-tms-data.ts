import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type Load = Tables<"loads">;
export type Shipper = Tables<"shippers">;
export type Carrier = Tables<"carriers">;
export type Document = Tables<"documents">;
export type AuditLog = Tables<"audit_logs">;
export type Driver = Tables<"drivers">;
export type Vehicle = Tables<"vehicles">;
export type LoadStop = Tables<"load_stops">;
export type Epod = Tables<"epods">;
export type Notification = Tables<"notifications">;
export type DeliveryMilestone = any;
export type DriverCheckin = any;
export type LoadException = any;



export type LoadWithParties = Load & {
  shipper: Pick<Shipper, "id" | "name"> | null;
  carrier: Pick<Carrier, "id" | "name"> | null;
  driver: Pick<Driver, "id" | "first_name" | "last_name"> | null;
  vehicle: Pick<Vehicle, "id" | "vehicle_id_tag" | "vehicle_type"> | null;
  stops: LoadStop[];
};

const LOAD_SELECT =
  "*, shipper:shippers(id, name), carrier:carriers(id, name), driver:drivers(id, first_name, last_name), vehicle:vehicles(id, vehicle_id_tag, vehicle_type), stops:load_stops(*)";

export function useLoads() {
  return useQuery({
    queryKey: ["loads"],
    queryFn: async (): Promise<LoadWithParties[]> => {
      const { data, error } = await supabase
        .from("loads")
        .select(LOAD_SELECT)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as LoadWithParties[];
    },
  });
}

export function useLoad(id: string) {
  return useQuery({
    queryKey: ["load", id],
    queryFn: async (): Promise<LoadWithParties | null> => {
      const { data, error } = await supabase
        .from("loads")
        .select(LOAD_SELECT)
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return (data ?? null) as unknown as LoadWithParties | null;
    },
  });
}

export function useShippers() {
  return useQuery({
    queryKey: ["shippers"],
    queryFn: async (): Promise<Shipper[]> => {
      const { data, error } = await supabase
        .from("shippers")
        .select("*")
        .order("name");
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useCarriers() {
  return useQuery({
    queryKey: ["carriers"],
    queryFn: async (): Promise<Carrier[]> => {
      const { data, error } = await supabase
        .from("carriers")
        .select("*")
        .order("name");
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useDocuments() {
  return useQuery({
    queryKey: ["documents"],
    queryFn: async (): Promise<Document[]> => {
      const { data, error } = await supabase
        .from("documents")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useAuditLogs() {
  return useQuery({
    queryKey: ["audit-logs"],
    queryFn: async (): Promise<AuditLog[]> => {
      const { data, error } = await supabase
        .from("audit_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useDrivers(carrierId?: string) {
  return useQuery({
    queryKey: ["drivers", carrierId],
    queryFn: async (): Promise<Driver[]> => {
      let query = supabase.from("drivers").select("*");
      if (carrierId) {
        query = query.eq("carrier_id", carrierId);
      }
      const { data, error } = await query.order("last_name");
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useVehicles(carrierId?: string) {
  return useQuery({
    queryKey: ["vehicles", carrierId],
    queryFn: async (): Promise<Vehicle[]> => {
      let query = supabase.from("vehicles").select("*");
      if (carrierId) {
        query = query.eq("carrier_id", carrierId);
      }
      const { data, error } = await query.order("vehicle_id_tag");
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useVehicle(id: string) {
  return useQuery({
    queryKey: ["vehicle", id],
    queryFn: async (): Promise<Vehicle | null> => {
      const { data, error } = await supabase
        .from("vehicles")
        .select("*, carrier:carriers(id, name), driver:drivers(id, first_name, last_name)")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return data as any;
    },
  });
}

export function useStops(loadId: string) {
  return useQuery({
    queryKey: ["stops", loadId],
    queryFn: async (): Promise<LoadStop[]> => {
      const { data, error } = await supabase
        .from("load_stops")
        .select("*")
        .eq("load_id", loadId)
        .order("stop_number");
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useEpod(loadId: string) {
  return useQuery({
    queryKey: ["epod", loadId],
    queryFn: async (): Promise<Epod | null> => {
      const { data, error } = await supabase
        .from("epods")
        .select("*")
        .eq("load_id", loadId)
        .maybeSingle();
      if (error) throw error;
      return data ?? null;
    },
  });
}

export function useMilestones(loadId: string) {
  return useQuery({
    queryKey: ["milestones", loadId],
    queryFn: async (): Promise<any[]> => {
      const { data, error } = await (supabase as any)
        .from("delivery_milestones")
        .select("*")
        .eq("load_id", loadId)
        .order("recorded_at", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useDriverCheckins(driverId?: string) {
  return useQuery({
    queryKey: ["driver-checkins", driverId],
    queryFn: async (): Promise<DriverCheckin[]> => {
      let query = (supabase as any).from("driver_checkins").select("*");
      if (driverId) {
        query = query.eq("driver_id", driverId);
      }
      const { data, error } = await query.order("check_in_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}


export function useLoadExceptions(loadId?: string) {
  return useQuery({
    queryKey: ["load-exceptions", loadId],
    queryFn: async (): Promise<LoadException[]> => {
      let query = (supabase as any).from("load_exceptions").select("*");
      if (loadId) {
        query = query.eq("load_id", loadId);
      }
      const { data, error } = await query.order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useNotifications() {
  const { data: profile } = useQuery({
    queryKey: ["session-profile"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();
      return data;
    },
  });

  return useQuery({
    queryKey: ["notifications", profile?.id],
    queryFn: async (): Promise<Notification[]> => {
      if (!profile?.id) return [];
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", profile.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as Notification[];
    },
    enabled: !!profile?.id,
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

