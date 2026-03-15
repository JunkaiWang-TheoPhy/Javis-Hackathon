# Hue and Google-Nest Direct Skeleton Design

## Goal

Add the next two brand-specific direct adapter skeletons without breaking the HA-first architecture:

- a minimal usable Philips Hue plugin
- a future-compatible Google Home/Nest plugin skeleton

## Scope

### Hue

Implement a real but minimal direct adapter surface:

- config parsing
- status export
- bridge metadata fetch
- light listing

This keeps the plugin genuinely useful while staying small.

### Google/Nest

Implement a skeleton only:

- config parsing
- status export
- config summary
- explicit note that live control is deferred until a proper Home API / OAuth flow is added

This avoids pretending the repo can directly control Google Home devices from a simple server token.

## Why This Split

Hue local APIs are practical for a direct plugin. Google Home/Nest has a heavier auth and app-facing API story, so the right move is to create the plugin boundary now and keep actual control for a later phase.

## Plugin Shape

Each plugin will follow the same repo pattern:

- `package.json`
- `openclaw.plugin.json`
- `src/index.ts`
- optional helper module
- `skills/<name>/SKILL.md`
- tests in `src/__tests__/`

## Follow-up Work

- wire `directAdapter` execution from `ha-control` into the new plugins
- add live Hue actuation tools after the status/read path is stable
- add real Google Home user-auth flows
