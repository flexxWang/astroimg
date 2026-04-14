"use client";

import { useCallback, useEffect, useState } from "react";
import { fetchMessages, MessageItem } from "@/features/messages/services/messageApi";

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
    let cancelled = false;

    async function resetAndLoad() {
      setLoading(false);
      setLoadingMore(false);

      if (!conversationId) {
        if (!cancelled) {
          setMessages([]);
          setHasMore(true);
        }
        return;
      }

      if (!cancelled) {
        setMessages([]);
        setHasMore(true);
      }

      await loadInitial();
    }

    void resetAndLoad();

    return () => {
      cancelled = true;
    };
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
