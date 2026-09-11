"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type ComponentType,
  type FormEvent,
  type ReactNode,
} from "react";
import {
  EditorContent,
  Node,
  NodeViewWrapper,
  ReactNodeViewRenderer,
  mergeAttributes,
  useEditor,
  type Editor,
  type ReactNodeViewProps,
} from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import CharacterCount from "@tiptap/extension-character-count";
import {
  Bold,
  Braces,
  ChevronDown,
  Code2,
  Image as ImageIcon,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
  Minus,
  Paperclip,
  Pilcrow,
  Quote,
  Redo2,
  Sigma,
  Strikethrough,
  Table2,
  Trash2,
  Underline,
  UploadCloud,
  Undo2,
  Video,
  X,
} from "lucide-react";
import { signUpload, uploadFile } from "@/features/uploads/services/uploadApi";
import { cn } from "@/lib/utils";

const MAX_CHARS = 2000;
const TOOLBAR_GROUP_DIVIDER =
  "after:mx-1 after:h-6 after:w-px after:bg-[#eef0f4] after:content-['']";

type ToolbarItem = {
  label: string;
  icon: ComponentType<{ className?: string }>;
  active: boolean | ((editor: Editor) => boolean);
  action: (editor: Editor) => boolean;
  disabled?: (editor: Editor) => boolean;
};

type EditorDialog = "link" | "video" | "attachment" | "formula" | "table" | null;

type MediaNodeViewProps = ReactNodeViewProps & {
  kind: "image" | "video" | "attachment";
};

function MediaDeleteConfirm({
  kind,
  onCancel,
  onConfirm,
}: {
  kind: MediaNodeViewProps["kind"];
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const label = kind === "image" ? "图片" : kind === "video" ? "视频" : "附件";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/25 p-4 backdrop-blur-sm"
      onClick={(event) => event.stopPropagation()}
    >
      <div className="w-[320px] rounded-xl border border-[#e7eaf0] bg-white p-5 text-center shadow-2xl">
        <div className="mx-auto mb-3 flex size-9 items-center justify-center rounded-full bg-red-50 text-red-500">
          <Trash2 className="size-4" />
        </div>
        <div className="font-medium text-[#1f2329]">删除这个{label}？</div>
        <div className="mt-1 text-xs leading-5 text-[#8590a6]">
          删除后会从当前正文中移除。
        </div>
        <div className="mt-4 flex justify-center gap-2">
          <button
            type="button"
            className="h-8 rounded-lg px-3 text-sm text-[#596172] transition hover:bg-[#f2f4f8]"
            onClick={(event) => {
              event.stopPropagation();
              onCancel();
            }}
          >
            取消
          </button>
          <button
            type="button"
            className="h-8 rounded-lg bg-red-500 px-3 text-sm font-medium text-white transition hover:bg-red-600"
            onClick={(event) => {
              event.stopPropagation();
              onConfirm();
            }}
          >
            删除
          </button>
        </div>
      </div>
    </div>
  );
}

function MediaDeleteButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      className="absolute right-3 top-3 z-10 flex size-8 items-center justify-center rounded-full bg-white text-red-500 shadow-lg ring-1 ring-[#e7eaf0] transition hover:bg-red-50"
      title="删除"
      aria-label="删除"
      onMouseDown={(event) => {
        event.preventDefault();
        event.stopPropagation();
      }}
      onClick={(event) => {
        event.stopPropagation();
        onClick();
      }}
    >
      <Trash2 className="size-4" />
    </button>
  );
}

function MediaNodeView(props: MediaNodeViewProps) {
  const { node, deleteNode, kind, selected } = props;
  const [active, setActive] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const attrs = node.attrs as {
    src?: string;
    href?: string;
    alt?: string;
    title?: string;
    name?: string;
  };
  const label = attrs.title || attrs.name || attrs.alt || "附件";
  const src = attrs.src || attrs.href || "";
  const showDelete = active || selected || confirming;

  if (kind === "image") {
    return (
      <NodeViewWrapper
        as="figure"
        data-type="image"
        className="cursor-default"
        onClick={() => setActive(true)}
        onBlur={() => {
          if (!confirming) setActive(false);
        }}
        tabIndex={0}
      >
        <span className="relative inline-block max-w-full align-top">
          {showDelete ? (
            <MediaDeleteButton onClick={() => setConfirming(true)} />
          ) : null}
          {confirming ? (
            <MediaDeleteConfirm
              kind={kind}
              onCancel={() => setConfirming(false)}
              onConfirm={deleteNode}
            />
          ) : null}
          {/* Rich text image URLs are user-uploaded editor content. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={src} alt={attrs.alt || "图片"} title={attrs.title || ""} />
        </span>
      </NodeViewWrapper>
    );
  }

  return (
    <NodeViewWrapper
      as="div"
      data-type={kind === "video" ? "video-embed" : "attachment"}
      className={cn(
        "relative cursor-default",
        "rounded-lg transition",
        showDelete && "ring-2 ring-[#1772f6]/35 ring-offset-2",
      )}
      onClick={() => setActive(true)}
      onBlur={() => {
        if (!confirming) setActive(false);
      }}
      tabIndex={0}
    >
      {showDelete ? (
        <MediaDeleteButton onClick={() => setConfirming(true)} />
      ) : null}
      {confirming ? (
        <MediaDeleteConfirm
          kind={kind}
          onCancel={() => setConfirming(false)}
          onConfirm={deleteNode}
        />
      ) : null}
      {kind === "video" ? (
        <>
          <video controls src={src} title={label} />
          <a href={src} target="_blank" rel="noreferrer">
            {label}
          </a>
        </>
      ) : null}
      {kind === "attachment" ? (
        <a href={src} target="_blank" rel="noreferrer">
          {label}
        </a>
      ) : null}
    </NodeViewWrapper>
  );
}

const MediaImage = Node.create({
  name: "mediaImage",
  group: "block",
  atom: true,
  draggable: true,
  addAttributes() {
    return {
      src: { default: null },
      alt: { default: "" },
      title: { default: "" },
    };
  },
  parseHTML() {
    return [{ tag: "figure[data-type='image']" }, { tag: "img[src]" }];
  },
  renderHTML({ HTMLAttributes }) {
    const { src, alt, title } = HTMLAttributes;
    return [
      "figure",
      { "data-type": "image" },
      ["img", mergeAttributes({ src, alt, title })],
    ];
  },
  addNodeView() {
    return ReactNodeViewRenderer((props) => (
      <MediaNodeView {...props} kind="image" />
    ));
  },
});

const VideoEmbed = Node.create({
  name: "videoEmbed",
  group: "block",
  atom: true,
  addAttributes() {
    return {
      src: { default: "" },
      title: { default: "视频" },
    };
  },
  parseHTML() {
    return [{ tag: "div[data-type='video-embed']" }];
  },
  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes({ "data-type": "video-embed" }, HTMLAttributes),
      [
        "video",
        {
          controls: "true",
          src: HTMLAttributes.src,
          title: HTMLAttributes.title,
        },
      ],
      [
        "a",
        { href: HTMLAttributes.src, target: "_blank", rel: "noreferrer" },
        HTMLAttributes.title || HTMLAttributes.src,
      ],
    ];
  },
  addNodeView() {
    return ReactNodeViewRenderer((props) => (
      <MediaNodeView {...props} kind="video" />
    ));
  },
});

const AttachmentBlock = Node.create({
  name: "attachmentBlock",
  group: "block",
  atom: true,
  addAttributes() {
    return {
      href: { default: "" },
      name: { default: "附件" },
    };
  },
  parseHTML() {
    return [{ tag: "div[data-type='attachment']" }];
  },
  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes({ "data-type": "attachment" }, HTMLAttributes),
      ["a", { href: HTMLAttributes.href, target: "_blank", rel: "noreferrer" }, HTMLAttributes.name],
    ];
  },
  addNodeView() {
    return ReactNodeViewRenderer((props) => (
      <MediaNodeView {...props} kind="attachment" />
    ));
  },
});

const FormulaBlock = Node.create({
  name: "formulaBlock",
  group: "block",
  atom: true,
  addAttributes() {
    return {
      formula: { default: "" },
    };
  },
  parseHTML() {
    return [{ tag: "div[data-type='formula']" }];
  },
  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes({ "data-type": "formula" }, HTMLAttributes),
      HTMLAttributes.formula,
    ];
  },
});

const EditableTable = Node.create({
  name: "editableTable",
  group: "block",
  content: "tableRow+",
  addAttributes() {
    return {
      rows: { default: null },
      cols: { default: null },
    };
  },
  parseHTML() {
    return [{ tag: "table[data-type='editable-table']" }];
  },
  renderHTML({ HTMLAttributes }) {
    return [
      "table",
      mergeAttributes({ "data-type": "editable-table" }, HTMLAttributes),
      ["tbody", {}, 0],
    ];
  },
});

const TableRow = Node.create({
  name: "tableRow",
  content: "(tableCell | tableHeader)+",
  parseHTML() {
    return [{ tag: "tr" }];
  },
  renderHTML({ HTMLAttributes }) {
    return ["tr", mergeAttributes(HTMLAttributes), 0];
  },
});

const TableCell = Node.create({
  name: "tableCell",
  content: "block+",
  isolating: true,
  parseHTML() {
    return [{ tag: "td" }];
  },
  renderHTML({ HTMLAttributes }) {
    return ["td", mergeAttributes(HTMLAttributes), 0];
  },
});

const TableHeader = Node.create({
  name: "tableHeader",
  content: "block+",
  isolating: true,
  parseHTML() {
    return [{ tag: "th" }];
  },
  renderHTML({ HTMLAttributes }) {
    return ["th", mergeAttributes(HTMLAttributes), 0];
  },
});

function normalizeUrl(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

function insertBlock(
  editor: Editor,
  block: Parameters<Editor["commands"]["insertContent"]>[0],
) {
  editor.chain().focus().insertContent(block).run();
}

function buildEditableTable(rows: number, cols: number) {
  return {
    type: "editableTable",
    attrs: { rows, cols },
    content: Array.from({ length: rows }, (_, rowIndex) => ({
      type: "tableRow",
      content: Array.from({ length: cols }, (_, colIndex) => ({
        type: rowIndex === 0 ? "tableHeader" : "tableCell",
        content: [
          {
            type: "paragraph",
            content:
              rowIndex === 0
                ? [{ type: "text", text: `列 ${colIndex + 1}` }]
                : undefined,
          },
        ],
      })),
    })),
  };
}

export default function PostEditor({
  onChange,
  value,
  placeholder = "写下你的观测与思考...",
  className,
  paperHeader,
  showStatusBar = true,
}: {
  onChange?: (value: string) => void;
  value?: string;
  placeholder?: string;
  className?: string;
  paperHeader?: ReactNode;
  showStatusBar?: boolean;
}) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const headingButtonRef = useRef<HTMLButtonElement | null>(null);
  const [uploading, setUploading] = useState(false);
  const [headingOpen, setHeadingOpen] = useState(false);
  const [headingMenuPosition, setHeadingMenuPosition] = useState({
    left: 0,
    top: 0,
  });
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
        link: {
          autolink: true,
          openOnClick: false,
          linkOnPaste: true,
          HTMLAttributes: {
            rel: "noopener noreferrer",
            target: "_blank",
          },
        },
      }),
      MediaImage,
      VideoEmbed,
      AttachmentBlock,
      FormulaBlock,
      EditableTable,
      TableRow,
      TableCell,
      TableHeader,
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

  const [activeDialog, setActiveDialog] = useState<EditorDialog>(null);
  const [dialogTitleValue, setDialogTitleValue] = useState("");
  const [dialogValue, setDialogValue] = useState("");
  const [dialogFile, setDialogFile] = useState<File | null>(null);
  const [tableRows, setTableRows] = useState(4);
  const [tableCols, setTableCols] = useState(3);
  const [dialogLoading, setDialogLoading] = useState(false);

  const toolbarGroups = useMemo<ToolbarItem[][]>(
    () => [
      [
        {
          label: "撤销",
          icon: Undo2,
          active: false,
          action: (editor: Editor) => editor.chain().focus().undo().run(),
          disabled: (editor: Editor) => !editor.can().undo(),
        },
        {
          label: "重做",
          icon: Redo2,
          active: false,
          action: (editor: Editor) => editor.chain().focus().redo().run(),
          disabled: (editor: Editor) => !editor.can().redo(),
        },
      ],
      [
        {
          label: "正文",
          icon: Pilcrow,
          active: (editor: Editor) => editor.isActive("paragraph"),
          action: (editor: Editor) => editor.chain().focus().setParagraph().run(),
        },
        {
          label: "加粗",
          icon: Bold,
          active: (editor: Editor) => editor.isActive("bold"),
          action: (editor: Editor) => editor.chain().focus().toggleBold().run(),
        },
        {
          label: "斜体",
          icon: Italic,
          active: (editor: Editor) => editor.isActive("italic"),
          action: (editor: Editor) => editor.chain().focus().toggleItalic().run(),
        },
        {
          label: "下划线",
          icon: Underline,
          active: (editor: Editor) => editor.isActive("underline"),
          action: (editor: Editor) =>
            editor.chain().focus().toggleUnderline().run(),
        },
        {
          label: "删除线",
          icon: Strikethrough,
          active: (editor: Editor) => editor.isActive("strike"),
          action: (editor: Editor) => editor.chain().focus().toggleStrike().run(),
        },
      ],
      [
        {
          label: "列表",
          icon: List,
          active: (editor: Editor) => editor.isActive("bulletList"),
          action: (editor: Editor) =>
            editor.chain().focus().toggleBulletList().run(),
        },
        {
          label: "有序列表",
          icon: ListOrdered,
          active: (editor: Editor) => editor.isActive("orderedList"),
          action: (editor: Editor) =>
            editor.chain().focus().toggleOrderedList().run(),
        },
        {
          label: "引用",
          icon: Quote,
          active: (editor: Editor) => editor.isActive("blockquote"),
          action: (editor: Editor) =>
            editor.chain().focus().toggleBlockquote().run(),
        },
        {
          label: "分割线",
          icon: Minus,
          active: false,
          action: (editor: Editor) =>
            editor.chain().focus().setHorizontalRule().run(),
        },
        {
          label: "代码块",
          icon: Code2,
          active: (editor: Editor) => editor.isActive("codeBlock"),
          action: (editor: Editor) =>
            editor.chain().focus().toggleCodeBlock().run(),
        },
      ],
    ],
    [],
  );

  useEffect(() => {
    if (!editor) return;
    const current = editor.getHTML();
    if ((value || "") !== current) {
      editor.commands.setContent(value || "", { emitUpdate: false });
    }
  }, [editor, value]);

  if (!editor) return null;

  const charCount = editor.storage.characterCount.characters();
  const isOver = charCount > MAX_CHARS;
  const wordCount = editor.storage.characterCount.words();

  const toggleHeadingMenu = () => {
    const rect = headingButtonRef.current?.getBoundingClientRect();
    if (rect) {
      setHeadingMenuPosition({
        left: rect.left,
        top: rect.bottom + 8,
      });
    }
    setHeadingOpen((open) => !open);
  };

  const openDialog = (dialog: Exclude<EditorDialog, null>) => {
    if (dialog === "link") {
      setDialogValue((editor.getAttributes("link").href as string | undefined) ?? "");
      setDialogTitleValue(editor.state.doc.textBetween(
        editor.state.selection.from,
        editor.state.selection.to,
        " ",
      ));
    } else {
      setDialogValue("");
      setDialogTitleValue("");
    }
    setDialogFile(null);
    setActiveDialog(dialog);
  };

  const closeDialog = () => {
    if (dialogLoading) return;
    setActiveDialog(null);
    setDialogTitleValue("");
    setDialogValue("");
    setDialogFile(null);
  };

  const handleSetLink = () => {
    const previousUrl = editor.getAttributes("link").href as string | undefined;
    const selectedText = editor.state.doc.textBetween(
      editor.state.selection.from,
      editor.state.selection.to,
      " ",
    );
    setDialogTitleValue(selectedText);
    setDialogValue(previousUrl || "");
    setActiveDialog("link");
  };

  const handleSubmitLink = () => {
    const href = normalizeUrl(dialogValue);
    const title = dialogTitleValue.trim();
    if (!href) {
      editor.chain().focus().unsetLink().run();
      closeDialog();
      return;
    }
    if (title) {
      editor
        .chain()
        .focus()
        .insertContent({
          type: "text",
          text: title,
          marks: [{ type: "link", attrs: { href } }],
        })
        .run();
    } else {
      editor.chain().focus().extendMarkRange("link").setLink({ href }).run();
    }
    closeDialog();
  };

  const handleSubmitVideo = async () => {
    const src = normalizeUrl(dialogValue);
    if (!dialogFile && !src) return;

    setDialogLoading(true);
    try {
      if (dialogFile) {
        const signed = await signUpload(
          dialogFile.name,
          dialogFile.type,
          dialogFile.size,
        );
        await uploadFile(signed.data, dialogFile);
        insertBlock(editor, {
          type: "videoEmbed",
          attrs: {
            src: signed.data.fileUrl,
            title: dialogFile.name,
          },
        });
      } else {
        insertBlock(editor, {
          type: "videoEmbed",
          attrs: { src, title: "视频链接" },
        });
      }
      closeDialog();
    } finally {
      setDialogLoading(false);
    }
  };

  const handleSubmitAttachment = async () => {
    const href = normalizeUrl(dialogValue);
    if (!dialogFile && !href) return;

    setDialogLoading(true);
    try {
      if (dialogFile) {
        const signed = await signUpload(
          dialogFile.name,
          dialogFile.type || "application/octet-stream",
          dialogFile.size,
        );
        await uploadFile(signed.data, dialogFile);
        insertBlock(editor, {
          type: "attachmentBlock",
          attrs: {
            href: signed.data.fileUrl,
            name: dialogFile.name,
          },
        });
      } else {
        insertBlock(editor, {
          type: "attachmentBlock",
          attrs: { href, name: "附件链接" },
        });
      }
      closeDialog();
    } finally {
      setDialogLoading(false);
    }
  };

  const handleSubmitFormula = () => {
    const formula = dialogValue.trim();
    if (!formula) return;
    insertBlock(editor, {
      type: "formulaBlock",
      attrs: { formula },
    });
    closeDialog();
  };

  const handleSubmitTable = () => {
    const rows = Math.min(Math.max(tableRows, 1), 20);
    const cols = Math.min(Math.max(tableCols, 1), 10);
    insertBlock(editor, buildEditableTable(rows, cols));
    closeDialog();
  };

  const handleSelectImage = () => {
    fileInputRef.current?.click();
  };

  const handleImageChange = async (
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setUploading(true);
    try {
      const signed = await signUpload(file.name, file.type, file.size);
      await uploadFile(signed.data, file);
      insertBlock(editor, {
        type: "mediaImage",
        attrs: {
          src: signed.data.fileUrl,
          alt: file.name,
          title: "",
        },
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDialogSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (activeDialog === "link") {
      handleSubmitLink();
      return;
    }
    if (activeDialog === "video") {
      void handleSubmitVideo();
      return;
    }
    if (activeDialog === "attachment") {
      void handleSubmitAttachment();
      return;
    }
    if (activeDialog === "formula") {
      handleSubmitFormula();
      return;
    }
    if (activeDialog === "table") {
      handleSubmitTable();
    }
  };

  const dialogTitle =
    activeDialog === "link"
      ? "插入链接"
      : activeDialog === "video"
        ? "上传视频"
        : activeDialog === "attachment"
          ? "上传附件"
          : activeDialog === "formula"
            ? "插入公式"
            : activeDialog === "table"
              ? "插入表格"
              : "";

  return (
    <div
      className={cn(
        "flex h-full min-h-0 flex-col bg-white text-[#1f2329]",
        className,
      )}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleImageChange}
      />
      <div className="z-20 min-h-16 shrink-0 overflow-visible border-b border-[#e7eaf0] bg-white py-2 shadow-[0_1px_2px_rgba(18,18,18,0.03)]">
        <div className="mx-auto flex w-full max-w-[1120px] items-center justify-center gap-x-1.5 whitespace-nowrap">
          {toolbarGroups.map((group, groupIndex) => (
            <div key={groupIndex} className="contents">
              <div className={cn("flex items-center gap-1 px-1", TOOLBAR_GROUP_DIVIDER)}>
                {group.map((item) => {
                  const Icon = item.icon;
                  const isActive =
                    typeof item.active === "function"
                      ? item.active(editor)
                      : item.active;
                  const isDisabled = item.disabled?.(editor) ?? false;
                  return (
                    <button
                      key={item.label}
                      type="button"
                      title={item.label}
                      disabled={isDisabled}
                      aria-pressed={Boolean(isActive)}
                      onClick={() => item.action(editor)}
                      className={cn(
                        "flex h-11 min-w-11 flex-col items-center justify-center rounded-md px-1.5 text-[13px] font-medium text-[#596172] transition hover:bg-[#f2f4f8] hover:text-[#121212] disabled:cursor-not-allowed disabled:opacity-35",
                        isActive && "bg-[#eef5ff] text-[#1772f6]",
                      )}
                    >
                      <Icon className="mb-1 size-4" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
              {groupIndex === 0 ? (
                <div className={cn("relative flex items-center px-1", TOOLBAR_GROUP_DIVIDER)}>
                  <button
                    ref={headingButtonRef}
                    type="button"
                    title="标题"
                    aria-expanded={headingOpen}
                    onClick={toggleHeadingMenu}
                    className={cn(
                      "flex h-11 min-w-11 flex-col items-center justify-center rounded-md px-1.5 text-[13px] font-medium text-[#596172] transition hover:bg-[#f2f4f8] hover:text-[#121212]",
                      (editor.isActive("heading", { level: 1 }) ||
                        editor.isActive("heading", { level: 2 })) &&
                        "bg-[#eef5ff] text-[#1772f6]",
                    )}
                  >
                    <span className="mb-1 flex items-center gap-0.5">
                      <span className="text-base font-semibold leading-none">H</span>
                      <ChevronDown className="size-3" />
                    </span>
                    <span>标题</span>
                  </button>
                </div>
              ) : null}
            </div>
          ))}
          <div className="flex items-center gap-1 px-1">
          <button
            type="button"
            title="链接"
            aria-pressed={editor.isActive("link")}
            onClick={handleSetLink}
            className={cn(
              "flex h-11 min-w-11 flex-col items-center justify-center rounded-md px-1.5 text-[13px] font-medium text-[#596172] transition hover:bg-[#f2f4f8] hover:text-[#121212]",
              editor.isActive("link") && "bg-[#eef5ff] text-[#1772f6]",
            )}
          >
            <LinkIcon className="mb-1 size-4" />
            <span>链接</span>
          </button>
          <button
            type="button"
            title="图片"
            disabled={uploading}
            onClick={handleSelectImage}
            className="flex h-11 min-w-11 flex-col items-center justify-center rounded-md px-1.5 text-[13px] font-medium text-[#596172] transition hover:bg-[#f2f4f8] hover:text-[#121212] disabled:cursor-wait disabled:opacity-50"
          >
            <ImageIcon className="mb-1 size-4" />
            <span>{uploading ? "上传中" : "图片"}</span>
          </button>
          <button
            type="button"
            title="视频"
            onClick={() => openDialog("video")}
            className="flex h-11 min-w-11 flex-col items-center justify-center rounded-md px-1.5 text-[13px] font-medium text-[#596172] transition hover:bg-[#f2f4f8] hover:text-[#121212]"
          >
            <Video className="mb-1 size-4" />
            <span>视频</span>
          </button>
          <button
            type="button"
            title="表格"
            onClick={() => openDialog("table")}
            className="flex h-11 min-w-11 flex-col items-center justify-center rounded-md px-1.5 text-[13px] font-medium text-[#596172] transition hover:bg-[#f2f4f8] hover:text-[#121212]"
          >
            <Table2 className="mb-1 size-4" />
            <span>表格</span>
          </button>
          <button
            type="button"
            title="公式"
            onClick={() => openDialog("formula")}
            className="flex h-11 min-w-11 flex-col items-center justify-center rounded-md px-1.5 text-[13px] font-medium text-[#596172] transition hover:bg-[#f2f4f8] hover:text-[#121212]"
          >
            <Sigma className="mb-1 size-4" />
            <span>公式</span>
          </button>
          <button
            type="button"
            title="附件"
            onClick={() => openDialog("attachment")}
            className="flex h-11 min-w-11 flex-col items-center justify-center rounded-md px-1.5 text-[13px] font-medium text-[#596172] transition hover:bg-[#f2f4f8] hover:text-[#121212]"
          >
            <Paperclip className="mb-1 size-4" />
            <span>附件</span>
          </button>
          <button
            type="button"
            title="注释"
            onClick={() => editor.chain().focus().toggleCode().run()}
            className={cn(
              "flex h-11 min-w-11 flex-col items-center justify-center rounded-md px-1.5 text-[13px] font-medium text-[#596172] transition hover:bg-[#f2f4f8] hover:text-[#121212]",
              editor.isActive("code") && "bg-[#eef5ff] text-[#1772f6]",
            )}
          >
            <Braces className="mb-1 size-4" />
            <span>注释</span>
          </button>
          </div>
        </div>
      </div>
      {headingOpen ? (
        <div
          className="fixed z-50 w-28 rounded-lg border border-[#e7eaf0] bg-white p-1 shadow-xl"
          style={{
            left: headingMenuPosition.left,
            top: headingMenuPosition.top,
          }}
        >
          <button
            type="button"
            className="flex w-full items-center justify-between rounded-md px-3 py-2 text-sm text-[#1f2329] hover:bg-[#f2f4f8]"
            onClick={() => {
              editor.chain().focus().toggleHeading({ level: 1 }).run();
              setHeadingOpen(false);
            }}
          >
            H1
            {editor.isActive("heading", { level: 1 }) ? "✓" : ""}
          </button>
          <button
            type="button"
            className="flex w-full items-center justify-between rounded-md px-3 py-2 text-sm text-[#1f2329] hover:bg-[#f2f4f8]"
            onClick={() => {
              editor.chain().focus().toggleHeading({ level: 2 }).run();
              setHeadingOpen(false);
            }}
          >
            H2
            {editor.isActive("heading", { level: 2 }) ? "✓" : ""}
          </button>
        </div>
      ) : null}
      <div className="flex flex-1 justify-center overflow-y-auto bg-white px-4 py-3 sm:px-6">
        <div className="w-full bg-white py-6">
          {paperHeader}
          <EditorContent
            editor={editor}
            className="post-editor-content min-h-[calc(100vh-250px)] [&_.ProseMirror]:min-h-[calc(100vh-250px)] [&_.ProseMirror]:outline-none"
          />
        </div>
      </div>
      {activeDialog ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/25 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="post-editor-dialog-title"
        >
          <form
            onSubmit={handleDialogSubmit}
            className="w-full max-w-xl overflow-hidden rounded-xl border border-[#e7eaf0] bg-white shadow-2xl"
          >
            <div className="flex h-14 items-center justify-between border-b border-[#e7eaf0] px-6">
              <h2 id="post-editor-dialog-title" className="font-medium">
                {dialogTitle}
              </h2>
              <button
                type="button"
                className="rounded-md p-1 text-[#8590a6] transition hover:bg-[#f2f4f8] hover:text-[#1f2329]"
                onClick={closeDialog}
                aria-label="关闭"
              >
                <X className="size-4" />
              </button>
            </div>
            <div className="space-y-5 p-6">
              {activeDialog === "link" ? (
                <div className="space-y-4">
                  <label className="block space-y-2 text-sm">
                    <span className="font-medium text-[#1f2329]">显示标题</span>
                    <input
                      value={dialogTitleValue}
                      onChange={(event) =>
                        setDialogTitleValue(event.target.value)
                      }
                      placeholder="链接在正文里显示的文字"
                      className="h-10 w-full rounded-lg border border-[#dfe3eb] px-3 outline-none focus:border-[#1772f6] focus:ring-2 focus:ring-[#1772f6]/15"
                      autoFocus
                    />
                  </label>
                  <label className="block space-y-2 text-sm">
                    <span className="font-medium text-[#1f2329]">链接地址</span>
                    <input
                      value={dialogValue}
                      onChange={(event) => setDialogValue(event.target.value)}
                      placeholder="https://example.com"
                      className="h-10 w-full rounded-lg border border-[#dfe3eb] px-3 outline-none focus:border-[#1772f6] focus:ring-2 focus:ring-[#1772f6]/15"
                    />
                  </label>
                </div>
              ) : null}

              {activeDialog === "video" ? (
                <div className="space-y-5">
                  <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-[#bfd3f4] bg-[#f8fbff] px-6 py-8 text-center transition hover:border-[#1772f6] hover:bg-[#f3f8ff]">
                    <UploadCloud className="mb-3 size-9 text-[#1772f6]" />
                    <span className="text-sm font-medium text-[#1f2329]">
                      点击选择视频文件
                    </span>
                    <span className="mt-1 text-xs text-[#8590a6]">
                      支持本地上传，也可以在下方填写视频链接
                    </span>
                    <input
                      type="file"
                      accept="video/*"
                      onChange={(event) =>
                        setDialogFile(event.target.files?.[0] ?? null)
                      }
                      className="sr-only"
                    />
                  </label>
                  {dialogFile ? (
                    <div className="rounded-lg border border-[#e7eaf0] bg-white px-4 py-3 text-sm">
                      <div className="font-medium text-[#1f2329]">
                        {dialogFile.name}
                      </div>
                      <div className="mt-1 text-xs text-[#8590a6]">
                        {(dialogFile.size / 1024 / 1024).toFixed(2)} MB
                      </div>
                    </div>
                  ) : null}
                  <label className="block space-y-2 text-sm">
                    <span className="font-medium text-[#1f2329]">
                      视频链接
                    </span>
                    <input
                      value={dialogValue}
                      onChange={(event) => setDialogValue(event.target.value)}
                      placeholder="https://..."
                      className="h-10 w-full rounded-lg border border-[#dfe3eb] px-3 outline-none focus:border-[#1772f6] focus:ring-2 focus:ring-[#1772f6]/15"
                    />
                  </label>
                </div>
              ) : null}

              {activeDialog === "attachment" ? (
                <div className="space-y-5">
                  <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-[#bfd3f4] bg-[#f8fbff] px-6 py-8 text-center transition hover:border-[#1772f6] hover:bg-[#f3f8ff]">
                    <UploadCloud className="mb-3 size-9 text-[#1772f6]" />
                    <span className="text-sm font-medium text-[#1f2329]">
                      点击选择附件文件
                    </span>
                    <span className="mt-1 text-xs text-[#8590a6]">
                      支持文档、压缩包、数据文件等素材
                    </span>
                    <input
                      type="file"
                      onChange={(event) =>
                        setDialogFile(event.target.files?.[0] ?? null)
                      }
                      className="sr-only"
                    />
                  </label>
                  {dialogFile ? (
                    <div className="rounded-lg border border-[#e7eaf0] bg-white px-4 py-3 text-sm">
                      <div className="font-medium text-[#1f2329]">
                        {dialogFile.name}
                      </div>
                      <div className="mt-1 text-xs text-[#8590a6]">
                        {(dialogFile.size / 1024 / 1024).toFixed(2)} MB
                      </div>
                    </div>
                  ) : null}
                  <label className="block space-y-2 text-sm">
                    <span className="font-medium text-[#1f2329]">
                      附件链接
                    </span>
                    <input
                      value={dialogValue}
                      onChange={(event) => setDialogValue(event.target.value)}
                      placeholder="https://..."
                      className="h-10 w-full rounded-lg border border-[#dfe3eb] px-3 outline-none focus:border-[#1772f6] focus:ring-2 focus:ring-[#1772f6]/15"
                    />
                  </label>
                </div>
              ) : null}

              {activeDialog === "formula" ? (
                <label className="block space-y-2 text-sm">
                  <span className="font-medium text-[#1f2329]">公式内容</span>
                  <textarea
                    value={dialogValue}
                    onChange={(event) => setDialogValue(event.target.value)}
                    placeholder="E = mc^2"
                    className="min-h-24 w-full resize-none rounded-md border border-[#dfe3eb] px-3 py-2 font-mono outline-none focus:border-[#1772f6] focus:ring-2 focus:ring-[#1772f6]/15"
                    autoFocus
                  />
                </label>
              ) : null}

              {activeDialog === "table" ? (
                <div className="grid grid-cols-2 gap-4">
                  <label className="block space-y-2 text-sm">
                    <span className="font-medium text-[#1f2329]">行数</span>
                    <input
                      type="number"
                      min={1}
                      max={20}
                      value={tableRows}
                      onChange={(event) => setTableRows(Number(event.target.value))}
                      className="h-9 w-full rounded-md border border-[#dfe3eb] px-3 outline-none focus:border-[#1772f6] focus:ring-2 focus:ring-[#1772f6]/15"
                    />
                  </label>
                  <label className="block space-y-2 text-sm">
                    <span className="font-medium text-[#1f2329]">列数</span>
                    <input
                      type="number"
                      min={1}
                      max={10}
                      value={tableCols}
                      onChange={(event) => setTableCols(Number(event.target.value))}
                      className="h-9 w-full rounded-md border border-[#dfe3eb] px-3 outline-none focus:border-[#1772f6] focus:ring-2 focus:ring-[#1772f6]/15"
                    />
                  </label>
                </div>
              ) : null}
            </div>
            <div className="flex justify-end gap-3 border-t border-[#e7eaf0] bg-[#fbfcfe] px-6 py-4">
              <button
                type="button"
                className="h-9 rounded-lg px-4 text-sm text-[#596172] transition hover:bg-[#f2f4f8]"
                onClick={closeDialog}
                disabled={dialogLoading}
              >
                取消
              </button>
              <button
                type="submit"
                className="h-9 rounded-lg bg-[#1772f6] px-5 text-sm font-medium text-white transition hover:bg-[#0f63d9] disabled:cursor-not-allowed disabled:opacity-50"
                disabled={dialogLoading}
              >
                {dialogLoading ? "处理中..." : "确认"}
              </button>
            </div>
          </form>
        </div>
      ) : null}
      {showStatusBar ? (
        <div className="flex items-center justify-end gap-3 border-t border-[#e7eaf0] bg-white px-5 py-2 text-xs text-[#8590a6]">
          <span>词数：{wordCount}</span>
          <span className={isOver ? "font-medium text-red-500" : undefined}>
            字数：{charCount}/{MAX_CHARS}
          </span>
        </div>
      ) : null}
    </div>
  );
}
