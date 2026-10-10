import type { Npc } from '@/lib/_model';
import { gs } from '@/lib/_state';

export interface ChangeRelationParameters {
  characterKey: string;
  relationParameter: keyof Npc['relationProgress'];
  amount: number;
}

export function changeRelation(parameters: ChangeRelationParameters): string {
  const { characterKey, relationParameter, amount } = parameters;
  const character = gs.characters[characterKey];
  if (!character) {
    return `Invalid character key: ${characterKey}.`;
  }
  character.relationProgress[relationParameter] += amount;
  const direction = amount >= 0 ? 'improves' : 'worsens';
  return `Your ${relationParameter} with ${character.name} ${direction}.`;
}
