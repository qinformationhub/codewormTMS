import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { PageHeader, Panel } from "@/components/tms/primitives";
import { CheckChip, Field, SectionTitle, field } from "@/components/tms/form-fields";
import { useSessionProfile } from "@/hooks/use-session";
import { useShippers, useLoads, useCarriers } from "@/hooks/use-tms-data";
import { supabase } from "@/integrations/supabase/client";
import {
  COMPLIANCE_FLAGS,
  PACKING_GROUPS,
  SHIPPER_TEMPERATURE_BANDS,
  TEMPERATURE_REQUIREMENTS,
  THEFT_RISK_RATINGS,
  TRUCK_REQUIREMENTS,
  WEIGHT_UNITS,
} from "@/lib/form-options";
import {
  EQUIPMENT_TYPES,
  FREIGHT_CATEGORIES,
  nextReference,
  titleize,
  type FreightCategory,
} from "@/lib/tms";

export const Route = createFileRoute("/_authenticated/loads/new")({
  head: () => ({
    meta: [
      { title: "Create Load — BF101 LLC FREIGHT LOGDOG" },
      {
        name: "description",
        content:
          "Build a new freight load with lane, commodity, equipment, compliance class and financial terms.",
      },
      { property: "og:title", content: "Create Load — BF101 LLC FREIGHT LOGDOG" },
      {
        property: "og:description",
        content: "Create a regulated freight load in the Code Worm operator terminal.",
      },
    ],
  }),
  component: NewLoad,
});

function NewLoad() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: profile } = useSessionProfile();
  const { data: shippers = [] } = useShippers();
  const { data: carriers = [] } = useCarriers();
  const { data: loads = [] } = useLoads();
  const [form, setForm] = useState({
    shipper_id: "",
    carrier_id: "",
    commodity: "",
    category: "general" as FreightCategory,
    equipment: EQUIPMENT_TYPES[0]!,
    weight_lbs: "42000",
    pieces: "0",
    weight_unit: "lbs",
    truck_requirement: "",
    temperature_requirement: "none",
    origin_city: "",
    origin_state: "",
    destination_city: "",
    destination_state: "",
    pickup_date: "",
    delivery_date: "",
    revenue: "",
    cost: "",
    hazmat_class: "",
    un_number: "",
    proper_shipping_name: "",
    packing_group: "",
    emergency_contact: "",
    temperature_band: "none",
    declared_value: "0",
    theft_risk: "",
    notes: "",
    sla_deadline: "",
  });
  const [flags, setFlags] = useState<string[]>([]);
  const isShipper = profile?.role === "shipper";
  const ownShipperId = isShipper && shippers.length === 1 ? shippers[0]!.id : "";
  const shipperId = form.shipper_id || ownShipperId;
  const [toggles, setToggles] = useState({
    enable_tracking: false,
    no_unauthorized_stops: false,
    high_value: false,
    white_glove: false,
  });

  function set(key: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function toggleFlag(value: string) {
    setFlags((prev) =>
      prev.includes(value) ? prev.filter((f) => f !== value) : [...prev, value],
    );
  }

  const create = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase
        .from("loads")
        .insert({
          reference: nextReference(loads.map((l) => l.reference)),
          shipper_id: shipperId || null,
          carrier_id: form.carrier_id || null,
          commodity: form.commodity,
          category: form.category,
          equipment: form.equipment,
          weight_lbs: Number(form.weight_lbs || 0),
          pieces: Number(form.pieces || 0),
          weight_unit: form.weight_unit,
          truck_requirement: form.truck_requirement,
          temperature_requirement: form.temperature_requirement,
          origin_city: form.origin_city,
          origin_state: form.origin_state.toUpperCase(),
          destination_city: form.destination_city,
          destination_state: form.destination_state.toUpperCase(),
          pickup_date: form.pickup_date || null,
          delivery_date: form.delivery_date || null,
          revenue: Number(form.revenue || 0),
          cost: Number(form.cost || 0),
          hazmat_class: form.hazmat_class || null,
          un_number: form.un_number,
          proper_shipping_name: form.proper_shipping_name,
          packing_group: form.packing_group,
          emergency_contact: form.emergency_contact,
          temperature_band: form.temperature_band,
          declared_value: Number(form.declared_value || 0),
          theft_risk: form.theft_risk,
          compliance_flags: flags,
          ...toggles,
          notes: form.notes,
          sla_deadline: form.sla_deadline ? new Date(form.sla_deadline).toISOString() : null,
          status: "planning" as const,
        })
        .select("id")
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast.success("Load created");
      void queryClient.invalidateQueries({ queryKey: ["loads"] });
      navigate({ to: "/loads/$loadId", params: { loadId: data.id } });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <>
      <Link
        to="/loads"
        className="label-mono mb-6 inline-flex items-center gap-2 text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Back to board
      </Link>
      <PageHeader title="Create Load" subtitle="Register a new regulated freight movement." />

      <form
        onSubmit={(e) => {
          e.preventDefault();
          create.mutate();
        }}
        className="grid gap-6 lg:grid-cols-2"
      >
        <Panel title="Shipment">
          <div className="grid gap-4 p-5 sm:grid-cols-2">
            <Field label="Shipper *">
              <select
                value={shipperId}
                onChange={(e) => set("shipper_id", e.target.value)}
                required
                className={field}
              >
                <option value="">Select shipper</option>
                {shippers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Carrier (optional)">
              <select
                value={form.carrier_id}
                onChange={(e) => set("carrier_id", e.target.value)}
                className={field}
              >
                <option value="">Select carrier</option>
                {carriers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Commodity" full>
              <input
                required
                value={form.commodity}
                onChange={(e) => set("commodity", e.target.value)}
                placeholder="e.g., Pharmaceuticals"
                className={field}
              />
            </Field>
            <Field label="Category">
              <select
                value={form.category}
                onChange={(e) => set("category", e.target.value)}
                className={field}
              >
                {FREIGHT_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {titleize(c)}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Equipment">
              <select
                value={form.equipment}
                onChange={(e) => set("equipment", e.target.value)}
                className={field}
              >
                {EQUIPMENT_TYPES.map((eq) => (
                  <option key={eq} value={eq}>
                    {eq}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Weight (lbs)">
              <input
                type="number"
                value={form.weight_lbs}
                onChange={(e) => set("weight_lbs", e.target.value)}
                placeholder="0"
                className={field}
              />
            </Field>
            <Field label="Pieces">
              <input
                type="number"
                value={form.pieces}
                onChange={(e) => set("pieces", e.target.value)}
                placeholder="0"
                className={field}
              />
            </Field>
            <Field label="Weight Unit">
              <select
                value={form.weight_unit}
                onChange={(e) => set("weight_unit", e.target.value)}
                className={field}
              >
                {WEIGHT_UNITS.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Truck Requirement (optional)">
              <select
                value={form.truck_requirement}
                onChange={(e) => set("truck_requirement", e.target.value)}
                className={field}
              >
                <option value="">Select Requirement</option>
                {TRUCK_REQUIREMENTS.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Temperature Requirement (optional)">
              <select
                value={form.temperature_requirement}
                onChange={(e) => set("temperature_requirement", e.target.value)}
                className={field}
              >
                {TEMPERATURE_REQUIREMENTS.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="HazMat Class">
              <input
                value={form.hazmat_class}
                onChange={(e) => set("hazmat_class", e.target.value)}
                placeholder="e.g. 3"
                className={field}
              />
            </Field>
          </div>
        </Panel>

        <Panel title="Lane & Terms">
          <div className="grid gap-4 p-5 sm:grid-cols-2">
            <Field label="Pickup Location (City)">
              <input
                required
                value={form.origin_city}
                onChange={(e) => set("origin_city", e.target.value)}
                placeholder="e.g., Chicago"
                className={field}
              />
            </Field>
            <Field label="Pickup State">
              <input
                required
                maxLength={2}
                value={form.origin_state}
                onChange={(e) => set("origin_state", e.target.value)}
                placeholder="IL"
                className={field}
              />
            </Field>
            <Field label="Delivery Location (City)">
              <input
                required
                value={form.destination_city}
                onChange={(e) => set("destination_city", e.target.value)}
                placeholder="e.g., Dallas"
                className={field}
              />
            </Field>
            <Field label="Delivery State">
              <input
                required
                maxLength={2}
                value={form.destination_state}
                onChange={(e) => set("destination_state", e.target.value)}
                placeholder="TX"
                className={field}
              />
            </Field>
            <Field label="Pickup Date">
              <input
                type="date"
                value={form.pickup_date}
                onChange={(e) => set("pickup_date", e.target.value)}
                className={field}
              />
            </Field>
            <Field label="Delivery Date">
              <input
                type="date"
                value={form.delivery_date}
                onChange={(e) => set("delivery_date", e.target.value)}
                className={field}
              />
            </Field>
            <Field label="Revenue / Shipper Rate ($)" hint="Suggested industry rate: $900">
              <input
                type="number"
                value={form.revenue}
                onChange={(e) => set("revenue", e.target.value)}
                placeholder="0"
                className={field}
              />
            </Field>
            <Field label="Target Carrier Cost ($)">
              <input
                type="number"
                value={form.cost}
                onChange={(e) => set("cost", e.target.value)}
                placeholder="0"
                className={field}
              />
            </Field>
            <Field label="SLA Deadline" full>
              <input
                type="datetime-local"
                value={form.sla_deadline}
                onChange={(e) => set("sla_deadline", e.target.value)}
                className={field}
              />
            </Field>
          </div>
        </Panel>

        <Panel title="Compliance & Tracking">
          <div className="grid gap-4 p-5 sm:grid-cols-2">
            <div className="sm:col-span-2 flex flex-wrap gap-2">
              {COMPLIANCE_FLAGS.map((f) => (
                <CheckChip
                  key={f.value}
                  label={f.label}
                  checked={flags.includes(f.value)}
                  onToggle={() => toggleFlag(f.value)}
                />
              ))}
              <CheckChip
                label="Enable real-time tracking"
                checked={toggles.enable_tracking}
                onToggle={() =>
                  setToggles((p) => ({ ...p, enable_tracking: !p.enable_tracking }))
                }
              />
              <CheckChip
                label="No unauthorized stops"
                checked={toggles.no_unauthorized_stops}
                onToggle={() =>
                  setToggles((p) => ({ ...p, no_unauthorized_stops: !p.no_unauthorized_stops }))
                }
              />
            </div>
            <SectionTitle title="HazMat Details" />
            <Field label="UN Number">
              <input
                value={form.un_number}
                onChange={(e) => set("un_number", e.target.value)}
                placeholder="UN1090"
                className={field}
              />
            </Field>
            <Field label="Proper Shipping Name">
              <input
                value={form.proper_shipping_name}
                onChange={(e) => set("proper_shipping_name", e.target.value)}
                placeholder="Acetone"
                className={field}
              />
            </Field>
            <Field label="Packing Group">
              <select
                value={form.packing_group}
                onChange={(e) => set("packing_group", e.target.value)}
                className={field}
              >
                <option value="">Select Group</option>
                {PACKING_GROUPS.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Emergency Contact">
              <input
                value={form.emergency_contact}
                onChange={(e) => set("emergency_contact", e.target.value)}
                placeholder="24/7 safety contact"
                className={field}
              />
            </Field>
          </div>
        </Panel>

        <Panel title="Medical & Temperature">
          <div className="grid gap-4 p-5 sm:grid-cols-2">
            <Field label="Temperature Band">
              <select
                value={form.temperature_band}
                onChange={(e) => set("temperature_band", e.target.value)}
                className={field}
              >
                {SHIPPER_TEMPERATURE_BANDS.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Declared Value ($)">
              <input
                type="number"
                value={form.declared_value}
                onChange={(e) => set("declared_value", e.target.value)}
                placeholder="0"
                className={field}
              />
            </Field>
            <Field label="Theft Risk Rating">
              <select
                value={form.theft_risk}
                onChange={(e) => set("theft_risk", e.target.value)}
                className={field}
              >
                <option value="">Select rating</option>
                {THEFT_RISK_RATINGS.map((r) => (
                  <option key={r} value={r}>
                    {titleize(r)}
                  </option>
                ))}
              </select>
            </Field>
            <div className="flex flex-wrap items-end gap-2">
              <CheckChip
                label="High Value Shipment"
                checked={toggles.high_value}
                onToggle={() => setToggles((p) => ({ ...p, high_value: !p.high_value }))}
              />
              <CheckChip
                label="White Glove Handling"
                checked={toggles.white_glove}
                onToggle={() => setToggles((p) => ({ ...p, white_glove: !p.white_glove }))}
              />
            </div>
            <Field label="Notes" full>
              <textarea
                rows={3}
                value={form.notes}
                onChange={(e) => set("notes", e.target.value)}
                placeholder="Additional load notes..."
                className="w-full rounded-xs bg-secondary p-3 text-sm text-foreground outline-none"
              />
            </Field>
          </div>
        </Panel>

        <div className="lg:col-span-2">
          <button
            type="submit"
            disabled={create.isPending}
            className="label-mono rounded-xs bg-signal px-6 py-4 text-signal-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {create.isPending ? "Creating..." : "Create Load"}
          </button>
        </div>
      </form>
    </>
  );
}