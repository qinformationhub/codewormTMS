import { supabaseAdmin } from "@/integrations/supabase/client.server";
import type { Database } from "@/integrations/supabase/types";

type Load = Database["public"]["Tables"]["loads"]["Row"];

export interface CarrierScore {
  carrierId: string;
  name: string;
  score: number;
  reasons: string[];
}

export async function findEligibleCarriers(loadId: string) {
  // 1. Get load details
  const { data: load, error: loadError } = await supabaseAdmin
    .from("loads")
    .select("*")
    .eq("id", loadId)
    .single();

  const typedLoad = load as Load | null;

  if (loadError || !load) throw new Error("Load not found");

  // 2. Get active carriers
  const { data: carriers, error: carrierError } = await supabaseAdmin
    .from("carriers")
    .select("*")
    .eq("status", "active");

  if (carrierError) throw carrierError;

  // 3. Filter candidates
  const eligible = carriers.filter((carrier) => {
    if (!typedLoad) return false;
    // Equipment match
    if (typedLoad.equipment && carrier.reefer_certified === false && typedLoad.equipment.toLowerCase().includes("reefer")) {
      return false;
    }

    // HazMat match
    if (typedLoad.hazmat_class && !carrier.hazmat_certified) {
      return false;
    }

    // GDP match
    if (typedLoad.category === "pharmaceutical" && !carrier.gdp_certified) {
      return false;
    }

    return true;
  });

  return eligible;
}

export async function scoreCarriers(loadId: string, carriers: any[]): Promise<CarrierScore[]> {
  const scored = carriers.map((carrier) => {
    let score = 70; // Base score
    const reasons: string[] = ["Active status"];

    // Equipment match bonus
    reasons.push("Compatible equipment");

    // Insurance bonus
    if (carrier.insurance_coverage > 500000) {
      score += 10;
      reasons.push("High insurance coverage");
    }

    // Performance bonus (mocking with claims ratio)
    if (carrier.claims_ratio < 0.02) {
      score += 15;
      reasons.push("Excellent claims record");
    } else if (carrier.claims_ratio > 0.1) {
      score -= 20;
      reasons.push("High claims ratio");
    }

    // Safety rating
    if (carrier.hazmat_safety_rating === "satisfactory") {
      score += 5;
      reasons.push("Satisfactory safety rating");
    }

    return {
      carrierId: carrier.id,
      name: carrier.name,
      score: Math.min(100, Math.max(0, score)),
      reasons,
    };
  });

  return scored.sort((a, b) => b.score - a.score);
}

export async function createDispatchAssignment(params: {
  loadId: string;
  carrierId: string;
  driverId?: string | null;
  method: "manual" | "automatic";
  score?: number;
  reasoning?: string;
  vehicleId?: string | null;
}) {
  // 1. Mark existing active assignments as replaced
  await supabaseAdmin
    .from("dispatch_assignments")
    .update({ status: "replaced" })
    .eq("load_id", params.loadId)
    .eq("status", "active");

  // 2. Create new assignment
  const { data, error } = await supabaseAdmin
    .from("dispatch_assignments")
    .insert({
      load_id: params.loadId,
      carrier_id: params.carrierId,
      method: params.method,
      score: params.score ?? null,
      reasoning: params.reasoning ?? null,
      status: "active",
    })
    .select()
    .single();

  if (error) throw error;

  // 3. Update the load itself
  await supabaseAdmin
    .from("loads")
    .update({ 
      carrier_id: params.carrierId,
      driver_id: params.driverId || null,
      vehicle_id: params.vehicleId || null,
      status: "booked" // Automatically move to booked on dispatch
    } as any)
    .eq("id", params.loadId);

  return data;
}

export async function getDispatchHistory(loadId: string) {
  const { data, error } = await supabaseAdmin
    .from("dispatch_assignments")
    .select(`
      *,
      carrier:carriers(name)
    `)
    .eq("load_id", loadId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
}

export async function getDriverPerformance(driverId: string) {
  const { data, error } = await supabaseAdmin
    .from("loads")
    .select("status, delivery_date")
    .eq("driver_id", driverId);

  if (error) throw error;

  const delivered = data.filter(l => l.status === 'delivered');
  const total = data.length;
  
  // Simplified metric calculation
  const performance = {
    totalLoads: total,
    deliveredLoads: delivered.length,
    onTimePercentage: total > 0 ? (delivered.length / total) * 100 : 100
  };

  return performance;
}
