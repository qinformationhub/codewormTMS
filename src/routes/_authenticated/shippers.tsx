import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, Pencil } from "lucide-react";
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
import { useShippers, type Shipper } from "@/hooks/use-tms-data";
import { supabase } from "@/integrations/supabase/client";
import {
  COMPLIANCE_FLAGS,
  INDUSTRIES,
  SECURITY_LEVELS,
  SHIPPER_TEMPERATURE_BANDS,
} from "@/lib/form-options";
import { labelize } from "@/lib/tms";

export const Route = createFileRoute("/_authenticated/shippers")({
  head: () => ({
    meta: [
      { title: "Shipper Accounts — BF101 LLC FREIGHT LOGDOG" },
      {
        name: "description",
        content:
          "Manage shipper accounts, industry vertical, security clearance level and compliance flags across the brokerage network.",
      },
      { property: "og:title", content: "Shipper Accounts — BF101 LLC FREIGHT LOGDOG" },
      {
        property: "og:description",
        content: "Shipper account directory with compliance and security clearance detail.",
      },
    ],
  }),
  component: Shippers,
});

const EMPTY = {
  name: "",
  industry: "",
  contact_name: "",
  contact_email: "",
  phone: "",
  address: "",
  security_level: "standard",
  compliance_flags: [] as string[],
  status: "pending",
  temperature_band: "none",
  min_insurance: "100000",
  chain_of_custody: false,
  truck_insurance: false,
  portal_email: "",
};

type SopDoc = { title: string; url: string };

function Shippers() {
  const { data: shippers = [], isLoading } = useShippers();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Shipper | null>(null);
  const [form, setForm] = useState({ ...EMPTY });
  const [sopDocs, setSopDocs] = useState<SopDoc[]>([{ title: "", url: "" }]);

  function set(key: keyof typeof EMPTY, value: string | string[] | boolean) {
    setForm((prev) => ({ ...prev, [key]: value }) as typeof EMPTY);
  }

  function openCreate() {
    setEditing(null);
    setForm({ ...EMPTY });
    setSopDocs([{ title: "", url: "" }]);
    setOpen(true);
  }

  function openEdit(s: Shipper) {
    setEditing(s);
    setForm({
      name: s.name,
      industry: s.industry,
      contact_name: s.contact_name,
      contact_email: s.contact_email,
      phone: s.phone,
      address: s.address,
      security_level: s.security_level,
      compliance_flags: s.compliance_flags ?? [],
      status: s.status,
      temperature_band: s.temperature_band ?? "none",
      min_insurance: String(s.min_insurance ?? 0),
      chain_of_custody: s.chain_of_custody ?? false,
      truck_insurance: s.truck_insurance ?? false,
      portal_email: s.portal_email ?? "",
    });
    const docs = Array.isArray(s.sop_documents) ? (s.sop_documents as unknown as SopDoc[]) : [];
    setSopDocs(docs.length ? docs : [{ title: "", url: "" }]);
    setOpen(true);
  }

  const save = useMutation({
    mutationFn: async () => {
      const payload = {
        name: form.name,
        industry: form.industry,
        contact_name: form.contact_name,
        contact_email: form.contact_email,
        phone: form.phone,
        address: form.address,
        security_level: form.security_level,
        compliance_flags: form.compliance_flags,
        status: form.status as Shipper["status"],
        temperature_band: form.temperature_band,
        min_insurance: Number(form.min_insurance || 0),
        chain_of_custody: form.chain_of_custody,
        truck_insurance: form.truck_insurance,
        portal_email: form.portal_email,
        sop_documents: sopDocs.filter((d) => d.title.trim() || d.url.trim()),
      };
      
      let orgId = editing?.id;

      const query = editing
        ? supabase.from("shippers").update(payload).eq("id", editing.id)
        : supabase.from("shippers").insert(payload).select().single();
      
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
            orgType: "shipper",
            email: form.portal_email,
            contactName: form.contact_name || form.name,
          }
        });
        toast.info("Invitation sent to " + form.portal_email);
      }
    },
    onSuccess: () => {
      toast.success(editing ? "Shipper updated" : "Shipper added & Invited");
      setOpen(false);
      void queryClient.invalidateQueries({ queryKey: ["shippers"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("shippers").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Shipper removed");
      void queryClient.invalidateQueries({ queryKey: ["shippers"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  function toggleFlag(flag: string) {
    setForm((prev) => ({
      ...prev,
      compliance_flags: prev.compliance_flags.includes(flag)
        ? prev.compliance_flags.filter((f) => f !== flag)
        : [...prev.compliance_flags, flag],
    }));
  }

  return (
    <>
      <PageHeader
        title="Shipper Accounts"
        subtitle={`${shippers.length} accounts under management`}
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <button
                type="button"
                onClick={openCreate}
                className="label-mono inline-flex h-10 items-center gap-2 rounded-xs bg-primary px-4 text-primary-foreground"
              >
                <Plus className="size-4" /> Add Shipper
              </button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
              <DialogHeader>
                <DialogTitle className="display-title text-xl">
                  {editing ? "Edit Shipper" : "Add Shipper"}
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
                    placeholder="Acme Pharma Inc"
                  />
                </Field>
                <Field label="Industry Classification *">
                  <select
                    required
                    className={field}
                    value={form.industry}
                    onChange={(e) => set("industry", e.target.value)}
                  >
                    <option value="">Select industry</option>
                    {INDUSTRIES.map((i) => (
                      <option key={i} value={i}>
                        {i}
                      </option>
                    ))}
                  </select>
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
                <Field label="Contact Name">
                  <input
                    className={field}
                    value={form.contact_name}
                    onChange={(e) => set("contact_name", e.target.value)}
                    placeholder="Jane Smith"
                  />
                </Field>
                <Field label="Contact Email">
                  <input
                    type="email"
                    className={field}
                    value={form.contact_email}
                    onChange={(e) => set("contact_email", e.target.value)}
                    placeholder="ops@acme.com"
                  />
                </Field>
                <Field label="Contact Phone">
                  <input
                    className={field}
                    value={form.phone}
                    onChange={(e) => set("phone", e.target.value)}
                  />
                </Field>
                <Field label="Address">
                  <input
                    className={field}
                    value={form.address}
                    onChange={(e) => set("address", e.target.value)}
                  />
                </Field>

                <SectionTitle
                  title="Regulatory Compliance Flags"
                  hint="These flags are inherited by every load created under this shipper."
                />
                <div className="sm:col-span-2 flex flex-wrap gap-2">
                  {COMPLIANCE_FLAGS.map((f) => (
                    <CheckChip
                      key={f.value}
                      label={f.label}
                      checked={form.compliance_flags.includes(f.value)}
                      onToggle={() => toggleFlag(f.value)}
                    />
                  ))}
                </div>

                <SectionTitle title="Temperature & Security" />
                <Field label="Temperature Band">
                  <select
                    className={field}
                    value={form.temperature_band}
                    onChange={(e) => set("temperature_band", e.target.value)}
                  >
                    {SHIPPER_TEMPERATURE_BANDS.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Security Level">
                  <select
                    className={field}
                    value={form.security_level}
                    onChange={(e) => set("security_level", e.target.value)}
                  >
                    {SECURITY_LEVELS.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Min Insurance ($)">
                  <input
                    type="number"
                    className={field}
                    value={form.min_insurance}
                    onChange={(e) => set("min_insurance", e.target.value)}
                    placeholder="100000"
                  />
                </Field>
                <div className="flex flex-wrap items-end gap-2">
                  <CheckChip
                    label="Chain-of-Custody Required"
                    checked={form.chain_of_custody}
                    onToggle={() => set("chain_of_custody", !form.chain_of_custody)}
                  />
                </div>

                <SectionTitle title="Insurance Coverage" />
                <div className="sm:col-span-2">
                  <CheckChip
                    label="Truck Insurance Required"
                    checked={form.truck_insurance}
                    onToggle={() => set("truck_insurance", !form.truck_insurance)}
                  />
                </div>

                <SectionTitle title="Shipper Portal Login" />
                <Field label="Portal Email" full>
                  <input
                    type="email"
                    className={field}
                    value={form.portal_email}
                    onChange={(e) => set("portal_email", e.target.value)}
                    placeholder="shipper.portal@example.com"
                  />
                </Field>

                <SectionTitle
                  title="SOP & Policy Documents"
                  hint="Link external SharePoint or Drive URLs for specific handling instructions."
                />
                <div className="sm:col-span-2 space-y-3">
                  {sopDocs.map((doc, i) => (
                    <div key={i} className="grid gap-3 sm:grid-cols-2">
                      <input
                        className={field}
                        value={doc.title}
                        placeholder="Document title"
                        onChange={(e) =>
                          setSopDocs((prev) =>
                            prev.map((d, idx) => (idx === i ? { ...d, title: e.target.value } : d)),
                          )
                        }
                      />
                      <input
                        className={field}
                        value={doc.url}
                        placeholder="URL (https://...)"
                        onChange={(e) =>
                          setSopDocs((prev) =>
                            prev.map((d, idx) => (idx === i ? { ...d, url: e.target.value } : d)),
                          )
                        }
                      />
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => setSopDocs((prev) => [...prev, { title: "", url: "" }])}
                    className="label-mono rounded-xs bg-secondary px-3 py-2 text-secondary-foreground"
                  >
                    + Add Document Link
                  </button>
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
                    {save.isPending ? "Saving" : editing ? "Save Changes" : "Create Shipper"}
                  </button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        }
      />
      <Panel title="Account Directory">
        {isLoading ? (
          <EmptyState title="Loading accounts" />
        ) : shippers.length === 0 ? (
          <EmptyState title="No shipper accounts" hint="Add your first shipper account." />
        ) : (
          <TableShell
            columns={[
              "Name",
              "Industry",
              "Compliance Flags",
              "Security",
              "Portal Login",
              "Status",
              "Actions",
            ]}
          >
            {shippers.map((s) => (
              <tr key={s.id} className="border-b border-border/60 last:border-0 hover:bg-surface/60">
                <td className="px-5 py-3">
                  <p className="font-semibold text-foreground">{s.name}</p>
                  <p className="text-xs text-muted-foreground">{s.address}</p>
                </td>
                <td className="px-5 py-3 text-muted-foreground">{s.industry || "—"}</td>
                <td className="px-5 py-3">
                  <div className="flex flex-wrap gap-1">
                    {(s.compliance_flags ?? []).length ? (
                      (s.compliance_flags ?? []).map((flag) => (
                        <Pill key={flag} tone="warn">
                          {labelize(flag)}
                        </Pill>
                      ))
                    ) : (
                      <span className="text-xs text-muted-foreground">None</span>
                    )}
                  </div>
                </td>
                <td className="px-5 py-3">
                  <Pill tone="info">{labelize(s.security_level)}</Pill>
                </td>
                <td className="px-5 py-3">
                  {s.portal_user_id ? (
                    <Pill tone="ok">Linked</Pill>
                  ) : (
                    <Pill tone="neutral">Not Linked</Pill>
                  )}
                  <p className="mt-1 text-xs text-muted-foreground">{s.contact_email || "—"}</p>
                </td>
                <td className="px-5 py-3">
                  <Pill tone={s.status === "active" ? "ok" : s.status === "pending" ? "warn" : "danger"}>
                    {labelize(s.status)}
                  </Pill>
                </td>
                <td className="px-5 py-3">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      aria-label={`Edit ${s.name}`}
                      onClick={() => openEdit(s)}
                      className="inline-flex size-8 items-center justify-center rounded-xs bg-secondary text-muted-foreground hover:text-foreground"
                    >
                      <Pencil className="size-4" />
                    </button>
                    <button
                      type="button"
                      aria-label={`Delete ${s.name}`}
                      onClick={() => {
                        if (confirm(`Remove ${s.name}?`)) remove.mutate(s.id);
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
