import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { CheckChip, Field, SectionTitle, field } from "@/components/tms/form-fields";
import { EmptyState, PageHeader, Panel, Pill, TableShell } from "@/components/tms/primitives";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useCarriers, type Carrier } from "@/hooks/use-tms-data";
import { supabase } from "@/integrations/supabase/client";
import {
  HAZMAT_SAFETY_RATINGS,
  SECURITY_PROTOCOLS,
  TEMPERATURE_CAPABILITIES,
} from "@/lib/form-options";
import { labelize } from "@/lib/tms";

export const Route = createFileRoute("/_authenticated/carriers")({
  head: () => ({
    meta: [
      { title: "Carrier Network — BF101 LLC FREIGHT LOGDOG" },
      {
        name: "description",
        content:
          "Carrier network directory with MC/DOT authority, HazMat and GDP certifications, insurance expiry and hauled volume.",
      },
      { property: "og:title", content: "Carrier Network — BF101 LLC FREIGHT LOGDOG" },
      {
        property: "og:description",
        content: "Vetted carrier directory with authority and certification tracking.",
      },
    ],
  }),
  component: Carriers,
});

const EMPTY = {
  name: "",
  mc_number: "",
  dot_number: "",
  insurance_coverage: "100000",
  contact_name: "",
  contact_email: "",
  phone: "",
  address: "",
  hazmat_safety_rating: "none",
  security_protocol: "none",
  claims_ratio: "0",
  portal_email: "",
  status: "pending",
};

function Carriers() {
  const { data: carriers = [], isLoading } = useCarriers();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Carrier | null>(null);
  const [form, setForm] = useState({ ...EMPTY });
  const [quals, setQuals] = useState({
    hazmat_certified: false,
    gdp_certified: false,
    reefer_certified: false,
    medical_approved: false,
    truck_insurance: false,
  });
  const [temps, setTemps] = useState<string[]>([]);

  function set(key: keyof typeof EMPTY, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function openCreate() {
    setEditing(null);
    setForm({ ...EMPTY });
    setQuals({
      hazmat_certified: false,
      gdp_certified: false,
      reefer_certified: false,
      medical_approved: false,
      truck_insurance: false,
    });
    setTemps([]);
    setOpen(true);
  }

  function openEdit(c: Carrier) {
    setEditing(c);
    setForm({
      name: c.name,
      mc_number: c.mc_number,
      dot_number: c.dot_number,
      insurance_coverage: String(c.insurance_coverage ?? 0),
      contact_name: c.contact_name,
      contact_email: c.contact_email,
      phone: c.phone,
      address: c.address ?? "",
      hazmat_safety_rating: c.hazmat_safety_rating ?? "none",
      security_protocol: c.security_protocol ?? "none",
      claims_ratio: String(c.claims_ratio ?? 0),
      portal_email: c.portal_email ?? "",
      status: c.status,
    });
    setQuals({
      hazmat_certified: c.hazmat_certified,
      gdp_certified: c.gdp_certified,
      reefer_certified: c.reefer_certified ?? false,
      medical_approved: c.medical_approved ?? false,
      truck_insurance: c.truck_insurance ?? false,
    });
    setTemps(c.temperature_capabilities ?? []);
    setOpen(true);
  }

  const save = useMutation({
    mutationFn: async () => {
      const payload = {
        name: form.name,
        mc_number: form.mc_number,
        dot_number: form.dot_number,
        insurance_coverage: Number(form.insurance_coverage || 0),
        contact_name: form.contact_name,
        contact_email: form.contact_email,
        phone: form.phone,
        address: form.address,
        hazmat_safety_rating: form.hazmat_safety_rating,
        security_protocol: form.security_protocol,
        claims_ratio: Number(form.claims_ratio || 0),
        temperature_capabilities: temps,
        portal_email: form.portal_email,
        status: form.status as Carrier["status"],
        ...quals,
      };
      
      let orgId = editing?.id;

      const query = editing
        ? supabase.from("carriers").update(payload).eq("id", editing.id)
        : supabase.from("carriers").insert(payload).select().single();
      
      const { data, error } = await query;
      if (error) throw error;

      if (!editing && data) {
        orgId = data.id;
      }

      if (!editing && form.portal_email && orgId) {
        const { inviteOrganizationUser } = await import("@/lib/onboarding.functions");
        await inviteOrganizationUser({
          data: {
            orgId,
            orgType: "carrier",
            email: form.portal_email,
            contactName: form.contact_name || form.name,
          }
        });
        toast.info("Invitation sent to " + form.portal_email);
      }
    },
    onSuccess: () => {
      toast.success(editing ? "Carrier updated" : "Carrier added & Invited");
      setOpen(false);
      void queryClient.invalidateQueries({ queryKey: ["carriers"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("carriers").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Carrier removed");
      void queryClient.invalidateQueries({ queryKey: ["carriers"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  function toggleTemp(value: string) {
    setTemps((prev) =>
      prev.includes(value) ? prev.filter((t) => t !== value) : [...prev, value],
    );
  }

  return (
    <>
      <PageHeader
        title="Carrier Network"
        subtitle={`${carriers.length} vetted carriers`}
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <button
                type="button"
                onClick={openCreate}
                className="label-mono inline-flex h-10 items-center gap-2 rounded-xs bg-primary px-4 text-primary-foreground"
              >
                <Plus className="size-4" /> Add Carrier
              </button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
              <DialogHeader>
                <DialogTitle className="display-title text-xl">
                  {editing ? "Edit Carrier" : "Add New Carrier"}
                </DialogTitle>
              </DialogHeader>
              <form
                className="grid gap-4 sm:grid-cols-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  save.mutate();
                }}
              >
                <Field label="Company Name *" full>
                  <input
                    required
                    className={field}
                    value={form.name}
                    onChange={(e) => set("name", e.target.value)}
                    placeholder="Ironline Freight LLC"
                  />
                </Field>
                <Field label="MC Number">
                  <input
                    className={field}
                    value={form.mc_number}
                    onChange={(e) => set("mc_number", e.target.value)}
                    placeholder="MC-XXXXX"
                  />
                </Field>
                <Field label="DOT Number">
                  <input
                    className={field}
                    value={form.dot_number}
                    onChange={(e) => set("dot_number", e.target.value)}
                  />
                </Field>
                <Field label="Insurance Coverage ($)">
                  <input
                    type="number"
                    className={field}
                    value={form.insurance_coverage}
                    onChange={(e) => set("insurance_coverage", e.target.value)}
                    placeholder="100000"
                  />
                </Field>
                <Field label="Contact Name">
                  <input
                    className={field}
                    value={form.contact_name}
                    onChange={(e) => set("contact_name", e.target.value)}
                  />
                </Field>
                <Field label="Contact Email">
                  <input
                    type="email"
                    className={field}
                    value={form.contact_email}
                    onChange={(e) => set("contact_email", e.target.value)}
                  />
                </Field>
                <Field label="Contact Phone">
                  <input
                    className={field}
                    value={form.phone}
                    onChange={(e) => set("phone", e.target.value)}
                  />
                </Field>
                <Field label="Address" full>
                  <input
                    className={field}
                    value={form.address}
                    onChange={(e) => set("address", e.target.value)}
                  />
                </Field>

                <SectionTitle title="Qualification Attributes" />
                <div className="sm:col-span-2 flex flex-wrap gap-2">
                  <CheckChip
                    label="HazMat Authority (FMCSA)"
                    checked={quals.hazmat_certified}
                    onToggle={() =>
                      setQuals((p) => ({ ...p, hazmat_certified: !p.hazmat_certified }))
                    }
                  />
                  <CheckChip
                    label="GDP Certified"
                    checked={quals.gdp_certified}
                    onToggle={() => setQuals((p) => ({ ...p, gdp_certified: !p.gdp_certified }))}
                  />
                  <CheckChip
                    label="Reefer Certified"
                    checked={quals.reefer_certified}
                    onToggle={() =>
                      setQuals((p) => ({ ...p, reefer_certified: !p.reefer_certified }))
                    }
                  />
                  <CheckChip
                    label="Medical Freight Approved"
                    checked={quals.medical_approved}
                    onToggle={() =>
                      setQuals((p) => ({ ...p, medical_approved: !p.medical_approved }))
                    }
                  />
                </div>
                <Field label="HazMat Safety Rating">
                  <select
                    className={field}
                    value={form.hazmat_safety_rating}
                    onChange={(e) => set("hazmat_safety_rating", e.target.value)}
                  >
                    {HAZMAT_SAFETY_RATINGS.map((r) => (
                      <option key={r.value} value={r.value}>
                        {r.label}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Security Protocol Status">
                  <select
                    className={field}
                    value={form.security_protocol}
                    onChange={(e) => set("security_protocol", e.target.value)}
                  >
                    {SECURITY_PROTOCOLS.map((r) => (
                      <option key={r.value} value={r.value}>
                        {r.label}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Claims Ratio (%)">
                  <input
                    type="number"
                    className={field}
                    value={form.claims_ratio}
                    onChange={(e) => set("claims_ratio", e.target.value)}
                    placeholder="0"
                  />
                </Field>
                <Field label="Status">
                  <select
                    className={field}
                    value={form.status}
                    onChange={(e) => set("status", e.target.value)}
                  >
                    {["active", "pending", "suspended", "inactive"].map((s) => (
                      <option key={s} value={s}>
                        {labelize(s)}
                      </option>
                    ))}
                  </select>
                </Field>
                <SectionTitle title="Temperature Capabilities" />
                <div className="sm:col-span-2 flex flex-wrap gap-2">
                  {TEMPERATURE_CAPABILITIES.map((t) => (
                    <CheckChip
                      key={t.value}
                      label={t.label}
                      checked={temps.includes(t.value)}
                      onToggle={() => toggleTemp(t.value)}
                    />
                  ))}
                </div>

                <SectionTitle title="Carrier Portal Login" />
                <Field label="Portal Email" full>
                  <input
                    type="email"
                    className={field}
                    value={form.portal_email}
                    onChange={(e) => set("portal_email", e.target.value)}
                    placeholder="carrier.portal@example.com"
                  />
                </Field>

                <SectionTitle title="Insurance Coverage" />
                <div className="sm:col-span-2">
                  <CheckChip
                    label="Truck Insurance Required"
                    checked={quals.truck_insurance}
                    onToggle={() =>
                      setQuals((p) => ({ ...p, truck_insurance: !p.truck_insurance }))
                    }
                  />
                </div>

                <DialogFooter className="sm:col-span-2">
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="label-mono h-10 rounded-xs bg-secondary px-4 text-secondary-foreground"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={save.isPending}
                    className="label-mono h-10 rounded-xs bg-primary px-4 text-primary-foreground disabled:opacity-60"
                  >
                    {save.isPending ? "Saving" : editing ? "Save Changes" : "Create Carrier"}
                  </button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        }
      />
      <Panel title="Authority & Certification">
        {isLoading ? (
          <EmptyState title="Loading carriers" />
        ) : carriers.length === 0 ? (
          <EmptyState title="No carriers onboarded" />
        ) : (
          <TableShell
            columns={["Name", "MC#", "DOT#", "HazMat", "GDP", "Portal Login", "Status", "Actions"]}
          >
            {carriers.map((c) => (
              <tr key={c.id} className="border-b border-border/60 last:border-0 hover:bg-surface/60">
                <td className="px-5 py-3">
                  <p className="font-semibold text-foreground">{c.name}</p>
                  <p className="text-xs text-muted-foreground">{c.contact_name || "—"}</p>
                </td>
                <td className="px-5 py-3 font-mono text-xs text-muted-foreground">
                  {c.mc_number || "—"}
                </td>
                <td className="px-5 py-3 font-mono text-xs text-muted-foreground">
                  {c.dot_number || "—"}
                </td>
                <td className="px-5 py-3">
                  {c.hazmat_certified ? <Pill tone="danger">Yes</Pill> : <Pill tone="neutral">No</Pill>}
                </td>
                <td className="px-5 py-3">
                  {c.gdp_certified ? <Pill tone="info">Yes</Pill> : <Pill tone="neutral">No</Pill>}
                </td>
                <td className="px-5 py-3">
                  {c.portal_user_id ? <Pill tone="ok">Linked</Pill> : <Pill tone="neutral">Not Linked</Pill>}
                  <p className="mt-1 text-xs text-muted-foreground">
                    {c.portal_email || c.contact_email || "—"}
                  </p>
                </td>
                <td className="px-5 py-3">
                  <Pill tone={c.status === "active" ? "ok" : c.status === "pending" ? "warn" : "danger"}>
                    {labelize(c.status)}
                  </Pill>
                </td>
                <td className="px-5 py-3">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      aria-label={`Edit ${c.name}`}
                      onClick={() => openEdit(c)}
                      className="inline-flex size-8 items-center justify-center rounded-xs bg-secondary text-muted-foreground hover:text-foreground"
                    >
                      <Pencil className="size-4" />
                    </button>
                    <button
                      type="button"
                      aria-label={`Delete ${c.name}`}
                      onClick={() => {
                        if (confirm(`Remove ${c.name}?`)) remove.mutate(c.id);
                      }}
                      className="inline-flex size-8 items-center justify-center rounded-xs bg-secondary text-muted-foreground hover:text-signal"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </TableShell>
        )}
      </Panel>
    </>
  );
}