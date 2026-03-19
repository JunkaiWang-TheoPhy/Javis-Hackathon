# Notification Router Operator Checklist

## Purpose

This checklist defines the smallest operator-facing steps for standing up the release-side `notification-router`.

## Checklist

1. Read [runtime-contract.md](/Users/thomasjwang/Documents/GitHub/Javis-Hackathon/Mira_Released_Version/services/notification-router/docs/runtime-contract.md).
2. Copy [../config/env.example](/Users/thomasjwang/Documents/GitHub/Javis-Hackathon/Mira_Released_Version/services/notification-router/config/env.example) into a local environment file outside version control.
3. Copy [../config/outbound-policy.example.yaml](/Users/thomasjwang/Documents/GitHub/Javis-Hackathon/Mira_Released_Version/services/notification-router/config/outbound-policy.example.yaml) if file-backed policy loading is needed.
4. Install package dependencies from [../package.json](/Users/thomasjwang/Documents/GitHub/Javis-Hackathon/Mira_Released_Version/services/notification-router/package.json).
5. Run local tests before starting the service.
6. Verify `GET /v1/health`.
7. Verify one low-risk self check-in dispatch before wiring the service into any upstream gateway or module flow.

## Non-Goals

This checklist still does not cover:

- production process supervision
- container packaging
- secrets vault integration
- multi-channel rate limiting
