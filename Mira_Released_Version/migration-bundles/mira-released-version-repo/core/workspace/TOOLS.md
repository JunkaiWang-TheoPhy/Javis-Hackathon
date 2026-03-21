# TOOLS.md

## Purpose

This is the release-safe template for deployment-specific tools and bridge notes.

Use this file for:

- paired device names
- node IDs
- helper commands
- bridge caveats
- reachability verification notes

## Suggested Sections

### Local Device Notes

Record:

- display name
- node or client ID
- access path
- last verified time

### Verification Rules

Record:

- which command proves the device is reachable
- which command proves the capability is usable
- what should count as a real failure versus a transient probe warning

### Operating Caveats

Record:

- known unstable tools
- gateway caveats
- preferred fallback paths

## Release Rule

This release copy is a template.

Do not place live private device IDs, private URLs, credentials, or operator-only details here unless they are intentionally part of a public example.
