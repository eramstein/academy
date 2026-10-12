import { gs } from '@/lib/_state';

export interface AddGoldParameters {
  amount: number;
}

export function addGold(parameters: AddGoldParameters): string {
  const { amount } = parameters;
  gs.player.gold += amount;
  const verb = amount > 0 ? 'gain' : 'spend';
  return `You ${verb} ${amount} gold.`;
}
