import { Type, type Static } from "@sinclair/typebox";

export const BoundingBoxSchema = Type.Object(
  {
    x: Type.Number(),
    y: Type.Number(),
    w: Type.Number(),
    h: Type.Number(),
  },
  { additionalProperties: false },
);

export const DetectionSchema = Type.Object(
  {
    id: Type.String(),
    label: Type.String(),
    score: Type.Number(),
    bbox: BoundingBoxSchema,
  },
  { additionalProperties: false },
);

export const OCRSpanSchema = Type.Object(
  {
    text: Type.String(),
    score: Type.Number(),
    bbox: BoundingBoxSchema,
  },
  { additionalProperties: false },
);

export const UserEventSchema = Type.Object(
  {
    type: Type.Union([
      Type.Literal("capture_button"),
      Type.Literal("voice_query"),
      Type.Literal("tap_select"),
      Type.Literal("confirm"),
      Type.Literal("dismiss"),
    ]),
    text: Type.Optional(Type.String()),
    targetDetectionId: Type.Optional(Type.String()),
  },
  { additionalProperties: false },
);

export const VisualObservationEventSchema = Type.Object(
  {
    schemaVersion: Type.Literal("0.1.0"),
    sessionId: Type.String(),
    observationId: Type.String(),
    observedAt: Type.String(),
    source: Type.Object(
      {
        deviceFamily: Type.Literal("rokid_glasses"),
        appId: Type.String(),
        firmwareVersion: Type.Optional(Type.String()),
        appVersion: Type.String(),
      },
      { additionalProperties: false },
    ),
    capture: Type.Object(
      {
        mode: Type.Union([
          Type.Literal("snapshot"),
          Type.Literal("roi_snapshot"),
          Type.Literal("keyframe"),
          Type.Literal("partner_continuous_stream"),
        ]),
        frameRef: Type.Optional(Type.String()),
        width: Type.Optional(Type.Number()),
        height: Type.Optional(Type.Number()),
        rois: Type.Optional(Type.Array(BoundingBoxSchema)),
      },
      { additionalProperties: false },
    ),
    detections: Type.Array(DetectionSchema),
    ocr: Type.Array(OCRSpanSchema),
    selectedDetectionId: Type.Optional(Type.String()),
    userEvent: Type.Optional(UserEventSchema),
    summary: Type.Optional(Type.String()),
    homeContext: Type.Optional(
      Type.Object(
        {
          presence: Type.Optional(
            Type.Union([
              Type.Literal("home"),
              Type.Literal("away"),
              Type.Literal("unknown"),
            ]),
          ),
          timezone: Type.Optional(Type.String()),
          locale: Type.Optional(Type.String()),
        },
        { additionalProperties: false },
      ),
    ),
    privacy: Type.Object(
      {
        redactFaces: Type.Boolean(),
        retainFrame: Type.Boolean(),
      },
      { additionalProperties: false },
    ),
  },
  { additionalProperties: false },
);

export type BoundingBox = Static<typeof BoundingBoxSchema>;
export type Detection = Static<typeof DetectionSchema>;
export type OCRSpan = Static<typeof OCRSpanSchema>;
export type UserEvent = Static<typeof UserEventSchema>;
export type VisualObservationEvent = Static<typeof VisualObservationEventSchema>;
