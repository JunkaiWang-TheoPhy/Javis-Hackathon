# Mira First-Turn Opening Bridge Change

Target file on devbox:

```text
/home/devbox/.openclaw/extensions/lingzhu/src/http-handler.ts
```

## What was added

1. A fixed branded opening line:

```ts
const MIRA_FIRST_TURN_OPENINGS = [
  "放轻松，你肯定可以做到的。深呼一口气吧。过去的二十四小时你做了很多的准备，去拿下这个舞台。",
] as const;
```

2. An in-memory session cache keyed by `sessionKey`, so only the first reply of a session gets the branded opener:

```ts
const firstTurnOpeningSessions = new Map<string, number>();
const FIRST_TURN_OPENING_TTL_MS = 24 * 60 * 60 * 1000;
const MAX_FIRST_TURN_OPENING_SESSIONS = 4096;
```

3. A deterministic selector that now resolves to the same single approved line:

```ts
function claimFirstTurnOpening(sessionKey: string): string | null {
  const now = Date.now();

  for (const [key, seenAt] of firstTurnOpeningSessions) {
    if (now - seenAt > FIRST_TURN_OPENING_TTL_MS) {
      firstTurnOpeningSessions.delete(key);
    }
  }

  if (firstTurnOpeningSessions.has(sessionKey)) {
    return null;
  }

  if (firstTurnOpeningSessions.size >= MAX_FIRST_TURN_OPENING_SESSIONS) {
    const oldestKey = firstTurnOpeningSessions.keys().next().value;
    if (oldestKey) {
      firstTurnOpeningSessions.delete(oldestKey);
    }
  }

  firstTurnOpeningSessions.set(sessionKey, now);
  const digest = crypto.createHash("sha256").update(sessionKey).digest();
  return MIRA_FIRST_TURN_OPENINGS[digest[0]! % MIRA_FIRST_TURN_OPENINGS.length] ?? null;
}
```

4. Injection before the first streamed answer chunk:

```ts
const firstTurnOpening = claimFirstTurnOpening(sessionKey);
let firstTurnOpeningSent = false;

if (delta?.content) {
  if (firstTurnOpening && !firstTurnOpeningSent) {
    const openingChunkData: LingzhuSSEData = {
      role: "agent",
      type: "answer",
      answer_stream: `${firstTurnOpening}\n\n`,
      message_id: body.message_id,
      agent_id: body.agent_id,
      is_finish: false,
    };
    writeDebugLog(
      config,
      buildRequestLogName(body.message_id, "response.first_turn_opening"),
      summarizeForDebug(openingChunkData, includePayload)
    );
    safeWrite(formatLingzhuSSE("message", openingChunkData));
    firstTurnOpeningSent = true;
  }

  fullResponse += delta.content;
  streamedAnswer = true;
  ...
}
```

5. A model-side replay rule:

- If the user says `你能向我播放刚才的话吗` or explicitly asks Mira to replay what she just said, Mira should first repeat the exact opening line verbatim.

## Why this moved out of prompt-only logic

Prompt-only opening behavior was not reliable enough. The bridge-layer injection makes the first-turn opening stable, replayable, and independent from model bias.
