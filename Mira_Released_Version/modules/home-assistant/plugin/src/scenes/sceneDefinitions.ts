export type SceneSelector = {
  role: string;
  required?: boolean;
  maxCount?: number;
};

export type SceneActionTemplate = {
  role: string;
  intent: string;
  fixedPayload?: Record<string, unknown>;
  valueFromContext?: string;
  fallbackValue?: unknown;
};

export type SceneNotificationTemplate = {
  message_kind: "reminder" | "checkin" | "summary" | "alert" | "escalation";
  recipient_scope: "self" | "known_contact" | "caregiver" | "group";
  contentTemplate: string;
};

export type SceneDefinition = {
  id: string;
  description: string;
  preconditions: Array<{
    field: string;
    equals?: unknown;
    min?: number;
  }>;
  selectors: SceneSelector[];
  actionTemplates: SceneActionTemplate[];
  optionalNotifications?: SceneNotificationTemplate[];
};

const SCENE_DEFINITIONS: SceneDefinition[] = [
  {
    id: "arrival_cooling",
    description: "Cool the home environment after arrival, especially after exercise or elevated heart rate.",
    preconditions: [
      { field: "atHome", equals: true },
    ],
    selectors: [
      { role: "cooling.primary_fan", required: true, maxCount: 1 },
      { role: "cooling.primary_climate", required: true, maxCount: 1 },
      { role: "mood.arrival_audio", required: false, maxCount: 1 },
      { role: "lighting.arrival_scene", required: false, maxCount: 1 },
    ],
    actionTemplates: [
      { role: "cooling.primary_fan", intent: "turn_on" },
      { role: "cooling.primary_climate", intent: "set_hvac_mode", fixedPayload: { value: "cool" } },
      { role: "cooling.primary_climate", intent: "set_temperature", valueFromContext: "targetTemperatureC", fallbackValue: 23 },
      { role: "mood.arrival_audio", intent: "play_media", fixedPayload: { value: "arrival_playlist" } },
      { role: "lighting.arrival_scene", intent: "activate" },
    ],
    optionalNotifications: [
      {
        message_kind: "alert",
        recipient_scope: "self",
        contentTemplate: "Arrival cooling scene is ready.",
      },
    ],
  },
];

export function getSceneDefinition(sceneId: string) {
  return SCENE_DEFINITIONS.find((definition) => definition.id === sceneId) ?? null;
}

export function listSceneDefinitions() {
  return [...SCENE_DEFINITIONS];
}
