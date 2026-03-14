import { Type } from "@sinclair/typebox";

import {
  ActionEnvelopeSchema,
  VisualObservationEventSchema,
} from "../../../packages/contracts/src/index.ts";
import { HomeAssistantClient } from "./homeAssistant.ts";
import { normalizeDispatchPayload } from "./safeguards.ts";
import type {
  PluginApi,
  RokidBridgeConfig,
  ToolContent,
  VisualObservationEvent,
} from "./types.ts";

const PLUGIN_ID = "rokid-bridge";

type ObservationSummary = {
  selectedLabel: string | null;
  topDetections: Array<{
    id: string;
    label: string;
    score: number;
  }>;
  ocr: string[];
  userEvent: VisualObservationEvent["userEvent"] | null;
  summary: string | null;
};

function asTextContent(data: unknown): { content: ToolContent[] } {
  return {
    content: [
      {
        type: "text",
        text: typeof data === "string" ? data : JSON.stringify(data, null, 2),
      },
    ],
  };
}

function getConfig(api: PluginApi): RokidBridgeConfig {
  return (api.config?.plugins?.entries?.[PLUGIN_ID]?.config ?? {}) as RokidBridgeConfig;
}

function getHomeAssistantClient(api: PluginApi) {
  const cfg = getConfig(api);
  return new HomeAssistantClient({
    baseUrl:
      cfg.homeAssistantBaseUrl ??
      process.env.HA_BASE_URL ??
      "http://homeassistant:8123",
    token: cfg.homeAssistantToken ?? process.env.HA_TOKEN ?? "",
  });
}

export function buildObservationSummary(
  observation: VisualObservationEvent,
): ObservationSummary {
  const selected = observation.detections.find(
    (item) => item.id === observation.selectedDetectionId,
  );

  return {
    selectedLabel: selected?.label ?? null,
    topDetections: [...observation.detections]
      .sort((left, right) => right.score - left.score)
      .slice(0, 5)
      .map((item) => ({
        id: item.id,
        label: item.label,
        score: item.score,
      })),
    ocr: observation.ocr.map((item) => item.text),
    userEvent: observation.userEvent ?? null,
    summary: observation.summary ?? null,
  };
}

export { normalizeDispatchPayload } from "./safeguards.ts";

export default function register(api: PluginApi) {
  api.registerTool(
    {
      name: "rokid_ingest_observation",
      description:
        "Normalize a Rokid visual observation into agent-readable context.",
      parameters: Type.Object({
        observation: VisualObservationEventSchema,
      }),
      async execute(_id: string, params: { observation: VisualObservationEvent }) {
        return asTextContent(buildObservationSummary(params.observation));
      },
    },
    { optional: true },
  );

  api.registerTool(
    {
      name: "rokid_dispatch_ha",
      description:
        "Dispatch a confirmed Home Assistant service call for Rokid flows.",
      parameters: Type.Object({
        domain: Type.String(),
        service: Type.String(),
        entityId: Type.Optional(Type.String()),
        data: Type.Optional(Type.Record(Type.String(), Type.Any())),
        reason: Type.Optional(Type.String()),
      }),
      async execute(
        _id: string,
        params: {
          domain: string;
          service: string;
          entityId?: string;
          data?: Record<string, unknown>;
          reason?: string;
        },
      ) {
        const normalized = normalizeDispatchPayload(params);
        const result = await getHomeAssistantClient(api).callService(
          normalized.domain,
          normalized.service,
          normalized.payload,
        );

        return asTextContent({
          ok: true,
          reason: params.reason ?? null,
          service: `${normalized.domain}.${normalized.service}`,
          entityId: params.entityId ?? null,
          result,
        });
      },
    },
    { optional: true },
  );

  api.registerTool(
    {
      name: "rokid_bridge_status",
      description: "Report the current Rokid bridge plugin status.",
      parameters: Type.Object({}),
      async execute() {
        const cfg = getConfig(api);
        return asTextContent({
          ok: true,
          plugin: PLUGIN_ID,
          configured: Boolean(cfg.homeAssistantBaseUrl || process.env.HA_BASE_URL),
          homeAssistantBaseUrl:
            cfg.homeAssistantBaseUrl ??
            process.env.HA_BASE_URL ??
            "http://homeassistant:8123",
        });
      },
    },
    { optional: true },
  );

  api.registerGatewayMethod(`${PLUGIN_ID}.status`, ({ respond }: any) => {
    const cfg = getConfig(api);
    respond(true, {
      ok: true,
      plugin: PLUGIN_ID,
      configured: Boolean(cfg.homeAssistantBaseUrl || process.env.HA_BASE_URL),
      homeAssistantBaseUrl:
        cfg.homeAssistantBaseUrl ??
        process.env.HA_BASE_URL ??
        "http://homeassistant:8123",
      schemas: {
        observation: VisualObservationEventSchema.properties.schemaVersion.const,
        envelope: ActionEnvelopeSchema.properties.schemaVersion.const,
      },
    });
  });
}
