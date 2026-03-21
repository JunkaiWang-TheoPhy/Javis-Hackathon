# Core Examples

## Purpose

This directory will hold minimal examples that prove Mira core can stand on its own.

## Owns

- minimal core demos
- release-side example entrypoints

## Does Not Own

- full module demos
- hardware walkthroughs
- service deployment guides

## Planned Contents

- minimal standalone Mira example
- example config and startup notes

## Current Status

This directory now points at the first concrete example path:

- [examples/minimal-core/README.md](/Users/thomasjwang/Documents/GitHub/Javis-Hackathon/Mira_Released_Version/examples/minimal-core/README.md)

That example is the current proof target for the claim that `core/` can stand on its own.

It now also carries the first release-safe core plugin path through:

- [plugins/lingzhu-bridge/README.md](/Users/thomasjwang/Documents/GitHub/Javis-Hackathon/Mira_Released_Version/core/plugins/lingzhu-bridge/README.md)

Future core examples can branch from it, but should preserve the same rule:

- no module dependency unless the example explicitly says so
