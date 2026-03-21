import { strict as assert } from "node:assert";
import test from "node:test";

import {
  extractMemoryQueryText,
  injectMemoryPrompt,
  resolveMemoryAudience,
} from "../src/memory-context.ts";

test("extractMemoryQueryText returns the latest user text message", () => {
  const queryText = extractMemoryQueryText([
    {
      role: "user",
      type: "text",
      text: "早上提醒我开会。",
    },
    {
      role: "agent",
      type: "text",
      text: "好。",
    },
    {
      role: "user",
      type: "text",
      text: "晚上尽量别突然提醒我。",
    },
  ]);

  assert.equal(queryText, "晚上尽量别突然提醒我。");
});

test("resolveMemoryAudience falls back to shared for shared-agent sessions", () => {
  assert.equal(
    resolveMemoryAudience({
      sessionMode: "shared_agent",
      memoryContextAudience: "auto",
    }),
    "shared",
  );
});

test("injectMemoryPrompt inserts memory after existing system messages", () => {
  const messages = injectMemoryPrompt(
    [
      { role: "system", content: "base prompt" },
      { role: "system", content: "device metadata" },
      { role: "user", content: "你好" },
    ],
    "## Long-Term Memory\n- 用户不喜欢晚上被突然提醒",
  );

  assert.equal(messages[2]?.role, "system");
  assert.match(String(messages[2]?.content ?? ""), /Long-Term Memory/);
  assert.equal(messages[3]?.role, "user");
});
