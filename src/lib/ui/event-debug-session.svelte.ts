import { uiState } from '../_state/state-ui.svelte';
import {
  applyEventDebugSetup,
  formatSimulatedMessage,
  type EventDebugPlan,
} from '../sim/event-debug';
import { simulateEvent } from '../sim/scene';

export const eventDebugSession = $state({
  plan: null as EventDebugPlan | null,
  enabled: {} as Record<string, boolean>,
});

export function openEventDebug(plan: EventDebugPlan) {
  eventDebugSession.plan = plan;
  eventDebugSession.enabled = Object.fromEntries(
    plan.toggles.map((toggle) => [toggle.id, toggle.defaultOn])
  );
}

export function closeEventDebug() {
  eventDebugSession.plan = null;
  eventDebugSession.enabled = {};
}

export function confirmEventDebug(applySetup: boolean): { ok: boolean; message: string } {
  const plan = eventDebugSession.plan;
  if (!plan) return { ok: false, message: 'No event selected' };
  const enabled = Object.entries(eventDebugSession.enabled)
    .filter(([, on]) => on)
    .map(([id]) => id);
  const notes = applySetup ? applyEventDebugSetup(plan, enabled) : [];
  const notices = plan.notices;
  const eventKey = plan.eventKey;
  const message = formatSimulatedMessage(eventKey, notes, notices);
  let result = { ok: false, message: `Event not found: ${eventKey}` };
  try {
    if (simulateEvent(eventKey)) result = { ok: true, message };
  } finally {
    closeEventDebug();
    uiState.consoleCommand.visible = false;
  }
  return result;
}
