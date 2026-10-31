import { isUnitCard, type Card, type Player, type Position, type UnitCard } from '../_model';
import { bs } from '../_state';
import { shuffleDeck } from './deck';
import { onDeployUnit } from './listeners';
import { soundManager } from './sound';
import { makeDeployedUnit } from './unit';

export function getAllGraveyardsCards(): Card[] {
  return bs.players.flatMap((p) => p.graveyard);
}

export function getAllGraveyardsUnits(): UnitCard[] {
  return bs.players.flatMap((p) => p.graveyard.filter(isUnitCard) as UnitCard[]);
}

/** Dead units keep board fields (`hasAttacked`, `position`); membership is the reliable check. */
export function findGraveyardOwnerPlayerId(instanceId: string): number | null {
  for (const player of bs.players) {
    if (player.graveyard.some((c) => c.instanceId === instanceId)) return player.id;
  }
  return null;
}

export function reanimate(card: UnitCard, position: Position) {
  const player = bs.players[card.ownerPlayerId];
  if (player) {
    player.graveyard.splice(player.graveyard.indexOf(card), 1);
    bs.units.push(makeDeployedUnit(card, position));
    const deployedUnit = bs.units[bs.units.length - 1];
    soundManager.playDeploySound();
    onDeployUnit(deployedUnit);
  }
}

// graveyard to hand
export function regrowCard(cardInstanceId: string, player: Player) {
  const card = player.graveyard.find((c) => c.instanceId === cardInstanceId);
  if (!card) return;
  player.graveyard = player.graveyard.filter((c) => c.instanceId !== cardInstanceId);
  player.hand.push(card);
}

// graveyard to deck
export function recycleCard(cardInstanceId: string, player: Player) {
  const card = player.graveyard.find((c) => c.instanceId === cardInstanceId);
  if (!card) return;
  player.graveyard = player.graveyard.filter((c) => c.instanceId !== cardInstanceId);
  player.deck.push(card);
  player.deck = shuffleDeck(player.deck);
}
