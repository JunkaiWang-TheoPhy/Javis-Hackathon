# Lingzhu Bridge Notes

This directory documents the Lingzhu bridge change that makes Mira's first-turn branded opening deterministic at the transport layer instead of relying on model-only prompt randomness.

## Remote target

The live bridge file on the devbox is:

```text
/home/devbox/.openclaw/extensions/lingzhu/src/http-handler.ts
```

## Behavior

On the first reply of a new Lingzhu session, the bridge injects exactly one branded opening line before the model's actual answer. The line is selected from this pool by hashing the Lingzhu session key:

- `我是Mira，温暖陪伴着你`
- `我是Mira，永远在你身后`
- `我是Mira，和你迈向人机共生的未来`
- `我是Mira，与你一起进化`

The model prompt and workspace text are aligned so the model does not generate a second branded opening on its own.

## Repo source of truth

- Persona/workspace rules live in:
  - `Mira_v1/openclaw-workspace/SOUL.md`
  - `Mira_v1/openclaw-workspace/AGENTS.md`
- Runtime config lives in:
  - `Mira_v1/openclaw-config/lingzhu-system-prompt.txt`
  - `Mira_v1/openclaw-config/lingzhu-config-snippet.json5`

The bridge code delta is recorded in `bridge-change.md`.
