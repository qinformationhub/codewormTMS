import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Search, FileCheck, AlertTriangle } from "lucide-react";

import {
  EmptyState,
  PageHeader,
  Panel,
  Pill,
  TableShell,
} from "@/components/tms/primitives";
import { useMyOrg, useSessionProfile } from "@/hooks/use-session";
import { useLoads } from "@/hooks/use-tms-data";
import { useRealtimeLoads } from "@/hooks/use-realtime-loads";
import { supabase } from "@/integrations/supabase/client";
import {
  LOAD_STATUSES,
  STATUS_TONE,
  labelize,
  money,
  shortDate,
  dateTime,
  titleize,
  type LoadStatus,
  type LoadPriority,
  PRIORITY_TONE,
  SLA_TONE,
  type SLAStatus,

} from "@/lib/tms";
import { cn } from "@/lib/utils";

const CARRIER_FILTER_STATUSES: LoadStatus[] = [
  "available",
  "booked",
  "dispatched",
  "in_transit",
  "delivered",
  "cancelled",
];

export const Route = createFileRoute("/_authenticated/loads/")({
  head: () => ({
    meta: [
      { title: "Load Board — BF101 LLC FREIGHT LOGDOG" },
      {
        name: "description",
        content:
          "Search, filter and manage every freight load across the network with status, lane and revenue detail.",
      },
      { property: "og:title", content: "Load Board — BF101 LLC FREIGHT LOGDOG" },
      {
        property: "og:description",
        content: "Full freight load board with lane, status and revenue detail.",
      },
    ],
  }),
  component: LoadBoard,
});

function LoadBoard() {
  const { data: profile } = useSessionProfile();
  const { data: loads = [], isLoading } = useLoads();
  const { data: myOrg } = useMyOrg(profile?.role, profile?.id);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"all" | LoadStatus>("all");

  // Subscribe to real-time updates for relevant loads
  useRealtimeLoads();

  const isCarrier = profile?.role === "carrier";

  useEffect(() => {
    if (isCarrier && status === "all") setStatus("available");
  }, [isCarrier, status]);

  const scopedLoads = isCarrier && myOrg
    ? loads.filter((load) => load.carrier_id === myOrg.id)
    : loads;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const result = scopedLoads.filter((load) => {
      if (status !== "all" && load.status !== status) return false;
      if (!q) return true;
      return [
        load.reference,
        load.commodity,
        load.origin_city,
        load.destination_city,
        load.shipper?.name,
        load.carrier?.name,
      ]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q));
    });

    const priorityWeight = (p: string) => {
      if (p === "emergency") return 3;
      if (p === "priority") return 2;
      return 1;
    };

    return result.sort((a, b) => priorityWeight(b.priority) - priorityWeight(a.priority));
  }, [scopedLoads, query, status]);

  const role = profile?.role ?? "admin";

  return (
    <>
      <PageHeader
        title={role === "carrier" ? "Load Tenders" : role === "shipper" ? "My Loads" : "Load Board"}
        subtitle={`${filtered.length} of ${scopedLoads.length} loads`}
        actions={
          role === "carrier" ? null : (
            <Link
              to="/loads/new"
              className="label-mono rounded-xs bg-signal px-4 py-3 text-signal-foreground transition-opacity hover:opacity-90"
            >
              {role === "shipper" ? "+ Create New Load" : "+ New Load"}
            </Link>
          )
        }
      />

      <div className="panel mb-6 flex flex-wrap items-center gap-3 p-4">
        <div className="flex min-w-56 flex-1 items-center gap-2 rounded-xs bg-secondary px-4">
          <Search className="size-4 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={
              isCarrier
                ? "Search reference, commodity, pickup..."
                : "Search reference, lane, commodity, party..."
            }
            className="h-10 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {isCarrier
            ? CARRIER_FILTER_STATUSES.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setStatus(s)}
                  className={cn(
                    "label-mono rounded-xs px-3 py-2 transition-colors",
                    status === s
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-muted-foreground hover:text-foreground",
                  )}
                >
                  {labelize(s)}
                </button>
              ))
            : (["all", ...LOAD_STATUSES] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setStatus(s as "all" | LoadStatus)}
                  className={cn(
                    "label-mono rounded-xs px-3 py-2 transition-colors",
                    status === s
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-muted-foreground hover:text-foreground",
                  )}
                >
                  {labelize(s)}
                </button>
              ))}
        </div>
      </div>

      <Panel title="Freight Manifest">
        {isLoading ? (
          <EmptyState title="Loading freight data" />
        ) : filtered.length === 0 ? (
          <EmptyState title="No matching loads" hint="Adjust your search or status filter." />
        ) : (
          <TableShell
            columns={
              isCarrier || role === "shipper"
                ? (["Reference", "Status", "SLA", "Commodity", role === "shipper" ? "Revenue" : "Cost", isCarrier ? "Driver" : null, isCarrier ? "Vehicle" : null, "Pickup", "ePOD", "Exc", "Action"].filter(Boolean) as string[])
                : ["Reference", "Lane", "Shipper", "Carrier", "Driver", "Vehicle", "Category", "Status", "SLA", "Pickup", "Revenue", "ePOD", "Exc"]
            }
          >
            {filtered.map((load) => (
              <tr
                key={load.id}
                className={cn(
                  "border-b border-border/60 last:border-0 hover:bg-surface/60",
                  load.priority === "emergency" && "bg-signal/5",
                )}
              >
                <td className="px-5 py-3">
                  <Link
                    to="/loads/$loadId"
                    params={{ loadId: load.id }}
                    className="font-mono text-sm font-semibold text-primary hover:underline"
                  >
                    {load.reference}
                  </Link>
                  {load.priority !== "normal" && (
                    <div className="mt-1 flex gap-1">
                      <Pill tone={PRIORITY_TONE[load.priority as LoadPriority] || "neutral"} className="scale-[0.6] origin-left py-0 h-4 uppercase">
                        {load.priority === "emergency" ? "urgent" : load.priority}
                      </Pill>
                    </div>
                  )}
                </td>
                {isCarrier || role === "shipper" ? (
                  <>
                    <td className="px-5 py-3">
                      <Pill tone={STATUS_TONE[load.status as LoadStatus]}>{labelize(load.status)}</Pill>
                    </td>
                    <td className="px-5 py-3">
                      <Pill tone={SLA_TONE[load.sla_status as SLAStatus] || "neutral"}>{labelize(load.sla_status)}</Pill>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex flex-col">
                        <span className="text-xs font-medium text-foreground">{dateTime(load.delivery_date)}</span>
                        {load.sla_status === 'breached' && (
                          <span className="text-[10px] text-signal font-bold uppercase label-mono">Delayed</span>
                        )}
                      </div>
                    </td>

                    <td className="px-5 py-3 text-foreground">{load.commodity || "—"}</td>
                    <td className="px-5 py-3 font-semibold text-foreground">
                      {money(role === "shipper" ? load.revenue : load.cost)}
                    </td>
                    {isCarrier && (
                      <>
                        <td className="px-5 py-3 text-muted-foreground text-xs label-mono">
                          {load.driver ? `${load.driver.first_name[0]}. ${load.driver.last_name}` : "—"}
                        </td>
                        <td className="px-5 py-3 text-muted-foreground text-xs label-mono">
                          {load.vehicle ? load.vehicle.vehicle_id_tag : "—"}
                        </td>
                      </>
                    )}
                    <td className="px-5 py-3 text-muted-foreground">
                      {load.origin_city}, {load.origin_state} · {shortDate(load.pickup_date)}
                    </td>
                    <td className="px-5 py-3">
                      <ExceptionIndicator loadId={load.id} />
                    </td>
                    <td className="px-5 py-3">
                      <Link
                        to="/loads/$loadId"
                        params={{ loadId: load.id }}
                        className="label-mono rounded-xs bg-secondary px-3 py-2 text-secondary-foreground transition-colors hover:text-signal"
                      >
                        View
                      </Link>
                    </td>
                  </>
                ) : (
                  <>
                <td className="px-5 py-3 text-foreground">
                  {load.origin_city}, {load.origin_state} → {load.destination_city},{" "}
                  {load.destination_state}
                </td>
                <td className="px-5 py-3 text-muted-foreground">{load.shipper?.name ?? "—"}</td>
                <td className="px-5 py-3 text-muted-foreground">{load.carrier?.name ?? "Unassigned"}</td>
                <td className="px-5 py-3 text-muted-foreground text-xs label-mono">
                  {load.driver ? `${load.driver.first_name[0]}. ${load.driver.last_name}` : "—"}
                </td>
                <td className="px-5 py-3 text-muted-foreground text-xs label-mono">
                  {load.vehicle ? load.vehicle.vehicle_id_tag : "—"}
                </td>
                <td className="px-5 py-3 text-muted-foreground">{titleize(load.category)}</td>
                <td className="px-5 py-3">
                  <Pill tone={STATUS_TONE[load.status as LoadStatus]}>{labelize(load.status)}</Pill>
                </td>
                <td className="px-5 py-3">
                  <Pill tone={SLA_TONE[load.sla_status as SLAStatus] || "neutral"}>{labelize(load.sla_status)}</Pill>
                </td>
                <td className="px-5 py-3">
                  <div className="flex flex-col">
                    <span className="text-xs font-medium text-foreground">{dateTime(load.delivery_date)}</span>
                    {load.sla_status === 'breached' && (
                      <span className="text-[10px] text-signal font-bold uppercase label-mono">Delayed</span>
                    )}
                  </div>
                </td>

                <td className="px-5 py-3 text-muted-foreground">{shortDate(load.pickup_date)}</td>
                <td className="px-5 py-3 font-semibold text-foreground">{money(load.revenue)}</td>
                <td className="px-5 py-3">
                  <EpodIndicator loadId={load.id} />
                </td>
                <td className="px-5 py-3">
                  <ExceptionIndicator loadId={load.id} />
                </td>
                  </>
                )}
              </tr>
            ))}
          </TableShell>
        )}
      </Panel>
    </>
  );
}
function EpodIndicator({ loadId }: { loadId: string }) {
  const [hasEpod, setHasEpod] = useState<boolean | null>(null);

  useEffect(() => {
    async function checkEpod() {
      const { count } = await supabase
        .from("epods")
        .select("*", { count: "exact", head: true })
        .eq("load_id", loadId);
      setHasEpod(Boolean(count && count > 0));
    }
    void checkEpod();
  }, [loadId]);

  if (hasEpod === null) return <div className="size-4 animate-pulse rounded-full bg-secondary" />;
  if (!hasEpod) return <span className="text-[10px] text-muted-foreground uppercase label-mono">None</span>;

  return (
    <div title="ePOD Completed">
      <FileCheck className="size-4 text-green-500" />
    </div>
  );
}

function ExceptionIndicator({ loadId }: { loadId: string }) {
  const [exceptionsCount, setExceptionsCount] = useState<number | null>(null);

  useEffect(() => {
    async function checkExceptions() {
      const { count } = await (supabase as any)
        .from("load_exceptions")
        .select("*", { count: "exact", head: true })
        .eq("load_id", loadId)
        .eq("status", "Open");
      setExceptionsCount(count);
    }
    void checkExceptions();
  }, [loadId]);

  if (exceptionsCount === null) return <div className="size-4 animate-pulse rounded-full bg-secondary" />;
  if (exceptionsCount === 0) return <span className="text-[10px] text-muted-foreground uppercase label-mono">None</span>;

  return (
    <div title={`${exceptionsCount} Open Exceptions`} className="flex items-center gap-1">
      <AlertTriangle className="size-4 text-signal" />
      <span className="text-[10px] font-bold text-signal font-mono">{exceptionsCount}</span>
    </div>
  );
}
