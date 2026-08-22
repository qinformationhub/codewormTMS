import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Plus, 
  Truck, 
  Search, 
  ChevronRight, 
  Gauge, 
  Activity, 
  Clock, 
  AlertCircle,
  CheckCircle2,
  Settings,
} from "lucide-react";
import { useState, useMemo } from "react";
import { toast } from "sonner";

import { EmptyState, PageHeader, Panel, Pill, StatCard, TableShell } from "@/components/tms/primitives";
import { useSessionProfile, useMyOrg } from "@/hooks/use-session";
import { supabase } from "@/integrations/supabase/client";
import { labelize, money, shortDate } from "@/lib/tms";
import { useVehicles, useCarriers, useDrivers, useLoads, type Vehicle } from "@/hooks/use-tms-data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/fleet")({
  component: FleetManagementPage,
});

const VEHICLE_STATUS_TONE: Record<string, any> = {
  available: "ok",
  assigned: "primary",
  in_transit: "warn",
  maintenance: "danger",
  inactive: "neutral",
};

function FleetManagementPage() {
  const { data: profile } = useSessionProfile();
  const isAdmin = profile?.role === "admin";
  const { data: myOrg } = useMyOrg(profile?.role, profile?.id);
  const queryClient = useQueryClient();

  const [isAdding, setIsAdding] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [carrierFilter, setCarrierFilter] = useState("all");

  const effectiveCarrierId = isAdmin ? (carrierFilter === "all" ? undefined : carrierFilter) : (myOrg?.id as string);
  
  const { data: vehiclesData = [], isLoading: isLoadingVehicles } = useVehicles(effectiveCarrierId);
  const vehicles = (vehiclesData || []) as Vehicle[];
  const { data: carriers = [] } = useCarriers();
  const { data: drivers = [] } = useDrivers(effectiveCarrierId);
  const { data: allLoads = [] } = useLoads();

  const filteredVehicles = useMemo(() => {
    return vehicles.filter(v => {
      const searchMatch = v.vehicle_id_tag.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         (v.vin && v.vin.toLowerCase().includes(searchQuery.toLowerCase())) ||
                         (v.license_plate && v.license_plate.toLowerCase().includes(searchQuery.toLowerCase()));
      const statusMatch = statusFilter === "all" || v.status === statusFilter;
      return searchMatch && statusMatch;
    });
  }, [vehicles, searchQuery, statusFilter]);

  const stats = useMemo(() => {
    const total = vehicles.length;
    const available = vehicles.filter(v => v.status === "available").length;
    const assigned = vehicles.filter(v => v.status === "assigned").length;
    const inTransit = vehicles.filter(v => v.status === "in_transit").length;
    const maintenance = vehicles.filter(v => v.status === "maintenance").length;
    const inactive = vehicles.filter(v => v.status === "inactive").length;
    
    const utilized = assigned + inTransit;
    const utilizationRate = total > 0 ? Math.round((utilized / total) * 100) : 0;

    return { total, available, assigned, inTransit, maintenance, inactive, utilizationRate };
  }, [vehicles]);

  const toggleVehicleStatus = async (id: string, currentStatus: string) => {
    const nextStatus = currentStatus === "inactive" ? "available" : "inactive";
    // @ts-ignore
    const { error } = await supabase.from("vehicles").update({ status: nextStatus }).eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success(`Vehicle status updated to ${nextStatus}`);
      void queryClient.invalidateQueries({ queryKey: ["vehicles"] });
    }
  };

  if (isLoadingVehicles) return <EmptyState title="Loading fleet data..." />;

  return (
    <div className="p-6 space-y-6">
      <PageHeader 
        title="Fleet Management" 
        subtitle="Vehicle tracking, utilization reporting and maintenance"
        actions={
          <button 
            onClick={() => setIsAdding(true)}
            className="label-mono flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-xs hover:opacity-90 transition-opacity"
          >
            <Plus className="size-4" /> Add Vehicle
          </button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard label="Total Fleet" value={stats.total} icon={<Truck className="size-5" />} />
        <StatCard label="Utilization" value={`${stats.utilizationRate}%`} icon={<Activity className="size-5" />} tone="primary" />
        <StatCard label="Available" value={stats.available} icon={<CheckCircle2 className="size-5" />} tone="ok" />
        <StatCard label="In Transit" value={stats.inTransit} icon={<Clock className="size-5" />} tone="warn" />
        <StatCard label="Maintenance" value={stats.maintenance} icon={<Settings className="size-5" />} tone="danger" />
        <StatCard label="Inactive" value={stats.inactive} icon={<AlertCircle className="size-5" />} tone="neutral" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Panel title="Vehicle Roster">
            <div className="p-4 flex flex-wrap gap-4 items-center border-b border-border/60">
              <div className="flex-1 min-w-[200px] relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <input 
                  placeholder="ID, VIN or Plate..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-secondary pl-9 pr-4 py-2 rounded-xs text-sm outline-none border border-transparent focus:border-primary/30"
                />
              </div>
              <select 
                className="bg-secondary px-3 py-2 rounded-xs text-sm outline-none border border-transparent focus:border-primary/30"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All Statuses</option>
                <option value="available">Available</option>
                <option value="assigned">Assigned</option>
                <option value="in_transit">In Transit</option>
                <option value="maintenance">Maintenance</option>
                <option value="inactive">Inactive</option>
              </select>
              {isAdmin && (
                <select 
                  className="bg-secondary px-3 py-2 rounded-xs text-sm outline-none border border-transparent focus:border-primary/30"
                  value={carrierFilter}
                  onChange={(e) => setCarrierFilter(e.target.value)}
                >
                  <option value="all">All Carriers</option>
                  {carriers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              )}
            </div>

            {filteredVehicles.length > 0 ? (
              <TableShell columns={["Vehicle ID", "Type", "Carrier", "Driver", "Capacity", "Status", "Actions"]}>
                {filteredVehicles.map((v: any) => {
                   const assignedDriver = drivers.find(d => d.id === v.assigned_driver_id);
                   const carrier = carriers.find(c => c.id === v.carrier_id);
                   return (
                    <tr key={v.id} className="border-b border-border/60 hover:bg-surface/60 transition-colors">
                      <td className="px-5 py-4">
                        <div>
                          <p className="font-mono text-sm font-semibold text-foreground">{v.vehicle_id_tag}</p>
                          <p className="text-[10px] label-mono text-muted-foreground uppercase">{v.make} {v.model}</p>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-xs label-mono text-muted-foreground uppercase">
                        {v.vehicle_type}
                      </td>
                      <td className="px-5 py-4 text-sm text-muted-foreground">
                        {carrier?.name || "—"}
                      </td>
                      <td className="px-5 py-4 text-sm">
                        {assignedDriver ? `${assignedDriver.first_name} ${assignedDriver.last_name}` : <span className="text-muted-foreground">—</span>}
                      </td>
                      <td className="px-5 py-4 text-sm text-muted-foreground">
                        {v.capacity_lbs ? `${(v.capacity_lbs / 1000).toFixed(1)}k lbs` : "—"}
                      </td>
                      <td className="px-5 py-4">
                        <Pill tone={VEHICLE_STATUS_TONE[v.status] || "neutral"}>
                          {labelize(v.status)}
                        </Pill>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex gap-3">
                           <button onClick={() => toggleVehicleStatus(v.id, v.status)} className="text-xs label-mono text-primary hover:underline">
                            {v.status === "inactive" ? "Activate" : "Deactivate"}
                          </button>
                        </div>
                      </td>
                    </tr>
                   );
                })}
              </TableShell>
            ) : (
              <div className="p-12 text-center text-muted-foreground font-mono text-sm">No vehicles tracked in the specified fleet.</div>
            )}
          </Panel>
        </div>

        <div className="space-y-6">
          <Panel title="Fleet Utilization">
             <div className="p-5 space-y-6">
                <div>
                   <div className="flex justify-between items-end mb-2">
                      <p className="label-mono text-xs text-muted-foreground">Capacity Utilization</p>
                      <p className="display-title text-2xl text-foreground">{stats.utilizationRate}%</p>
                   </div>
                   <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary transition-all duration-500" 
                        style={{ width: `${stats.utilizationRate}%` }}
                      />
                   </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                   <div className="bg-secondary p-3 rounded-xs border border-border/40">
                      <p className="label-mono text-[10px] text-muted-foreground uppercase">Utilized</p>
                      <p className="text-lg font-semibold mt-1">{stats.assigned + stats.inTransit}</p>
                   </div>
                   <div className="bg-secondary p-3 rounded-xs border border-border/40">
                      <p className="label-mono text-[10px] text-muted-foreground uppercase">Idle</p>
                      <p className="text-lg font-semibold mt-1">{stats.available}</p>
                   </div>
                </div>

                <div className="pt-4 border-t border-border">
                   <p className="label-mono text-xs text-muted-foreground mb-4">Operational Summary</p>
                   <ul className="space-y-3">
                      {[
                        ["Active Loads", allLoads.filter(l => ['booked', 'dispatched', 'picked_up', 'in_transit'].includes(l.status)).length],
                        ["Fleet Availability", `${stats.available} units`],
                        ["Maintenance Ratio", `${stats.total > 0 ? Math.round((stats.maintenance / stats.total) * 100) : 0}%`]
                      ].map(([label, value]) => (
                        <li key={String(label)} className="flex justify-between text-sm">
                           <span className="text-muted-foreground">{label}</span>
                           <span className="font-semibold">{value}</span>
                        </li>
                      ))}
                   </ul>
                </div>
             </div>
          </Panel>
        </div>
      </div>

      {isAdding && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border w-full max-w-2xl p-6 rounded-xs shadow-xl max-h-[90vh] overflow-y-auto">
            <h2 className="display-title text-xl mb-4">Register New Vehicle</h2>
            <form 
              className="space-y-6"
              onSubmit={async (e) => {
                e.preventDefault();
                const fd = new FormData(e.currentTarget);
                
                const carrierId = (isAdmin ? fd.get("carrier_id") : myOrg?.id) as string;
                if (!carrierId) {
                  toast.error("Carrier selection is required");
                  return;
                }

                const payload = {
                  carrier_id: carrierId,
                  vehicle_id_tag: fd.get("vehicle_id_tag") as string,
                  vehicle_type: fd.get("vehicle_type") as string,
                  make: fd.get("make") as string,
                  model: fd.get("model") as string,
                  year: parseInt(fd.get("year") as string) || null,
                  license_plate: fd.get("license_plate") as string,
                  vin: fd.get("vin") as string,
                  capacity_lbs: parseInt(fd.get("capacity_lbs") as string) || null,
                  assigned_driver_id: (fd.get("driver_id") as string) || null,
                  status: "available"
                };

                // @ts-ignore
                const { error } = await supabase.from("vehicles").insert(payload);

                if (error) toast.error(error.message);
                else {
                  toast.success("Vehicle registered in fleet");
                  setIsAdding(false);
                  void queryClient.invalidateQueries({ queryKey: ["vehicles"] });
                }
              }}
            >
              <div className="grid grid-cols-2 gap-4">
                {isAdmin && (
                  <div className="col-span-2 space-y-1">
                    <label className="label-mono text-[10px] text-muted-foreground uppercase">Owner Carrier</label>
                    <select name="carrier_id" required className="w-full bg-secondary border-none rounded-xs p-2 text-sm outline-none">
                      <option value="">Select Carrier...</option>
                      {carriers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                )}
                
                <div className="space-y-1">
                  <label className="label-mono text-[10px] text-muted-foreground uppercase">Vehicle ID / Name</label>
                  <input name="vehicle_id_tag" required placeholder="e.g. TRK-001" className="w-full bg-secondary border-none rounded-xs p-2 text-sm outline-none" />
                </div>
                
                <div className="space-y-1">
                  <label className="label-mono text-[10px] text-muted-foreground uppercase">Vehicle Type</label>
                  <select name="vehicle_type" className="w-full bg-secondary border-none rounded-xs p-2 text-sm outline-none">
                    <option value="Dry Van">Dry Van</option>
                    <option value="Reefer">Reefer</option>
                    <option value="Flatbed">Flatbed</option>
                    <option value="Box Truck">Box Truck</option>
                    <option value="Sprinter">Sprinter Van</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="label-mono text-[10px] text-muted-foreground uppercase">Assigned Driver</label>
                  <select name="driver_id" className="w-full bg-secondary border-none rounded-xs p-2 text-sm outline-none">
                    <option value="">Unassigned</option>
                    {drivers.map(d => (
                      <option key={d.id} value={d.id}>{d.first_name} {d.last_name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="label-mono text-[10px] text-muted-foreground uppercase">Capacity (lbs)</label>
                  <input name="capacity_lbs" type="number" placeholder="45000" className="w-full bg-secondary border-none rounded-xs p-2 text-sm outline-none" />
                </div>

                <div className="space-y-1">
                  <label className="label-mono text-[10px] text-muted-foreground uppercase">Make</label>
                  <input name="make" placeholder="Freightliner" className="w-full bg-secondary border-none rounded-xs p-2 text-sm outline-none" />
                </div>
                <div className="space-y-1">
                  <label className="label-mono text-[10px] text-muted-foreground uppercase">Model</label>
                  <input name="model" placeholder="Cascadia" className="w-full bg-secondary border-none rounded-xs p-2 text-sm outline-none" />
                </div>
                
                <div className="space-y-1">
                  <label className="label-mono text-[10px] text-muted-foreground uppercase">License Plate</label>
                  <input name="license_plate" className="w-full bg-secondary border-none rounded-xs p-2 text-sm outline-none" />
                </div>
                <div className="space-y-1">
                  <label className="label-mono text-[10px] text-muted-foreground uppercase">VIN</label>
                  <input name="vin" className="w-full bg-secondary border-none rounded-xs p-2 text-sm outline-none" />
                </div>
              </div>
              
              <div className="flex gap-3 pt-4 border-t border-border">
                <button type="button" onClick={() => setIsAdding(false)} className="flex-1 label-mono text-xs bg-secondary py-3 rounded-xs transition-colors hover:bg-secondary/80">Cancel</button>
                <button type="submit" className="flex-1 label-mono text-xs bg-primary text-primary-foreground py-3 rounded-xs transition-opacity hover:opacity-90">Register Vehicle</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
