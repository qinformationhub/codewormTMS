import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Field, SectionTitle, field } from "@/components/tms/form-fields";
import { useSessionProfile } from "@/hooks/use-session";
import { useCarriers, useLoads, useShippers } from "@/hooks/use-tms-data";
import { supabase } from "@/integrations/supabase/client";
import { DOCUMENT_CATEGORIES, DOCUMENT_TYPES } from "@/lib/form-options";

const EMPTY = {
  file_name: "",
  category: "Operational",
  doc_type: "BOL",
  load_id: "",
  shipper_id: "",
  carrier_id: "",
  expires_at: "",
};

export function DocumentUploadDialog() {
  const queryClient = useQueryClient();
  const { data: profile } = useSessionProfile();
  const { data: loads = [] } = useLoads();
  const { data: shippers = [] } = useShippers();
  const { data: carriers = [] } = useCarriers();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);

  function set(key: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  const upload = useMutation({
    mutationFn: async () => {
      const owner_type = form.carrier_id ? "carrier" : form.shipper_id ? "shipper" : "broker";
      const { error } = await supabase.from("documents").insert({
        file_name: form.file_name,
        category: form.category,
        doc_type: form.doc_type,
        owner_type,
        load_id: form.load_id || null,
        shipper_id: form.shipper_id || null,
        carrier_id: form.carrier_id || null,
        expires_at: form.expires_at || null,
        status: "pending",
        uploaded_by: profile?.id ?? null,
        uploaded_by_name: profile?.full_name ?? "",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Document uploaded");
      void queryClient.invalidateQueries({ queryKey: ["documents"] });
      setForm(EMPTY);
      setOpen(false);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          className="label-mono rounded-xs bg-signal px-4 py-3 text-signal-foreground transition-opacity hover:opacity-90"
        >
          + Upload Document
        </button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="display-title text-xl">Upload New Document</DialogTitle>
        </DialogHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            upload.mutate();
          }}
          className="grid gap-4 sm:grid-cols-2"
        >
          <Field label="File" full>
            <input
              type="file"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f && !form.file_name) set("file_name", f.name);
              }}
              className="w-full rounded-xs bg-secondary px-3 py-3 text-sm text-foreground file:mr-3 file:rounded-xs file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-xs file:text-primary-foreground"
            />
          </Field>
          <Field label="Document Title *" full>
            <input
              required
              value={form.file_name}
              onChange={(e) => set("file_name", e.target.value)}
              placeholder="e.g., Bill of Lading#1234"
              className={field}
            />
          </Field>
          <Field label="Category">
            <select
              value={form.category}
              onChange={(e) => set("category", e.target.value)}
              className={field}
            >
              {DOCUMENT_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Document Type">
            <select
              value={form.doc_type}
              onChange={(e) => set("doc_type", e.target.value)}
              className={field}
            >
              {DOCUMENT_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </Field>
          <SectionTitle title="Links" hint="Attach this record to a load or trading partner." />
          <Field label="Link To Load (optional)">
            <select
              value={form.load_id}
              onChange={(e) => set("load_id", e.target.value)}
              className={field}
            >
              <option value="">-- Not Linked --</option>
              {loads.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.reference} · {l.commodity}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Link To Shipper (optional)">
            <select
              value={form.shipper_id}
              onChange={(e) => set("shipper_id", e.target.value)}
              className={field}
            >
              <option value="">-- Not Linked --</option>
              {shippers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Link To Carrier (optional)">
            <select
              value={form.carrier_id}
              onChange={(e) => set("carrier_id", e.target.value)}
              className={field}
            >
              <option value="">-- Not Linked --</option>
              {carriers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Expiration Date (optional)">
            <input
              type="date"
              value={form.expires_at}
              onChange={(e) => set("expires_at", e.target.value)}
              className={field}
            />
          </Field>
          <div className="sm:col-span-2 rounded-xs bg-secondary/60 p-4">
            <p className="label-mono text-foreground">Compliance Suggestions</p>
            <p className="mt-2 text-xs text-muted-foreground">
              Select a load to get document suggestions based on attributes (HazMat, GDP, DEA,
              cold-chain, and delivery workflow). Suggested types follow common US freight and
              regulated-logistics documentation practices and should be verified against your
              legal/compliance program.
            </p>
          </div>
          <DialogFooter className="sm:col-span-2">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="label-mono rounded-xs bg-secondary px-4 py-3 text-secondary-foreground"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={upload.isPending}
              className="label-mono rounded-xs bg-signal px-4 py-3 text-signal-foreground disabled:opacity-60"
            >
              {upload.isPending ? "Uploading..." : "Upload Document"}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
