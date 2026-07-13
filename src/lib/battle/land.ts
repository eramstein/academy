import type { Land, Player } from '../_model';
import { bs } from '../_state';
import { onLandDestroyed } from './listeners';

// lands open a color by setting it to 0, the player then has to increase it otherwise
export function initColorsFromLands(player: Player) {
  player.lands.forEach((land) => {
    land.colors.forEach((color) => {
      player.colors[color.color] = 0;
    });
  });
}

export function damageLand(land: Land, damage: number) {
  land.health -= damage;
  if (land.health <= 0) {
    destroyLand(land);
    return true;
  }
  return false;
}

export function destroyLand(land: Land) {
  onLandDestroyed(land);
  land.isRuined = true;
  land.abilities = land.ruinsAbilities;
}

export function getAllLands(): Land[] {
  return bs.players.flatMap((p) => p.lands);
}

export function fortifyLand(land: Land, amount: number) {
  land.health += amount;
}
