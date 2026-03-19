import { strict as assert } from "node:assert";
import test from "node:test";

import {
  MIRA_FIRST_TURN_OPENINGS,
  getReplayFirstTurnOpening,
  isReplayFirstTurnOpeningRequest,
  resolveFirstTurnBufferedContent,
  selectFirstTurnOpening,
  stripRedundantFirstTurnIntro,
  trimLeadingPunctuationAndWhitespace,
} from "../src/first-turn-opening.ts";

test("strips a duplicated branded opening with greeting", () => {
  const input = "你好！放轻松，你肯定可以做到的。深呼一口气吧。过去的二十四小时你做了很多的准备，去拿下这个舞台。\n\n现在是北京时间上午9点。";
  assert.equal(stripRedundantFirstTurnIntro(input), "现在是北京时间上午9点。");
});

test("strips an alternative duplicated branded opening without greeting", () => {
  const input = "放轻松，你肯定可以做到的。深呼一口气吧。过去的二十四小时你做了很多的准备，去拿下这个舞台。现在是北京时间上午9点。";
  assert.equal(stripRedundantFirstTurnIntro(input), "现在是北京时间上午9点。");
});

test("drops leftover leading punctuation after stripping the duplicated opening", () => {
  const input = "放轻松，你肯定可以做到的。深呼一口气吧。过去的二十四小时你做了很多的准备，去拿下这个舞台。。\n\n现在是北京时间上午9点。";
  assert.equal(stripRedundantFirstTurnIntro(input), "现在是北京时间上午9点。");
});

test("trimLeadingPunctuationAndWhitespace removes punctuation-only prefix chunks", () => {
  assert.equal(trimLeadingPunctuationAndWhitespace("。\n\n现"), "现");
});

test("resolveFirstTurnBufferedContent keeps buffering when only the duplicated intro has arrived", () => {
  const result = resolveFirstTurnBufferedContent("放轻松，你肯定可以做到的。深呼一口气吧。过去的二十四小时你做了很多的准备，去拿下这个舞台。\n\n");
  assert.equal(result.shouldResolve, false);
  assert.equal(result.contentToSend, "");
});

test("resolveFirstTurnBufferedContent releases once substantive content follows the duplicated intro", () => {
  const result = resolveFirstTurnBufferedContent("放轻松，你肯定可以做到的。深呼一口气吧。过去的二十四小时你做了很多的准备，去拿下这个舞台。\n\n现");
  assert.equal(result.shouldResolve, true);
  assert.equal(result.contentToSend, "现");
});

test("keeps a partial prefix untouched until the duplicated opening is complete", () => {
  const input = "放轻松，你肯定可以做到的。深呼";
  assert.equal(stripRedundantFirstTurnIntro(input), input);
});

test("selectFirstTurnOpening is deterministic per session and stays within the approved set", () => {
  const sessionKey = "agent:main:lingzhu_demo-user";
  const opening = selectFirstTurnOpening(sessionKey);
  assert.equal(selectFirstTurnOpening(sessionKey), opening);
  assert.ok(MIRA_FIRST_TURN_OPENINGS.includes(opening));
});

test("detects an explicit replay request for the branded opening", () => {
  assert.equal(isReplayFirstTurnOpeningRequest("你能向我播放刚才的话吗"), true);
  assert.equal(isReplayFirstTurnOpeningRequest("你能向我播放刚才的话吗？我没听清"), true);
  assert.equal(isReplayFirstTurnOpeningRequest("把刚才的话再复述一遍"), true);
  assert.equal(isReplayFirstTurnOpeningRequest("今天天气怎么样"), false);
});

test("returns the exact branded opening for replay requests", () => {
  assert.equal(
    getReplayFirstTurnOpening("你能向我播放刚才的话吗"),
    "放轻松，你肯定可以做到的。深呼一口气吧。过去的二十四小时你做了很多的准备，去拿下这个舞台。"
  );
  assert.equal(
    getReplayFirstTurnOpening("今天天气怎么样"),
    "放轻松，你肯定可以做到的。深呼一口气吧。过去的二十四小时你做了很多的准备，去拿下这个舞台。"
  );
});

test("returns the exact branded opening for arbitrary requests", () => {
  assert.equal(
    getReplayFirstTurnOpening("帮我看一下今天的日程"),
    "放轻松，你肯定可以做到的。深呼一口气吧。过去的二十四小时你做了很多的准备，去拿下这个舞台。"
  );
  assert.equal(
    getReplayFirstTurnOpening("退出智能体"),
    "放轻松，你肯定可以做到的。深呼一口气吧。过去的二十四小时你做了很多的准备，去拿下这个舞台。"
  );
});
