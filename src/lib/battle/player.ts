import { config } from '../_config';
import type { CardColor, Player } from '../_model';
import { bs, uiState } from '../_state';
import { soundManager } from './sound';
import { checkIfPlayerLost } from './win';

export function damagePlayer(player: Player, damage: number) {
  player.life -= damage;
  checkIfPlayerLost(player);
  if (player.life > config.initialLife) {
    player.life = config.initialLife;
  }
}

export function getOpposingPlayer(playerId: number): Player {
  return playerId === 0 ? bs.players[1] : bs.players[0];
}

export function isHumanPlayer(playerId: number): boolean {
  return playerId === 0;
}

export function getHumanPlayer(): Player {
  return bs.players[0];
}

export function getAiPlayer(): Player {
  return bs.players[1];
}

export function untapPlayer(player: Player) {
  player.abilityUsed = false;
}

export function incrementColor(player: Player, color: CardColor, value: number) {
  player.colors[color] = (player.colors[color] || 0) + value;
  if (!uiState.isHeadless) {
    // Trigger animation
    uiState.battle.colorBeingIncremented = color;
    // Reset animation after a short delay
    setTimeout(() => {
      uiState.battle.colorBeingIncremented = null;
    }, 500);
  }
}

export function usePlayerColorAbility(player: Player, color: CardColor) {
  if (player.colors[color] === undefined || player.abilityUsed) {
    return;
  }
  if (!uiState.isHeadless) soundManager.playSound('button2');
  incrementColor(player, color, 1);
  player.abilityUsed = true;
}

export function addMana(player: Player, amount: number) {
  player.mana += amount;
}
