import type { Static } from "@sinclair/typebox";

import type {
  VisualObservationEventSchema,
  ActionEnvelopeSchema,
} from "../../../packages/contracts/src/index.ts";

export type ToolContent = { type: "text"; text: string };

export type PluginApi = {
  config: any;
  registerTool: (tool: any, options?: { optional?: boolean }) => void;
  registerGatewayMethod: (name: string, handler: (ctx: any) => void) => void;
};

export type RokidBridgeConfig = {
  homeAssistantBaseUrl?: string;
  homeAssistantToken?: string;
  defaultArea?: string;
};

export type VisualObservationEvent = Static<typeof VisualObservationEventSchema>;
export type ActionEnvelope = Static<typeof ActionEnvelopeSchema>;
