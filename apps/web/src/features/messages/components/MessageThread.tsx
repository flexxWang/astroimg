"use client";

import type { RefObject } from "react";
import Image from "next/image";
import { MessageEmptyState } from "@/features/messages/components/MessageEmptyState";
import { parseMessageContent } from "@/features/messages/messageContent";
import type { MessageItem } from "@/features/messages/services/messageApi";

function formatMessageDate(date: Date) {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / (60 * 1000));
  const diffDays = Math.floor(diffMs / (24 * 60 * 60 * 1000));

  if (diffDays === 0) {
    if (diffMinutes < 5) return "刚刚";
    return date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  }
  if (diffDays === 1) return "昨天";
  if (diffDays === 2) return "前天";
  return date.toLocaleDateString();
}

function getMessageImageSize(width?: number, height?: number) {
  const naturalWidth = width && width > 0 ? width : 288;
  const naturalHeight = height && height > 0 ? height : 216;
  const maxWidth = 288;
  const maxHeight = 288;
  const scale = Math.min(maxWidth / naturalWidth, maxHeight / naturalHeight, 1);

  return {
    width: Math.max(1, Math.round(naturalWidth * scale)),
    height: Math.max(1, Math.round(naturalHeight * scale)),
  };
}

export function MessageThread({
  currentUserId,
  currentUsername,
  emptyState,
  hasMore,
  initializing,
  loadingMore,
  messages,
  onPreviewImages,
  onScroll,
  otherUsername,
  scrollRef,
}: {
  currentUserId: string;
  currentUsername?: string;
  emptyState: {
    description: string;
    title: string;
  };
  hasMore: boolean;
  initializing: boolean;
  loadingMore: boolean;
  messages: MessageItem[];
  onPreviewImages: (images: string[], index: number) => void;
  onScroll: () => void;
  otherUsername?: string;
  scrollRef: RefObject<HTMLDivElement | null>;
}) {
  return (
    <div
      ref={scrollRef}
      className="relative min-h-0 flex-1 space-y-3 overflow-y-auto bg-slate-50/50 px-6 py-5"
      onScroll={onScroll}
    >
      {initializing ? (
        <div className="pointer-events-none absolute inset-0 z-10 bg-slate-50/95" />
      ) : loadingMore ? (
        <div className="text-center text-xs text-slate-500">加载中...</div>
      ) : null}
      {!initializing && !hasMore && messages.length > 0 ? (
        <div className="text-center text-xs text-slate-400">没有更多了</div>
      ) : null}

      <div
        className={`space-y-3 ${
          initializing ? "invisible pointer-events-none" : ""
        }`}
      >
        {messages.map((message, index, list) => {
          const currentDate = message.createdAt
            ? formatMessageDate(new Date(message.createdAt))
            : "";
          const prev = list[index - 1];
          const prevDate = prev?.createdAt
            ? formatMessageDate(new Date(prev.createdAt))
            : "";
          const showDivider = currentDate && currentDate !== prevDate;
          const isMine = message.senderId === currentUserId;
          const avatarName = isMine
            ? currentUsername || currentUserId
            : otherUsername || "用户";
          const parsedContent = parseMessageContent(message.content);

          return (
            <div key={message.id} className="space-y-2">
              {showDivider ? (
                <div className="my-3 flex w-full justify-center">
                  <span className="rounded-full bg-white px-3 py-1 text-xs text-slate-400 shadow-sm ring-1 ring-slate-200">
                    {currentDate}
                  </span>
                </div>
              ) : null}
              <div
                className={`flex items-start gap-2 ${
                  isMine ? "justify-end" : "justify-start"
                }`}
              >
                {!isMine ? (
                  <div
                    className="flex size-8 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-xs font-semibold text-indigo-600 ring-1 ring-indigo-100"
                    aria-label={avatarName}
                  >
                    {avatarName.slice(0, 1).toUpperCase()}
                  </div>
                ) : null}
                <div
                  className={`flex max-w-[70%] flex-col gap-1 ${
                    isMine ? "items-end" : "items-start"
                  }`}
                >
                  {parsedContent.text ? (
                    <div
                      className={`w-full rounded-lg px-3 py-2.5 text-sm leading-6 shadow-sm ${
                        isMine
                          ? "rounded-tr-none bg-[#2563eb] text-white"
                          : "rounded-tl-none bg-white text-slate-900 ring-1 ring-indigo-100"
                      }`}
                    >
                      <div className="whitespace-pre-wrap break-words px-1">
                        {parsedContent.text}
                      </div>
                    </div>
                  ) : null}
                  {parsedContent.images.length > 0 ? (
                    <div className="grid max-w-72 grid-cols-1 gap-2">
                      {parsedContent.images.map((image) => {
                        const imageSize = getMessageImageSize(
                          image.width,
                          image.height,
                        );
                        return (
                          <button
                            key={image.url}
                            type="button"
                            onClick={() => {
                              const images = parsedContent.images.map(
                                (item) => item.url,
                              );
                              onPreviewImages(
                                images,
                                images.findIndex((item) => item === image.url),
                              );
                            }}
                            className="relative block overflow-hidden rounded-lg bg-slate-100 shadow-sm ring-1 ring-slate-200 transition hover:opacity-90"
                            style={imageSize}
                          >
                            <Image
                              src={image.url}
                              alt={image.name || "消息图片"}
                              fill
                              loading="eager"
                              sizes={`${imageSize.width}px`}
                              unoptimized
                              className="object-cover"
                            />
                          </button>
                        );
                      })}
                    </div>
                  ) : null}
                  {isMine ? (
                    <div className="pr-1 text-[10px] text-slate-400">
                      {message.read ? "已读" : "未读"}
                    </div>
                  ) : null}
                </div>
                {isMine ? (
                  <div
                    className="flex size-8 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-semibold text-blue-700 ring-1 ring-blue-200"
                    aria-label={avatarName}
                  >
                    {avatarName.slice(0, 1).toUpperCase()}
                  </div>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>

      {!initializing && messages.length === 0 ? (
        <MessageEmptyState
          title={emptyState.title}
          description={emptyState.description}
        />
      ) : null}
    </div>
  );
}
