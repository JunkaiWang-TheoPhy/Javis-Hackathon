import { strict as assert } from "node:assert";
import test from "node:test";

import { lingzhuToOpenAI } from "../src/transform.ts";

test("lingzhuToOpenAI keeps image attachments from text messages", () => {
  const openaiMessages = lingzhuToOpenAI([
    {
      role: "user",
      type: "text",
      text: "请帮我看这张图",
      attachments: [
        {
          type: "image",
          path: "/home/devbox/.openclaw/extensions/.cache/img/img_test.webp",
        },
      ],
    } as any,
  ]);

  const userMessage = openaiMessages.find((message) => message.role === "user");
  assert.ok(userMessage);
  assert.ok(Array.isArray(userMessage.content));
  assert.deepEqual(userMessage.content, [
    { type: "text", text: "请帮我看这张图" },
    {
      type: "image_url",
      image_url: { url: "file:///home/devbox/.openclaw/extensions/.cache/img/img_test.webp" },
    },
  ]);
});

test("lingzhuToOpenAI treats image message content paths as image inputs", () => {
  const openaiMessages = lingzhuToOpenAI([
    {
      role: "user",
      type: "image",
      content: "/home/devbox/.openclaw/extensions/.cache/img/img_test.webp",
    } as any,
  ]);

  const userMessage = openaiMessages.find((message) => message.role === "user");
  assert.ok(userMessage);
  assert.ok(Array.isArray(userMessage.content));
  assert.deepEqual(userMessage.content, [
    {
      type: "image_url",
      image_url: { url: "file:///home/devbox/.openclaw/extensions/.cache/img/img_test.webp" },
    },
  ]);
});
