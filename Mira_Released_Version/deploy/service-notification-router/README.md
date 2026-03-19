# Notification Router Deploy

## Purpose

This directory will hold release-side deployment guidance for the outbound routing service.

## Owns

- service deploy notes
- channel environment expectations
- release-safe service composition steps

## Does Not Own

- provider secrets
- outbound policy semantics themselves
- module planning logic

## Planned Contents

- service startup notes
- channel provider environment templates
- example routing topology

## Current Status

This directory now documents the minimal release-side startup path for the first-pass `notification-router` package.

## Minimal Local Run

Expected source package:

- [package.json](/Users/thomasjwang/Documents/GitHub/Javis-Hackathon/Mira_Released_Version/services/notification-router/package.json)
- [src/server.ts](/Users/thomasjwang/Documents/GitHub/Javis-Hackathon/Mira_Released_Version/services/notification-router/src/server.ts)

Expected configuration references:

- [config/env.example](/Users/thomasjwang/Documents/GitHub/Javis-Hackathon/Mira_Released_Version/services/notification-router/config/env.example)
- [config/outbound-policy.example.yaml](/Users/thomasjwang/Documents/GitHub/Javis-Hackathon/Mira_Released_Version/services/notification-router/config/outbound-policy.example.yaml)
- [env.example](/Users/thomasjwang/Documents/GitHub/Javis-Hackathon/Mira_Released_Version/deploy/service-notification-router/env.example)
- [start-local.sh](/Users/thomasjwang/Documents/GitHub/Javis-Hackathon/Mira_Released_Version/deploy/service-notification-router/start-local.sh)
- [check-health.sh](/Users/thomasjwang/Documents/GitHub/Javis-Hackathon/Mira_Released_Version/deploy/service-notification-router/check-health.sh)
- [dispatch-self-checkin.sh](/Users/thomasjwang/Documents/GitHub/Javis-Hackathon/Mira_Released_Version/deploy/service-notification-router/dispatch-self-checkin.sh)

Current minimal run model:

1. enter the service directory
2. provide DM and/or email environment variables
3. optionally point the service at a YAML policy file
4. run local tests
5. start the server with a TypeScript-capable Node workflow
6. verify `GET /v1/health`
7. dispatch a low-risk self check-in through `POST /v1/dispatch`

Example install:

```bash
cd Mira_Released_Version/services/notification-router
npm install
```

Example deploy-pack environment:

```bash
cd Mira_Released_Version/deploy/service-notification-router
cp env.example .env.local
```

Example startup:

```bash
cd Mira_Released_Version/deploy/service-notification-router
./start-local.sh
```

Health check:

```bash
cd Mira_Released_Version/deploy/service-notification-router
./check-health.sh
```

Sample self check-in dispatch:

```bash
cd Mira_Released_Version/deploy/service-notification-router
./dispatch-self-checkin.sh
```

Current limitations:

- this is still a source-first development path, not yet a production packaging guide
- deploy packaging, secrets management, and container/runtime manifests are still out of scope for this first pass
- the local startup script expects `npm install` to have been run in `services/notification-router`
- the sample dispatch path assumes a reachable DM webhook if `openclaw_channel_dm` is selected
