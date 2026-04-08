import FollowButton from "@/components/FollowButton";
import ProfileTabs from "@/components/ProfileTabs";
import UserAvatar from "@/components/UserAvatar";
import { serverFetch } from "@/lib/serverApi";
import type {
  Paginated,
  PostListItem,
  UserProfile,
  WorkItem,
} from "@/lib/types";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function UserProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const userResult = await serverFetch<UserProfile>(`/users/${id}`);
  const postsResult = await serverFetch<Paginated<PostListItem>>(
    `/posts/user/${id}?page=1&pageSize=10`,
  );
  const worksResult = await serverFetch<Paginated<WorkItem>>(
    `/works/user/${id}?page=1&pageSize=12`,
  );

  const user = userResult.data;
  const postsPage = postsResult.data ?? {
    items: [],
    page: 1,
    pageSize: 10,
    total: 0,
    hasMore: false,
  };
  const worksPage = worksResult.data ?? {
    items: [],
    page: 1,
    pageSize: 12,
    total: 0,
    hasMore: false,
  };
  const stats = user?.stats ?? {
    posts: 0,
    followers: 0,
    following: 0,
    likes: 0,
  };
  console.log("用户信息", userResult, user);

  const joinedAt = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString()
    : "未知";

  return (
    <div className="space-y-8">
      <section className="rounded-3xl border bg-white/80 p-6 shadow-sm">
        <div className="flex flex-wrap items-center gap-6">
          <UserAvatar name={user?.username || "用户"} size="lg" />
          <div className="flex-1 space-y-2">
            <h1 className="text-2xl font-semibold">
              {user?.username || "用户"}
            </h1>
            <p className="text-sm text-muted-foreground">
              {user?.bio || "这个人还没有填写简介"}
            </p>
            <div className="text-xs text-muted-foreground">
              加入时间 · {joinedAt}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <FollowButton userId={id} />
            <Link href={`/messages?to=${id}`}>
              <Button variant="secondary" size="sm">
                私信
              </Button>
            </Link>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: "发布", value: stats.posts },
            { label: "获赞", value: stats.likes },
            { label: "粉丝", value: stats.followers },
            { label: "关注", value: stats.following },
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-2xl border bg-white/70 p-4 text-center"
            >
              <div className="text-xl font-semibold">{item.value}</div>
              <div className="text-xs text-muted-foreground">{item.label}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">内容</h2>
        <ProfileTabs userId={id} postsPage={postsPage} worksPage={worksPage} />
      </section>
    </div>
  );
}
