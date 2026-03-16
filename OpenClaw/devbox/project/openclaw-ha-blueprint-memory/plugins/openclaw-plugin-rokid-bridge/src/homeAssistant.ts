export class HomeAssistantClient {
  constructor(
    private readonly cfg: { baseUrl: string; token: string },
  ) {}

  async callService(
    domain: string,
    service: string,
    payload: Record<string, unknown>,
  ) {
    const response = await fetch(
      `${this.cfg.baseUrl.replace(/\/+$/, "")}/api/services/${domain}/${service}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.cfg.token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      },
    );

    if (!response.ok) {
      throw new Error(`HA call failed (${response.status}): ${await response.text()}`);
    }

    const text = await response.text();
    return text ? JSON.parse(text) : null;
  }
}
