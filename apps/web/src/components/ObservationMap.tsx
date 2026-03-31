"use client";

import { useMemo, useState } from "react";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import L from "leaflet";
import { useQuery } from "@tanstack/react-query";
import { fetchObservationPoints } from "@/services/observationApi";
import type { ObservationPoint } from "@/lib/types";

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

export default function ObservationMap() {
  const { data } = useQuery({
    queryKey: ["observation-points"],
    queryFn: fetchObservationPoints,
  });

  const points = data?.data ?? [];
  const center = useMemo(() => {
    if (points.length > 0) {
      return [points[0].latitude, points[0].longitude] as [number, number];
    }
    return [31.2304, 121.4737] as [number, number];
  }, [points]);

  const [activeId, setActiveId] = useState<string | null>(null);
  const bounds = useMemo(
    () => L.latLngBounds([-85, -180], [85, 180]),
    [],
  );

  return (
    <div className="overflow-hidden rounded-2xl border bg-white/80 shadow-sm">
      <MapContainer
        center={center}
        zoom={4}
        minZoom={2}
        maxBounds={bounds}
        maxBoundsViscosity={1.0}
        className="h-[620px] w-full"
        scrollWheelZoom
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          noWrap
        />
        {points.map((point) => (
          <Marker
            key={point.id}
            position={[point.latitude, point.longitude]}
            eventHandlers={{
              click: () => setActiveId(point.id),
            }}
          >
            <Popup>
              <div className="space-y-1">
                <div className="font-medium">{point.name}</div>
                <div className="text-xs text-muted-foreground">
                  {point.description || "暂无描述"}
                </div>
                {point.lightPollution ? (
                  <div className="text-xs text-muted-foreground">
                    光害等级：{point.lightPollution}
                  </div>
                ) : null}
                {point.elevation ? (
                  <div className="text-xs text-muted-foreground">
                    海拔：{point.elevation} m
                  </div>
                ) : null}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
