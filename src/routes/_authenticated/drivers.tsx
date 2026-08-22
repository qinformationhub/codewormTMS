import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, User, Phone, Mail, Shield, CheckCircle2, XCircle, Search, Filter, Trash2, Edit, LogIn, LogOut, Clock, History } from "lucide-react";
import { useState, useMemo, useEffect } from "react";

import { toast } from "sonner";

import { EmptyState, PageHeader, Panel, Pill, TableShell } from "@/components/tms/primitives";
import { useSessionProfile, useMyOrg } from "@/hooks/use-session";
import { supabase } from "@/integrations/supabase/client";
import { labelize, shortDate } from "@/lib/tms";
import { useDrivers, useCarriers, useDriverCheckins } from "@/hooks/use-tms-data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/drivers")({
  component: DriversPage,
});

function DriversPage() {
  const { data: profile } = useSessionProfile();
  const isAdmin = profile?.role === "admin";
  const { data: myOrg } = useMyOrg(profile?.role, profile?.id);
  const [isAdding, setIsAdding] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState<any>(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [carrierFilter, setCarrierFilter] = useState<string>("all");
  const [employmentFilter, setEmploymentFilter] = useState<string>("all");

  
  const carrierId = isAdmin ? (carrierFilter === 'all' ? undefined : carrierFilter) : myOrg?.id;
  const { data: drivers = [], isLoading, refetch } = useDrivers(carrierId);
  const { data: carriers = [] } = useCarriers();

  const filteredDrivers = useMemo(() => {
    return drivers.filter(d => {
      const nameMatch = `${d.first_name} ${d.last_name}`.toLowerCase().includes(searchQuery.toLowerCase());
      const employmentMatch = employmentFilter === 'all' || d.employment_type === employmentFilter;
      return nameMatch && employmentMatch;
    });
  }, [drivers, searchQuery, employmentFilter]);

  const toggleStatus = async (id: string, currentStatus: string) => {
    const nextStatus = currentStatus === "active" ? "inactive" : "active";
    const { error } = await supabase.from("drivers").update({ status: nextStatus }).eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success(`Driver status updated to ${nextStatus}`);
      void refetch();
    }
  };

  const handleCheckIn = async (driver: any) => {
    if (driver.status !== "active") {
      toast.error("Driver must be active to check in.");
      return;
    }
    if (driver.availability_status === "checked_in") {
      toast.error("Driver is already checked in.");
      return;
    }

    const { error } = await (supabase as any).from("driver_checkins").insert({
      driver_id: driver.id,
      carrier_id: driver.carrier_id,
      status: "checked_in",
      check_in_at: new Date().toISOString()
    });

    if (error) {
      toast.error(error.message);
      return;
    }

    const { error: updateError } = await supabase
      .from("drivers")
      .update({ availability_status: "checked_in" as any })
      .eq("id", driver.id);

    if (updateError) toast.error(updateError.message);
    else {
      toast.success("Driver checked in successfully");
      void refetch();
    }
  };

  const handleCheckOut = async (driver: any) => {
    if (driver.availability_status !== "checked_in") {
      toast.error("Driver is not checked in.");
      return;
    }

    // Check for active loads
    const { data: activeLoads, error: loadsError } = await supabase
      .from("loads")
      .select("id")
      .eq("driver_id", driver.id)
      .in("status", ["booked", "dispatched", "in_transit"]);

    if (loadsError) {
      toast.error("Failed to verify active loads");
      return;
    }

    if (activeLoads && activeLoads.length > 0) {
      toast.error("Driver has active loads and cannot check out.");
      return;
    }

    // Find the latest open check-in
    const { data: checkin, error: checkinError } = await (supabase as any)
      .from("driver_checkins")
      .select("id")
      .eq("driver_id", driver.id)
      .is("check_out_at", null)
      .order("check_in_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (checkinError) {
      toast.error("Failed to find active check-in record");
      return;
    }

    if (checkin) {
      await (supabase as any)
        .from("driver_checkins")
        .update({ check_out_at: new Date().toISOString(), status: "checked_out" })
        .eq("id", checkin.id);
    }

    const { error: updateError } = await supabase
      .from("drivers")
      .update({ availability_status: "available" as any })
      .eq("id", driver.id);

    if (updateError) toast.error(updateError.message);
    else {
      toast.success("Driver checked out successfully");
      void refetch();
    }
  };


  const getExpirationTone = (date: string | null) => {
    if (!date) return "neutral";
    const diff = new Date(date).getTime() - Date.now();
    const days = diff / (1000 * 60 * 60 * 24);
    if (days < 0) return "danger";
    if (days < 30) return "warn";
    return "ok";
  };

  if (isLoading) return <EmptyState title="Loading drivers..." />;

  return (
    <div className="p-6 space-y-6">
      <PageHeader 
        title="Driver Management" 
        subtitle="Operational roster, compliance tracking and performance"
        actions={
          <button 
            onClick={() => setIsAdding(true)}
            className="label-mono flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-xs hover:opacity-90 transition-opacity"
          >
            <Plus className="size-4" /> Onboard Driver
          </button>
        }
      />

      <Panel title="Filters">
        <div className="p-4 flex flex-wrap gap-4 items-center">
          <div className="flex-1 min-w-[200px] relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <input 
              placeholder="Search by name..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-secondary pl-9 pr-4 py-2 rounded-xs text-sm outline-none border border-transparent focus:border-primary/30"
            />
          </div>
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
          <select 
            className="bg-secondary px-3 py-2 rounded-xs text-sm outline-none border border-transparent focus:border-primary/30"
            value={employmentFilter}
            onChange={(e) => setEmploymentFilter(e.target.value)}
          >
            <option value="all">All Types</option>
            <option value="employee">Employee</option>
            <option value="contractor">Contractor</option>
          </select>
        </div>
      </Panel>

      <Panel title="Active Roster">
        {filteredDrivers.length > 0 ? (
          <TableShell columns={["Driver", "Carrier", "Compliance", "Employment", "Availability", "Status", "Actions"]}>

            {filteredDrivers.map((d) => (
              <tr key={d.id} className="border-b border-border/60 hover:bg-surface/60 transition-colors">
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="size-8 rounded-full bg-secondary flex items-center justify-center text-xs font-bold label-mono">
                      {d.first_name[0]}{d.last_name[0]}
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{d.first_name} {d.last_name}</p>
                      <p className="text-[10px] label-mono text-muted-foreground uppercase">{d.license_type || "No License Set"}</p>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-4 text-sm text-muted-foreground">
                   {carriers.find(c => c.id === d.carrier_id)?.name || "—"}
                </td>
                <td className="px-5 py-4">
                  <div className="space-y-1">
                    <Pill tone={getExpirationTone(d.license_expiration)}>
                      Lic: {d.license_expiration ? shortDate(d.license_expiration) : "NONE"}
                    </Pill>
                    {d.certification_name && (
                      <Pill tone={getExpirationTone(d.certification_expiration)}>
                        {d.certification_name}
                      </Pill>
                    )}
                  </div>
                </td>
                <td className="px-5 py-4">
                  <span className="text-xs label-mono uppercase text-muted-foreground">{d.employment_type || "—"}</span>
                </td>
                <td className="px-5 py-4">
                  <Pill tone={d.availability_status === 'available' ? 'ok' : d.availability_status === 'assigned' ? 'primary' : d.availability_status === 'checked_in' ? 'ok' : 'neutral'}>
                    {labelize(d.availability_status)}
                  </Pill>
                </td>
                <td className="px-5 py-4">
                  <Pill tone={d.status === "active" ? "ok" : "neutral"}>
                    {labelize(d.status)}
                  </Pill>
                </td>
                <td className="px-5 py-4">
                  <div className="flex flex-wrap gap-2">
                    {!isAdmin && d.availability_status !== "checked_in" && (
                      <button onClick={() => handleCheckIn(d)} title="Check In" className="p-1 text-ok hover:bg-ok/10 rounded transition-colors">
                        <LogIn className="size-4" />
                      </button>
                    )}
                    {!isAdmin && d.availability_status === "checked_in" && (
                      <button onClick={() => handleCheckOut(d)} title="Check Out" className="p-1 text-danger hover:bg-danger/10 rounded transition-colors">
                        <LogOut className="size-4" />
                      </button>
                    )}
                    <button 
                      onClick={() => {
                        setSelectedDriver(d);
                        setIsHistoryOpen(true);
                      }} 
                      title="View History" 
                      className="p-1 text-muted-foreground hover:bg-secondary rounded transition-colors"
                    >
                      <History className="size-4" />
                    </button>
                    <button onClick={() => toggleStatus(d.id, d.status)} className="text-xs label-mono text-primary hover:underline self-center ml-1">
                      {d.status === "active" ? "Suspend" : "Activate"}
                    </button>
                  </div>
                </td>

              </tr>
            ))}
          </TableShell>
        ) : (
          <div className="p-12 text-center text-muted-foreground">No drivers found matching criteria.</div>
        )}
      </Panel>

      {isAdding && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border w-full max-w-2xl p-6 rounded-xs shadow-xl max-h-[90vh] overflow-y-auto">
            <h2 className="display-title text-xl mb-4">Onboard New Operator</h2>
            <form 
              className="space-y-6"
              onSubmit={async (e) => {
                e.preventDefault();
                const fd = new FormData(e.currentTarget);
                const payload = {
                  carrier_id: (isAdmin ? fd.get("carrier_id") : myOrg?.id) as string,
                  first_name: fd.get("first_name") as string,
                  last_name: fd.get("last_name") as string,
                  email: fd.get("email") as string,
                  phone: fd.get("phone") as string,
                  license_number: fd.get("license_number") as string,
                  license_state: fd.get("license_state") as string,
                  license_type: fd.get("license_type") as string,
                  license_expiration: fd.get("license_expiration") as string || null,
                  employment_type: fd.get("employment_type") as any,
                  date_of_birth: fd.get("dob") as string || null,
                  status: "active",
                  availability_status: "available"
                };

                const { error } = await supabase.from("drivers").insert(payload);

                if (error) toast.error(error.message);
                else {
                  toast.success("Driver onboarded");
                  setIsAdding(false);
                  void refetch();
                }
              }}
            >
              <div className="grid grid-cols-2 gap-4">
                {isAdmin && (
                  <div className="col-span-2 space-y-1">
                    <label className="label-mono text-[10px] text-muted-foreground uppercase">Assign to Carrier</label>
                    <select name="carrier_id" required className="w-full bg-secondary border-none rounded-xs p-2 text-sm">
                      <option value="">Select Carrier...</option>
                      {carriers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                )}
                <div className="space-y-1">
                  <label className="label-mono text-[10px] text-muted-foreground uppercase">First Name</label>
                  <input name="first_name" required className="w-full bg-secondary border-none rounded-xs p-2 text-sm" />
                </div>
                <div className="space-y-1">
                  <label className="label-mono text-[10px] text-muted-foreground uppercase">Last Name</label>
                  <input name="last_name" required className="w-full bg-secondary border-none rounded-xs p-2 text-sm" />
                </div>
                <div className="space-y-1">
                  <label className="label-mono text-[10px] text-muted-foreground uppercase">License Type</label>
                  <select name="license_type" className="w-full bg-secondary border-none rounded-xs p-2 text-sm">
                    <option value="Class A CDL">Class A CDL</option>
                    <option value="Class B CDL">Class B CDL</option>
                    <option value="Class C CDL">Class C CDL</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="label-mono text-[10px] text-muted-foreground uppercase">License Expiration</label>
                  <input name="license_expiration" type="date" className="w-full bg-secondary border-none rounded-xs p-2 text-sm" />
                </div>
                <div className="space-y-1">
                  <label className="label-mono text-[10px] text-muted-foreground uppercase">Employment Type</label>
                  <select name="employment_type" className="w-full bg-secondary border-none rounded-xs p-2 text-sm">
                    <option value="employee">W2 Employee</option>
                    <option value="contractor">1099 Contractor</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="label-mono text-[10px] text-muted-foreground uppercase">Date of Birth</label>
                  <input name="dob" type="date" className="w-full bg-secondary border-none rounded-xs p-2 text-sm" />
                </div>
              </div>
              
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setIsAdding(false)} className="flex-1 label-mono text-xs bg-secondary py-3 rounded-xs">Cancel</button>
                <button type="submit" className="flex-1 label-mono text-xs bg-primary text-primary-foreground py-3 rounded-xs">Complete Onboarding</button>
              </div>
            </form>
          </div>
        </div>
      )}
      {isHistoryOpen && selectedDriver && (
        <CheckinHistoryDialog 
          driver={selectedDriver} 
          onClose={() => {
            setIsHistoryOpen(false);
            setSelectedDriver(null);
          }} 
        />
      )}
    </div>
  );
}

function CheckinHistoryDialog({ driver, onClose }: { driver: any, onClose: () => void }) {
  const { data: history = [], isLoading } = useDriverCheckins(driver.id);


  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card border border-border w-full max-w-2xl p-6 rounded-xs shadow-xl max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="display-title text-xl">Check-In History</h2>
            <p className="text-xs label-mono text-muted-foreground uppercase">
              {driver.first_name} {driver.last_name}
            </p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <XCircle className="size-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto min-h-[300px]">
          {isLoading ? (
            <div className="p-12 text-center text-muted-foreground">Loading history...</div>
          ) : history.length > 0 ? (
            <TableShell columns={["Status", "Check In", "Check Out", "Duration"]}>
              {history.map((h: any) => {
                const checkIn = new Date(h.check_in_at);
                const checkOut = h.check_out_at ? new Date(h.check_out_at) : null;
                const duration = checkOut 
                  ? Math.round((checkOut.getTime() - checkIn.getTime()) / (1000 * 60)) 
                  : null;

                return (
                  <tr key={h.id} className="border-b border-border/60">
                    <td className="px-5 py-3">
                      <Pill tone={h.status === 'checked_in' && !h.check_out_at ? 'ok' : 'neutral'}>
                        {h.status === 'checked_in' && !h.check_out_at ? 'Active' : 'Completed'}
                      </Pill>
                    </td>
                    <td className="px-5 py-3 text-sm font-mono">
                      {new Date(h.check_in_at).toLocaleString()}
                    </td>
                    <td className="px-5 py-3 text-sm font-mono">
                      {h.check_out_at ? new Date(h.check_out_at).toLocaleString() : "—"}
                    </td>
                    <td className="px-5 py-3 text-sm text-muted-foreground">
                      {duration !== null ? `${duration}m` : "Active"}
                    </td>
                  </tr>
                );
              })}
            </TableShell>
          ) : (
            <div className="p-12 text-center text-muted-foreground border border-dashed border-border rounded-xs">
              No check-in records found for this driver.
            </div>
          )}
        </div>

        <div className="mt-6 flex justify-end">
          <button onClick={onClose} className="label-mono text-xs bg-secondary px-6 py-2 rounded-xs">Close</button>
        </div>
      </div>
    </div>
  );
}
