"use client";

import { useEffect, useMemo, useRef } from "react";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import { useQuery } from "@tanstack/react-query";
import { fetchObservationPoints } from "@/features/observations/services/observationApi";
import { queryKeys } from "@/lib/queryKeys";

type LeafletDefaultIconPrototype = typeof L.Icon.Default.prototype & {
  _getIconUrl?: string;
};

delete (L.Icon.Default.prototype as LeafletDefaultIconPrototype)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const BUILDING_LEVEL_ZOOM = 18;
const DEFAULT_CENTER: [number, number] = [31.2304, 121.4737];

function CurrentLocationView({ fallbackCenter }: { fallbackCenter: [number, number] }) {
  const map = useMap();
  const hasLocated = useRef(false);

  useEffect(() => {
    if (hasLocated.current) return;
    hasLocated.current = true;

    map.setView(fallbackCenter, BUILDING_LEVEL_ZOOM);

    if (!navigator.geolocation) return;

    let cancelled = false;

    navigator.geolocation.getCurrentPosition(
      (position) => {
        if (cancelled) return;

        map.setView(
          [position.coords.latitude, position.coords.longitude],
          BUILDING_LEVEL_ZOOM,
        );
      },
      undefined,
      {
        enableHighAccuracy: true,
        maximumAge: 60_000,
        timeout: 10_000,
      },
    );

    return () => {
      cancelled = true;
    };
  }, [fallbackCenter, map]);

  return null;
}

export default function ObservationMap() {
  const { data } = useQuery({
    queryKey: queryKeys.observations.points(),
    queryFn: fetchObservationPoints,
  });

  const points = useMemo(() => data?.data ?? [], [data]);
  const center = useMemo(() => {
    if (points.length > 0) {
      return [points[0].latitude, points[0].longitude] as [number, number];
    }
    return DEFAULT_CENTER;
  }, [points]);

  const bounds = useMemo(() => L.latLngBounds([-85, -180], [85, 180]), []);

  return (
    <div className="h-[calc(100vh-230px)] overflow-hidden rounded-2xl border bg-white/80 shadow-sm">
      <MapContainer
        center={center}
        zoom={BUILDING_LEVEL_ZOOM}
        minZoom={2}
        maxBounds={bounds}
        maxBoundsViscosity={1.0}
        className="h-full w-full"
        scrollWheelZoom
      >
        <CurrentLocationView fallbackCenter={center} />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          noWrap
        />
        {points.map((point) => (
          <Marker key={point.id} position={[point.latitude, point.longitude]}>
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
