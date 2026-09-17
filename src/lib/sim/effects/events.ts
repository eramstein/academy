import { unlockEventTemplate } from '../events';

export interface UnlockEventParameters {
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
