"use client";

import dynamic from "next/dynamic";

const ObservationMap = dynamic(() => import("@/components/ObservationMap"), {
  ssr: false,
});

export default function MapPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold">观测点地图</h1>
        <p className="text-sm text-muted-foreground">
          收藏你的观测地，找回那些完美的星夜。
        </p>
      </div>
      <ObservationMap />
    </div>
  );
}
