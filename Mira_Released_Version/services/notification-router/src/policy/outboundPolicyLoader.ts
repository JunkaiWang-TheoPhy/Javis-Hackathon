import { readFile } from "node:fs/promises";

import { DEFAULT_OUTBOUND_POLICY } from "./defaultOutboundPolicy.ts";
import type { LoadedOutboundPolicy } from "./outboundPolicyTypes.ts";

export type OutboundPolicyInput = LoadedOutboundPolicy | string | URL;

async function parseYaml(raw: string): Promise<unknown> {
  try {
    const yamlModule = await import("yaml");
    return yamlModule.parse(raw);
  } catch (error) {
    throw new Error(
      "YAML policy loading requires the optional 'yaml' package in the release-side notification-router package.",
      { cause: error },
    );
  }
}

function isLoadedOutboundPolicy(input: unknown): input is LoadedOutboundPolicy {
  if (!input || typeof input !== "object") {
    return false;
  }

  const candidate = input as Record<string, unknown>;
  return (
    typeof candidate.version === "number" &&
    !!candidate.defaults &&
    Array.isArray(candidate.rules)
  );
}

export async function loadOutboundPolicy(
  input?: OutboundPolicyInput,
): Promise<LoadedOutboundPolicy> {
  if (!input) {
    return DEFAULT_OUTBOUND_POLICY;
  }

  if (isLoadedOutboundPolicy(input)) {
    return input;
  }

  const raw = await readFile(input, "utf8");
  const parsed = await parseYaml(raw);
  if (!isLoadedOutboundPolicy(parsed)) {
    throw new Error("Outbound policy file did not parse into a valid policy shape.");
  }

  return parsed;
}
