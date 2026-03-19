import assert from "node:assert/strict";
import test from "node:test";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { exportReleaseRepo } from "../export-release-repo.mjs";

test("exportReleaseRepo copies a release tree and excludes local-only artifacts", () => {
  const sourceDir = mkdtempSync(join(tmpdir(), "mira-release-src-"));
  const outputDir = mkdtempSync(join(tmpdir(), "mira-release-out-"));

  mkdirSync(join(sourceDir, "docs", "migration"), { recursive: true });
  mkdirSync(join(sourceDir, "deploy"), { recursive: true });
  mkdirSync(join(sourceDir, "core", "openclaw-config"), { recursive: true });
  mkdirSync(join(sourceDir, "modules", "home-assistant", "config"), { recursive: true });
  mkdirSync(join(sourceDir, "modules", "home-assistant", "docs"), { recursive: true });
  mkdirSync(join(sourceDir, "core", "plugins", "lingzhu-bridge"), { recursive: true });
  mkdirSync(join(sourceDir, "modules", "home-assistant", "plugin"), { recursive: true });
  mkdirSync(join(sourceDir, "services", "notification-router"), { recursive: true });
  mkdirSync(join(sourceDir, "services", "notification-router", "docs"), { recursive: true });
  mkdirSync(join(sourceDir, "services", "notification-router", "node_modules", "yaml"), {
    recursive: true
  });

  writeFileSync(join(sourceDir, "README.md"), "# root\n");
  writeFileSync(join(sourceDir, "CONTRIBUTING.md"), "# contributing\n");
  writeFileSync(join(sourceDir, "CHANGELOG.md"), "# changelog\n");
  writeFileSync(join(sourceDir, ".gitignore"), "node_modules/\n");
  writeFileSync(join(sourceDir, "LICENSE.placeholder.md"), "# placeholder\n");
  writeFileSync(join(sourceDir, "package.json"), "{\"name\":\"mira-released-version\"}\n");
  writeFileSync(join(sourceDir, "deploy", "deploy-paths-overview.md"), "# deploy\n");
  writeFileSync(join(sourceDir, "docs", "migration", "source-to-release-mapping.md"), "# map\n");
  writeFileSync(join(sourceDir, "docs", "migration", "release-baseline.md"), "# baseline\n");
  writeFileSync(join(sourceDir, "docs", "migration", "open-source-readiness-checklist.md"), "# open\n");
  writeFileSync(join(sourceDir, "docs", "migration", "repository-split-readiness.md"), "# split\n");
  writeFileSync(join(sourceDir, "docs", "migration", "package-and-license-decisions.md"), "# package\n");
  writeFileSync(join(sourceDir, "core", "openclaw-config", "openclaw.example.json"), "{}\n");
  writeFileSync(join(sourceDir, "core", "openclaw-config", "minimal-runtime-contract.md"), "# contract\n");
  writeFileSync(join(sourceDir, "modules", "home-assistant", "config", "home-assistant-module.example.json"), "{}\n");
  writeFileSync(join(sourceDir, "modules", "home-assistant", "docs", "module-runtime-contract.md"), "# module\n");
  writeFileSync(join(sourceDir, "core", "plugins", "lingzhu-bridge", "package.json"), "{\"name\":\"@mira-release/lingzhu-bridge-core\"}\n");
  writeFileSync(join(sourceDir, "modules", "home-assistant", "plugin", "package.json"), "{\"name\":\"@mira-release/home-assistant-module-plugin\"}\n");
  writeFileSync(join(sourceDir, "modules", "home-assistant", "plugin", "tsconfig.json"), "{}\n");
  writeFileSync(join(sourceDir, "services", "notification-router", "package.json"), "{\"name\":\"@mira-release/notification-router\"}\n");
  writeFileSync(join(sourceDir, "services", "notification-router", "package-lock.json"), "{\"name\":\"@mira-release/notification-router\",\"packages\":{\"\":{\"name\":\"@mira-release/notification-router\"}}}\n");
  writeFileSync(join(sourceDir, "services", "notification-router", "tsconfig.json"), "{}\n");
  writeFileSync(join(sourceDir, "services", "notification-router", "docs", "runtime-contract.md"), "# runtime\n", { flag: "w" });
  writeFileSync(join(sourceDir, "services", "notification-router", ".env"), "SECRET=x\n");

  const result = exportReleaseRepo({ sourceDir, outputDir });

  assert.equal(result.sourceDir, sourceDir);
  assert.equal(result.outputDir, outputDir);
  assert.equal(existsSync(join(outputDir, "README.md")), true);
  assert.equal(existsSync(join(outputDir, "services", "notification-router", "package.json")), true);
  assert.equal(existsSync(join(outputDir, "services", "notification-router", "node_modules")), false);
  assert.equal(existsSync(join(outputDir, "services", "notification-router", ".env")), false);
  assert.match(readFileSync(join(outputDir, "LICENSE.placeholder.md"), "utf8"), /placeholder/i);
});
