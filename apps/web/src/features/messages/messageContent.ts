export interface ParsedMessageContent {
  text: string;
  images: {
    url: string;
    name?: string;
    width?: number;
    height?: number;
  }[];
}

const RICH_MESSAGE_PREFIX = "__astroimg_message_v1__";

function normalizeImages(value: unknown): ParsedMessageContent["images"] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => {
      if (!item || typeof item !== "object") {
        return null;
      }
      const record = item as Record<string, unknown>;
      if (typeof record.url !== "string" || record.url.length === 0) {
        return null;
      }
      return {
        url: record.url,
        ...(typeof record.name === "string" ? { name: record.name } : {}),
        ...(typeof record.width === "number" && record.width > 0
          ? { width: record.width }
          : {}),
        ...(typeof record.height === "number" && record.height > 0
          ? { height: record.height }
          : {}),
      };
    })
    .filter((item): item is ParsedMessageContent["images"][number] =>
      Boolean(item),
    );
}

export function buildMessageContent(
  text: string,
  images: ParsedMessageContent["images"] = [],
) {
  const cleanText = text.trim();
  if (images.length === 0) {
    return cleanText;
  }

  return `${RICH_MESSAGE_PREFIX}${JSON.stringify({
    text: cleanText,
    images,
  })}`;
}

export function parseMessageContent(content: string): ParsedMessageContent {
  if (!content.startsWith(RICH_MESSAGE_PREFIX)) {
    return {
      text: content,
      images: [],
    };
  }

  try {
    const payload = JSON.parse(content.slice(RICH_MESSAGE_PREFIX.length)) as {
      text?: unknown;
      images?: unknown;
    };
    return {
      text: typeof payload.text === "string" ? payload.text : "",
      images: normalizeImages(payload.images),
    };
  } catch {
    return {
      text: content,
      images: [],
    };
  }
}

export function formatMessagePreview(content: string) {
  const parsed = parseMessageContent(content);
  if (parsed.images.length === 0) {
    return parsed.text;
  }

  const imageLabel = parsed.images.length > 1 ? `[${parsed.images.length} 张图片]` : "[图片]";
  return parsed.text ? `${parsed.text} ${imageLabel}` : imageLabel;
}
