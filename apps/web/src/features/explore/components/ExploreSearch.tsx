"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";
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
    <div className="relative w-full sm:w-[22rem]">
      <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        placeholder="搜索热榜内容"
        className="h-10 rounded-full border-slate-200 bg-white/80 pl-9 pr-10 text-sm shadow-sm backdrop-blur transition focus-visible:border-blue-400 focus-visible:ring-blue-100"
        value={value}
        onChange={(event) => setValue(event.target.value)}
      />
      {value ? (
        <button
          type="button"
          aria-label="清空搜索"
          className="absolute right-2 top-1/2 flex size-6 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground transition hover:bg-slate-100 hover:text-foreground"
          onClick={() => setValue("")}
        >
          <X className="size-3.5" />
        </button>
      ) : null}
    </div>
  );
}
