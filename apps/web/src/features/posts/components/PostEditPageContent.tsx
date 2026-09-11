"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import PostWritingPage, {
  formatSaveState,
  hasMeaningfulPostContent,
} from "@/features/posts/components/PostWritingPage";
import { updatePost, type PostListItem } from "@/features/posts/services/postApi";
import { useCurrentUser } from "@/features/users/hooks/useCurrentUser";
import { useToast } from "@/hooks/useToast";
import { queryKeys } from "@/lib/queryKeys";
import { showErrorToast, showSuccessToast } from "@/lib/showToastMessage";

export default function PostEditPageContent({
  initialPost,
}: {
  initialPost: PostListItem;
}) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useCurrentUser();
  const { hasToast } = useToast();
  const [title, setTitle] = useState(initialPost.title);
  const [content, setContent] = useState(initialPost.content);
  const [loading, setLoading] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(
    initialPost.createdAt ? new Date(initialPost.createdAt) : null,
  );

  const handleSave = async () => {
    if (!user) {
      router.push("/login");
      return;
    }
    if (user.id !== initialPost.authorId) {
      showErrorToast("没有权限", "只能编辑自己发布的帖子。");
      return;
    }
    if (!title.trim() || !hasMeaningfulPostContent(content)) {
      if (!hasToast("请补全内容")) {
        showErrorToast("请补全内容", "标题和正文不能为空。");
      }
      return;
    }

    setLoading(true);
    try {
      const result = await updatePost(initialPost.id, { title, content });
      queryClient.setQueryData(queryKeys.posts.detail(initialPost.id), result.data);
      void queryClient.invalidateQueries({ queryKey: queryKeys.posts.all() });
      setLastSavedAt(new Date());
      showSuccessToast("帖子已更新");
      router.push(`/post/${initialPost.id}`);
    } catch {
    } finally {
      setLoading(false);
    }
  };

  return (
    <PostWritingPage
      title={title}
      content={content}
      loading={loading}
      saveStateText={formatSaveState(lastSavedAt, "已发布")}
      saveButtonText="保存修改"
      publishButtonText="保存"
      publishingText="保存中..."
      onTitleChange={setTitle}
      onContentChange={setContent}
      onSave={handleSave}
      onPublish={handleSave}
    />
  );
}
