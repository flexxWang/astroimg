import ProfileTabs from "@/features/users/components/ProfileTabs";
import UserProfileHeader from "@/features/users/components/UserProfileHeader";
import {
  createEmptyPostFeedPage,
  DEFAULT_POST_FEED_PAGE_SIZE,
} from "@/features/posts/queries/postFeedQuery";
import {
  createEmptyWorkFeedPage,
  DEFAULT_WORK_FEED_PAGE_SIZE,
} from "@/features/works/queries/workFeedQuery";
import { serverFetch } from "@/lib/serverApi";
import type {
  Paginated,
  PostListItem,
  UserProfile,
  WorkItem,
} from "@/lib/types";

export default async function UserProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const userResult = await serverFetch<UserProfile>(`/users/${id}`);
  const postsResult = await serverFetch<Paginated<PostListItem>>(
    `/posts/user/${id}?page=1&pageSize=${DEFAULT_POST_FEED_PAGE_SIZE}`,
  );
  const worksResult = await serverFetch<Paginated<WorkItem>>(
    `/works/user/${id}?page=1&pageSize=${DEFAULT_WORK_FEED_PAGE_SIZE}`,
  );

  const user = userResult.data;
  const postsPage = postsResult.data ?? createEmptyPostFeedPage();
  const worksPage = worksResult.data ?? createEmptyWorkFeedPage();

  return (
    <div className="space-y-8">
      <UserProfileHeader initialProfile={user} userId={id} />

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">内容</h2>
        <ProfileTabs userId={id} postsPage={postsPage} worksPage={worksPage} />
      </section>
    </div>
  );
}
