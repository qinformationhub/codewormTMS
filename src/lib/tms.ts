export type AppRole = "admin" | "shipper" | "carrier";
export type LoadPriority = "normal" | "priority" | "emergency";

export type LoadStatus =
  | "planning"
  | "pending_adjustment"
  | "available"
  | "booked"
  | "dispatched"
  | "picked_up"
  | "in_transit"
  | "delivered"
  | "invoiced"
  | "paid"
  | "rejected"
  | "cancelled";

export const LOAD_STATUSES: LoadStatus[] = [
  "planning",
  "pending_adjustment",
  "available",
  "booked",
  "dispatched",
  "picked_up",
  "in_transit",
  "delivered",
  "invoiced",
  "paid",
  "rejected",
  "cancelled",
];

export const PIPELINE_STATUSES: LoadStatus[] = [
  "planning",
  "available",
  "booked",
  "dispatched",
  "in_transit",
  "delivered",
  "invoiced",
];

export const ACTIVE_STATUSES: LoadStatus[] = [
  "booked",
  "dispatched",
  "picked_up",
  "in_transit",
];

export const FREIGHT_CATEGORIES = [
  "hazmat",
  "medical",
  "pharmaceutical",
  "cold_chain",
  "general",
] as const;

export type FreightCategory = (typeof FREIGHT_CATEGORIES)[number];

export const EQUIPMENT_TYPES = [
  "Dry Van",
  "Reefer",
  "Flatbed",
  "Tanker",
  "Hopper",
  "Step Deck",
];

export type Tone = "neutral" | "info" | "ok" | "warn" | "danger" | "primary";

export const STATUS_TONE: Record<LoadStatus, Tone> = {
  planning: "neutral",
  pending_adjustment: "warn",
  available: "info",
  booked: "primary",
  dispatched: "primary",
  picked_up: "primary",
  in_transit: "warn",
  delivered: "ok",
  invoiced: "ok",
  paid: "ok",
  rejected: "danger",
  cancelled: "danger",
};

export const PRIORITY_TONE: Record<LoadPriority, Tone> = {
  normal: "neutral",
  priority: "warn",
  emergency: "danger",
};

export type SLAStatus = "on_track" | "at_risk" | "met" | "breached";

export const SLA_TONE: Record<SLAStatus, Tone> = {
  on_track: "info",
  at_risk: "warn",
  met: "ok",
  breached: "danger",
};

export function labelize(value: string | null | undefined): string {
  if (!value) return "—";
  return value.replace(/_/g, " ").toUpperCase();
}

export function titleize(value: string | null | undefined): string {
  if (!value) return "—";
  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function money(value: number | string | null | undefined): string {
  const n = typeof value === "string" ? Number(value) : (value ?? 0);
  return `$${Math.round(n).toLocaleString("en-US")}`;
}

export function shortDate(value: string | null | undefined): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" });
}

export function dateTime(value: string | null | undefined): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-US", {
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function nextReference(existing: string[]): string {
  const numbers = existing
    .map((r) => Number(r.replace(/\D/g, "")))
    .filter((n) => !Number.isNaN(n) && n > 0);
  const max = numbers.length ? Math.max(...numbers) : 10240;
  return `CW-${max + 1}`;
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "U";
  return (parts[0]![0]! + (parts[1]?.[0] ?? "")).toUpperCase();
}