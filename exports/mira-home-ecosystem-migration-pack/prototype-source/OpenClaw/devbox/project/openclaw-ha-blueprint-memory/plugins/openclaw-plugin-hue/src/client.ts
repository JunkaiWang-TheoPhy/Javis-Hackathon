export type HueConfig = {
  baseUrl: string;
  applicationKey: string;
  bridgeId?: string;
  defaultTransitionMs?: number;
};

type HueResponse<T> = {
  data?: T[];
  errors?: Array<Record<string, unknown>>;
};

type HueResource = {
  id: string;
  type: string;
  [key: string]: unknown;
};

export function normalizeHueBaseUrl(raw: string): string {
  const trimmed = raw.replace(/\/+$/, "");
  if (trimmed.endsWith("/clip/v2")) {
    return trimmed;
  }
  return `${trimmed}/clip/v2`;
}

export function extractHueResources<T extends HueResource>(
  payload: HueResponse<T>,
  expectedType?: string,
): T[] {
  const data = Array.isArray(payload?.data) ? payload.data : [];
  return expectedType ? data.filter((item) => item.type === expectedType) : data;
}

async function readJson<T>(response: Response): Promise<T> {
  const text = await response.text();
  return text ? (JSON.parse(text) as T) : ({} as T);
}

export type HueLightControl = {
  power?: "on" | "off";
  brightness?: number;
  transitionMs?: number;
};

export class HueBridgeClient {
  constructor(private readonly cfg: HueConfig) {}

  private async requestJson<T>(path: string, init?: RequestInit): Promise<T> {
    const response = await fetch(`${normalizeHueBaseUrl(this.cfg.baseUrl)}${path}`, {
      ...init,
      headers: {
        "hue-application-key": this.cfg.applicationKey,
        "Content-Type": "application/json",
        ...(init?.headers ?? {}),
      },
    });

    if (!response.ok) {
      throw new Error(`Hue ${(init?.method ?? "GET").toUpperCase()} ${path} failed (${response.status})`);
    }

    return readJson<T>(response);
  }

  async getBridge() {
    const payload = await this.requestJson<HueResponse<HueResource>>("/resource/bridge");
    return extractHueResources(payload, "bridge")[0] ?? null;
  }

  async listLights() {
    const payload = await this.requestJson<HueResponse<HueResource>>("/resource/light");
    return extractHueResources(payload, "light");
  }

  async listScenes() {
    const payload = await this.requestJson<HueResponse<HueResource>>("/resource/scene");
    return extractHueResources(payload, "scene");
  }

  async setLightState(lightId: string, control: HueLightControl) {
    const body: Record<string, unknown> = {};
    if (control.power) {
      body.on = { on: control.power === "on" };
    }
    if (typeof control.brightness === "number") {
      body.dimming = { brightness: control.brightness };
    }

    const duration = control.transitionMs ?? this.cfg.defaultTransitionMs;
    if (typeof duration === "number") {
      body.dynamics = { duration };
    }

    return this.requestJson<HueResponse<HueResource>>(`/resource/light/${lightId}`, {
      method: "PUT",
      body: JSON.stringify(body),
    });
  }

  async activateScene(sceneId: string, transitionMs?: number) {
    const duration = transitionMs ?? this.cfg.defaultTransitionMs;
    const recall = typeof duration === "number"
      ? { action: "active", duration }
      : { action: "active" };

    return this.requestJson<HueResponse<HueResource>>(`/resource/scene/${sceneId}`, {
      method: "PUT",
      body: JSON.stringify({
        recall,
      }),
    });
  }
}
