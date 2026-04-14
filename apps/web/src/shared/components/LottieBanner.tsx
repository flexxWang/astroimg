"use client";

import Lottie from "lottie-react";
import animationData from "@/assets/lottie/text.json";

export default function LottieBanner() {
  return (
    <div className="rounded-3xl border bg-white/70 p-6 shadow-sm">
      <div className="flex flex-col items-start gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">本周观测灵感</p>
          <h2 className="text-2xl font-semibold">追逐星轨，记录宇宙光痕</h2>
          <p className="text-sm text-muted-foreground">
            分享你的作品，和同好一起打磨每一次曝光。
          </p>
        </div>
        <div className="w-full max-w-[420px]">
          <Lottie animationData={animationData} loop autoplay />
        </div>
      </div>
    </div>
  );
}
