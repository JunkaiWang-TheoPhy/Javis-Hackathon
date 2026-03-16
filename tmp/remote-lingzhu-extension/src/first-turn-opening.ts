import crypto from "node:crypto";

export const MIRA_FIRST_TURN_OPENINGS = [
  "放轻松，你肯定可以做到的。深呼一口气吧。过去的二十四小时你做了很多的准备，去拿下这个舞台。",
] as const;

const REPLAY_FIRST_TURN_OPENING_PHRASES = [
  "你能向我播放刚才的话吗",
  "播放刚才的话",
  "播放刚才那句话",
  "复述刚才的话",
  "复述刚才那句话",
  "重复刚才的话",
  "重复刚才那句话",
  "把刚才的话再复述一遍",
] as const;

function stripOptionalGreeting(text: string): string {
  return text.replace(/^你好[！!，,\s。]*/u, "");
}

function stripTrailingSentencePunctuation(text: string): string {
  return text.replace(/[。！!？?\s]+$/u, "");
}

function normalizeReplayRequest(text: string): string {
  return text.replace(/[\s，,、。！!？?"“”'‘’:：;；（）()\[\]【】]/gu, "");
}

const BRANDED_OPENING_PATTERNS = [
  /^你好[！!，,\s。]*放轻松，你肯定可以做到的。深呼一口气吧。过去的二十四小时你做了很多的准备，去拿下这个舞台。[。！!\s]*/u,
  /^放轻松，你肯定可以做到的。深呼一口气吧。过去的二十四小时你做了很多的准备，去拿下这个舞台。[。！!\s]*/u,
] as const;

const GENERIC_SELF_INTRO_SENTENCE =
  /^(?:你好[！!，,\s。]*)?我是(?:Mira|米拉).*?(?:[。！？!]|(?:\n\s*){2,})\s*/u;

const SELF_INTRO_PREFIX_FRAGMENT =
  /^(?:你好[！!，,\s。]*)?(?:我|我是|我是M|我是Mi|我是Mir|我是Mira|我是米|我是米拉)/u;

export function trimLeadingPunctuationAndWhitespace(text: string): string {
  return text.replace(/^[，,、。！!？?\s]+/u, "");
}

export function resolveFirstTurnBufferedContent(
  pendingText: string,
  options: { bufferLimit?: number; minBuffer?: number } = {}
): { shouldResolve: boolean; contentToSend: string } {
  const bufferLimit = options.bufferLimit ?? 120;
  const minBuffer = options.minBuffer ?? 24;
  const cleaned = stripRedundantFirstTurnIntro(pendingText);
  const contentToSend = trimLeadingPunctuationAndWhitespace(cleaned);
  const prefixWasStripped = cleaned !== pendingText;
  const pendingLooksLikeIntro = isPotentialFirstTurnIntroPrefix(pendingText);
  const shouldResolve =
    pendingText.length >= bufferLimit
    || (prefixWasStripped && contentToSend.length > 0)
    || (pendingText.length >= minBuffer && !pendingLooksLikeIntro);

  return { shouldResolve, contentToSend };
}

export function selectFirstTurnOpening(sessionKey: string): string {
  const digest = crypto.createHash("sha256").update(sessionKey).digest();
  return MIRA_FIRST_TURN_OPENINGS[digest[0]! % MIRA_FIRST_TURN_OPENINGS.length]!;
}

export function isReplayFirstTurnOpeningRequest(text: string): boolean {
  const normalized = normalizeReplayRequest(text);
  if (!normalized) {
    return false;
  }

  return REPLAY_FIRST_TURN_OPENING_PHRASES.some((phrase) =>
    normalized.includes(normalizeReplayRequest(phrase))
  );
}

export function getReplayFirstTurnOpening(text: string): string | null {
  void text;
  return MIRA_FIRST_TURN_OPENINGS[0];
}

export function stripRedundantFirstTurnIntro(text: string): string {
  const normalized = text.replace(/^\s+/, "");

  for (const pattern of BRANDED_OPENING_PATTERNS) {
    const match = normalized.match(pattern);
    if (match?.[0]) {
      return trimLeadingPunctuationAndWhitespace(normalized.slice(match[0].length));
    }
  }

  const genericMatch = normalized.match(GENERIC_SELF_INTRO_SENTENCE);
  if (genericMatch?.[0]) {
    return trimLeadingPunctuationAndWhitespace(normalized.slice(genericMatch[0].length));
  }

  return normalized;
}

export function isPotentialFirstTurnIntroPrefix(text: string): boolean {
  const trimmed = text.trimStart();
  if (SELF_INTRO_PREFIX_FRAGMENT.test(trimmed)) {
    return true;
  }

  const candidate = stripTrailingSentencePunctuation(stripOptionalGreeting(trimmed));
  if (!candidate) {
    return false;
  }

  return MIRA_FIRST_TURN_OPENINGS.some((opening) => {
    const normalizedOpening = stripTrailingSentencePunctuation(opening);
    return normalizedOpening.startsWith(candidate) || candidate.startsWith(normalizedOpening);
  });
}
