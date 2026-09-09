import type { Card, Player } from '../_model';
import { bs } from '../_state';
import { onCardDrawn } from './listeners';
import { soundManager } from './sound';

export function shuffleDeck(deck: Card[]): Card[] {
  return deck.sort(() => Math.random() - 0.5);
}

export function drawCard(player: Player) {
  const card = player.deck.shift();
  if (!card) {
    player.life--;
    return;
  }
  player.hand.push(card);
  onCardDrawn(player, card);
  if (player.isPlayer) {
    soundManager.playSound('draw');
  }
}

export function getAllDecksCards(): Card[] {
  return bs.players.flatMap((p) => p.deck);
}

export function tutorCard(cardInstanceId: string, player: Player) {
  const card = player.deck.find((c) => c.instanceId === cardInstanceId);
  if (!card) return;
  player.deck = player.deck.filter((c) => c.instanceId !== cardInstanceId);
  player.hand.push(card);
}

export function putToDeckBottom(card: Card, player: Player) {
  player.graveyard = player.graveyard.filter((c) => c.instanceId !== card.instanceId);
  player.deck.push(card);
}
