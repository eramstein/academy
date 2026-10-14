import { getSceneEventByKey } from '../events';
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
