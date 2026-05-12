export const queryKeys = {
  auth: {
    me: () => ["auth", "me"] as const,
  },
  ai: {
    history: () => ["ai-copilot-history"] as const,
  },
  posts: {
    all: () => ["posts"] as const,
    likeStatus: (postId: string) => ["posts", "likes", postId, "me"] as const,
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
    all: () => ["works"] as const,
    feed: (params?: { userId?: string; pageSize?: number }) =>
      ["works", "feed", params?.userId ?? "all", params?.pageSize ?? 12] as const,
    detail: (workId: string) => ["works", "detail", workId] as const,
    comments: (workId: string) =>
      ["works", "detail", workId, "comments"] as const,
    likeStatus: (workId: string) => ["works", "likes", workId, "me"] as const,
    types: () => ["works", "types"] as const,
    devices: () => ["works", "devices"] as const,
  },
  notifications: {
    list: () => ["notifications", "list"] as const,
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
    profile: (userId: string) => ["users", "profile", userId] as const,
  },
  follows: {
    status: (userId: string) => ["follows", "status", userId] as const,
  },
  drafts: {
    list: (userId?: string) => ["drafts", userId ?? "guest"] as const,
    detail: (draftId: string) => ["drafts", "detail", draftId] as const,
  },
  observations: {
    points: () => ["observation-points"] as const,
  },
};
