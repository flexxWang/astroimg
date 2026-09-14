"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";

type ThreadScrollMode = "initializing" | "ready" | "loadingOlder";

export function useMessageThreadScroll({
  conversationId,
  hasMore,
  loadMore,
  loading,
  messagesLength,
  searchActive,
}: {
  conversationId: string | null;
  hasMore: boolean;
  loadMore: () => Promise<unknown>;
  loading: boolean;
  messagesLength: number;
  searchActive: boolean;
}) {
  const [isInitializing, setIsInitializing] = useState(Boolean(conversationId));
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const stateRef = useRef<{
    conversationId: string | null;
    mode: ThreadScrollMode;
    previousHeight: number;
  }>({
    conversationId: null,
    mode: "initializing",
    previousHeight: 0,
  });

  const scrollToBottom = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        el.scrollTop = el.scrollHeight - el.clientHeight;
      });
    });
  }, []);

  const resetThreadScroll = useCallback((nextConversationId: string | null) => {
    stateRef.current = {
      conversationId: nextConversationId,
      mode: "initializing",
      previousHeight: 0,
    };
    setIsInitializing(Boolean(nextConversationId));
  }, []);

  useLayoutEffect(() => {
    if (stateRef.current.conversationId !== conversationId) {
      stateRef.current = {
        conversationId,
        mode: "initializing",
        previousHeight: 0,
      };
    }
    if (!conversationId || loading || stateRef.current.mode !== "initializing") {
      return;
    }

    const el = scrollRef.current;
    if (!el) return;
    const conversationIdAtStart = conversationId;

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (stateRef.current.conversationId !== conversationIdAtStart) {
          return;
        }

        el.scrollTop =
          messagesLength === 0 ? 0 : el.scrollHeight - el.clientHeight;
        stateRef.current = {
          conversationId: conversationIdAtStart,
          mode: "ready",
          previousHeight: 0,
        };
        setIsInitializing(false);
      });
    });
  }, [conversationId, loading, messagesLength]);

  useEffect(() => {
    if (searchActive || stateRef.current.mode !== "ready") return;
    const el = scrollRef.current;
    if (!el) return;
    const distanceToBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    if (distanceToBottom < 200) {
      scrollToBottom();
    }
  }, [messagesLength, scrollToBottom, searchActive]);

  const handleScroll = useCallback(() => {
    if (searchActive || !hasMore || !conversationId) return;
    if (stateRef.current.mode !== "ready") return;

    const el = scrollRef.current;
    if (!el || el.scrollTop > 1) return;

    const conversationIdAtStart = conversationId;
    const previousHeight = el.scrollHeight;
    stateRef.current = {
      conversationId: conversationIdAtStart,
      mode: "loadingOlder",
      previousHeight,
    };

    void loadMore().finally(() => {
      requestAnimationFrame(() => {
        if (
          stateRef.current.conversationId !== conversationIdAtStart ||
          stateRef.current.mode !== "loadingOlder"
        ) {
          return;
        }

        const currentEl = scrollRef.current;
        if (currentEl) {
          currentEl.scrollTop =
            currentEl.scrollHeight - stateRef.current.previousHeight;
        }
        stateRef.current = {
          conversationId: conversationIdAtStart,
          mode: "ready",
          previousHeight: 0,
        };
      });
    });
  }, [conversationId, hasMore, loadMore, searchActive]);

  return {
    handleScroll,
    isInitializing,
    resetThreadScroll,
    scrollRef,
    scrollToBottom,
  };
}
