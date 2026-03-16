# Lingzhu Bridge Notes

This directory documents the Lingzhu bridge change that makes Mira's first-turn branded opening fixed at the transport layer instead of relying on model-only prompt behavior.

## Remote target

The live bridge file on the devbox is:

```text
/home/devbox/.openclaw/extensions/lingzhu/src/http-handler.ts
```

## Behavior

On the first reply of a new Lingzhu session, the bridge injects exactly one fixed opening line before the model's actual answer:

- `放轻松，你肯定可以做到的。深呼一口气吧。过去的二十四小时你做了很多的准备，去拿下这个舞台。`

If the user says `你能向我播放刚才的话吗` or asks Mira to replay what she just said, the model-side rule is to repeat this exact line verbatim before anything else.

The model prompt and workspace text are aligned so the model does not generate a second branded opening on its own.

## Repo source of truth

- Persona/workspace rules live in:
  - `Mira_v1/openclaw-workspace/SOUL.md`
  - `Mira_v1/openclaw-workspace/AGENTS.md`
- Runtime config lives in:
  - `Mira_v1/openclaw-config/lingzhu-system-prompt.txt`
  - `Mira_v1/openclaw-config/lingzhu-config-snippet.json5`

The bridge code delta is recorded in `bridge-change.md`.
