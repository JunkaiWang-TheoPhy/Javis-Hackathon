import { strict as assert } from "node:assert";
import test from "node:test";

import {
  IMAGE_ONLY_FALLBACK_TEXT,
  buildCachedImageFileName,
  extractFallbackUserText,
  inferMimeTypeFromPath,
} from "../src/image-message-utils.ts";

test("extractFallbackUserText returns a readable image placeholder for image-only multimodal content", () => {
  const messages = [
    {
      content: [
        {
          type: "image_url",
          image_url: {
            url: "data:image/png;base64,AAAA",
          },
        },
      ],
    },
  ];

  assert.equal(extractFallbackUserText(messages), IMAGE_ONLY_FALLBACK_TEXT);
});

test("extractFallbackUserText preserves plain text without object stringification", () => {
  const messages = [
    {
      text: "帮我看看这张图",
    },
    {
      content: [
        {
          type: "text",
          text: "图里有什么？",
        },
      ],
    },
  ];

  assert.equal(extractFallbackUserText(messages), "帮我看看这张图 图里有什么？");
});

test("buildCachedImageFileName and inferMimeTypeFromPath preserve avif mime metadata", () => {
  const fileName = buildCachedImageFileName({
    hash: "1234567890ab",
    mimeType: "image/avif",
    now: 1710000000000,
  });

  assert.equal(inferMimeTypeFromPath(fileName), "image/avif");
});

test("inferMimeTypeFromPath keeps svg mime metadata from cached filenames", () => {
  const fileName = buildCachedImageFileName({
    hash: "abcdef123456",
    mimeType: "image/svg+xml",
    now: 1710000000001,
  });

  assert.equal(inferMimeTypeFromPath(fileName), "image/svg+xml");
});
