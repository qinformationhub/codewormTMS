import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, CheckCircle2, Clock, Plus, Filter, MessageSquare } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

import { Panel, Pill, TableShell } from "./primitives";
import { useLoadExceptions } from "@/hooks/use-tms-data";
import { supabase } from "@/integrations/supabase/client";
import { labelize, dateTime } from "@/lib/tms";
import { cn } from "@/lib/utils";

const EXCEPTION_TYPES = [
  "Pickup Issue",
  "Delivery Issue",
  "Delay",
  "Vehicle Issue",
  "Driver Issue",
  "Damaged Shipment",
  "Missing Shipment",
  "Weather",
  "Documentation Issue",
  "Other",
];

import type { Tone } from "@/lib/tms";

const SEVERITY_TONE: Record<string, Tone> = {
  Low: "neutral",
  Medium: "primary",
  High: "warn",
  Critical: "danger",
};

const STATUS_TONE: Record<string, Tone> = {
  Open: "neutral",
  "In Progress": "primary",
  Resolved: "ok",
};

interface ExceptionSectionProps {
  loadId: string;
  role: "admin" | "shipper" | "carrier";
  userId: string | undefined;
}

export function ExceptionSection({ loadId, role, userId }: ExceptionSectionProps) {
  const queryClient = useQueryClient();
  const { data: exceptions, isLoading } = useLoadExceptions(loadId);
  const [isAdding, setIsAdding] = useState(false);
  const [selectedException, setSelectedException] = useState<any>(null);

  const isAdmin = role === "admin";
  const isCarrier = role === "carrier";
  const isShipper = role === "shipper";

  const createException = useMutation({
    mutationFn: async (data: any) => {
      const { error } = await (supabase as any).from("load_exceptions").insert({
        ...data,
        load_id: loadId,
        created_by: userId,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Exception reported");
      setIsAdding(false);
      void queryClient.invalidateQueries({ queryKey: ["load-exceptions", loadId] });
    },
    onError: (err: any) => toast.error(err.message),
  });

  const updateException = useMutation({
    mutationFn: async ({ id, ...data }: any) => {
      const { error } = await (supabase as any)
        .from("load_exceptions")
        .update({
          ...data,
          ...(data.status === "Resolved" ? { resolved_by: userId, resolved_at: new Date().toISOString() } : {}),
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Exception updated");
      setSelectedException(null);
      void queryClient.invalidateQueries({ queryKey: ["load-exceptions", loadId] });
    },
    onError: (err: any) => toast.error(err.message),
  });

  return (
    <Panel
      title="Exceptions & Notes"
      action={
        !isShipper ? (
          <button
            onClick={() => setIsAdding(true)}
            className="label-mono flex items-center gap-1 text-xs text-primary hover:text-signal"
          >
            <Plus className="size-3" /> Report Exception
          </button>
        ) : null
      }
    >
      <div className="divide-y divide-border/60">
        {!exceptions || exceptions.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground text-sm">
            No exceptions reported for this load.
          </div>
        ) : (
          <div className="p-0">
            <TableShell
              columns={["Type", "Severity", "Status", "Reported", "Resolved", "Actions"]}
            >
              {exceptions.map((ex: any) => (
                <tr key={ex.id} className="group border-b border-border/40 last:border-0">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className={cn("size-3.5", 
                        ex.severity === 'Critical' ? "text-signal" : 
                        ex.severity === 'High' ? "text-warning" : "text-muted-foreground"
                      )} />
                      <span className="font-medium text-foreground">{ex.type}</span>
                    </div>
                    <p className="mt-1 text-[11px] text-muted-foreground line-clamp-1">{ex.description}</p>
                  </td>
                  <td className="px-5 py-3">
                    <Pill tone={SEVERITY_TONE[ex.severity] || "neutral"} className="text-[10px]">
                      {ex.severity}
                    </Pill>
                  </td>
                  <td className="px-5 py-3">
                    <Pill tone={STATUS_TONE[ex.status] || "neutral"} className="text-[10px]">
                      {ex.status}
                    </Pill>
                  </td>
                  <td className="px-5 py-3 text-[11px] text-muted-foreground">
                    {dateTime(ex.created_at)}
                  </td>
                  <td className="px-5 py-3 text-[11px] text-muted-foreground">
                    {ex.resolved_at ? dateTime(ex.resolved_at) : "—"}
                  </td>
                  <td className="px-5 py-3">
                    <button
                      onClick={() => setSelectedException(ex)}
                      className="label-mono text-[10px] text-primary hover:underline"
                    >
                      Details
                    </button>
                  </td>
                </tr>
              ))}
            </TableShell>
          </div>
        )}
      </div>

      {isAdding && (
        <ExceptionForm
          onClose={() => setIsAdding(false)}
          onSubmit={(data: any) => createException.mutate(data)}
        />
      )}

      {selectedException && (
        <ExceptionDetails
          exception={selectedException}
          role={role}
          onClose={() => setSelectedException(null)}
          onUpdate={(data: any) => updateException.mutate({ id: selectedException.id, ...data })}
        />
      )}
    </Panel>
  );
}

function ExceptionForm({ onClose, onSubmit }: any) {
  const [formData, setFormData] = useState({
    type: "Delay",
    severity: "Medium",
    description: "",
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-card border border-border shadow-2xl">
        <div className="border-b border-border p-4">
          <h3 className="label-mono text-sm font-bold">Report Exception</h3>
        </div>
        <div className="p-6 space-y-4">
          <div className="space-y-1">
            <label className="label-mono text-[10px] text-muted-foreground">Exception Type</label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              className="w-full bg-secondary p-2 rounded-xs text-sm outline-none"
            >
              {EXCEPTION_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label className="label-mono text-[10px] text-muted-foreground">Severity</label>
            <select
              value={formData.severity}
              onChange={(e) => setFormData({ ...formData, severity: e.target.value })}
              className="w-full bg-secondary p-2 rounded-xs text-sm outline-none"
            >
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
              <option value="Critical">Critical</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="label-mono text-[10px] text-muted-foreground">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full bg-secondary p-2 rounded-xs text-sm outline-none min-h-[100px] resize-none"
              placeholder="Provide details about the issue..."
            />
          </div>
        </div>
        <div className="border-t border-border p-4 flex justify-end gap-3">
          <button onClick={onClose} className="label-mono text-xs px-4 py-2 hover:bg-secondary">
            Cancel
          </button>
          <button
            onClick={() => onSubmit(formData)}
            disabled={!formData.description}
            className="label-mono text-xs bg-primary text-primary-foreground px-6 py-2 rounded-xs disabled:opacity-50"
          >
            Submit Report
          </button>
        </div>
      </div>
    </div>
  );
}

function ExceptionDetails({ exception, role, onClose, onUpdate }: any) {
  const [newStatus, setNewStatus] = useState(exception.status);
  const [newDescription, setNewDescription] = useState(exception.description);
  
  const isAdmin = role === "admin";
  const isCarrier = role === "carrier";
  const canEdit = isAdmin || (isCarrier && exception.status !== "Resolved");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg bg-card border border-border shadow-2xl">
        <div className="border-b border-border p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="label-mono text-sm font-bold">Exception Detail</h3>
            <Pill tone={SEVERITY_TONE[exception.severity] || "neutral"} className="text-[9px]">
              {exception.severity}
            </Pill>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <Plus className="size-4 rotate-45" />
          </button>
        </div>
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="label-mono text-[10px] text-muted-foreground">Type</p>
              <p className="text-sm font-medium mt-1">{exception.type}</p>
            </div>
            <div>
              <p className="label-mono text-[10px] text-muted-foreground">Status</p>
              <div className="mt-1">
                {canEdit ? (
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    className="bg-secondary px-2 py-1 rounded-xs text-xs outline-none border border-transparent focus:border-primary"
                  >
                    <option value="Open">Open</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Resolved">Resolved</option>
                  </select>
                ) : (
                  <Pill tone={STATUS_TONE[exception.status] || "neutral"} className="text-[10px]">
                    {exception.status}
                  </Pill>
                )}
              </div>
            </div>
          </div>

          <div>
            <p className="label-mono text-[10px] text-muted-foreground">Reported By & Date</p>
            <p className="text-xs mt-1 text-foreground/80">
              {dateTime(exception.created_at)}
            </p>
          </div>

          <div>
            <p className="label-mono text-[10px] text-muted-foreground">Description / Notes</p>
            {canEdit ? (
              <textarea
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                className="w-full mt-2 bg-secondary p-3 rounded-xs text-sm outline-none min-h-[120px] resize-none"
              />
            ) : (
              <div className="mt-2 p-3 bg-secondary/30 rounded-xs text-sm text-foreground/90 whitespace-pre-wrap">
                {exception.description}
              </div>
            )}
          </div>

          {exception.resolved_at && (
            <div className="p-3 bg-ok/5 border border-ok/20 rounded-xs flex items-center gap-3">
              <CheckCircle2 className="size-4 text-ok" />
              <div>
                <p className="label-mono text-[9px] text-ok uppercase font-bold">Resolved</p>
                <p className="text-[11px] text-foreground/70">{dateTime(exception.resolved_at)}</p>
              </div>
            </div>
          )}
        </div>
        
        {canEdit && (
          <div className="border-t border-border p-4 flex justify-end gap-3">
            <button onClick={onClose} className="label-mono text-xs px-4 py-2 hover:bg-secondary">
              Cancel
            </button>
            <button
              onClick={() => onUpdate({ status: newStatus, description: newDescription })}
              className="label-mono text-xs bg-primary text-primary-foreground px-6 py-2 rounded-xs"
            >
              Update Exception
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
