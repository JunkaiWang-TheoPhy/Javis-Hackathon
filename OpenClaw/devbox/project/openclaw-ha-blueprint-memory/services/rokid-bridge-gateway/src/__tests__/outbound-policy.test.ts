import assert from "node:assert/strict";
import test from "node:test";

import {
  evaluateOutboundIntent,
  loadOutboundPolicy,
  type OutboundIntent,
} from "../outbound/outboundPolicyEvaluator.ts";

const policyPath = new URL("../../config/outbound-policy.yaml", import.meta.url);

function buildIntent(overrides: Partial<OutboundIntent> = {}): OutboundIntent {
  return {
    messageKind: "reminder",
    recipientScope: "self",
    riskTier: "low",
    channel: "email",
    firstContact: false,
    contentTags: [],
    ...overrides,
  };
}

test("allows user_self_reminder for low-risk self reminders on private channels", async () => {
  const policy = await loadOutboundPolicy(policyPath);
  const decision = evaluateOutboundIntent(policy, buildIntent());

  assert.equal(decision.action, "allow");
  assert.equal(decision.matchedRule, "user_self_reminder");
});

test("allows user_self_checkin for low-risk self check-ins", async () => {
  const policy = await loadOutboundPolicy(policyPath);
  const decision = evaluateOutboundIntent(policy, buildIntent({
    messageKind: "checkin",
    channel: "direct_message",
  }));

  assert.equal(decision.action, "allow");
  assert.equal(decision.matchedRule, "user_self_checkin");
});

test("asks before caregiver escalation", async () => {
  const policy = await loadOutboundPolicy(policyPath);
  const decision = evaluateOutboundIntent(policy, buildIntent({
    messageKind: "escalation",
    recipientScope: "caregiver",
    riskTier: "medium",
    channel: "direct_message",
  }));

  assert.equal(decision.action, "ask");
  assert.equal(decision.matchedRule, "caregiver_escalation");
});

test("asks before first contact to a new non-self recipient", async () => {
  const policy = await loadOutboundPolicy(policyPath);
  const decision = evaluateOutboundIntent(policy, buildIntent({
    recipientScope: "known_contact",
    firstContact: true,
  }));

  assert.equal(decision.action, "ask");
  assert.equal(decision.matchedRule, "new_recipient_requires_confirmation");
});

test("blocks public posting", async () => {
  const policy = await loadOutboundPolicy(policyPath);
  const decision = evaluateOutboundIntent(policy, buildIntent({
    recipientScope: "public",
    channel: "public_post",
  }));

  assert.equal(decision.action, "block");
  assert.equal(decision.matchedRule, "block_public_posting");
});
