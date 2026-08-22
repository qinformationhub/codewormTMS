import { useState, useRef, useEffect } from "react";
import SignatureCanvas from "react-signature-canvas";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { FileCheck, PenTool, X, Save, Clock, MapPin, User, FileText } from "lucide-react";

import { Panel, Pill } from "@/components/tms/primitives";
import { supabase } from "@/integrations/supabase/client";
import { useEpod } from "@/hooks/use-tms-data";
import { dateTime } from "@/lib/tms";

interface EpodSectionProps {
  load: any;
  role: "admin" | "shipper" | "carrier";
  carrierId?: string;
  userId?: string | null | undefined;
}

export function EpodSection({ load, role, carrierId, userId }: EpodSectionProps) {
  const { data: epod, isLoading } = useEpod(load.id);
  const [isSigning, setIsSigning] = useState(false);
  const sigCanvas = useRef<any>(null);
  const queryClient = useQueryClient();

  const createEpod = useMutation({
    mutationFn: async (payload: any) => {
      if (!carrierId) {
        throw new Error("Carrier context is missing. Please ensure you are logged in correctly.");
      }
      
      const { error } = await (supabase as any).from("epods").insert({
        load_id: load.id,
        carrier_id: carrierId,
        recipient_name: payload.recipient_name,
        delivery_notes: payload.delivery_notes,
        signature_data: payload.signature_data,
        delivery_location: payload.delivery_location,
        delivery_timestamp: new Date().toISOString(),
      });
      if (error) throw error;

      // Auto-record milestone
      await (supabase as any).from("delivery_milestones").insert({
        load_id: load.id,
        event_type: "epod_captured",
        recorded_by: payload.userId,
      });
      
      if (load.status !== 'delivered') {
        const { error: loadError } = await supabase.from("loads").update({ status: 'delivered' }).eq("id", load.id);
        if (loadError) console.error("Failed to update load status:", loadError);
      }
    },
    onSuccess: () => {
      toast.success("ePOD finalized successfully");
      setIsSigning(false);
      void queryClient.invalidateQueries({ queryKey: ["epod", load.id] });
      void queryClient.invalidateQueries({ queryKey: ["load", load.id] });
    },
    onError: (err: any) => {
      console.error("ePOD Error:", err);
      toast.error(err.message || "Failed to submit ePOD");
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (sigCanvas.current?.isEmpty()) {
      toast.error("Signature is required");
      return;
    }

    const formData = new FormData(e.currentTarget);
    const payload = {
      recipient_name: formData.get("recipient_name") as string,
      delivery_notes: formData.get("delivery_notes") as string,
      signature_data: sigCanvas.current?.getTrimmedCanvas().toDataURL("image/png"),
      delivery_location: load.destination_city + ", " + load.destination_state, 
      userId,
    };

    createEpod.mutate(payload);
  };

  if (isLoading) return <div className="p-4 animate-pulse bg-secondary/20 rounded-xs">Loading ePOD...</div>;

  if (epod) {
    return (
      <Panel title="Electronic Proof of Delivery">
        <div className="p-5 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="label-mono text-[10px] text-muted-foreground uppercase flex items-center gap-1">
                <User className="size-3" /> Recipient
              </p>
              <p className="font-medium text-foreground">{epod.recipient_name}</p>
            </div>
            <div className="space-y-1">
              <p className="label-mono text-[10px] text-muted-foreground uppercase flex items-center gap-1">
                <Clock className="size-3" /> Delivery Time
              </p>
              <p className="font-medium text-foreground">{dateTime(epod.delivery_timestamp)}</p>
            </div>
            <div className="col-span-2 space-y-1">
              <p className="label-mono text-[10px] text-muted-foreground uppercase flex items-center gap-1">
                <MapPin className="size-3" /> Delivery Location
              </p>
              <p className="font-medium text-foreground">{epod.delivery_location}</p>
            </div>
            {epod.delivery_notes && (
              <div className="col-span-2 space-y-1">
                <p className="label-mono text-[10px] text-muted-foreground uppercase flex items-center gap-1">
                  <FileText className="size-3" /> Delivery Notes
                </p>
                <p className="text-sm text-muted-foreground bg-secondary/30 p-2 rounded-xs italic">
                  "{epod.delivery_notes}"
                </p>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <p className="label-mono text-[10px] text-muted-foreground uppercase flex items-center gap-1">
              <PenTool className="size-3" /> Digital Signature
            </p>
            <div className="border border-border rounded-xs bg-white p-2 w-full max-w-[400px]">
              <img src={epod.signature_data} alt="Recipient Signature" className="max-h-32 object-contain" />
            </div>
          </div>

          <div className="pt-4 border-t border-border flex items-center justify-between">
             <Pill tone="ok" className="text-[10px]">FINALIZED & SECURED</Pill>
             <p className="text-[10px] text-muted-foreground italic">Reference: {load.reference}</p>
          </div>
        </div>
      </Panel>
    );
  }

  if (role === "carrier" && !isSigning && load.status !== 'cancelled' && load.status !== 'rejected') {
    return (
      <Panel title="Proof of Delivery">
        <div className="p-10 text-center space-y-4">
          <div className="mx-auto size-12 rounded-full bg-primary/10 flex items-center justify-center">
            <FileCheck className="size-6 text-primary" />
          </div>
          <div className="space-y-1">
            <h3 className="font-medium text-foreground">Delivery Completion</h3>
            <p className="text-sm text-muted-foreground max-w-xs mx-auto">
              Finalize the shipment by capturing a recipient signature and delivery details.
            </p>
          </div>
          <button
            onClick={() => setIsSigning(true)}
            disabled={!carrierId}
            className="label-mono inline-flex items-center gap-2 px-6 py-2 bg-primary text-primary-foreground rounded-xs hover:bg-signal transition-colors disabled:opacity-50"
          >
            <PenTool className="size-4" /> Create ePOD
          </button>
        </div>
      </Panel>
    );
  }

  if (isSigning) {
    const SignaturePad = SignatureCanvas as any;
    return (
      <Panel 
        title="Finalize Delivery" 
        action={
          <button onClick={() => setIsSigning(false)} className="text-muted-foreground hover:text-foreground">
            <X className="size-4" />
          </button>
        }
      >
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="space-y-1">
            <label className="label-mono text-[10px] text-muted-foreground">Recipient Name</label>
            <input
              name="recipient_name"
              required
              placeholder="Full name of person receiving delivery"
              className="w-full bg-secondary p-2 rounded-xs text-sm outline-none border border-transparent focus:border-primary/30"
            />
          </div>

          <div className="space-y-1">
            <label className="label-mono text-[10px] text-muted-foreground">Delivery Notes</label>
            <textarea
              name="delivery_notes"
              rows={2}
              placeholder="Any exceptions, damages, or delivery notes..."
              className="w-full bg-secondary p-2 rounded-xs text-sm outline-none border border-transparent focus:border-primary/30"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="label-mono text-[10px] text-muted-foreground">Signature</label>
              <button
                type="button"
                onClick={() => sigCanvas.current?.clear()}
                className="text-[10px] text-muted-foreground hover:text-signal uppercase underline"
              >
                Clear
              </button>
            </div>
            <div className="border border-border rounded-xs bg-white overflow-hidden touch-none cursor-crosshair">
              <SignaturePad
                ref={sigCanvas}
                penColor="black"
                canvasProps={{
                  width: 500,
                  height: 200,
                  className: "signature-canvas w-full h-[200px]"
                }}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={createEpod.isPending}
            className="w-full label-mono flex items-center justify-center gap-2 py-3 bg-primary text-primary-foreground rounded-xs hover:bg-signal transition-colors disabled:opacity-50"
          >
            {createEpod.isPending ? "Finalizing..." : <><Save className="size-4" /> Finalize & Submit ePOD</>}
          </button>
        </form>
      </Panel>
    );
  }

  return (
    <Panel title="Electronic Proof of Delivery">
      <div className="p-8 text-center text-muted-foreground text-sm italic">
        ePOD has not been submitted for this shipment yet.
      </div>
    </Panel>
  );
}
