import { cpSync, existsSync, mkdirSync, rmSync } from "node:fs";
import { dirname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const DEFAULT_SOURCE = resolve(__dirname, "..");
const DEFAULT_OUTPUT = resolve(DEFAULT_SOURCE, "..", "exports", "mira-released-version-repo");

const EXCLUDED_SEGMENTS = new Set([
  "node_modules",
  ".git",
  ".DS_Store",
  ".env",
  ".env.local",
  "dist",
  "build"
]);

function shouldCopyPath(sourceDir, currentPath) {
  const rel = relative(sourceDir, currentPath);
  if (!rel || rel === "") {
    return true;
  }
  return rel.split(sep).every((segment) => !EXCLUDED_SEGMENTS.has(segment));
}

export function exportReleaseRepo({
  sourceDir = DEFAULT_SOURCE,
  outputDir = DEFAULT_OUTPUT
} = {}) {
  rmSync(outputDir, { recursive: true, force: true });
  mkdirSync(outputDir, { recursive: true });

  cpSync(sourceDir, outputDir, {
    recursive: true,
    filter: (src) => shouldCopyPath(sourceDir, src)
  });

  return {
    sourceDir,
    outputDir
  };
}

if (process.argv[1] && resolve(process.argv[1]) === __filename) {
  const result = exportReleaseRepo();
  const lines = [
    "# Mira Release Export",
    `source: ${result.sourceDir}`,
    `output: ${result.outputDir}`,
    "status: ok"
  ];
  console.log(lines.join("\n"));
}
