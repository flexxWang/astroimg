"use client";

import { useState } from "react";
import PostFeed from "@/features/posts/components/PostFeed";
import WorkFeed from "@/features/works/components/WorkFeed";
import type { Paginated, PostListItem, WorkItem } from "@/lib/types";

export default function ProfileTabs({
  userId,
  postsPage,
  worksPage,
}: {
  userId: string;
  postsPage: Paginated<PostListItem>;
  worksPage: Paginated<WorkItem>;
}) {
  const [tab, setTab] = useState<"works" | "posts">("works");

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 rounded-full border bg-white/70 p-1 text-sm">
        <button
          className={`rounded-full px-4 py-2 ${
            tab === "works"
              ? "bg-slate-900 text-white"
              : "text-muted-foreground hover:text-foreground"
          }`}
          onClick={() => setTab("works")}
        >
          作品
        </button>
        <button
          className={`rounded-full px-4 py-2 ${
            tab === "posts"
              ? "bg-slate-900 text-white"
              : "text-muted-foreground hover:text-foreground"
          }`}
          onClick={() => setTab("posts")}
        >
          帖子
        </button>
      </div>

      {tab === "works" ? (
        <WorkFeed
          initialPage={worksPage}
          pageSize={12}
          userId={userId}
        />
      ) : (
        <PostFeed initialPage={postsPage} pageSize={10} userId={userId} />
      )}
    </div>
  );
}
