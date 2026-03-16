import type { ActionEnvelope, VisualObservationEvent } from "../../../packages/contracts/src/index.ts";

type PendingAction = {
  sessionId: string;
  observationId: string;
  panelId: string;
  buttonId: string;
  service: {
    domain: string;
    service: string;
    entityId?: string;
    data?: Record<string, unknown>;
  };
  observation: VisualObservationEvent;
};

function confirmKey(
  sessionId: string,
  observationId: string,
  panelId: string,
  buttonId: string,
) {
  return `${sessionId}:${observationId}:${panelId}:${buttonId}`;
}

export class TransientMemoryStore {
  private readonly pendingByKey = new Map<string, PendingAction>();
  private readonly confirmedByKey = new Map<string, ActionEnvelope>();

  savePending(action: PendingAction) {
    this.pendingByKey.set(
      confirmKey(action.sessionId, action.observationId, action.panelId, action.buttonId),
      action,
    );
  }

  getPending(sessionId: string, observationId: string, panelId: string, buttonId: string) {
    return this.pendingByKey.get(confirmKey(sessionId, observationId, panelId, buttonId));
  }

  saveConfirmed(
    sessionId: string,
    observationId: string,
    panelId: string,
    buttonId: string,
    envelope: ActionEnvelope,
  ) {
    const key = confirmKey(sessionId, observationId, panelId, buttonId);
    this.pendingByKey.delete(key);
    this.confirmedByKey.set(key, envelope);
  }

  getConfirmed(sessionId: string, observationId: string, panelId: string, buttonId: string) {
    return this.confirmedByKey.get(confirmKey(sessionId, observationId, panelId, buttonId));
  }

  hasPendingActions() {
    return this.pendingByKey.size > 0;
  }
}
