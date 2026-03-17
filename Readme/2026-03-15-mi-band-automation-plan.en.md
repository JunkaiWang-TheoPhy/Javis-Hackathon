# Mi Band Automation Plan - 2026-03-15

## File Relationship

- Chinese source: `2026-03-15-mi-band-automation-plan.md`
- English companion: `2026-03-15-mi-band-automation-plan.en.md`

This file is the English companion to the original planning note. The Chinese source remains the original working record; this file exists to make the same confirmed requirements easier to carry into later release documentation.

## Purpose

This note records the confirmed requirements for the next stage of the Mi Band physiological data pipeline.

It does not repeat earlier completed work such as:

- ADB authorization
- Xiaomi 12X connectivity
- Mi Band 9 Pro pairing evidence
- Android gateway implementation
- desktop bridge implementation
- public bridge and devbox plugin verification

For earlier implementation context, the source points to:

- `Readme/Dairy/2026-03-15-mi-band-9-pro-gateway-progress.md`
- `devices/mi-band-9-pro/README.md`
- `tools/mi_band_desktop_bridge/README.md`

## Confirmed Scope

The next phase should extend the existing desktop ADB bridge into a longer-running physiological data pipeline that can be consumed by cloud-side OpenClaw.

The first delivery target is file output only. Proactive outbound notifications are explicitly out of scope for this phase.

## Confirmed Output Location

The canonical cloud-side OpenClaw-readable directory is:

`/home/devbox/.openclaw/workspace/mi-band/`

This directory should contain:

- latest snapshot files
- rolling raw records
- derived status files
- baseline summary files
- compressed monthly outputs

## Confirmed Sampling Rules

### Default Collection

- default interval: `1 minute`
- transport path:
  - `Mi Band 9 Pro -> Xiaomi 12X -> adb on local Mac -> local bridge -> sync into devbox workspace`

### Adaptive Escalation

If the physiological values show large short-window fluctuations across `3 minutes`, the collector should temporarily escalate to:

- `30 seconds` per sample
- for `5 minutes`

After the temporary window ends, the collector should return to the normal `1 minute` cadence.

The reason for this design is to avoid paying the performance cost of the heavier `30-second` path all the time.

## Confirmed Data Requirements

The minimum required physiological indicators are:

- heart rate
- SpO2
- steps

When available from the current bridge, the following derived inputs should also be included:

- distance
- calories
- short-window volatility
- deviation from the user's own historical averages

## Confirmed Baseline Requirements

The baseline layer should learn and maintain user baselines across:

- daily average
- weekly average
- monthly average
- yearly average

These baselines should be computed from stored historical samples and continuously updated as new samples arrive.

The point of the baseline layer is relative interpretation, not just fixed-threshold checking.

## Confirmed Status Inference Requirements

A separate script should produce a derived `status` judgment every `5 minutes`.

The required status set includes:

- calm
- stressed
- happy
- angry
- depressed

The minimum confirmed inputs are:

- heart rate
- SpO2
- steps

The intended design should also include historical deviation and short-window instability when those signals are available.

## Confirmed Retention and Compression Rules

For data older than `1 month`:

- compress or summarize historical physiological records
- organize them into structured tables and summary data
- clear older detailed raw records after the compressed artifacts are produced

The retained long-horizon artifacts should still support:

- monthly review
- yearly review
- future baseline calculation

## Confirmed Phase Boundary

This phase should:

- keep writing structured files for OpenClaw to read
- avoid proactive outbound notifications for now

So the first operational goal is:

- reliable periodic collection
- structured sync into the OpenClaw workspace
- rolling baseline computation
- derived 5-minute status generation
- monthly compression and cleanup

## Expected File Categories

The exact filenames can be finalized later, but the intended categories are:

- `latest/`
  - newest snapshot and newest status
- `raw/`
  - minute-level and temporary 30-second physiological samples
- `status/`
  - derived 5-minute status judgments
- `baselines/`
  - day/week/month/year summary files
- `archive/`
  - compressed monthly tables and cleaned historical outputs

## Implementation Notes For Follow-Up

The existing bridge already proves that non-null heart rate, SpO2, and step data can be read over ADB.

The next implementation should therefore build on the desktop bridge path rather than return to the previously blocked Android-only provider path.

The known runtime constraint remains:

- the always-on full `adb logcat -d` path is too slow for stable `15s` polling

That is why the plan keeps:

- `1 minute` as the default cadence
- `30 seconds` only as a temporary elevated mode

## Status

This file records confirmed requirements and boundaries only.

It does not claim that the full automation layer has already been implemented.
