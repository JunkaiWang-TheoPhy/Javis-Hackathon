import { strict as assert } from "node:assert";
import test from "node:test";

import {
  MIRA_FIRST_TURN_OPENINGS,
  resolveFirstTurnBufferedContent,
  selectFirstTurnOpening,
  stripRedundantFirstTurnIntro,
  trimLeadingPunctuationAndWhitespace,
} from "../src/first-turn-opening.ts";

test("strips a duplicated branded opening with greeting", () => {
  const input = "你好！我是Mira，温暖陪伴着你。\n\n现在是北京时间上午9点。";
  assert.equal(stripRedundantFirstTurnIntro(input), "现在是北京时间上午9点。");
});

test("strips an alternative duplicated branded opening without greeting", () => {
  const input = "我是米拉，与你一起进化。现在是北京时间上午9点。";
  assert.equal(stripRedundantFirstTurnIntro(input), "现在是北京时间上午9点。");
});

test("drops leftover leading punctuation after stripping the duplicated opening", () => {
  const input = "我是Mira，永远在你身后。。\n\n现在是北京时间上午9点。";
  assert.equal(stripRedundantFirstTurnIntro(input), "现在是北京时间上午9点。");
});

test("trimLeadingPunctuationAndWhitespace removes punctuation-only prefix chunks", () => {
  assert.equal(trimLeadingPunctuationAndWhitespace("。\n\n现"), "现");
});

test("resolveFirstTurnBufferedContent keeps buffering when only the duplicated intro has arrived", () => {
  const result = resolveFirstTurnBufferedContent("你好！我是Mira，永远在你身后\n\n");
  assert.equal(result.shouldResolve, false);
  assert.equal(result.contentToSend, "");
});

test("resolveFirstTurnBufferedContent releases once substantive content follows the duplicated intro", () => {
  const result = resolveFirstTurnBufferedContent("你好！我是Mira，永远在你身后。\n\n现");
  assert.equal(result.shouldResolve, true);
  assert.equal(result.contentToSend, "现");
});

test("keeps a partial prefix untouched until the duplicated opening is complete", () => {
  const input = "你好！我是Mira，温暖";
  assert.equal(stripRedundantFirstTurnIntro(input), input);
});

test("selectFirstTurnOpening is deterministic per session and stays within the approved set", () => {
  const sessionKey = "agent:main:lingzhu_demo-user";
  const opening = selectFirstTurnOpening(sessionKey);
  assert.equal(selectFirstTurnOpening(sessionKey), opening);
  assert.ok(MIRA_FIRST_TURN_OPENINGS.includes(opening));
});
