import { Type, type Static } from "@sinclair/typebox";

export const OverlayPanelActionSchema = Type.Object(
  {
    kind: Type.Literal("overlay_panel"),
    panelId: Type.String(),
    title: Type.String(),
    body: Type.String(),
    anchorDetectionId: Type.Optional(Type.String()),
    buttons: Type.Optional(
      Type.Array(
        Type.Object(
          {
            id: Type.String(),
            label: Type.String(),
            role: Type.Optional(
              Type.Union([
                Type.Literal("primary"),
                Type.Literal("secondary"),
                Type.Literal("dismiss"),
              ]),
            ),
          },
          { additionalProperties: false },
        ),
      ),
    ),
  },
  { additionalProperties: false },
);

export const SpeechActionSchema = Type.Object(
  {
    kind: Type.Literal("speech"),
    text: Type.String(),
    interrupt: Type.Boolean(),
  },
  { additionalProperties: false },
);

export const HighlightTargetActionSchema = Type.Object(
  {
    kind: Type.Literal("highlight_target"),
    targetDetectionId: Type.String(),
    style: Type.Optional(
      Type.Union([
        Type.Literal("outline"),
        Type.Literal("pulse"),
        Type.Literal("badge"),
      ]),
    ),
  },
  { additionalProperties: false },
);

export const HomeAssistantServiceActionSchema = Type.Object(
  {
    kind: Type.Literal("home_assistant_service"),
    confirmRequired: Type.Boolean(),
    service: Type.Object(
      {
        domain: Type.String(),
        service: Type.String(),
        entityId: Type.Optional(Type.String()),
        data: Type.Optional(Type.Record(Type.String(), Type.Unknown())),
      },
      { additionalProperties: false },
    ),
  },
  { additionalProperties: false },
);

export const NoopActionSchema = Type.Object(
  {
    kind: Type.Literal("noop"),
    reason: Type.String(),
  },
  { additionalProperties: false },
);

export const ActionSchema = Type.Union([
  OverlayPanelActionSchema,
  SpeechActionSchema,
  HighlightTargetActionSchema,
  HomeAssistantServiceActionSchema,
  NoopActionSchema,
]);

export const ActionEnvelopeSchema = Type.Object(
  {
    schemaVersion: Type.Literal("0.1.0"),
    envelopeId: Type.String(),
    sessionId: Type.String(),
    correlationId: Type.String(),
    createdAt: Type.String(),
    safetyTier: Type.Union([
      Type.Literal("inform"),
      Type.Literal("confirm"),
      Type.Literal("side_effect"),
    ]),
    actions: Type.Array(ActionSchema),
    memoryWrites: Type.Optional(
      Type.Array(
        Type.Object(
          {
            namespace: Type.Union([
              Type.Literal("episodic"),
              Type.Literal("semantic"),
              Type.Literal("preferences"),
            ]),
            key: Type.String(),
            value: Type.Unknown(),
          },
          { additionalProperties: false },
        ),
      ),
    ),
  },
  { additionalProperties: false },
);

export type OverlayPanelAction = Static<typeof OverlayPanelActionSchema>;
export type SpeechAction = Static<typeof SpeechActionSchema>;
export type HighlightTargetAction = Static<typeof HighlightTargetActionSchema>;
export type HomeAssistantServiceAction = Static<typeof HomeAssistantServiceActionSchema>;
export type NoopAction = Static<typeof NoopActionSchema>;
export type Action = Static<typeof ActionSchema>;
export type ActionEnvelope = Static<typeof ActionEnvelopeSchema>;
