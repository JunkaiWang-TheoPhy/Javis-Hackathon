import type {
  NotificationDispatchResponse,
  OutboundMessageIntent,
} from "../../../../packages/contracts/src/index.ts";

const DEFAULT_NOTIFICATION_ROUTER_BASE_URL = "http://127.0.0.1:3302";

function resolveNotificationRouterBaseUrl() {
  return (
    process.env.MIRA_NOTIFICATION_ROUTER_BASE_URL ??
    DEFAULT_NOTIFICATION_ROUTER_BASE_URL
  ).replace(/\/+$/, "");
}

export async function dispatchOutboundIntent(
  intent: OutboundMessageIntent,
): Promise<NotificationDispatchResponse> {
  const response = await fetch(`${resolveNotificationRouterBaseUrl()}/v1/dispatch`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ intent }),
  });

  const body = await response.json() as NotificationDispatchResponse | { error?: string };
  if (!response.ok) {
    throw new Error(
      `Notification router dispatch failed (${response.status}): ${
        "error" in body && typeof body.error === "string" ? body.error : JSON.stringify(body)
      }`,
    );
  }

  return body as NotificationDispatchResponse;
}
