import { Type, type Static } from "@sinclair/typebox";

export const AmbientVisionEventSchema = Type.Object(
  {
    schemaVersion: Type.Literal("0.1.0"),
    sessionId: Type.String(),
    observationId: Type.String(),
    observedAt: Type.String(),
    source: Type.Object(
      {
        deviceFamily: Type.Literal("mac_webcam"),
        deviceName: Type.String(),
        appVersion: Type.String(),
      },
      { additionalProperties: false },
    ),
    capture: Type.Object(
      {
        mode: Type.Union([Type.Literal("snapshot"), Type.Literal("clip")]),
        frameRef: Type.Optional(Type.String()),
        width: Type.Optional(Type.Number()),
        height: Type.Optional(Type.Number()),
      },
      { additionalProperties: false },
    ),
    event: Type.Object(
      {
        changeScore: Type.Number(),
        personPresent: Type.Boolean(),
        personCount: Type.Number(),
        activityState: Type.Union([
          Type.Literal("idle"),
          Type.Literal("person_present"),
          Type.Literal("active_motion"),
        ]),
        reasons: Type.Array(Type.String()),
      },
      { additionalProperties: false },
    ),
    privacy: Type.Object(
      {
        retainFrame: Type.Boolean(),
      },
      { additionalProperties: false },
    ),
  },
  { additionalProperties: false },
);

export type AmbientVisionEvent = Static<typeof AmbientVisionEventSchema>;
