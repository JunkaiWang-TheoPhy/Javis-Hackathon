# Mi Band Automation Plan - 2026-03-15

## Purpose

This note records the newly confirmed requirements for the next Mi Band data pipeline stage.

It intentionally does not repeat the already documented content about:

- ADB authorization
- Xiaomi 12X connectivity
- Mi Band 9 Pro pairing evidence
- Android gateway implementation
- desktop bridge implementation
- public bridge and devbox plugin verification

For the earlier completed work, see:

- `Readme/Dairy/2026-03-15-mi-band-9-pro-gateway-progress.md`
- `devices/mi-band-9-pro/README.md`
- `tools/mi_band_desktop_bridge/README.md`

## Confirmed Scope

The next stage should extend the current desktop ADB bridge into a longer-running physiological data pipeline for cloud OpenClaw consumption.

The first delivery target is file output only. It does not need proactive Feishu or other message push in this phase.

## Confirmed Output Location

The cloud-side target directory is fixed as:

`/home/devbox/.openclaw/workspace/mi-band/`

This directory will be treated as the canonical OpenClaw-readable storage location for:

- latest snapshot files
- rolling raw records
- derived status files
- baseline summary files
- compressed monthly outputs

## Confirmed Sampling Rules

### Default collection

- Default sampling interval: `1 minute`
- Default transport path:
  - `Mi Band 9 Pro -> Xiaomi 12X -> adb on local Mac -> local bridge -> sync into devbox workspace`

### Adaptive temporary escalation

If physiological values show large short-window fluctuation across `3 minutes`, the collector should temporarily increase to:

- `30 seconds` per sample
- duration: `5 minutes`

After that temporary window ends, the collector should return to the normal `1 minute` schedule.

This adaptive escalation is intended to avoid running the heavier data path at `30 seconds` all the time.

## Confirmed Data Requirements

The status and baseline system must use at least these three physiological indicators:

- heart rate
- SpO2
- steps

Additional derived inputs are also part of the intended design if available from the existing bridge:

- distance
- calories
- short-window volatility
- deviation from the user's own historical averages

## Confirmed Baseline Memory Requirements

The pipeline should learn and maintain user baselines across these windows:

- daily average
- weekly average
- monthly average
- yearly average

These baselines should be computed from stored historical samples and updated continuously as new data arrives.

The baseline layer is intended to support relative interpretation, not just raw threshold checks.

## Confirmed Status Inference Requirements

A separate script should produce a derived `status` judgment every `5 minutes`.

The required status set must include at least:

- calm
- stressed
- happy
- angry
- depressed

This status output must combine multiple physiological inputs, and the minimum confirmed set is:

- heart rate
- SpO2
- steps

The design expectation discussed in this session is that status inference should also incorporate historical deviation and short-window instability when those signals are available.

## Confirmed Retention and Compression Rules

For data older than `1 month`:

- compress or summarize historical physiological records
- organize them into tables and summary data
- clear older detailed physiological raw records after the compressed artifacts are produced

The retained long-horizon artifacts should preserve enough information to support:

- monthly review
- yearly review
- future baseline calculation

## Confirmed Phase Boundary

This phase should:

- keep writing structured files for OpenClaw to read
- avoid adding proactive outbound notifications for now

So the first operational goal is:

- reliable periodic collection
- structured file sync into the OpenClaw workspace
- rolling baseline computation
- derived 5-minute status generation
- monthly compression and cleanup

## Expected File Categories

The exact filenames can be finalized during implementation, but the intended categories are:

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

The current bridge already proves that non-null heart rate, SpO2, and step data can be read over ADB.

The next implementation should therefore build on the desktop bridge path rather than return to the blocked Android-only provider path.

The current known runtime constraint remains:

- the always-on full `adb logcat -d` path is too slow for stable `15s` polling

That is why this plan keeps:

- `1 minute` as the normal cadence
- `30 seconds` only as a temporary elevated mode

## Status

This file records confirmed requirements and boundaries only.

It is not a claim that the above automation layer has already been implemented.
