/**
 * Lingzhu plugin configuration for the release-safe core bridge package.
 */
export interface LingzhuConfig {
  enabled?: boolean;
  authAk?: string;
  agentId?: string;
  includeMetadata?: boolean;
  requestTimeoutMs?: number;
  systemPrompt?: string;
  defaultNavigationMode?: "0" | "1" | "2";
  enableFollowUp?: boolean;
  followUpMaxCount?: number;
  maxImageBytes?: number;
  sessionMode?: "per_user" | "shared_agent" | "per_message";
  sessionNamespace?: string;
  debugLogging?: boolean;
  debugLogPayloads?: boolean;
  debugLogDir?: string;
  enableExperimentalNativeActions?: boolean;
  memoryContextEnabled?: boolean;
  memoryContextUrl?: string;
  memoryContextAudience?: "auto" | "direct" | "shared";
  memoryContextTimeoutMs?: number;
  memoryContextWorkingLimit?: number;
  memoryContextFactLimit?: number;
}

/**
 * Lingzhu request message format.
 */
export interface LingzhuMessage {
  role: "user" | "agent";
  type: "text" | "image";
  text?: string;
  content?: string;
  image_url?: string;
  attachments?: Array<{
    type?: string;
    path?: string;
    url?: string;
    image_url?: string;
    content?: string;
    dataUrl?: string;
  }>;
}

/**
 * Lingzhu device and runtime context envelope.
 */
export interface LingzhuContext {
  location?: string;
  latitude?: string;
  longitude?: string;
  weather?: string;
  battery?: string;
  currentTime?: string;
  lang?: string;
  company_id?: number;
  runningApp?: string;
}

export interface LingzhuMetadataEnvelope {
  context?: LingzhuContext;
  [key: string]: unknown;
}

/**
 * Lingzhu inbound request payload.
 */
export interface LingzhuRequest {
  message_id: string;
  agent_id: string;
  message: LingzhuMessage[];
  user_id?: string;
  metadata?: LingzhuContext | LingzhuMetadataEnvelope;
}

/**
 * Lingzhu-native tool call envelope.
 */
export interface LingzhuToolCall {
  handling_required: boolean;
  command:
  | "take_photo"
  | "take_navigation"
  | "notify_agent_off"
  | "control_calendar"
  | "send_notification"
  | "send_toast"
  | "speak_tts"
  | "start_video_record"
  | "stop_video_record"
  | "open_custom_view";
  is_recall?: boolean;
  action?: string;
  poi_name?: string;
  navi_type?: string;
  title?: string;
  start_time?: string;
  end_time?: string;
  content?: string;
  play_tts?: boolean;
  icon_type?: string;
  duration_sec?: number;
  width?: number;
  height?: number;
  quality?: number;
  view_name?: string;
  view_payload?: string;
}

/**
 * Lingzhu SSE response payload.
 */
export interface LingzhuSSEData {
  role: "agent";
  type: "answer" | "tool_call" | "follow_up";
  answer_stream?: string;
  message_id: string;
  agent_id: string;
  is_finish: boolean;
  follow_up?: string[];
  tool_call?: LingzhuToolCall;
}
