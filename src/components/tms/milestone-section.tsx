import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Clock, CheckCircle2, ShieldCheck } from "lucide-react";
import { differenceInMinutes } from "date-fns";

import { Panel } from "@/components/tms/primitives";
import { supabase } from "@/integrations/supabase/client";
import { useMilestones } from "@/hooks/use-tms-data";
import { dateTime, labelize } from "@/lib/tms";
import { cn } from "@/lib/utils";

const MILESTONE_TYPES = [
  { id: "arrived_pickup", label: "Arrived at Pickup" },
  { id: "departed_pickup", label: "Departed Pickup" },
  { id: "arrived_delivery", label: "Arrived at Delivery" },
  { id: "delivery_completed", label: "Delivery Completed" },
];

interface MilestoneSectionProps {
  load: any;
  role: "admin" | "shipper" | "carrier";
  userId?: string | null | undefined;
}

export function MilestoneSection({ load, role, userId }: MilestoneSectionProps) {
  const { data: milestones = [], isLoading } = useMilestones(load.id);
  const queryClient = useQueryClient();
  const isAdmin = role === "admin";
  const isCarrier = role === "carrier";

  const recordMilestone = useMutation({
    mutationFn: async (eventType: string) => {
      const { error } = await (supabase as any).from("delivery_milestones").insert({
        load_id: load.id,
        event_type: eventType,
        recorded_by: userId,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Milestone recorded");
      void queryClient.invalidateQueries({ queryKey: ["milestones", load.id] });
    },
    onError: (err: any) => toast.error(err.message),
  });

  const verifyMilestone = useMutation({
    mutationFn: async (milestoneId: string) => {
      const { error } = await (supabase as any)
        .from("delivery_milestones")
        .update({
          verified_at: new Date().toISOString(),
          verified_by: userId,
        })
        .eq("id", milestoneId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Milestone verified");
      void queryClient.invalidateQueries({ queryKey: ["milestones", load.id] });
    },
    onError: (err: any) => toast.error(err.message),
  });

  if (isLoading) return <div className="p-4 animate-pulse bg-secondary/20 rounded-xs">Loading milestones...</div>;

  return (
    <Panel title="Delivery Milestones">
      <div className="divide-y divide-border/60">
        <div className="p-5 space-y-4">
          {isCarrier && load.status !== 'delivered' && (
            <div className="flex flex-wrap gap-2 mb-4">
              {MILESTONE_TYPES.map((type) => {
                const isRecorded = milestones.some((m: any) => m.event_type === type.id);
                return (
                  <button
                    key={type.id}
                    type="button"
                    disabled={isRecorded || recordMilestone.isPending}
                    onClick={() => recordMilestone.mutate(type.id)}
                    className={cn(
                      "label-mono text-[10px] px-3 py-1.5 rounded-xs border transition-colors flex items-center gap-1.5",
                      isRecorded
                        ? "bg-green-500/10 border-green-500/20 text-green-600 cursor-not-allowed"
                        : "bg-secondary border-transparent hover:border-primary/30 text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {isRecorded ? <CheckCircle2 className="size-3" /> : <Clock className="size-3" />}
                    {type.label}
                  </button>
                );
              })}
            </div>
          )}

          <div className="space-y-3">
            {milestones.length === 0 ? (
              <p className="text-sm text-muted-foreground italic text-center py-4">No milestones recorded yet.</p>
            ) : (
              milestones.map((m: any) => {
                const scheduledDate = m.event_type.includes('pickup') ? load.pickup_date : load.delivery_date;
                const diff = scheduledDate ? differenceInMinutes(new Date(m.recorded_at), new Date(scheduledDate)) : null;
                
                return (
                  <div key={m.id} className="flex items-start justify-between gap-4 group p-3 bg-secondary/20 rounded-xs border border-transparent hover:border-border/40 transition-all">
                    <div className="flex gap-3">
                      <div className={cn(
                        "mt-0.5 p-1.5 rounded-full",
                        m.verified_at ? "bg-green-500/10 text-green-500" : "bg-primary/10 text-primary"
                      )}>
                        {m.verified_at ? <ShieldCheck className="size-4" /> : <Clock className="size-4" />}
                      </div>
                      <div>
                        <h4 className="font-medium text-sm text-foreground">{labelize(m.event_type)}</h4>
                        <div className="label-mono text-[10px] text-muted-foreground mt-0.5 flex items-center gap-2">
                          <span>{dateTime(m.recorded_at)}</span>
                          {m.verified_at && (
                            <span className="text-green-500 flex items-center gap-0.5">
                              <ShieldCheck className="size-3" /> VERIFIED
                            </span>
                          )}
                        </div>
                        {isAdmin && diff !== null && (
                          <p className={cn(
                            "text-[10px] font-mono mt-1",
                            diff > 0 ? "text-amber-500" : "text-green-500"
                          )}>
                            {diff === 0 ? "On Time" : diff > 0 ? `+${diff} mins Late` : `${Math.abs(diff)} mins Early`}
                          </p>
                        )}
                      </div>
                    </div>

                    {isAdmin && !m.verified_at && (
                      <button
                        type="button"
                        onClick={() => verifyMilestone.mutate(m.id)}
                        disabled={verifyMilestone.isPending}
                        className="label-mono text-[10px] bg-primary text-primary-foreground px-2.5 py-1 rounded-xs hover:bg-signal transition-colors flex items-center gap-1 opacity-0 group-hover:opacity-100"
                      >
                         Verify
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </Panel>
  );
}
