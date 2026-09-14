"use client";

import { useEffect, useRef, useState } from "react";
import { ImagePlus, Send, Smile } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

const QUICK_EMOJIS = [
  "😀",
  "😃",
  "😄",
  "😁",
  "😂",
  "🤣",
  "😊",
  "😉",
  "😍",
  "😘",
  "😎",
  "🤔",
  "😅",
  "😭",
  "😤",
  "🥳",
  "🤩",
  "😇",
  "👍",
  "👎",
  "👏",
  "🙏",
  "💪",
  "🤝",
  "🙌",
  "👌",
  "🔥",
  "✨",
  "💫",
  "🌙",
  "⭐",
  "🌌",
  "☄️",
  "🪐",
  "🚀",
  "📷",
  "🔭",
  "🌠",
  "🌞",
  "🌝",
  "☁️",
  "⚡",
  "💡",
  "✅",
  "❌",
  "❗",
  "❓",
  "❤️",
  "💙",
  "💜",
  "💛",
  "🎉",
  "🎊",
  "🏆",
  "📌",
  "📎",
  "💬",
];

export function MessageComposer({
  content,
  disabled,
  onChange,
  onSend,
  onSelectImages,
  sending,
}: {
  content: string;
  disabled?: boolean;
  onChange: (content: string) => void;
  onSend: () => void;
  onSelectImages: (files: File[]) => void;
  sending: boolean;
}) {
  const [emojiOpen, setEmojiOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const emojiPickerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!emojiOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (
        target instanceof Node &&
        emojiPickerRef.current?.contains(target)
      ) {
        return;
      }
      setEmojiOpen(false);
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setEmojiOpen(false);
      }
    };

    window.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [emojiOpen]);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      onSend();
    }
  };

  const appendEmoji = (emoji: string) => {
    onChange(`${content}${emoji}`);
    setEmojiOpen(false);
  };

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []).filter((file) =>
      file.type.startsWith("image/"),
    );
    event.target.value = "";
    if (files.length > 0) {
      onSelectImages(files);
    }
  };

  return (
    <div className="shrink-0 border-t border-slate-200 bg-white p-4">
      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-2 transition focus-within:border-slate-300 focus-within:bg-white focus-within:ring-2 focus-within:ring-slate-200">
        <div className="flex items-center px-1 pb-2">
          <div ref={emojiPickerRef} className="relative flex items-center gap-1">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleImageChange}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={() => setEmojiOpen((open) => !open)}
              disabled={disabled || sending}
              title="添加表情"
            >
              <Smile className="size-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={() => {
                setEmojiOpen(false);
                fileInputRef.current?.click();
              }}
              disabled={disabled || sending}
              title="发送图片"
            >
              <ImagePlus className="size-4" />
            </Button>
            {emojiOpen ? (
              <div className="absolute bottom-9 left-0 z-20 grid max-h-64 w-72 grid-cols-8 gap-1 overflow-y-auto rounded-xl border border-slate-200 bg-white p-2 shadow-lg">
                {QUICK_EMOJIS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => appendEmoji(emoji)}
                    className="flex size-8 items-center justify-center rounded-lg text-lg transition hover:bg-slate-100"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        </div>
        <Textarea
          placeholder="输入消息..."
          value={content}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={handleKeyDown}
          className="min-h-20 resize-none border-0 bg-transparent px-2 py-2 shadow-none focus-visible:ring-0"
        />
        <div className="flex items-center justify-between px-1 pb-1">
          <span className="text-xs text-slate-400">
            Enter 发送，Shift + Enter 换行
          </span>
          <Button
            onClick={onSend}
            disabled={disabled || !content.trim() || sending}
            className="h-9 rounded-xl px-4"
          >
            {sending ? (
              "发送中..."
            ) : (
              <>
                <Send className="size-4" />
                发送
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
