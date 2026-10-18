import { gs } from '@/lib/_state';
import { getActingCharacter } from '../characters';

export interface AddGoldParameters {
  amount: number;
  /** Defaults to the player. */
  characterKey?: string;
}

export function addGold(parameters: AddGoldParameters): string {
  const { amount, characterKey = 'player' } = parameters;

  if (characterKey !== 'player' && characterKey !== gs.player.key && !gs.characters[characterKey]) {
    return `Invalid character key: ${characterKey}.`;
  }

  const character = getActingCharacter(characterKey);
  character.gold += amount;
  const verb = amount > 0 ? 'gain' : 'spend';

  if (character.key === gs.player.key) {
    return `You ${verb} ${Math.abs(amount)} gold.`;
  }
  return `${character.name} ${verb === 'gain' ? 'gains' : 'spends'} ${Math.abs(amount)} gold.`;
}
