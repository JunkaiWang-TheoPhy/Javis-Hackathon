# Lutron Session Info Design

## Goal

Add a read-only `lutron_list_session_info` tool that exposes a stable summary of the configured local Lutron bridge session without pretending that full direct control exists.

## Recommended Approach

Build `lutron_list_session_info` on top of the existing local TLS session helper instead of creating a second connection path.

This keeps the diagnostic stack narrow:

- `buildSessionChecklist` validates prerequisites
- `testLocalBridgeSession` performs the real TLS handshake
- `lutron_list_session_info` reshapes that data into a sanitized session summary

## Alternatives Considered

### Option 1: Reuse the existing TLS helper

Pros:

- one handshake path to maintain
- lower risk of diverging behavior between tools
- future LEAP command work can keep using the same lower-level connection code

Cons:

- the session-info tool depends on the current handshake payload shape

### Option 2: Build a separate lightweight info tool

Pros:

- total freedom to shape output independently

Cons:

- duplicate connection logic
- higher chance of inconsistent diagnostics
- unnecessary for the current scope

## Scope

`lutron_list_session_info` should:

- require the same bridge and certificate prerequisites as `lutron_test_session`
- attempt a real local TLS session
- return a summarized payload with:
  - `plugin`
  - `bridgeHost`
  - `bridgeId`
  - `port`
  - `servername`
  - `authorized`
  - `authorizationError`
  - `remoteAddress`
  - `remotePort`
  - `peerCertificateSummary`
  - `sessionReady`
- include checklist data so a caller can distinguish missing setup from handshake failures

It should not:

- expose raw private key or certificate contents
- claim that LEAP command execution exists
- become a generic raw LEAP inspector

## Error Handling

- Missing config should still fail with the existing checklist-based error path.
- Handshake failures should bubble up as tool errors, same as `lutron_test_session`.
- The returned certificate data should be summarized to stable, small fields rather than returning the entire peer certificate object.

## Testing

Add tests that prove:

- the tool registers
- it returns summarized session info on a successful mocked handshake
- the lower-level helper preserves enough data to derive the summarized payload
