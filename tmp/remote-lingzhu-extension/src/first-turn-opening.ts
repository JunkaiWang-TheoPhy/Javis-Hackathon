import crypto from "node:crypto";

export const MIRA_FIRST_TURN_OPENINGS = [
  "我是Mira，温暖陪伴着你",
  "我是Mira，永远在你身后",
  "我是Mira，和你迈向人机共生的未来",
  "我是Mira，与你一起进化",
] as const;

const BRANDED_OPENING_PATTERNS = [
  /^你好[！!，,\s。]*我是(?:Mira|米拉)[，,、\s]*温暖陪伴着你[。！!\s]*/u,
  /^你好[！!，,\s。]*我是(?:Mira|米拉)[，,、\s]*永远在你身后[。！!\s]*/u,
  /^你好[！!，,\s。]*我是(?:Mira|米拉)[，,、\s]*和你迈向人机共生的未来[。！!\s]*/u,
  /^你好[！!，,\s。]*我是(?:Mira|米拉)[，,、\s]*与你一起进化[。！!\s]*/u,
  /^我是(?:Mira|米拉)[，,、\s]*温暖陪伴着你[。！!\s]*/u,
  /^我是(?:Mira|米拉)[，,、\s]*永远在你身后[。！!\s]*/u,
  /^我是(?:Mira|米拉)[，,、\s]*和你迈向人机共生的未来[。！!\s]*/u,
  /^我是(?:Mira|米拉)[，,、\s]*与你一起进化[。！!\s]*/u,
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
  return SELF_INTRO_PREFIX_FRAGMENT.test(text.trimStart());
}
