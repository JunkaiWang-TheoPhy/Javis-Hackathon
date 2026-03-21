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
  {
    id: "post_workout_recovery",
    description: "Support cooling and recovery after a workout when the user is home.",
    preconditions: [
      { field: "atHome", equals: true },
      { field: "postWorkout", equals: true },
    ],
    selectors: [
      { role: "cooling.primary_fan", required: true, maxCount: 1 },
      { role: "cooling.primary_climate", required: true, maxCount: 1 },
      { role: "mood.arrival_audio", required: false, maxCount: 1 },
    ],
    actionTemplates: [
      { role: "cooling.primary_fan", intent: "turn_on" },
      { role: "cooling.primary_climate", intent: "set_hvac_mode", fixedPayload: { value: "cool" } },
      { role: "cooling.primary_climate", intent: "set_temperature", valueFromContext: "targetTemperatureC", fallbackValue: 22 },
      { role: "mood.arrival_audio", intent: "play_media", fixedPayload: { value: "recovery_playlist" } },
    ],
    optionalNotifications: [
      {
        message_kind: "checkin",
        recipient_scope: "self",
        contentTemplate: "Post-workout recovery scene is active.",
      },
    ],
  },
  {
    id: "quiet_evening",
    description: "Set a quiet evening home mode with lights, climate, and lock checks.",
    preconditions: [
      { field: "quietHours", equals: true },
    ],
    selectors: [
      { role: "lighting.quiet_evening", required: true, maxCount: 1 },
      { role: "sleep.quiet_climate", required: false, maxCount: 1 },
      { role: "security.entry_lock", required: false, maxCount: 1 },
    ],
    actionTemplates: [
      { role: "lighting.quiet_evening", intent: "activate" },
      { role: "sleep.quiet_climate", intent: "turn_on" },
      { role: "security.entry_lock", intent: "lock" },
    ],
    optionalNotifications: [
      {
        message_kind: "summary",
        recipient_scope: "self",
        contentTemplate: "Quiet evening scene is active.",
      },
    ],
  },
  {
    id: "high_heart_rate_response",
    description: "Respond to elevated heart rate at home with cooling and a private alert.",
    preconditions: [
      { field: "atHome", equals: true },
      { field: "heartRateBpm", min: 110 },
    ],
    selectors: [
      { role: "cooling.primary_fan", required: true, maxCount: 1 },
      { role: "cooling.primary_climate", required: true, maxCount: 1 },
    ],
    actionTemplates: [
      { role: "cooling.primary_fan", intent: "turn_on" },
      { role: "cooling.primary_climate", intent: "set_hvac_mode", fixedPayload: { value: "cool" } },
      { role: "cooling.primary_climate", intent: "set_temperature", valueFromContext: "targetTemperatureC", fallbackValue: 21 },
    ],
    optionalNotifications: [
      {
        message_kind: "alert",
        recipient_scope: "self",
        contentTemplate: "High heart rate response scene is active.",
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
