import { gs } from '@/lib/_state';
import {
  getManualSceneTriggers,
  getSceneEventByKey,
  rebuildWorkingEventTemplates,
} from '../events';
import { setEvent } from '../scene';

export interface FollowUpEventParameters {
  eventKey: string;
}

export function followUpEvent(parameters: FollowUpEventParameters): string {
  const { eventKey } = parameters;
  const resolved = getSceneEventByKey(eventKey);
  if (!resolved) {
    return `Invalid event key: ${eventKey}.`;
  }
  setEvent(resolved.event, resolved.template);
  // setEvent already narrates the follow-up text
  return '';
}

export interface InvalidateEventParameters {
  eventKey: string;
}

/**
 * Marks an event as consumed without playing it: stamps its story tag and drops
 * it from the working set (and any parked period / follow-up / manual slots).
 */
export function invalidateEvent(parameters: InvalidateEventParameters): string {
  const { eventKey } = parameters;
  const resolved = getSceneEventByKey(eventKey);
  if (!resolved) {
    return `Invalid event key: ${eventKey}.`;
  }
  if (!gs.storyTags) {
    gs.storyTags = {};
  }
  if ((gs.storyTags[eventKey] ?? 0) <= 0) {
    gs.storyTags[eventKey] = 1;
  }
  rebuildWorkingEventTemplates();

  if (gs.scene.pendingPeriodEvent?.eventKey === eventKey) {
    gs.scene.pendingPeriodEvent = undefined;
  }
  if (gs.scene.pendingFollowUpEvents?.length) {
    const remaining = gs.scene.pendingFollowUpEvents.filter((key) => key !== eventKey);
    gs.scene.pendingFollowUpEvents = remaining.length ? remaining : undefined;
  }
  gs.scene.manualTriggers = getManualSceneTriggers();

  // Silent: author with narrate when the player should notice.
  return '';
}
