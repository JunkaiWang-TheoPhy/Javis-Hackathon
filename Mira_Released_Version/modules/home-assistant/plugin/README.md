# Home Assistant Plugin

## Purpose

This directory will hold the release-side plugin package for Mira's Home Assistant module.

## Owns

- plugin-level entrypoints
- typed tool boundaries
- scene resolver and executor implementation surfaces

## Does Not Own

- top-level module positioning
- service-side outbound routing
- Home Assistant instance deployment itself

## Planned Contents

- plugin package metadata
- `src/` implementation
- skills and config notes

## Current Status

The first release-side plugin source skeleton already exists under `src/`, including scene definition, scene resolver, and executor files.
