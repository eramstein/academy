import { gs } from '@/lib/_state';
import { getSceneEventByKey, rebuildWorkingEventTemplates } from '../events';
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
 * it from the working set (and any parked period / follow-up slots).
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
  if (gs.scene.pendingOfferedEventKey === eventKey) {
    gs.scene.pendingOfferedEventKey = undefined;
  }
  if (gs.scene.periodEventOffer) {
    const remaining = gs.scene.periodEventOffer.events.filter((event) => event.eventKey !== eventKey);
    gs.scene.periodEventOffer =
      remaining.length > 0 ? { ...gs.scene.periodEventOffer, events: remaining } : undefined;
  }
  if (gs.scene.pendingFollowUpEvents?.length) {
    const remaining = gs.scene.pendingFollowUpEvents.filter((key) => key !== eventKey);
    gs.scene.pendingFollowUpEvents = remaining.length ? remaining : undefined;
  }

  // Silent: author with narrate when the player should notice.
  return '';
}
