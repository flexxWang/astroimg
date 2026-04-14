"use client";

import { layout, prepare } from "@chenglou/pretext";
import { useEffect, useMemo, useRef, useState } from "react";

type Props = {
  text: string;
  className?: string;
  minHeight?: number;
  font?: string;
  lineHeight?: number;
};

export default function PretextStreamText({
  text,
  className,
  minHeight = 180,
  font = '400 14px "Geist", "PingFang SC", "Microsoft YaHei", sans-serif',
  lineHeight = 22,
}: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [width, setWidth] = useState(0);
  const prepared = useMemo(() => prepare(text || " ", font), [text, font]);

  useEffect(() => {
    const node = containerRef.current;
    if (!node || typeof ResizeObserver === "undefined") {
      return;
    }

    const observer = new ResizeObserver((entries) => {
      const nextWidth = entries[0]?.contentRect.width ?? 0;
      setWidth(nextWidth);
    });

    observer.observe(node);
    setWidth(node.clientWidth);

    return () => observer.disconnect();
  }, []);

  const height = useMemo(() => {
    if (!width) {
      return minHeight;
    }

    const result = layout(prepared, Math.max(1, Math.floor(width)), lineHeight);
    return Math.max(minHeight, result.height + 8);
  }, [prepared, width, minHeight, lineHeight]);

  return (
    <div
      ref={containerRef}
      className={className}
      style={{ minHeight: `${height}px` }}
    >
      <pre className="whitespace-pre-wrap break-words font-sans text-sm leading-[22px] text-slate-700">
        {text || "AI 正在组织今晚的观测计划..."}
      </pre>
    </div>
  );
}
