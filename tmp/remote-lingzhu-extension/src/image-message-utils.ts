import path from "node:path";

export const IMAGE_ONLY_FALLBACK_TEXT = "请查看这张图片，并结合当前对话上下文回答。";

const MIME_EXTENSION_MAP = new Map<string, string>([
  ["image/png", ".png"],
  ["image/jpeg", ".jpg"],
  ["image/jpg", ".jpg"],
  ["image/gif", ".gif"],
  ["image/webp", ".webp"],
  ["image/avif", ".avif"],
  ["image/bmp", ".bmp"],
  ["image/tiff", ".tiff"],
  ["image/svg+xml", ".svg"],
  ["image/heic", ".heic"],
  ["image/heif", ".heif"],
  ["image/x-icon", ".ico"],
  ["image/vnd.microsoft.icon", ".ico"],
]);

const EXTENSION_MIME_MAP = new Map<string, string>([
  [".png", "image/png"],
  [".jpg", "image/jpeg"],
  [".jpeg", "image/jpeg"],
  [".gif", "image/gif"],
  [".webp", "image/webp"],
  [".avif", "image/avif"],
  [".bmp", "image/bmp"],
  [".tif", "image/tiff"],
  [".tiff", "image/tiff"],
  [".svg", "image/svg+xml"],
  [".heic", "image/heic"],
  [".heif", "image/heif"],
  [".ico", "image/x-icon"],
]);

type FallbackExtraction = {
  hasImage: boolean;
  texts: string[];
};

function normalizeWhitespace(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

function normalizeMimeType(mimeType: string): string {
  return mimeType.split(";")[0]?.trim().toLowerCase() ?? "";
}

function encodeMimeTypeForFileName(mimeType: string): string {
  return Buffer.from(mimeType, "utf8").toString("base64url");
}

function decodeMimeTypeFromFileName(baseName: string): string | null {
  const match = baseName.match(/__mime_([A-Za-z0-9_-]+)/);
  if (!match?.[1]) {
    return null;
  }

  try {
    const decoded = Buffer.from(match[1], "base64url").toString("utf8").trim().toLowerCase();
    return decoded.startsWith("image/") ? decoded : null;
  } catch {
    return null;
  }
}

function looksLikeImageReference(value: unknown): boolean {
  if (typeof value !== "string") {
    return false;
  }

  const normalized = value.trim().toLowerCase();
  return normalized.startsWith("data:image/")
    || normalized.startsWith("file://")
    || /^https?:\/\/.+\.(?:png|jpe?g|gif|webp|avif|bmp|svg|tiff?|heic|heif|ico)(?:[?#].*)?$/u.test(normalized);
}

function mergeFallbackExtraction(target: FallbackExtraction, next: FallbackExtraction): FallbackExtraction {
  target.hasImage = target.hasImage || next.hasImage;
  target.texts.push(...next.texts);
  return target;
}

function collectFallbackDetails(value: unknown, visited = new Set<object>()): FallbackExtraction {
  if (typeof value === "string") {
    const normalized = normalizeWhitespace(value);
    return {
      hasImage: false,
      texts: normalized ? [normalized] : [],
    };
  }

  if (Array.isArray(value)) {
    return value.reduce<FallbackExtraction>(
      (result, item) => mergeFallbackExtraction(result, collectFallbackDetails(item, visited)),
      { hasImage: false, texts: [] }
    );
  }

  if (!value || typeof value !== "object") {
    return { hasImage: false, texts: [] };
  }

  if (visited.has(value)) {
    return { hasImage: false, texts: [] };
  }
  visited.add(value);

  const record = value as Record<string, unknown>;
  const result: FallbackExtraction = { hasImage: false, texts: [] };

  if (typeof record.text === "string") {
    const normalized = normalizeWhitespace(record.text);
    if (normalized) {
      result.texts.push(normalized);
    }
  }

  const type = typeof record.type === "string" ? record.type.toLowerCase() : "";
  if (type === "image" || type === "image_url") {
    result.hasImage = true;
  }

  if (record.image_url || record.imageUrl || looksLikeImageReference(record.url) || looksLikeImageReference(record.uri)) {
    result.hasImage = true;
  }

  for (const key of ["content", "parts", "items"]) {
    if (!(key in record)) {
      continue;
    }
    mergeFallbackExtraction(result, collectFallbackDetails(record[key], visited));
  }

  return result;
}

export function extractFallbackUserText(
  messages: Array<{ text?: unknown; content?: unknown }>
): string {
  const extracted = messages.reduce<FallbackExtraction>((result, message) => {
    if (typeof message?.text === "string") {
      mergeFallbackExtraction(result, collectFallbackDetails(message.text));
    }

    if ("content" in message) {
      mergeFallbackExtraction(result, collectFallbackDetails(message.content));
    }

    return result;
  }, { hasImage: false, texts: [] });

  const joinedText = normalizeWhitespace(extracted.texts.join(" "));
  return joinedText || (extracted.hasImage ? IMAGE_ONLY_FALLBACK_TEXT : "");
}

export function fileExtensionForMimeType(mimeType: string | null | undefined): string {
  if (!mimeType) {
    return ".img";
  }

  const normalizedMimeType = normalizeMimeType(mimeType);
  return MIME_EXTENSION_MAP.get(normalizedMimeType) ?? ".img";
}

export function buildCachedImageFileName(options: {
  hash: string;
  mimeType?: string | null;
  now?: number;
}): string {
  const normalizedMimeType = options.mimeType ? normalizeMimeType(options.mimeType) : "";
  const mimeSuffix = normalizedMimeType.startsWith("image/")
    ? `__mime_${encodeMimeTypeForFileName(normalizedMimeType)}`
    : "";

  return `img_${options.now ?? Date.now()}_${options.hash}${mimeSuffix}${fileExtensionForMimeType(normalizedMimeType)}`;
}

export function inferMimeTypeFromPath(filePath: string): string {
  const baseName = path.basename(filePath);
  const embeddedMimeType = decodeMimeTypeFromFileName(baseName);
  if (embeddedMimeType) {
    return embeddedMimeType;
  }

  const ext = path.extname(baseName).toLowerCase();
  return EXTENSION_MIME_MAP.get(ext) ?? "application/octet-stream";
}
