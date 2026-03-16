import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

test("bootstrap-openclaw-plugin installs the new brand plugins", async () => {
  const script = await readFile(
    new URL("../bootstrap-openclaw-plugin.sh", import.meta.url),
    "utf8",
  );

  assert.match(script, /openclaw-plugin-hue/);
  assert.match(script, /openclaw-plugin-google-home/);
  assert.match(script, /openclaw-plugin-lutron/);
  assert.match(script, /openclaw-plugin-smartthings/);
  assert.match(script, /openclaw-plugin-alexa/);
});
