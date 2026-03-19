# Mira Release Core Plus Notification Router Example Design

## Goal

Turn `examples/service-notification-router` from a placeholder into the first release-side composition example that links Mira core to the outbound routing service.

## Scope

This step stays documentation-only. It does not add new runtime code. It clarifies how readers should combine:

- the minimal core path
- the release-safe Lingzhu core plugin package
- the release-side notification-router package and deploy pack

## Design

The example should describe one concrete story:

1. prepare `minimal-core`
2. make the release-safe `lingzhu` core plugin available
3. start `notification-router`
4. verify a low-risk self check-in path

This keeps the example aligned with current capabilities without overstating runtime completeness.
