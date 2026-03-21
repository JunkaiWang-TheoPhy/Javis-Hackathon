# Scene Resolver And Policy Coordination Spec

## 1. Purpose

This document defines how the future `sceneResolver.ts` should work inside Mira's Home Assistant flagship module, and how it should coordinate with:

- the device registry
- risk policy
- confirmation policy
- outbound policy

The goal is to make scene orchestration:

- deterministic
- auditable
- safe
- compatible with the current `ecosystem.ts` runtime model

This spec is designed to pair with:

- `../registry/devices.example.json`

## 2. Target File Boundaries

The intended future file layout is:

```text
modules/home-assistant/
├─ plugin/
│  └─ src/
│     ├─ scenes/
│     │  ├─ sceneResolver.ts
│     │  ├─ sceneDefinitions.ts
│     │  └─ scenePlanExecutor.ts
│     ├─ policies/
│     │  ├─ riskPolicy.ts
│     │  ├─ confirmationPolicy.ts
│     │  └─ outboundPolicyAdapter.ts
│     └─ registry/
│        └─ loadDevicesRegistry.ts
├─ registry/
│  └─ devices.example.json
└─ docs/
   └─ scene-resolver-policy-coordination-spec.md
```

Responsibility split:

- `sceneResolver.ts`
  - resolve scenes into executable plans
- `scenePlanExecutor.ts`
  - execute an already approved plan
- `riskPolicy.ts`
  - determine intrinsic action risk
- `confirmationPolicy.ts`
  - determine whether execution requires user confirmation
- `outboundPolicyAdapter.ts`
  - evaluate outbound message steps against the machine-readable outbound policy

## 3. Core Principle

`sceneResolver.ts` must not directly execute side effects.

It should:

- read scene definitions
- read registry metadata
- inspect current context
- produce a resolved plan
- attach policy decisions to each step

It should not:

- directly call Home Assistant
- directly send messages
- directly mutate memory

That separation keeps planning and execution distinct.

## 4. Input Model

Recommended input type:

```ts
type SceneResolveInput = {
  sceneId: string;
  context: {
    atHome?: boolean;
    postWorkout?: boolean;
    heartRateBpm?: number;
    quietHours?: boolean;
    currentHour?: number;
    userPresentArea?: string;
    triggeredBy?: "manual" | "heartbeat" | "cron" | "event";
    sourceEventId?: string;
  };
  registry: DevicesRegistry;
  stateSnapshot: Record<string, unknown>;
  policyContext: {
    requiresHumanApprovalDefault: boolean;
    outboundPolicyPath?: string;
    confirmationMode?: "normal" | "strict";
  };
};
```

Meaning:

- `sceneId`
  - the high-level scene to resolve
- `context`
  - user and environment context
- `registry`
  - normalized devices registry
- `stateSnapshot`
  - current state truth from Home Assistant or related sources
- `policyContext`
  - runtime-level policy settings

## 5. Output Model

Recommended output type:

```ts
type ResolvedScenePlan = {
  sceneId: string;
  planStatus: "ready" | "needs_confirmation" | "partially_blocked" | "blocked";
  summary: string;
  reasons: string[];
  requiredConfirmations: string[];
  steps: ScenePlanStep[];
};

type ScenePlanStep = {
  stepId: string;
  kind: "device_intent" | "ha_service" | "direct_adapter" | "outbound_message" | "memory_note";
  targetId?: string;
  role?: string;
  status: "planned" | "needs_confirmation" | "blocked";
  actionRiskTier?: "inform" | "confirm" | "side_effect";
  outboundRiskTier?: "low" | "medium" | "high";
  confirmationDecision?: "auto" | "ask" | "double_confirm" | "block";
  outboundDecision?: "allow" | "ask" | "block";
  payload: Record<string, unknown>;
  reasons: string[];
};
```

Key point:

- device action risk and outbound message risk should stay separate
- do not collapse everything into one generic risk enum

## 6. Registry Consumption Rules

`sceneResolver.ts` should consume `devices.example.json` through three layers:

1. device identity
   - `id`
   - `area`
   - `entityId`
   - `aliases`
2. capability surface
   - `capabilities`
   - `capabilityProfiles`
3. scene routing hints
   - `sceneBindings`
   - `traits`
   - `stateHints`

Scene resolution should prefer role-based matching over raw entity IDs.

That means:

- choose devices by `sceneBindings.role`
- use `priority` to rank candidates
- only fall back to explicit IDs when the scene definition hard-requires it

## 7. Scene Definition Shape

The scene definition should be a separate static structure, for example:

```ts
type SceneDefinition = {
  id: string;
  description: string;
  preconditions: Array<Record<string, unknown>>;
  selectors: Array<{
    role: string;
    required?: boolean;
    maxCount?: number;
  }>;
  actionTemplates: Array<{
    role: string;
    intent?: string;
    fixedPayload?: Record<string, unknown>;
    valueFromContext?: string;
  }>;
  optionalNotifications?: Array<{
    message_kind: "reminder" | "checkin" | "summary" | "alert" | "escalation";
    recipient_scope: "self" | "known_contact" | "caregiver" | "group";
    contentTemplate: string;
  }>;
};
```

This keeps scenes declarative rather than hard-coding branch logic in the resolver.

## 8. Resolution Phases

Recommended execution phases inside `sceneResolver.ts`:

### Phase 1. Load Definition

- load the scene definition by `sceneId`
- fail early if it does not exist

### Phase 2. Normalize Context

- normalize booleans and numeric context
- compute helper flags such as:
  - `isHighHeartRate`
  - `isArrivalCoolingCandidate`
  - `isQuietHours`

### Phase 3. Check Preconditions

- evaluate whether the scene is currently applicable
- if a required precondition fails, return `blocked`

### Phase 4. Select Devices

- match required scene roles against `sceneBindings.role`
- rank by `priority`
- filter by area or traits when the scene definition requests it

### Phase 5. Expand Candidate Steps

- convert role + action template into concrete plan steps
- infer `ha_service` or `direct_adapter` path from device metadata

### Phase 6. Evaluate `riskPolicy`

- evaluate intrinsic risk for each step
- use:
  - capability `riskTier`
  - device traits
  - scene type
  - target kind

### Phase 7. Evaluate `confirmationPolicy`

- decide whether the user must confirm
- use:
  - `requiresConfirmation`
  - `riskTier`
  - trigger source
  - quiet hours
  - whether the scene was explicitly user-requested

### Phase 8. Evaluate `outboundPolicy`

- only run for steps of kind `outbound_message`
- evaluate against the machine-readable outbound policy
- attach `allow / ask / block`

### Phase 9. Finalize Plan Status

- if any required step is blocked, plan may be `partially_blocked` or `blocked`
- if any step needs confirmation, plan should be `needs_confirmation`
- otherwise the plan is `ready`

## 9. `riskPolicy` Responsibility

`riskPolicy` answers:

- how risky is this action by nature

Inputs:

- device kind
- capability metadata
- scene type
- target area

Outputs:

- `actionRiskTier`
- reason codes

Examples:

- `lock.unlock` -> `confirm`
- `fan.turn_on` -> `side_effect`
- `scene.activate` -> `side_effect`
- `memory_note` -> `inform`

`riskPolicy` should not decide whether the action runs now.

## 10. `confirmationPolicy` Responsibility

`confirmationPolicy` answers:

- given the current context, does this step require explicit approval

Inputs:

- action risk
- `requiresConfirmation`
- trigger source
- quiet hours
- whether the user explicitly initiated the scene

Outputs:

- `auto`
- `ask`
- `double_confirm`
- `block`

Examples:

- manual `arrival_cooling` request from the user
  - fan + AC can be `auto`
- background `unlock` request
  - should remain `ask` or `double_confirm`

`confirmationPolicy` should not directly inspect vendor APIs or message adapters.

## 11. `outboundPolicy` Responsibility

`outboundPolicy` only applies to outbound message steps.

It answers:

- may this message leave the machine

Inputs:

- `message_kind`
- `recipient_scope`
- outbound risk
- channel class
- content tags

Outputs:

- `allow`
- `ask`
- `block`

Examples:

- `user_self_reminder`
  - `allow`
- `user_self_checkin`
  - `allow`
- `caregiver_escalation`
  - `ask`
- `new_recipient_requires_confirmation`
  - `ask`

## 12. Policy Order

The coordination order should be fixed:

```text
scene template
  -> registry resolution
  -> riskPolicy
  -> confirmationPolicy
  -> outboundPolicy (only for outbound steps)
  -> final scene plan
```

Do not run `outboundPolicy` before the step has already been typed as an outbound message.

## 13. Example: `arrival_cooling`

Example context:

```json
{
  "sceneId": "arrival_cooling",
  "context": {
    "atHome": true,
    "postWorkout": true,
    "heartRateBpm": 118,
    "quietHours": false,
    "triggeredBy": "event"
  }
}
```

Resolver behavior:

1. match `cooling.primary_fan` -> `mi-bedroom-fan`
2. match `cooling.primary_climate` -> `bedroom-climate`
3. optionally match `mood.arrival_audio` -> `living-room-speaker`
4. optionally match `lighting.arrival_scene` -> `hue-arrival-scene`
5. expand device steps
6. run risk and confirmation checks
7. optionally generate one `outbound_message` step to notify the user privately

Expected result:

- fan and climate steps likely `planned`
- outbound self-alert may be `allow`
- plan status may be `ready` if no confirmation-gated steps remain

## 14. Compatibility With Current Runtime

This spec is intentionally compatible with the current `ecosystem.ts` model:

- `capabilities[].intent`
- `domain`
- `service`
- `dataTemplate`
- `requiresConfirmation`
- `riskTier`

The main additions in the release version are:

- `displayName`
- `traits`
- `capabilityProfiles`
- `sceneBindings`
- `stateHints`

That means the release-facing registry can later be compiled or adapted back into the current runtime shape without discarding the existing plugin design.

## 15. Non-Goals

This spec does not:

- define vendor-specific auth flows
- define raw Home Assistant polling
- replace the current ecosystem registry implementation
- execute real side effects

## 16. Next Implementation Steps

Recommended order:

1. add a loader for `devices.example.json`
2. define `SceneDefinition` and `ResolvedScenePlan` types
3. implement `sceneResolver.ts` without side effects
4. implement `riskPolicy.ts`
5. implement `confirmationPolicy.ts`
6. connect outbound steps to the existing outbound policy file
7. only then implement `scenePlanExecutor.ts`
