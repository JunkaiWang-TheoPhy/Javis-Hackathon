import type { VisualObservationEvent } from "../../../../packages/contracts/src/index.ts";
import { buildObservationSummary } from "../../../../plugins/openclaw-plugin-rokid-bridge/src/index.ts";

export function buildObservationPrompt(observation: VisualObservationEvent) {
  const summary = buildObservationSummary(observation);
  return {
    summary,
    prompt: [
      `selected=${summary.selectedLabel ?? "unknown"}`,
      `ocr=${summary.ocr.join(" | ") || "none"}`,
      `userEvent=${summary.userEvent?.type ?? "none"}`,
      `text=${summary.userEvent?.text ?? ""}`,
    ].join("\n"),
  };
}
