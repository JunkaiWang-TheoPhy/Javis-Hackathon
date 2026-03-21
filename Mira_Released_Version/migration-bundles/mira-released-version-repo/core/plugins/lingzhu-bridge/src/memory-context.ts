import type { LingzhuConfig, LingzhuMessage } from "./types.js";

type MemoryAudience = "direct" | "shared";

type MemoryContextLogger = {
  info?: (message: string) => void;
  warn: (message: string) => void;
};

type FetchMemoryPromptOptions = {
  config: LingzhuConfig;
  sessionKey: string;
  messages: LingzhuMessage[];
  logger: MemoryContextLogger;
};

type InjectedMessage = {
  role: "system" | "user" | "assistant";
  content: unknown;
};

const DEFAULT_MEMORY_CONTEXT_URL = "http://127.0.0.1:3301/v1/memory/context";
const DEFAULT_MEMORY_CONTEXT_TIMEOUT_MS = 1500;
const DEFAULT_MEMORY_CONTEXT_WORKING_LIMIT = 4;
const DEFAULT_MEMORY_CONTEXT_FACT_LIMIT = 4;

function looksLikeImageReference(value: string) {
  return /^data:image\//iu.test(value)
    || /^https?:\/\//iu.test(value)
    || /^file:\/\//iu.test(value)
    || /\.(?:png|jpe?g|gif|webp|avif|bmp|svg|tiff?|heic|heif|ico)(?:[?#].*)?$/iu.test(value);
}

function extractMessageText(message: LingzhuMessage): string {
  if (typeof message.text === "string" && message.text.trim()) {
    return message.text.trim();
  }

  if (
    typeof message.content === "string"
    && message.content.trim()
    && !looksLikeImageReference(message.content.trim())
  ) {
    return message.content.trim();
  }

  return "";
}

export function extractMemoryQueryText(messages: LingzhuMessage[]): string {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const message = messages[index];
    if (message?.role !== "user") {
      continue;
    }

    const text = extractMessageText(message);
    if (text) {
      return text;
    }
  }

  return messages
    .filter((message) => message?.role === "user")
    .map((message) => extractMessageText(message))
    .filter(Boolean)
    .join(" ")
    .trim();
}

export function resolveMemoryAudience(config: LingzhuConfig): MemoryAudience {
  if (config.memoryContextAudience === "direct" || config.memoryContextAudience === "shared") {
    return config.memoryContextAudience;
  }

  return config.sessionMode === "shared_agent" ? "shared" : "direct";
}

function buildMemoryInstruction(prompt: string) {
  return [
    "[Mira memory context]",
    "Use this retrieved memory as supporting context. Prioritize the user's latest request, do not mention internal memory retrieval, and ignore stale memory that conflicts with the current instruction.",
    "",
    prompt.trim(),
  ].join("\n");
}

export function injectMemoryPrompt<T extends InjectedMessage>(messages: T[], prompt: string): T[] {
  const trimmedPrompt = prompt.trim();
  if (!trimmedPrompt) {
    return messages;
  }

  const memoryMessage = {
    role: "system",
    content: buildMemoryInstruction(trimmedPrompt),
  } as T;
  const firstNonSystemIndex = messages.findIndex((message) => message.role !== "system");

  if (firstNonSystemIndex === -1) {
    return [...messages, memoryMessage];
  }

  return [
    ...messages.slice(0, firstNonSystemIndex),
    memoryMessage,
    ...messages.slice(firstNonSystemIndex),
  ];
}

export async function maybeFetchMemoryPrompt(
  options: FetchMemoryPromptOptions,
): Promise<string | null> {
  if (options.config.memoryContextEnabled !== true) {
    return null;
  }

  const memoryContextUrl = options.config.memoryContextUrl?.trim() || DEFAULT_MEMORY_CONTEXT_URL;
  if (!memoryContextUrl) {
    return null;
  }

  const timeoutMs =
    typeof options.config.memoryContextTimeoutMs === "number" && Number.isFinite(options.config.memoryContextTimeoutMs)
      ? Math.max(500, Math.min(15000, Math.trunc(options.config.memoryContextTimeoutMs)))
      : DEFAULT_MEMORY_CONTEXT_TIMEOUT_MS;
  const workingLimit =
    typeof options.config.memoryContextWorkingLimit === "number" && Number.isFinite(options.config.memoryContextWorkingLimit)
      ? Math.max(1, Math.min(8, Math.trunc(options.config.memoryContextWorkingLimit)))
      : DEFAULT_MEMORY_CONTEXT_WORKING_LIMIT;
  const factLimit =
    typeof options.config.memoryContextFactLimit === "number" && Number.isFinite(options.config.memoryContextFactLimit)
      ? Math.max(1, Math.min(8, Math.trunc(options.config.memoryContextFactLimit)))
      : DEFAULT_MEMORY_CONTEXT_FACT_LIMIT;

  const queryText = extractMemoryQueryText(options.messages);
  const controller = new AbortController();
  const timeoutHandle = setTimeout(() => {
    controller.abort(new Error(`memory context timeout after ${timeoutMs}ms`));
  }, timeoutMs);

  try {
    const response = await fetch(memoryContextUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        audience: resolveMemoryAudience(options.config),
        sessionId: options.sessionKey,
        ...(queryText ? { queryText } : {}),
        workingLimit,
        factLimit,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      options.logger.warn(`[Lingzhu] Memory context request failed: ${response.status}`);
      return null;
    }

    const payload = await response.json() as {
      ok?: boolean;
      prompt?: unknown;
    };

    if (payload.ok !== true || typeof payload.prompt !== "string" || !payload.prompt.trim()) {
      return null;
    }

    options.logger.info?.("[Lingzhu] Memory context retrieved successfully");
    return payload.prompt.trim();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    options.logger.warn(`[Lingzhu] Memory context unavailable: ${message}`);
    return null;
  } finally {
    clearTimeout(timeoutHandle);
  }
}
