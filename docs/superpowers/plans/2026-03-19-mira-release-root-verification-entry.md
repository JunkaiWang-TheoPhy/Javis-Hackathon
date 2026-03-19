# Mira Release Root Verification Entry Plan

## Goal

Add a root-level verification entrypoint for `Mira_Released_Version/`.

## Steps

1. Add a release-root `package.json` with workspaces.
2. Add `scripts/verify-release.mjs`.
3. Add a minimal test for the verification script.
4. Wire the new entrypoint into release docs.
5. Run the script and its test to verify the root entry works.
