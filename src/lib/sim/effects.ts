import { EventEffectType, type EventEffect } from '../_model';
import { subscribe } from './effects/subscribe';
import { narrateText } from './narration';
import type { TransactionSubscriptionParameters } from './effects/subscribe';
import { getDeck, type GetDeckParameters } from './effects/decks';

export function applyEffect(effect: EventEffect) {
  const result = effectFunctions[effect.type](effect.parameters);
  narrateText(result);
}

const effectFunctions: Record<EventEffectType, (parameters: Record<string, any>) => string> = {
  [EventEffectType.GetDeck]: (parameters) => getDeck(parameters as GetDeckParameters),
  [EventEffectType.Subscribe]: (parameters) =>
    subscribe(parameters as TransactionSubscriptionParameters),
};
