"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";

export default function ExploreSearch() {
  const router = useRouter();
  const params = useSearchParams();
  const q = params.get("q") ?? "";
  const [value, setValue] = useState(q);

  useEffect(() => {
    setValue(q);
  }, [q]);

  useEffect(() => {
    if (value === q) return;
    const handle = window.setTimeout(() => {
      const next = new URLSearchParams(params.toString());
      if (value.trim()) {
        next.set("q", value.trim());
      } else {
        next.delete("q");
      }
      const query = next.toString();
      router.replace(query ? `/explore?${query}` : "/explore");
    }, 400);
    return () => window.clearTimeout(handle);
  }, [params, q, router, value]);

  return (
    <Input
      placeholder="搜索主题、设备或观测目标"
      className="max-w-sm"
      value={value}
      onChange={(event) => setValue(event.target.value)}
    />
  );
}
