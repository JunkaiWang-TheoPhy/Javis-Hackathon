# Contributing To Mira Released Version

This release tree is being prepared as a standalone public repository.

Before changing code or docs here, read:

- [readme/50-development/contributing-and-migration.md](/Users/thomasjwang/Documents/GitHub/Javis-Hackathon/Mira_Released_Version/readme/50-development/contributing-and-migration.md)
- [docs/migration/source-to-release-mapping.md](/Users/thomasjwang/Documents/GitHub/Javis-Hackathon/Mira_Released_Version/docs/migration/source-to-release-mapping.md)
- [docs/migration/release-baseline.md](/Users/thomasjwang/Documents/GitHub/Javis-Hackathon/Mira_Released_Version/docs/migration/release-baseline.md)
- [docs/migration/repository-split-readiness.md](/Users/thomasjwang/Documents/GitHub/Javis-Hackathon/Mira_Released_Version/docs/migration/repository-split-readiness.md)
- [docs/migration/package-and-license-decisions.md](/Users/thomasjwang/Documents/GitHub/Javis-Hackathon/Mira_Released_Version/docs/migration/package-and-license-decisions.md)

## Contribution Rules

- Keep `core/` independent from first-party modules.
- Keep `modules/` independent from service ownership.
- Keep `services/` free of persona and workspace source.
- Keep `deploy/` focused on operator paths, not runtime implementation.
- Do not copy live secrets, devbox runtime state, or installed dependencies into the release tree.

## Open-Source Readiness

Before proposing a release-side change as baseline-ready, confirm:

- no live credential or token is present
- no `node_modules/`, `dist/`, or local `.env` file is present
- docs point to release-side files first
- source boundaries are reflected in the migration mapping

Run:

```bash
cd Mira_Released_Version
npm run verify:release
```

## Current Status

This file is intentionally short.

The detailed workflow lives in:

- [readme/50-development/contributing-and-migration.md](/Users/thomasjwang/Documents/GitHub/Javis-Hackathon/Mira_Released_Version/readme/50-development/contributing-and-migration.md)
