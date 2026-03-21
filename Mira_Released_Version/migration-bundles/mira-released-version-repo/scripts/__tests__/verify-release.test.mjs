import assert from "node:assert/strict";
import test from "node:test";
import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import {
  collectReleaseVerification,
  formatReleaseVerification
} from "../verify-release.mjs";

test("collectReleaseVerification passes against the current release tree", () => {
  const result = collectReleaseVerification();
  assert.equal(result.ok, true);
  assert.deepEqual(result.missingFiles, []);
  assert.deepEqual(result.invalidJson, []);
  assert.deepEqual(result.badPackageNames, []);
  assert.deepEqual(result.forbiddenArtifacts, []);
});

test("collectReleaseVerification fails when a release package name is outside the mira-release namespace", () => {
  const root = mkdtempSync(join(tmpdir(), "mira-release-verify-"));

  const files = {
    "README.md": "# x\n",
    "CONTRIBUTING.md": "# x\n",
    "CHANGELOG.md": "# x\n",
    "LICENSE.placeholder.md": "# x\n",
    ".gitignore": "node_modules/\n",
    "docs/migration/source-to-release-mapping.md": "# x\n",
    "docs/migration/release-baseline.md": "# x\n",
    "docs/migration/open-source-readiness-checklist.md": "# x\n",
    "docs/migration/repository-split-readiness.md": "# x\n",
    "docs/migration/package-and-license-decisions.md": "# x\n",
    "deploy/deploy-paths-overview.md": "# x\n",
    "core/openclaw-config/openclaw.example.json": "{}\n",
    "core/openclaw-config/minimal-runtime-contract.md": "# x\n",
    "modules/home-assistant/config/home-assistant-module.example.json": "{}\n",
    "modules/home-assistant/docs/module-runtime-contract.md": "# x\n",
    "services/notification-router/docs/runtime-contract.md": "# x\n",
    "package.json": "{\"name\":\"mira-released-version\"}\n",
    "modules/home-assistant/registry/devices.example.json": "{}\n",
    "core/plugins/lingzhu-bridge/package.json": "{\"name\":\"@mira-release/lingzhu-bridge-core\"}\n",
    "modules/home-assistant/plugin/package.json": "{\"name\":\"bad-package\"}\n",
    "modules/home-assistant/plugin/tsconfig.json": "{}\n",
    "services/notification-router/package.json": "{\"name\":\"@mira-release/notification-router\"}\n",
    "services/notification-router/package-lock.json": "{\"name\":\"@mira-release/notification-router\",\"packages\":{\"\":{\"name\":\"@mira-release/notification-router\"}}}\n",
    "services/notification-router/tsconfig.json": "{}\n"
  };

  for (const [relPath, contents] of Object.entries(files)) {
    const file = join(root, relPath);
    mkdirSync(join(file, ".."), { recursive: true });
    writeFileSync(file, contents);
  }

  const result = collectReleaseVerification(root);
  assert.equal(result.ok, false);
  assert.equal(result.badPackageNames.length, 1);
  assert.match(formatReleaseVerification(result), /bad-package-names/);
});
