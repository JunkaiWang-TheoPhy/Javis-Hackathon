# Mira Release Notification Router Source Migration Design

## Goal

Move the first release-safe `notification-router` source package into `Mira_Released_Version/services/notification-router/src/` so the release tree contains a runnable outbound service skeleton instead of documentation alone.

## Scope

This migration pass includes:

- local release-side TypeScript contracts
- local outbound policy evaluator and default policy object
- local channel adapters for private DM and email
- local config loading
- local dispatch route and HTTP server

This pass does not include:

- live secrets
- active-repo test mirroring
- YAML file parsing at runtime
- full file-by-file parity with the active implementation

## Design Choice

Use a self-contained first pass instead of importing active-repo shared contracts or runtime YAML parsing.

Why:

- the release tree should be copyable into a standalone repo
- current root-repo dependency layout does not guarantee `yaml` is available from the release-side path
- a self-contained package is easier to explain, test, and gradually harden

## Resulting Structure

The release-side package should now own:

- `package.json`
- `src/types.ts`
- `src/policy/*`
- `src/channels/*`
- `src/config/routerConfig.ts`
- `src/dispatch/dispatchMessageIntent.ts`
- `src/routes/dispatchIntent.ts`
- `src/server.ts`

## Runtime Model

The first release-side runtime model is:

1. receive `OutboundMessageIntent`
2. load the built-in default outbound policy or an injected override
3. evaluate channels in priority order
4. dispatch the first allowed and configured channel
5. return a structured decision plus delivery result

## Verification

The migration is considered complete for this pass when:

- the release-side package serves `GET /v1/health`
- `POST /v1/dispatch` accepts a normalized intent
- an allowed self check-in dispatches through `openclaw_channel_dm`
- the smoke test passes from the active repo test harness

## Follow-Up

Later passes can add:

- YAML-backed policy loading
- package-level tests inside the release tree
- stronger deploy documentation
- closer parity with active runtime source layout
