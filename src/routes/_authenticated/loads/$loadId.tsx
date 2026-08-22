import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { 
  ArrowLeft, 
  Zap, 
  MapPin, 
  Calendar, 
  Clock, 
  Plus, 
  Trash2, 
  GripVertical,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import { format } from "date-fns";

import { EmptyState, Panel, Pill } from "@/components/tms/primitives";
import { EpodSection } from "@/components/tms/epod-section";
import { MilestoneSection } from "@/components/tms/milestone-section";
import { useSessionProfile, useMyOrg } from "@/hooks/use-session";
import { useCarriers, useDocuments, useLoad, useDrivers, useVehicles, useStops, useLoadExceptions } from "@/hooks/use-tms-data";
import { ExceptionSection } from "@/components/tms/exception-section";
import { useRealtimeLoads } from "@/hooks/use-realtime-loads";
import { supabase } from "@/integrations/supabase/client";
import {
  STATUS_TONE,
  dateTime,
  labelize,
  money,
  shortDate,
  titleize,
  type LoadStatus,
  type LoadPriority,
  PRIORITY_TONE,
  SLA_TONE,
  type SLAStatus,
} from "@/lib/tms";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/loads/$loadId")({
  component: LoadDetail,
});

function LoadDetail() {
  const { loadId } = useParams({ from: "/_authenticated/loads/$loadId" });
  const { data: load, isLoading } = useLoad(loadId);
  const { data: profile } = useSessionProfile();
  const { data: myOrg } = useMyOrg(profile?.role, profile?.id);
  const queryClient = useQueryClient();
  const isAdmin = profile?.role === "admin";
  const isShipper = profile?.role === "shipper";
  const isCarrier = profile?.role === "carrier";

  useRealtimeLoads(loadId);

  if (isLoading) return <EmptyState title="Loading load record" />;
  if (!load) return <EmptyState title="Load not found" />;

  const canEditStops = isAdmin || (isShipper && load.status === 'planning');

  return (
    <>
      <Link to="/loads" className="label-mono mb-6 inline-flex items-center gap-2 text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> Back to board
      </Link>

      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="label-mono text-muted-foreground">Load Reference</p>
          <h1 className="display-title mt-2 text-4xl leading-none text-foreground">{load.reference}</h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Pill tone={STATUS_TONE[load.status as LoadStatus]}>{labelize(load.status)}</Pill>
          <Pill tone={PRIORITY_TONE[load.priority as LoadPriority] || "neutral"}>
            {load.priority === "emergency" && <Zap className="size-3 mr-1 fill-current" />}
            {labelize(load.priority)}
          </Pill>
          <Pill tone={SLA_TONE[load.sla_status as SLAStatus] || "neutral"}>
            SLA: {labelize(load.sla_status)}
          </Pill>
          {load.sla_status === 'breached' && (
            <Pill tone="danger" className="animate-pulse">
              <AlertCircle className="size-3 mr-1" />
              DELAYED
            </Pill>
          )}
        </div>

      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Panel title="Shipment Detail">
            <dl className="grid grid-cols-2 gap-px bg-border md:grid-cols-3">
              {[
                ["Commodity", load.commodity],
                ["Category", titleize(load.category)],
                ["Shipper", load.shipper?.name ?? "—"],
                ["Carrier", load.carrier?.name ?? "Unassigned"],
                ["Driver", load.driver ? `${load.driver.first_name} ${load.driver.last_name}` : "Unassigned"],
                ["Vehicle", load.vehicle?.vehicle_id_tag ?? "Unassigned"],
                ["SLA Deadline", dateTime(load.sla_deadline)],
                ["Scheduled Delivery", dateTime(load.delivery_date)],
                ["Actual Completion", dateTime(load.actual_completion_time)],

              ].map(([label, value]) => (
                <div key={label} className="bg-card px-5 py-4">
                  <dt className="label-mono text-muted-foreground">{label}</dt>
                  <dd className="mt-2 text-sm font-medium text-foreground">{value}</dd>
                </div>
              ))}
            </dl>
          </Panel>

          <StopsList loadId={loadId} stops={load.stops || []} canEdit={canEditStops} isAdmin={isAdmin} />
          
          <ExceptionSection 
            loadId={loadId} 
            role={profile?.role as any} 
            userId={profile?.id ?? undefined} 
          />
          
          <MilestoneSection
            load={load}
            role={profile?.role as any}
            userId={profile?.id ?? undefined}
          />

          <EpodSection 
            load={load} 
            role={profile?.role as any} 
            carrierId={isCarrier ? (myOrg as any)?.id : load.carrier_id}
            userId={profile?.id ?? undefined}
          />
        </div>

        <div className="space-y-6">
          {isAdmin && (
             <DispatchPanel
               load={load}
               onDispatch={() => {
                 void queryClient.invalidateQueries({ queryKey: ["load", loadId] });
               }}
             />
          )}

          {isAdmin && (
            <Panel title="SLA Configuration">
              <div className="p-5 space-y-4">
                <div className="space-y-1">
                  <label className="label-mono text-xs text-muted-foreground">SLA Deadline</label>
                  <input
                    type="datetime-local"
                    defaultValue={load.sla_deadline ? format(new Date(load.sla_deadline), "yyyy-MM-dd'T'HH:mm") : ""}
                    onChange={async (e) => {
                      const val = e.target.value ? new Date(e.target.value).toISOString() : null;
                      const { error } = await supabase.from("loads").update({ sla_deadline: val }).eq("id", load.id);
                      if (error) toast.error(error.message);
                      else {
                        toast.success("SLA updated");
                        void queryClient.invalidateQueries({ queryKey: ["load", loadId] });
                      }
                    }}
                    className="w-full bg-secondary p-2 rounded-xs text-sm outline-none"
                  />
                </div>
              </div>
            </Panel>
          )}
          {isCarrier && (
            <Panel title="Delivery Commitment">
              <div className="p-5 space-y-4">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "p-2 rounded-full",
                    load.sla_status === 'breached' ? "bg-red-500/10 text-red-500" : 
                    load.sla_status === 'at_risk' ? "bg-amber-500/10 text-amber-500" : "bg-blue-500/10 text-blue-500"
                  )}>
                    {load.sla_status === 'breached' ? <AlertCircle className="size-5" /> : <Clock className="size-5" />}
                  </div>
                  <div>
                    <p className="label-mono text-[10px] text-muted-foreground uppercase">SLA Deadline</p>
                    <p className="font-bold text-foreground">{dateTime(load.sla_deadline)}</p>
                  </div>
                </div>
                <div className="pt-2 border-t border-border">
                  <p className="text-xs text-muted-foreground italic">
                    Status: <span className="font-semibold text-foreground">{labelize(load.sla_status)}</span>
                  </p>
                </div>
              </div>
            </Panel>
          )}
        </div>
      </div>
    </>
  );
}

function StopsList({ loadId, stops, canEdit, isAdmin }: { loadId: string, stops: any[], canEdit: boolean, isAdmin: boolean }) {
  const queryClient = useQueryClient();
  const [isAdding, setIsAdding] = useState(false);

  const deleteStop = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("load_stops").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Stop removed");
      void queryClient.invalidateQueries({ queryKey: ["load", loadId] });
    }
  });

  const updateStopStatus = useMutation({
    mutationFn: async ({ id, status, actual_arrival, actual_departure }: any) => {
      const { error } = await supabase.from("load_stops").update({ status, actual_arrival, actual_departure }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Stop updated");
      void queryClient.invalidateQueries({ queryKey: ["load", loadId] });
    }
  });

  return (
    <Panel 
      title="Route stops" 
      action={canEdit ? (
        <button 
          onClick={() => setIsAdding(true)}
          className="label-mono flex items-center gap-1 text-xs text-primary hover:text-signal"
        >
          <Plus className="size-3" /> Add Stop
        </button>
      ) : null}
    >
      <div className="divide-y divide-border/60">
        {stops.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground text-sm">No stops defined for this load.</div>
        ) : (
          stops.sort((a,b) => a.stop_number - b.stop_number).map((stop, idx) => (
            <div key={stop.id} className="p-5 flex items-start gap-4">
              <div className="flex flex-col items-center">
                <div className={cn(
                  "size-8 rounded-full flex items-center justify-center font-mono text-xs font-bold",
                  stop.status === 'departed' ? "bg-green-500/10 text-green-500" : "bg-secondary text-muted-foreground"
                )}>
                  {idx + 1}
                </div>
                {idx < stops.length - 1 && <div className="w-px h-full bg-border mt-2" />}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      "label-mono text-[10px] px-1.5 py-0.5 rounded-full",
                      stop.stop_type === 'pickup' ? "bg-blue-500/10 text-blue-500" : "bg-amber-500/10 text-amber-500"
                    )}>
                      {stop.stop_type.toUpperCase()}
                    </span>
                    <h4 className="font-medium text-foreground truncate">{stop.location_address}</h4>
                  </div>
                  <div className="flex items-center gap-2">
                    <Pill tone={stop.status === 'departed' ? 'ok' : stop.status === 'arrived' ? 'primary' : 'neutral'} className="text-[10px]">
                      {labelize(stop.status)}
                    </Pill>
                    {canEdit && (
                      <button 
                        onClick={() => deleteStop.mutate(stop.id)}
                        className="text-muted-foreground hover:text-signal p-1"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <p className="label-mono text-muted-foreground mb-1 flex items-center gap-1">
                      <Calendar className="size-3" /> Scheduled Arrival
                    </p>
                    <p className="text-foreground">{dateTime(stop.scheduled_arrival)}</p>
                  </div>
                  <div>
                    <p className="label-mono text-muted-foreground mb-1 flex items-center gap-1">
                      <Clock className="size-3" /> Actual Arrival
                    </p>
                    {isAdmin ? (
                      <input 
                        type="datetime-local"
                        defaultValue={stop.actual_arrival ? format(new Date(stop.actual_arrival), "yyyy-MM-dd'T'HH:mm") : ""}
                        onChange={(e) => updateStopStatus.mutate({ 
                          id: stop.id, 
                          actual_arrival: e.target.value ? new Date(e.target.value).toISOString() : null,
                          status: e.target.value ? 'arrived' : 'pending'
                        })}
                        className="bg-secondary p-1 rounded-xs outline-none"
                      />
                    ) : (
                      <p className="text-foreground">{dateTime(stop.actual_arrival)}</p>
                    )}
                  </div>
                  <div>
                    <p className="label-mono text-muted-foreground mb-1 flex items-center gap-1">
                      <Calendar className="size-3" /> Scheduled Departure
                    </p>
                    <p className="text-foreground">{dateTime(stop.scheduled_departure)}</p>
                  </div>
                  <div>
                    <p className="label-mono text-muted-foreground mb-1 flex items-center gap-1">
                      <Clock className="size-3" /> Actual Departure
                    </p>
                    {isAdmin ? (
                      <input 
                        type="datetime-local"
                        defaultValue={stop.actual_departure ? format(new Date(stop.actual_departure), "yyyy-MM-dd'T'HH:mm") : ""}
                        onChange={(e) => updateStopStatus.mutate({ 
                          id: stop.id, 
                          actual_departure: e.target.value ? new Date(e.target.value).toISOString() : null,
                          status: e.target.value ? 'departed' : (stop.actual_arrival ? 'arrived' : 'pending')
                        })}
                        className="bg-secondary p-1 rounded-xs outline-none"
                      />
                    ) : (
                      <p className="text-foreground">{dateTime(stop.actual_departure)}</p>
                    )}
                  </div>
                </div>
                {stop.notes && (
                  <div className="mt-3 p-2 bg-secondary/50 rounded-xs text-[11px] text-muted-foreground italic border-l-2 border-border">
                    {stop.notes}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {isAdding && (
        <AddStopForm 
          loadId={loadId} 
          nextNumber={stops.length + 1} 
          onClose={() => setIsAdding(false)} 
          onSuccess={() => {
            setIsAdding(false);
            void queryClient.invalidateQueries({ queryKey: ["load", loadId] });
          }}
        />
      )}
    </Panel>
  );
}

function AddStopForm({ loadId, nextNumber, onClose, onSuccess }: any) {
  const [formData, setFormData] = useState({
    location_address: "",
    stop_type: "delivery",
    scheduled_arrival: "",
    scheduled_departure: "",
    notes: ""
  });

  const add = useMutation({
    mutationFn: async (data: any) => {
      const { error } = await supabase.from("load_stops").insert({
        ...data,
        load_id: loadId,
        stop_number: nextNumber,
        scheduled_arrival: data.scheduled_arrival ? new Date(data.scheduled_arrival).toISOString() : null,
        scheduled_departure: data.scheduled_departure ? new Date(data.scheduled_departure).toISOString() : null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Stop added");
      onSuccess();
    },
    onError: (err: any) => toast.error(err.message)
  });

  return (
    <div className="p-5 bg-secondary/30 border-t border-border">
      <h5 className="label-mono text-xs mb-4">Add new stop</h5>
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <label className="label-mono text-[10px] text-muted-foreground">Address</label>
          <input 
            value={formData.location_address}
            onChange={(e) => setFormData({...formData, location_address: e.target.value})}
            className="w-full bg-secondary p-2 rounded-xs text-sm outline-none"
            placeholder="Street, City, State..."
          />
        </div>
        <div>
          <label className="label-mono text-[10px] text-muted-foreground">Type</label>
          <select 
            value={formData.stop_type}
            onChange={(e) => setFormData({...formData, stop_type: e.target.value})}
            className="w-full bg-secondary p-2 rounded-xs text-sm outline-none"
          >
            <option value="pickup">Pickup</option>
            <option value="delivery">Delivery</option>
          </select>
        </div>
        <div>
          <label className="label-mono text-[10px] text-muted-foreground">Notes</label>
          <input 
            value={formData.notes}
            onChange={(e) => setFormData({...formData, notes: e.target.value})}
            className="w-full bg-secondary p-2 rounded-xs text-sm outline-none"
          />
        </div>
        <div>
          <label className="label-mono text-[10px] text-muted-foreground">Scheduled Arrival</label>
          <input 
            type="datetime-local"
            value={formData.scheduled_arrival}
            onChange={(e) => setFormData({...formData, scheduled_arrival: e.target.value})}
            className="w-full bg-secondary p-2 rounded-xs text-sm outline-none"
          />
        </div>
        <div>
          <label className="label-mono text-[10px] text-muted-foreground">Scheduled Departure</label>
          <input 
            type="datetime-local"
            value={formData.scheduled_departure}
            onChange={(e) => setFormData({...formData, scheduled_departure: e.target.value})}
            className="w-full bg-secondary p-2 rounded-xs text-sm outline-none"
          />
        </div>
      </div>
      <div className="mt-4 flex justify-end gap-2">
        <button onClick={onClose} className="label-mono text-xs px-3 py-1 text-muted-foreground">Cancel</button>
        <button 
          onClick={() => add.mutate(formData)}
          disabled={!formData.location_address}
          className="label-mono text-xs px-4 py-1 bg-primary text-primary-foreground rounded-xs disabled:opacity-50"
        >
          Save Stop
        </button>
      </div>
    </div>
  );
}

function DispatchPanel({ load, onDispatch }: { load: any; onDispatch: () => void }) {
  const [selectedDriverId, setSelectedDriverId] = useState(load.driver_id || "");
  const [selectedVehicleId, setSelectedVehicleId] = useState(load.vehicle_id || "");
  const { data: drivers = [] } = useDrivers(load.carrier_id);
  const { data: vehiclesData = [] } = useVehicles(load.carrier_id);
  const vehicles = (vehiclesData || []) as any[];

  const queryClient = useQueryClient();

  const update = useMutation({
    mutationFn: async (patch: any) => {
      const { error } = await supabase.from("loads").update(patch).eq("id", load.id);
      if (error) throw error;
    },
    onSuccess: () => {
      onDispatch();
      toast.success("Assignment updated");
    },
    onError: (err: any) => toast.error(err.message)
  });

  return (
    <Panel title="Dispatch Control">
      <div className="p-5 space-y-4">
        <div className="space-y-1">
          <label className="label-mono text-xs text-muted-foreground">Assign Driver</label>
          <select
            value={selectedDriverId}
            onChange={(e) => {
              const val = e.target.value || null;
              setSelectedDriverId(val || "");
              update.mutate({ driver_id: val, status: 'booked' });
            }}
            className="w-full bg-secondary p-2 rounded-xs text-sm outline-none"
          >
            <option value="">Select a driver...</option>
            {drivers.filter((d: any) => d.status === 'active').map((d: any) => (
              <option key={d.id} value={d.id}>{d.first_name} {d.last_name} ({d.employment_type})</option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label className="label-mono text-xs text-muted-foreground">Assign Vehicle</label>
          <select
            value={selectedVehicleId}
            onChange={(e) => {
              const val = e.target.value || null;
              setSelectedVehicleId(val || "");
              update.mutate({ vehicle_id: val, status: 'booked' });
            }}
            className="w-full bg-secondary p-2 rounded-xs text-sm outline-none"
          >
            <option value="">Select a vehicle...</option>
            {vehicles.filter((v: any) => v.status !== 'maintenance' && v.status !== 'inactive').map((v: any) => (
              <option key={v.id} value={v.id}>{v.vehicle_id_tag} ({v.vehicle_type})</option>
            ))}
          </select>
        </div>
      </div>
    </Panel>
  );
}