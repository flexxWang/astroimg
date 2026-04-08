import { apiFetch } from "@/services/api";
import type { ObservationPoint } from "@/lib/types";

export function fetchObservationPoints() {
  return apiFetch<ObservationPoint[]>("/observation-points");
}

export function createObservationPoint(payload: {
  name: string;
  description?: string;
  latitude: number;
  longitude: number;
  lightPollution?: number;
  elevation?: number;
}) {
  return apiFetch<ObservationPoint>("/observation-points", {
    method: "POST",
    body: payload,
  });
}
