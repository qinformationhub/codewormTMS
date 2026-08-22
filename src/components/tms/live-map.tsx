import { useEffect, useRef } from "react";
import L from "leaflet";

import type { LoadWithParties } from "@/hooks/use-tms-data";
import { labelize, money, type LoadStatus } from "@/lib/tms";

const STATUS_COLORS: Record<LoadStatus, string> = {
  planning: "#94a3b8", // slate-400
  pending_adjustment: "#f59e0b", // amber-500
  available: "#0ea5e9", // sky-500
  booked: "#1e3a8a", // navy
  dispatched: "#1e3a8a", // navy
  picked_up: "#1e3a8a", // navy
  in_transit: "#f59e0b", // amber-500
  delivered: "#10b981", // emerald-500
  invoiced: "#10b981", // emerald-500
  paid: "#10b981", // emerald-500
  rejected: "#ef4444", // red-500
  cancelled: "#ef4444", // red-500
};

export default function LiveMap({ loads }: { loads: LoadWithParties[] }) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<Record<string, L.LayerGroup>>({});

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    mapRef.current = L.map(containerRef.current, {
      center: [39.5, -96],
      zoom: 4,
      scrollWheelZoom: false,
    });
    L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
      attribution: "&copy; OpenStreetMap &copy; CARTO",
      maxZoom: 18,
    }).addTo(mapRef.current);
    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    
    // Clear old markers
    Object.values(markersRef.current).forEach(group => group.remove());
    markersRef.current = {};

    loads.forEach((load) => {
      if (load.origin_lat == null || load.origin_lng == null) return;
      
      const statusColor = STATUS_COLORS[load.status as LoadStatus] || "#1e3a8a";
      const origin: [number, number] = [Number(load.origin_lat), Number(load.origin_lng)];
      const loadGroup = L.layerGroup().addTo(map);
      markersRef.current[load.id] = loadGroup;
      
      const originMarker = L.circleMarker(origin, {
        radius: 8,
        color: "#ffffff",
        fillColor: statusColor,
        fillOpacity: 1,
        weight: 2,
      })
        .bindPopup(
          `<div class="p-1">
            <div class="font-bold text-primary">${load.reference}</div>
            <div class="text-xs text-muted-foreground mb-1">${load.origin_city}, ${load.origin_state} → ${load.destination_city}, ${load.destination_state}</div>
            <div class="flex items-center gap-2">
              <span class="px-1.5 py-0.5 rounded-full text-[10px] font-bold text-white uppercase" style="background-color: ${statusColor}">${labelize(load.status)}</span>
              <span class="text-xs font-mono font-bold">${money(load.revenue)}</span>
            </div>
          </div>`
        )
        .addTo(loadGroup);

      if (load.destination_lat != null && load.destination_lng != null) {
        const dest: [number, number] = [
          Number(load.destination_lat),
          Number(load.destination_lng),
        ];
        
        L.circleMarker(dest, {
          radius: 5,
          color: statusColor,
          fillColor: "#ffffff",
          fillOpacity: 1,
          weight: 2,
        }).addTo(loadGroup);

        L.polyline([origin, dest], {
          color: statusColor,
          weight: 3,
          opacity: 0.6,
          dashArray: load.status === 'in_transit' ? undefined : "6 6",
        }).addTo(loadGroup);
      }
    });

    return () => {
      Object.values(markersRef.current).forEach(group => group.remove());
      markersRef.current = {};
    };
  }, [loads]);

  const highlightLoad = (loadId: string) => {
    const group = markersRef.current[loadId];
    if (group && mapRef.current) {
      const markers = group.getLayers();
      const firstMarker = markers[0];
      if (firstMarker instanceof L.CircleMarker) {
        firstMarker.openPopup();
        mapRef.current.setView(firstMarker.getLatLng(), 6, { animate: true });
      }
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      <div ref={containerRef} className="h-[600px] flex-1 rounded-xs border border-border" />
      
      <div className="w-full lg:w-80 shrink-0 bg-card border border-border rounded-xs overflow-hidden flex flex-col h-[600px]">
        <div className="p-4 border-b border-border bg-secondary/30">
          <h3 className="label-mono text-xs">Active Movements</h3>
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-2">
          {loads.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              No active loads to display
            </div>
          ) : (
            loads.map(load => {
              const statusColor = STATUS_COLORS[load.status as LoadStatus] || "#1e3a8a";
              return (
                <div 
                  key={load.id} 
                  className="p-3 bg-background border border-border rounded-xs hover:border-signal/50 transition-colors group cursor-pointer"
                  onClick={() => highlightLoad(load.id)}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-bold text-sm text-primary">{load.reference}</span>
                    <span 
                      className="px-1.5 py-0.5 rounded-full text-[9px] font-bold text-white uppercase"
                      style={{ backgroundColor: statusColor }}
                    >
                      {labelize(load.status)}
                    </span>
                  </div>
                  <div className="space-y-1">
                    <div className="text-[11px] text-muted-foreground flex items-center gap-2">
                      <span className="size-1.5 rounded-full bg-slate-400" />
                      {load.origin_city}, {load.origin_state}
                    </div>
                    <div className="text-[11px] text-muted-foreground flex items-center gap-2">
                      <span className="size-1.5 rounded-full" style={{ backgroundColor: statusColor }} />
                      {load.destination_city}, {load.destination_state}
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-xs font-mono font-bold">{money(load.revenue)}</span>
                    <button 
                      className="text-[10px] text-signal font-bold uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      Details →
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}