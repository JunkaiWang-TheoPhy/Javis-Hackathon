# Mi Band 9 Pro Local Source Design

## Summary

Extend the existing `Mi Band Gateway` so it can prefer Xiaomi-local data sources over Jetpack `Health Connect`.

The new flow is:

`Mi Band 9 Pro -> Xiaomi Fitness -> Xiaomi-local source probe -> gateway snapshot -> HTTP/SSE -> desktop`

## Goal

- Keep the existing `/status`, `/health/latest`, `/events`, and `/debug/source` endpoints stable.
- Prefer Xiaomi-local sources before `Health Connect`.
- Expose source diagnostics clearly enough that we can tell the difference between:
  - provider path missing
  - provider permission denied
  - log directory inaccessible from app sandbox
  - no recent structured data found
- Deliver a first usable minute-level path for `steps` and `spo2`, with `heart_rate` best effort.

## Constraints

- `com.mi.health.provider.main` and `com.mi.health.provider.device` root queries return no rows.
- Guessed provider subpaths currently fail with `no provider deploy`.
- The gateway app cannot rely on `run-as` or Xiaomi private database access.
- On this phone, the gateway app appears unable to read `com.mi.health` external log directories directly from its own sandbox.

## Approach

### 1. Introduce a multi-source metrics interface

Replace the current direct dependency on `HealthConnectRepository` with a source interface that returns:

- metrics
- source labels
- source timestamp
- source status/debug message

### 2. Add `XiaomiFitnessLocalSource`

This source will do two things in order:

1. Probe Xiaomi content providers with a small curated candidate set.
2. If provider reads fail, attempt Xiaomi log-directory access and parse known report lines.

If both fail, the source still returns structured debug state so `/debug/source` can explain why.

### 3. Keep `HealthConnectRepository` as a fallback source

If the Xiaomi-local source returns no usable metrics, the gateway can still fall back to the existing Health Connect path.

This keeps the bridge useful on devices where the local source is partially blocked.

## Components

### `GatewayMetricsSource`

A common interface for metric readers.

### `XiaomiFitnessProviderProbe`

Responsible for:

- probing known authorities
- classifying provider failures
- returning probe diagnostics even when no rows are available

### `XiaomiFitnessLogParser`

Responsible for parsing structured Xiaomi log lines such as:

- `DailyStepReport(...)`
- `DailySpo2Report(...)`
- future heart-rate patterns if present

### `XiaomiFitnessLocalSource`

Coordinator for:

- provider-first reads
- best-effort log access
- debug status composition

### `CompositeMetricsSource`

Source order:

1. `XiaomiFitnessLocalSource`
2. `HealthConnectRepository`

## Data Model Changes

The existing snapshot schema stays stable.

`/debug/source` will be expanded with Xiaomi-local diagnostics, for example:

- `xiaomi_local_status`
- `xiaomi_provider_status`
- `xiaomi_provider_probe`
- `xiaomi_log_status`
- `health_connect_status`

## Expected First-Version Behavior

- `steps` can become non-null if Xiaomi local logs or provider reads are accessible.
- `spo2` can become non-null if Xiaomi local logs expose `DailySpo2Report`.
- `heart_rate` remains best effort and may stay `null` until a reliable structured line or readable provider path is found.
- `/status` and `/events` remain backward compatible.

## Testing

- Pure JVM tests for Xiaomi log parsing.
- Pure JVM tests for source selection and status precedence.
- Existing Android JVM tests remain green.
- Desktop Python tests remain green.

## Out of Scope

- Root-only Xiaomi DB access
- Reverse engineering private binder protocols
- Guaranteeing second-level telemetry
