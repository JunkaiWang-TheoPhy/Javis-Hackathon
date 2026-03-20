# Repository Split Checklist

## Purpose

This checklist defines the concrete steps for splitting `Mira_Released_Version/` into its own repository.

## Checklist

1. Review:
   - [release-baseline.md](/Users/thomasjwang/Documents/GitHub/Javis-Hackathon/Mira_Released_Version/docs/migration/release-baseline.md)
   - [open-source-readiness-checklist.md](/Users/thomasjwang/Documents/GitHub/Javis-Hackathon/Mira_Released_Version/docs/migration/open-source-readiness-checklist.md)
   - [package-and-license-decisions.md](/Users/thomasjwang/Documents/GitHub/Javis-Hackathon/Mira_Released_Version/docs/migration/package-and-license-decisions.md)
2. Run:
   - `cd Mira_Released_Version && npm run verify:release`
   - `cd Mira_Released_Version && npm run test:release`
3. Export the standalone directory package:
   - `cd Mira_Released_Version && npm run export:repo`
4. Go to the exported directory package.
5. Replace [LICENSE.placeholder.md](/Users/thomasjwang/Documents/GitHub/Javis-Hackathon/Mira_Released_Version/LICENSE.placeholder.md) with the final `LICENSE`.
6. Run the same verify and test commands again inside the exported package.
7. Initialize the new repository:
   - `git init`
   - `git add .`
   - `git commit -m "chore: initialize Mira release repository"`

## Default Export Location

The current export script writes to:

- `../exports/mira-released-version-repo`

relative to [Mira_Released_Version](/Users/thomasjwang/Documents/GitHub/Javis-Hackathon/Mira_Released_Version).

## Non-Goals

This checklist does not choose the final license or create the remote repository for you.
