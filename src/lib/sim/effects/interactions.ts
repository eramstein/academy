import { gs } from '@/lib/_state';
import { getInteractionTemplate, runInteraction } from '../interactions';

export interface StartInteractionParameters {
  characterKey: string;
  interactionKey: string;
  /** Replaces the template's default situation for this session. */
  situation: string;
}

/** Opens a structured social interaction; the runner narrates the opening beat. */
export function startInteraction(parameters: StartInteractionParameters): string {
  const { characterKey, interactionKey, situation } = parameters;
  const character = gs.characters[characterKey];
  if (!character) {
    return `Invalid character key: ${characterKey}.`;
  }
  if (!getInteractionTemplate(interactionKey)) {
    return `Invalid interaction key: ${interactionKey}.`;
  }
  const override = typeof situation === 'string' ? situation.trim() : '';
  if (!override) {
    return `Situation is required.`;
  }
  // Fire-and-forget: same as clicking an Interact button. Sync setup claims
  // gs.scene.interaction before the first await so selectOption won't wipe it.
  void runInteraction({
    characterKey,
    interactionKey,
    situation: override,
  });
  return '';
}
