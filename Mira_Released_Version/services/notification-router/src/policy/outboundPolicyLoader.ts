import { readFile } from "node:fs/promises";

import { parse } from "yaml";

import { DEFAULT_OUTBOUND_POLICY } from "./defaultOutboundPolicy.ts";
import type { LoadedOutboundPolicy } from "./outboundPolicyTypes.ts";

export type OutboundPolicyInput = LoadedOutboundPolicy | string | URL;

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
  const parsed = parse(raw) as unknown;
  if (!isLoadedOutboundPolicy(parsed)) {
    throw new Error("Outbound policy file did not parse into a valid policy shape.");
  }

  return parsed;
}
