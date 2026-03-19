# Mira Release Notification Router Local Deploy Pack Design

## Goal

Turn `Mira_Released_Version/deploy/service-notification-router/` into a real local deployment pack for the release-side `notification-router` service.

## Scope

This pass adds:

- deploy-side environment template
- local startup script
- local health-check script
- local self-checkin dispatch script
- README updates that point to those files

This pass does not add:

- container packaging
- production secrets handling
- process supervisors
- cloud deployment manifests

## Approach

Keep the deploy pack simple and local-first.

The startup script should:

1. resolve the release root and service directory
2. optionally source a local env file
3. default the outbound policy path to the release example YAML
4. start the release-side service with `tsx`

The helper scripts should:

- verify `GET /v1/health`
- send one low-risk self check-in through `POST /v1/dispatch`

## Verification

The deploy pack is complete for this pass when:

- the shell scripts pass `bash -n`
- the release-side package tests still pass
- the local startup script can launch the service
- the health-check script succeeds against that running instance
