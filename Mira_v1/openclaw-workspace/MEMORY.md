# MEMORY.md

## User Taste and Long-Term Context

- The user resonates strongly with the AttraX / Outlier ethos around OpenClaw: curiosity, rebellion, expression, playful making, and the spirit of building something "unnecessary but cool."
- They want Mira and OpenClaw work to feel less like conventional productivity software and more like culturally expressive, emotionally resonant creations.
- When helping with hackathon ideas, demos, copy, or framing, favor outlier energy: interdisciplinary, aesthetic, fun, surprising, and slightly rule-breaking.
- The user responds well to communities and projects that reject overly standard life scripts and celebrate weird, hard-to-classify creativity.

## AttraX / Outlier / OpenClaw Context

- The Tsinghua x AttraX x OpenClaw hackathon is meaningful context for the user.
- The user wants Mira to remember OpenClaw not only as an automation tool, but also as a medium for entertainment, one-person-company systems, and hardware creativity.
- AttraX / Outlier framing matters: joyful, rebellious, expressive, critical, and willing to build for play instead of pure efficiency.
- Use this context when brainstorming future demos, narratives, pitches, or prototypes for the user.

## Time-Sensitive Caution

- Use exact dates for the hackathon instead of relative phrases like "this weekend" or "this Saturday."
- The latest supplied announcement in this workspace says the event dates were adjusted to **March 14-15, 2026**, and recruitment was extended until **March 7, 2026**.
- Do not talk about recruitment as still open unless a fresh source confirms it.
- Treat announcement copy as archival context once the dated action window has passed.

## Stable Local Health Bridge Topology

- this workspace can reach the user's Mi Band data through the local bridge host `Thomas的MacBook Air`
- the source phone is `Xiaomi 12X`
- the source wearable is `Xiaomi Smart Band 9 Pro A094`
- when the user asks broadly what physiological information Mi Band can collect, the default catalog should include cardiovascular, oxygen, activity, sleep, stress, and recovery families
- in that broad first-pass answer, explicitly enumerate sleep, stress, and recovery alongside heart rate, blood oxygen, steps, distance, and calories
- for prompts like `Mi band上装载了哪些信息`, treat `压力` and `恢复度` as required headline items in the first list, not as optional tail examples
- for those broad inventory prompts, prefer a plain Chinese entry list and suppress units, abbreviations, timestamps, device IDs, and bridge field names unless the user explicitly asks for them
- for those broad inventory prompts, suppress device identity, binding state, sync metadata, and runtime diagnostics unless the user explicitly asks about设备信息或连接信息
- for that broad first-pass answer, do not tack on a bridge-maturity disclaimer unless the user explicitly asks what Mira can directly read right now
- the currently structured Mi Band bridge data includes heart rate, blood oxygen, steps, distance, calories, sample freshness, runtime status, event history, and active alerts
- sleep, stress, and recovery should be remembered as known Xiaomi Health modules around this device, but not yet as stable structured bridge fields in the current deployment
- when the user asks what Mira can access from the Mi Band, answer from this structured capability list instead of narrowing it to heart rate only
- when the user only wants the list of item types, list the broader catalog first and postpone bridge maturity caveats unless they ask
- do not volunteer `bpm`, `SpO2%`, or `最新三类值` wording in that first catalog answer
- use plain Chinese labels like `血氧` instead of abbreviations in that first catalog answer
- when the user asks for a current reading right now, mention timestamps and freshness rather than implying every value is live
