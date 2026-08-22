import { createFileRoute } from "@tanstack/react-router";
import { ClientOnly } from "@tanstack/react-router";
import { lazy, Suspense } from "react";

import { EmptyState, PageHeader, Panel, Pill } from "@/components/tms/primitives";
import { useLoads } from "@/hooks/use-tms-data";
import { ACTIVE_STATUSES, STATUS_TONE, labelize, type LoadStatus } from "@/lib/tms";

const LiveMap = lazy(() => import("@/components/tms/live-map"));

export const Route = createFileRoute("/_authenticated/map")({
  head: () => ({
    meta: [
      { title: "Live Freight Map — BF101 LLC FREIGHT LOGDOG" },
      {
        name: "description",
        content:
          "Geospatial view of every active lane with origin and destination markers for in-transit freight.",
      },
      { property: "og:title", content: "Live Freight Map — BF101 LLC FREIGHT LOGDOG" },
      {
        property: "og:description",
        content: "Geospatial tracking of active freight lanes across the network.",
      },
    ],
  }),
  component: MapPage,
});

function MapPage() {
  const { data: loads = [] } = useLoads();
  const plotted = loads.filter((l) => l.origin_lat != null);
  const active = plotted.filter((l) => ACTIVE_STATUSES.includes(l.status as LoadStatus));

  return (
    <>
      <PageHeader
        title="Live Freight Map"
        subtitle={`${active.length} active movements · ${plotted.length} plotted lanes`}
      />
      <div className="flex flex-col gap-6">
        <Panel title="Network View" className="overflow-hidden">
          <ClientOnly fallback={<EmptyState title="Initializing map" />}>
            <Suspense fallback={<EmptyState title="Initializing map" />}>
              <LiveMap loads={plotted} />
            </Suspense>
          </ClientOnly>
        </Panel>
      </div>
    </>
  );
}