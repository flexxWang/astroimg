const QUERY_KEY_FALLBACK = {
  guest: "guest",
  pending: "pending",
} as const;

export const queryKeys = {
  auth: {
    me: () => ["auth", "me"] as const,
  },
  ai: {
    all: () => ["ai"] as const,
    history: () => [...queryKeys.ai.all(), "history"] as const,
  },
  posts: {
    all: () => ["posts"] as const,
    list: () => [...queryKeys.posts.all(), "list"] as const,
    feed: (params?: {
      userId?: string;
      pageSize?: number;
      keyword?: string;
    }) =>
      [
        ...queryKeys.posts.all(),
        "feed",
        params?.userId ?? "all",
        params?.pageSize ?? 10,
        params?.keyword ?? "",
      ] as const,
    detail: (postId: string) => [...queryKeys.posts.all(), "detail", postId] as const,
    comments: (postId: string) => [...queryKeys.posts.detail(postId), "comments"] as const,
    likeStatus: (postId: string) =>
      [...queryKeys.posts.detail(postId), "likes", "me"] as const,
  },
  works: {
    all: () => ["works"] as const,
    list: () => [...queryKeys.works.all(), "list"] as const,
    feed: (params?: { userId?: string; pageSize?: number }) =>
      [
        ...queryKeys.works.all(),
        "feed",
        params?.userId ?? "all",
        params?.pageSize ?? 12,
      ] as const,
    detail: (workId: string) => [...queryKeys.works.all(), "detail", workId] as const,
    comments: (workId: string) => [...queryKeys.works.detail(workId), "comments"] as const,
    likeStatus: (workId: string) =>
      [...queryKeys.works.detail(workId), "likes", "me"] as const,
    types: () => [...queryKeys.works.all(), "types"] as const,
    devices: () => [...queryKeys.works.all(), "devices"] as const,
  },
  notifications: {
    all: () => ["notifications"] as const,
    list: () => [...queryKeys.notifications.all(), "list"] as const,
    unread: (userId?: string | null) =>
      [
        ...queryKeys.notifications.all(),
        "unread",
        userId ?? QUERY_KEY_FALLBACK.guest,
      ] as const,
  },
  messages: {
    all: () => ["messages"] as const,
    conversations: (userId?: string | null) =>
      [
        ...queryKeys.messages.all(),
        "conversations",
        userId ?? QUERY_KEY_FALLBACK.guest,
      ] as const,
    thread: (conversationId?: string | null) =>
      [
        ...queryKeys.messages.all(),
        "thread",
        conversationId ?? QUERY_KEY_FALLBACK.pending,
      ] as const,
    search: (conversationId?: string | null, keyword?: string) =>
      [
        ...queryKeys.messages.all(),
        "search",
        conversationId ?? QUERY_KEY_FALLBACK.pending,
        keyword ?? "",
      ] as const,
  },
  users: {
    all: () => ["users"] as const,
    searchRoot: () => [...queryKeys.users.all(), "search"] as const,
    search: (keyword: string) => [...queryKeys.users.searchRoot(), keyword] as const,
    profile: (userId: string) => [...queryKeys.users.all(), "profile", userId] as const,
  },
  follows: {
    status: (userId: string) => ["follows", "status", userId] as const,
  },
  drafts: {
    all: () => ["drafts"] as const,
    list: (userId?: string | null) =>
      [...queryKeys.drafts.all(), "list", userId ?? QUERY_KEY_FALLBACK.guest] as const,
    detail: (draftId: string) => [...queryKeys.drafts.all(), "detail", draftId] as const,
  },
  observations: {
    all: () => ["observations"] as const,
    points: () => [...queryKeys.observations.all(), "points"] as const,
  },
};
