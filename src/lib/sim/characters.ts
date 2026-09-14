import { CharacterGender, type Character, type Npc } from '../_model';
import { gs } from '../_state';

export function getActingCharacter(characterKey = 'player'): Character {
  if (characterKey === 'player' || characterKey === gs.player.key) {
    return gs.player;
  }
  return gs.characters[characterKey] ?? gs.player;
}

export function getCharactersAtScene() {
  return Object.values(gs.characters).filter((c) => c.placeKey === gs.player.placeKey);
}

export function getCharacterPronoun(character: Npc) {
  switch (character.gender) {
    case CharacterGender.Male:
      return 'he';
    case CharacterGender.Female:
      return 'she';
    case CharacterGender.Other:
      return 'it';
  }
}

export function getCharacterPossessivePronoun(character: Npc) {
  switch (character.gender) {
    case CharacterGender.Male:
      return 'his';
    case CharacterGender.Female:
      return 'her';
    case CharacterGender.Other:
      return 'its';
  }
}
