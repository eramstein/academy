import { gs } from '../_state';

export function getCharactersAtScene() {
  return Object.values(gs.characters).filter((c) => c.placeKey === gs.player.placeKey);
}
