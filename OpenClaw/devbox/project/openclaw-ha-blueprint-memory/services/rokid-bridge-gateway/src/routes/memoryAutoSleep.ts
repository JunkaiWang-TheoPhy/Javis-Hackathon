import { MemoryIdleSleepController } from "../memory/memoryIdleSleepController.ts";

type MemoryAutoSleepBody = {
  now?: string;
  idleThresholdSeconds?: number;
};

export async function handleMemoryAutoSleepRequest(
  body: unknown,
  controller: MemoryIdleSleepController,
) {
  const input = (body ?? {}) as MemoryAutoSleepBody;
  const idleThresholdSeconds =
    typeof input.idleThresholdSeconds === "number" && Number.isFinite(input.idleThresholdSeconds)
      ? Math.max(60, Math.trunc(input.idleThresholdSeconds))
      : undefined;

  const result = controller.run({
    ...(typeof input.now === "string" ? { now: input.now } : {}),
    ...(idleThresholdSeconds !== undefined ? { idleThresholdMs: idleThresholdSeconds * 1000 } : {}),
  });

  return {
    status: 200,
    body: result,
  };
}
