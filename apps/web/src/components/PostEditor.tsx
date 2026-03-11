"use client";

import { useEffect } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import CharacterCount from "@tiptap/extension-character-count";
import { Button } from "@/components/ui/button";

const MAX_CHARS = 2000;

export default function PostEditor({
  onChange,
  value,
  placeholder = "写下你的观测与思考...",
}: {
  onChange?: (value: string) => void;
  value?: string;
  placeholder?: string;
}) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      CharacterCount.configure({ limit: MAX_CHARS }),
      Placeholder.configure({
        placeholder,
        emptyEditorClass:
          "before:content-[attr(data-placeholder)] before:text-muted-foreground before:float-left before:pointer-events-none before:h-0",
      }),
    ],
    content: value || "",
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      onChange?.(editor.getHTML());
    },
  });

  useEffect(() => {
    if (!editor) return;
    const current = editor.getHTML();
    if ((value || "") !== current) {
      editor.commands.setContent(value || "", false);
    }
  }, [editor, value]);

  if (!editor) return null;

  const charCount = editor.storage.characterCount.characters();
  const isOver = charCount > MAX_CHARS;

  return (
    <div className="rounded-lg border bg-white/70 shadow-sm">
      <div className="flex flex-wrap items-center gap-2 border-b bg-white/80 px-3 py-2">
        <Button
          type="button"
          variant={editor.isActive("bold") ? "default" : "secondary"}
          size="sm"
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          加粗
        </Button>
        <Button
          type="button"
          variant={editor.isActive("italic") ? "default" : "secondary"}
          size="sm"
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          斜体
        </Button>
        <Button
          type="button"
          variant={editor.isActive("heading", { level: 2 }) ? "default" : "secondary"}
          size="sm"
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 2 }).run()
          }
        >
          标题
        </Button>
        <Button
          type="button"
          variant={editor.isActive("bulletList") ? "default" : "secondary"}
          size="sm"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          列表
        </Button>
        <Button
          type="button"
          variant={editor.isActive("blockquote") ? "default" : "secondary"}
          size="sm"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
        >
          引用
        </Button>
      </div>
      <EditorContent editor={editor} className="min-h-48 px-4 py-3" />
      <div className="flex items-center justify-end border-t px-3 py-2 text-xs text-muted-foreground">
        <span className={isOver ? "text-red-500" : undefined}>
          {charCount}/{MAX_CHARS}
        </span>
      </div>
    </div>
  );
}
