import { getSceneEventByKey, unlockEventTemplate } from '../events';
import { setEvent } from '../scene';

export interface UnlockEventParameters {
  eventKey: string;
}

export interface FollowUpEventParameters {
  eventKey: string;
}

export function unlockEvent(parameters: UnlockEventParameters): string {
  const { eventKey } = parameters;
  const unlocked = unlockEventTemplate(eventKey);
  if (!unlocked) {
    return `Invalid event key: ${eventKey}.`;
  }
  return `A new path opens.`;
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
