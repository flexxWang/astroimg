export const queryKeys = {
  auth: {
    me: () => ["auth", "me"] as const,
  },
  posts: {
    all: () => ["posts"] as const,
    feed: (params?: {
      userId?: string;
      pageSize?: number;
      keyword?: string;
    }) =>
      [
        "posts",
        "feed",
        params?.userId ?? "all",
        params?.pageSize ?? 10,
        params?.keyword ?? "",
      ] as const,
    detail: (postId: string) => ["posts", "detail", postId] as const,
    comments: (postId: string) =>
      ["posts", "detail", postId, "comments"] as const,
  },
  works: {
    feed: (params?: { userId?: string; pageSize?: number }) =>
      ["works", "feed", params?.userId ?? "all", params?.pageSize ?? 12] as const,
    detail: (workId: string) => ["works", "detail", workId] as const,
    comments: (workId: string) =>
      ["works", "detail", workId, "comments"] as const,
  },
  notifications: {
    unread: (userId?: string) =>
      ["notifications", "unread", userId ?? "guest"] as const,
  },
  messages: {
    all: () => ["messages"] as const,
    allConversations: () => ["conversations"] as const,
    allSearch: () => ["messages-search"] as const,
    conversations: (userId?: string) =>
      ["conversations", userId ?? "guest"] as const,
    thread: (conversationId: string) =>
      ["messages", conversationId] as const,
    search: (conversationId: string, keyword: string) =>
      ["messages-search", conversationId, keyword] as const,
  },
  users: {
    allSearch: () => ["user-search"] as const,
    search: (keyword: string) => ["user-search", keyword] as const,
  },
  drafts: {
    list: (userId?: string) => ["drafts", userId ?? "guest"] as const,
  },
  observations: {
    points: () => ["observation-points"] as const,
  },
};
