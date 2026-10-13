import { gs } from '@/lib/_state';

export interface UseFocusParameters {
  amount: number;
}

export function useFocus(parameters: UseFocusParameters): string {
  const { amount } = parameters;
  if (typeof gs.player.maxFocus !== 'number') {
    gs.player.maxFocus = 3;
  }
  if (typeof gs.player.focus !== 'number') {
    gs.player.focus = gs.player.maxFocus;
  }
  const spent = Math.max(0, Math.min(amount, gs.player.focus));
  if (spent > 0) {
    gs.player.focus -= spent;
  }
  return `You use ${spent} focus.`;
}
