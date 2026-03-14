# Ecosystem Auth and Runtime Expansion Design

## Goal

Advance the repo from a mixed readiness/demo state into a more coherent smart-home platform by adding:

- a shared auth callback and token service
- real Google OAuth callback and token flow support
- minimal live SmartThings control
- Rokid routing through the existing ecosystem capability registry
- a unified ecosystem support matrix
- an Amazon Alexa readiness-only plugin

## Recommended Approach

Build one shared `ecosystem-auth-gateway` service, then layer ecosystem-specific behavior on top of it.

This is the best fit for the current repo because:

- `Google Home / Nest` needs a real OAuth callback flow before any serious runtime story exists
- `SmartThings` already has a usable cloud control surface that can be added with a narrow tool set
- `Rokid` should consume the same capability registry as `ha-control`, not keep a separate coffee-machine-only flow
- `Amazon Alexa` is best represented as a readiness and account-linking surface for now

## Alternatives Considered

### Option 1: Shared auth gateway plus thin ecosystem plugins

Pros:

- one place for callback handling and token storage
- avoids duplicating OAuth logic in multiple plugins
- keeps `rokid-bridge-gateway` focused on observation and confirmation flows
- makes future Google and Alexa work cleaner

Cons:

- adds one more internal service

### Option 2: Put OAuth callback endpoints inside `rokid-bridge-gateway`

Pros:

- fewer files and fewer services right now

Cons:

- mixes observation routing with auth lifecycle concerns
- makes future Google, Alexa, and other ecosystems harder to maintain
- turns the Rokid service into a general-purpose ecosystem backend

### Option 3: Skip callback flow and store tokens manually

Pros:

- fastest possible implementation

Cons:

- does not satisfy the requirement for a real callback and token flow
- weakens the credibility of Google support

## Scope

### 1. Shared auth service

Add `services/ecosystem-auth-gateway/` with:

- `GET /v1/health`
- `GET /v1/google-home/oauth/start`
- `GET /v1/google-home/oauth/callback`
- read/write token storage helpers
- machine-readable status responses

The service should be generic enough to host additional callback flows later, but only Google needs to be wired now.

### 2. Google Home / Nest

Upgrade the plugin from config-readiness only to real auth readiness with token awareness:

- `google_home_status` should report token state
- add `google_home_auth_status`
- add `google_home_build_auth_url`
- add `google_home_token_summary`

Boundary:

- do not over-claim broad live device control
- this phase is about real auth flow and token lifecycle

### 3. SmartThings

Upgrade the plugin from readiness only to minimal live control:

- `smartthings_list_devices`
- `smartthings_get_device_status`
- `smartthings_execute_command`

Keep the command surface intentionally small and explicit.

### 4. Rokid bridge

Replace the hard-coded coffee-machine branch with capability-registry-driven resolution.

The new path should:

- ingest the observation
- derive candidate aliases or device kinds
- resolve those through the shared ecosystem registry
- generate confirm or inform envelopes from resolved capabilities
- dispatch through the same intent model instead of a special coffee-only code path

It is acceptable to keep the existing coffee-machine test case as a demo fixture, but it should become one registry-backed scenario rather than a permanent special case.

### 5. Ecosystem support matrix

Add a single matrix page that answers:

- which ecosystems are listed
- which are HA-first
- which have readiness plugins
- which have real auth flow
- which have minimal live control
- which have direct control

### 6. Amazon Alexa

Add a readiness-only plugin with:

- status
- config summary
- account-linking checklist

No fake live-control path should be added in this phase.

## Data and Storage

Use a small local JSON token store under the new auth gateway service.

The stored record shape should be generic enough for multiple providers:

- provider id
- access token
- refresh token
- expiry time
- scope
- issued metadata

## Testing

Add tests for:

- Google auth URL generation and callback token persistence
- SmartThings device listing, status fetch, and command execution
- Rokid route behavior using registry-backed matching instead of the hard-coded coffee flow
- Alexa readiness tool registration
- matrix page and docs existence only where reasonable

## Sources and Boundaries

This design is based on official vendor docs:

- Google Home cloud-to-cloud authorization flow
- SmartThings device basics and commands
- Alexa smart-home account linking

Inference boundary:

- `Google Home / Nest` in this repo should stop at real token flow until a concrete server-side control path is implemented
- `Amazon Alexa` remains readiness-only for now
