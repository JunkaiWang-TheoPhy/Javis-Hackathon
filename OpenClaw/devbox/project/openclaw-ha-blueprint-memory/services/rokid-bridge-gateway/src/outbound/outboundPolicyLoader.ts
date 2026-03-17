import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

import YAML from "yaml";

import type { LoadedOutboundPolicy } from "./outboundPolicyTypes.ts";

const DEFAULT_POLICY_URL = new URL("../../config/outbound-policy.yaml", import.meta.url);

export function resolveOutboundPolicyPath(input?: string | URL) {
  if (!input) {
    return fileURLToPath(DEFAULT_POLICY_URL);
  }

  if (input instanceof URL) {
    return fileURLToPath(input);
  }

  return input;
}

export async function loadOutboundPolicy(input?: string | URL): Promise<LoadedOutboundPolicy> {
  const policyPath = resolveOutboundPolicyPath(input);
  const raw = await readFile(policyPath, "utf8");
  return YAML.parse(raw) as LoadedOutboundPolicy;
}
