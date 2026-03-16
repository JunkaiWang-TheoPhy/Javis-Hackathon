# Amazon Alexa and Apple Ecosystem Listing Design

## Goal

Add `Amazon Alexa` and a broader `Apple` smart-home label to the repo's support documentation without over-claiming new runtime integrations.

## Recommended Approach

Update the existing support-list docs and add a new overview file under `Readme/` that lists supported smart-home ecosystems only.

This keeps the change honest:

- `Amazon Alexa` is documented as part of the ecosystem surface the repo tracks
- `Apple Home / HomeKit` is documented as part of the Apple smart-home surface already represented in the repo
- no new direct plugin or fake runtime support is implied

## Alternatives Considered

### Option 1: Docs-only support listing

Pros:

- matches the user's request for a simple support inventory
- avoids inventing runtime capability that the repo does not yet implement
- low-risk and easy to keep current

Cons:

- does not add executable runtime coverage

### Option 2: Add config examples for Alexa and Apple

Pros:

- makes the support inventory visible inside the sample registry

Cons:

- `Amazon Alexa` is not currently modeled in this repo with the same semantics as direct or HA-imported device ecosystems
- a sample registry entry could imply stronger execution support than actually exists

## Scope

Update these surfaces:

- `0313/openclaw-ha-blueprint/README.md`
- `docs/openclaw-ha-ecosystem-progress-2026-03-15.md`
- a new support-inventory file under `Readme/`

The new `Readme` file should contain names only, with no implementation detail.

## Naming

Use the official ecosystem names:

- `Amazon Alexa`
- `Apple Home`
- `HomeKit`

Keep existing ecosystem names already used in the repo, such as `Google Home / Nest`, `Philips Hue`, `Lutron`, and `SmartThings`.
