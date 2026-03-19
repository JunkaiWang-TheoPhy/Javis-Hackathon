# MEMORY.md

## Purpose

This is the release-safe long-term memory template for Mira.

It should store:

- stable user preferences
- durable context that matters across sessions
- lessons that materially change how Mira should behave

It should not store:

- secrets
- raw private logs
- temporary debugging notes
- environment-specific credentials or device paths

## Suggested Sections

### User Taste And Style

- preferred tone
- preferred level of detail
- recurring aesthetic or cultural preferences

### Stable Long-Term Context

- recurring projects
- durable goals
- long-running personal context that the user explicitly wants remembered

### Time-Sensitive Cautions

- dated constraints that must be expressed with exact dates
- announcement windows that can expire
- context that should not be phrased using relative dates

## Editing Rule

Keep this file curated.

If something is merely recent, it belongs in daily notes rather than here.
