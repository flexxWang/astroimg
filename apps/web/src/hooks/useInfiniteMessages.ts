"use client";

import { useCallback, useEffect, useState } from "react";
import { fetchMessages, MessageItem } from "@/services/messageApi";

export function useInfiniteMessages(conversationId: string | null) {
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const loadInitial = useCallback(async () => {
    if (!conversationId) return;
    setLoading(true);
    const result = await fetchMessages(conversationId);
    setMessages(result.data);
    setHasMore(result.data.length >= 20);
    setLoading(false);
  }, [conversationId]);

  const loadMore = useCallback(async () => {
    if (!conversationId || !hasMore || loading) return;
    const first = messages[0];
    if (!first?.createdAt) return;
    setLoadingMore(true);
    const result = await fetchMessages(conversationId, first.createdAt);
    if (result.data.length === 0) {
      setHasMore(false);
    } else {
      setMessages((prev) => [...result.data, ...prev]);
    }
    setLoadingMore(false);
  }, [conversationId, hasMore, loading, messages]);

  const appendMessage = useCallback((msg: MessageItem) => {
    setMessages((prev) => [...prev, msg]);
  }, []);

  useEffect(() => {
    setMessages([]);
    setHasMore(true);
    if (conversationId) {
      loadInitial();
    }
  }, [conversationId, loadInitial]);

  return {
    messages,
    loadMore,
    loading,
    loadingMore,
    hasMore,
    setMessages,
    appendMessage,
    reload: loadInitial,
  };
}
