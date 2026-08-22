import { createFileRoute, Link } from "@tanstack/react-router";
import { AlertTriangle, DollarSign, Package, Truck } from "lucide-react";

import {
  EmptyState,
  PageHeader,
  Panel,
  Pill,
  StatCard,
  TableShell,
} from "@/components/tms/primitives";
import { useMyOrg, useSessionProfile } from "@/hooks/use-session";
import { useCarriers, useDocuments, useLoads, useShippers } from "@/hooks/use-tms-data";
import { useRealtimeLoads } from "@/hooks/use-realtime-loads";
import {
  ACTIVE_STATUSES,
  PIPELINE_STATUSES,
  STATUS_TONE,
  PRIORITY_TONE,
  labelize,
  money,
  shortDate,
  dateTime,
  titleize,

  type LoadStatus,
  type LoadPriority,
  SLA_TONE,
  type SLAStatus,
} from "@/lib/tms";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Command Center — BF101 LLC FREIGHT LOGDOG" },
      {
        name: "description",
        content:
          "Operational overview of active freight, revenue, compliance alerts and the live load pipeline.",
      },
      { property: "og:title", content: "Command Center — BF101 LLC FREIGHT LOGDOG" },
      {
        property: "og:description",
        content: "Live freight operations overview across shippers and carriers.",
      },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { data: profile } = useSessionProfile();
  const { data: loads = [], isLoading } = useLoads();
  const { data: shippers = [] } = useShippers();
  const { data: carriers = [] } = useCarriers();
  const { data: documents = [] } = useDocuments();
  const { data: myOrg } = useMyOrg(profile?.role, profile?.id);

  // Subscribe to real-time updates for relevant loads
  useRealtimeLoads();

  const role = profile?.role ?? "admin";
  const scopedLoads =
    role === "carrier" && myOrg
      ? loads.filter((l) => l.carrier_id === myOrg.id)
      : loads;
  const active = scopedLoads.filter((l) => ACTIVE_STATUSES.includes(l.status as LoadStatus));
  const revenue = scopedLoads.reduce((sum, l) => sum + Number(l.revenue ?? 0), 0);
  const margin = revenue - scopedLoads.reduce((sum, l) => sum + Number(l.cost ?? 0), 0);
  const expiring = documents.filter(
    (d) =>
      d.expires_at &&
      new Date(d.expires_at).getTime() - Date.now() < 1000 * 60 * 60 * 24 * 60,
  );

  const title =
    role === "admin"
      ? "Broker Command Center"
      : role === "shipper"
        ? "Shipper Command"
        : "Carrier Portal";

  return (
    <>
      <PageHeader
        title={title}
        subtitle={`Live operations snapshot · ${new Date().toLocaleDateString("en-US", {
          weekday: "long",
          month: "long",
          day: "numeric",
        })}`}
        actions={
          <Link
            to="/loads"
            className="label-mono rounded-xs bg-signal px-4 py-3 text-signal-foreground transition-opacity hover:opacity-90"
          >
            Open Load Board
          </Link>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Active Loads" value={active.length} icon={<Truck className="size-5" />} tone="primary" />
        <StatCard label="Total Loads" value={loads.length} icon={<Package className="size-5" />} />
        <StatCard label="Gross Revenue" value={money(revenue)} icon={<DollarSign className="size-5" />} tone="ok" />
        <StatCard
          label={role === "admin" ? "Net Margin" : "Docs Expiring"}
          value={role === "admin" ? money(margin) : expiring.length}
          icon={<AlertTriangle className="size-5" />}
          tone={role === "admin" ? "info" : "warn"}
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Panel title="Load Pipeline" className="lg:col-span-2">
          <div className="space-y-4 p-5">
            {PIPELINE_STATUSES.map((status) => {
              const count = loads.filter((l) => l.status === status).length;
              const pct = loads.length ? Math.round((count / loads.length) * 100) : 0;
              return (
                <div key={status}>
                  <div className="flex items-center justify-between">
                    <span className="label-mono text-muted-foreground">{labelize(status)}</span>
                    <span className="label-mono text-foreground">{count}</span>
                  </div>
                  <div className="mt-2 h-1.5 w-full rounded-full bg-secondary">
                    <div
                      className="h-1.5 rounded-full bg-primary"
                      style={{ width: `${Math.max(pct, count ? 4 : 0)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Panel>

        <Panel title="Network">
          <dl className="divide-y divide-border">
            {[
              ["Shippers", shippers.length],
              ["Carriers", carriers.length],
              ["Documents", documents.length],
              ["Expiring < 60d", expiring.length],
            ].map(([label, value]) => (
              <div key={String(label)} className="flex items-center justify-between px-5 py-4">
                <dt className="text-sm text-muted-foreground">{label}</dt>
                <dd className="display-title text-xl text-foreground">{value}</dd>
              </div>
            ))}
          </dl>
        </Panel>
      </div>

      <Panel
        title="Recent Loads"
        className="mt-6"
        action={
          <Link to="/loads" className="label-mono text-signal hover:underline">
            View all
          </Link>
        }
      >
        {isLoading ? (
          <EmptyState title="Loading freight data" />
        ) : loads.length === 0 ? (
          <EmptyState title="No loads yet" hint="Create a load to populate the board." />
        ) : (
          <TableShell
            columns={
              role === "shipper"
                ? ["Reference", "Status", "SLA", "ETA", "Commodity", "Pickup", "Delivery", "Action"]
                : role === "carrier"
                  ? ["Reference", "Status", "SLA", "ETA", "Commodity", "Cost", "Pickup", "Action"]
                  : ["Reference", "Lane", "Category", "Status", "SLA", "ETA", "Pickup", "Revenue"]

            }
          >
            {scopedLoads.slice(0, 8).map((load) => (
              <tr key={load.id} className="border-b border-border/60 last:border-0 hover:bg-surface/60">
                <td className="px-5 py-3">
                  <Link
                    to="/loads/$loadId"
                    params={{ loadId: load.id }}
                    className="font-mono text-sm font-semibold text-primary hover:underline"
                  >
                    {load.reference}
                  </Link>
                </td>
                {role === "shipper" ? (
                  <>
                    <td className="px-5 py-3">
                      <Pill tone={STATUS_TONE[load.status as LoadStatus]}>
                        {labelize(load.status)}
                      </Pill>
                    </td>
                    <td className="px-5 py-3">
                      <Pill tone={SLA_TONE[load.sla_status as SLAStatus] || "neutral"}>
                      {labelize(load.sla_status)}
                    </Pill>
                  </td>
                  <td className="px-5 py-3">
                    <span className="text-xs font-medium text-foreground">{dateTime(load.delivery_date)}</span>
                  </td>
                  <td className="px-5 py-3 text-foreground">{load.commodity || "—"}</td>
                  <td className="px-5 py-3 text-muted-foreground">
                    {load.origin_city}, {load.origin_state} · {shortDate(load.pickup_date)}
                  </td>

                    <td className="px-5 py-3 text-muted-foreground">
                      {load.destination_city}, {load.destination_state} ·{" "}
                      {shortDate(load.delivery_date)}
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
                ) : role === "carrier" ? (
                  <>
                    <td className="px-5 py-3">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <Pill tone={STATUS_TONE[load.status as LoadStatus]}>
                          {labelize(load.status)}
                        </Pill>
                        {load.priority !== "normal" && (
                          <Pill tone={PRIORITY_TONE[load.priority as LoadPriority] || "neutral"}>
                            {load.priority === "emergency" ? "URGENT" : labelize(load.priority)}
                          </Pill>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <Pill tone={SLA_TONE[load.sla_status as SLAStatus] || "neutral"}>
                      {labelize(load.sla_status)}
                    </Pill>
                  </td>
                  <td className="px-5 py-3">
                    <span className="text-xs font-medium text-foreground">{dateTime(load.delivery_date)}</span>
                  </td>
                  <td className="px-5 py-3 text-foreground">{load.commodity || "—"}</td>
                  <td className="px-5 py-3 font-semibold text-foreground">{money(load.cost)}</td>
                  <td className="px-5 py-3 text-muted-foreground">
                    {load.origin_city}, {load.origin_state} · {shortDate(load.pickup_date)}
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
                <td className="px-5 py-3 text-muted-foreground">{titleize(load.category)}</td>
                <td className="px-5 py-3">
                  <Pill tone={STATUS_TONE[load.status as LoadStatus]}>{labelize(load.status)}</Pill>
                </td>
                <td className="px-5 py-3">
                  <Pill tone={SLA_TONE[load.sla_status as SLAStatus] || "neutral"}>
                    {labelize(load.sla_status)}
                  </Pill>
                </td>
                <td className="px-5 py-3">
                  <span className="text-xs font-medium text-foreground">{dateTime(load.delivery_date)}</span>
                </td>
                <td className="px-5 py-3 text-muted-foreground">{shortDate(load.pickup_date)}</td>
                <td className="px-5 py-3 font-semibold text-foreground">{money(load.revenue)}</td>

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