import { CardColor, type Character, type UnitKeywords } from '@/lib/_model';
import { gs } from '@/lib/_state';
import { getRandomFromArray } from '@/lib/_utils/random';
import { ACTION_TEMPLATE_KEYS, getActionTemplateMeta } from '../cards/action-templates';
import { formatKeywordLabel, KEYWORD_KEYS } from '../cards/keywords';
import { getActingCharacter } from '../characters';
import { narrateText } from '../narration';
import { getDeck } from './decks';

const BASE_DECK_KEY_BY_COLOR: Record<CardColor, string> = {
  [CardColor.Red]: 'base_red',
  [CardColor.Black]: 'base_black',
  [CardColor.Green]: 'base_green',
  [CardColor.Blue]: 'base_blue',
};

export interface TeachColorParameters {
  color?: CardColor;
  characterKey?: string;
}

export function teachColor(parameters: TeachColorParameters): string {
  const { color: requestedColor, characterKey } = parameters;

  // Explicit color: teach that color to the learner (characterKey, default player).
  if (requestedColor && Object.values(CardColor).includes(requestedColor)) {
    return bumpColor(requestedColor, characterKey ?? 'player');
  }

  // No color + characterKey: study from that character (teacher) onto the player.
  if (characterKey) {
    const resolved = pickColorFromCharacter(characterKey);
    if (typeof resolved === 'string') {
      return resolved;
    }
    const { color, characterName: teacherName } = resolved;
    bumpColor(color, 'player');

    let gaveDeck = false;
    if (!playerOwnsColorCard(color)) {
      const deckKey = BASE_DECK_KEY_BY_COLOR[color];
      if (deckKey) {
        // getDeck sets the color to 1; keep the level we just taught.
        const level = gs.player.craftingKnowledge.colors![color]!;
        getDeck({ deckKey });
        gs.player.craftingKnowledge.colors![color] = level;
        gaveDeck = true;
      }
    }

    const label = formatKeywordLabel(color);
    const cardsClause = gaveDeck ? ' and gave you some spare cards to get you started' : '';
    narrateText(`${teacherName} taught you ${label}${cardsClause}.`);
    return '';
  }

  return `Invalid color: ${requestedColor}.`;
}

function pickColorFromCharacter(
  characterKey: string
): { color: CardColor; characterName: string } | string {
  const character = gs.characters[characterKey];
  if (!character) {
    return `Invalid character key: ${characterKey}.`;
  }
  const known = Object.entries(character.craftingKnowledge.colors ?? {})
    .filter(([, level]) => (level ?? 0) >= 1)
    .map(([c]) => c as CardColor);
  if (!known.length) {
    return `${character.name} does not know any colors.`;
  }
  const playerColors = gs.player.craftingKnowledge.colors ?? {};
  const unknownToPlayer = known.filter((c) => (playerColors[c] ?? 0) < 1);
  return {
    color: getRandomFromArray(unknownToPlayer.length ? unknownToPlayer : known),
    characterName: character.name,
  };
}

function bumpColor(color: CardColor, characterKey = 'player'): string {
  const learner = resolveLearner(characterKey);
  if (typeof learner === 'string') {
    return learner;
  }
  if (!learner.character.craftingKnowledge.colors) {
    learner.character.craftingKnowledge.colors = {};
  }
  const previous = learner.character.craftingKnowledge.colors[color] ?? 0;
  const level = previous + 1;
  learner.character.craftingKnowledge.colors[color] = level;
  return formatKnowledgeMessage(learner, formatKeywordLabel(color), previous, level);
}

function playerOwnsColorCard(color: CardColor): boolean {
  return gs.player.collection.some((card) => card.colors?.some((entry) => entry.color === color));
}

export interface TeachAbilityParameters {
  ability?: string;
  characterKey?: string;
}

const ABILITY_POOL: string[] = [...KEYWORD_KEYS, ...ACTION_TEMPLATE_KEYS];

export function teachAbility(parameters: TeachAbilityParameters = {}): string {
  const { ability: requested, characterKey } = parameters;

  let ability: string;
  let learnerKey = 'player';

  if (requested?.trim()) {
    // Explicit ability: teach it to the learner (characterKey, default player).
    ability = requested.trim();
    learnerKey = characterKey ?? 'player';
  } else if (characterKey) {
    // No ability + characterKey: study from that character (teacher) onto the player.
    const pool = knownAbilitiesForCharacter(characterKey);
    if (typeof pool === 'string') {
      return pool;
    }
    ability = getRandomFromArray(pool);
    learnerKey = 'player';
  } else {
    ability = getRandomFromArray(ABILITY_POOL);
  }

  if (KEYWORD_KEYS.includes(ability as keyof UnitKeywords)) {
    return bumpKeyword(ability as keyof UnitKeywords, learnerKey);
  }
  if (ACTION_TEMPLATE_KEYS.includes(ability)) {
    return bumpAction(ability, learnerKey);
  }
  return `Invalid ability: ${ability}.`;
}

function knownAbilitiesForCharacter(characterKey: string): string[] | string {
  const character = gs.characters[characterKey];
  if (!character) {
    return `Invalid character key: ${characterKey}.`;
  }
  const keywords = Object.entries(character.craftingKnowledge.keywords ?? {})
    .filter(([, level]) => (level ?? 0) >= 1)
    .map(([key]) => key);
  const actions = Object.entries(character.craftingKnowledge.actions ?? {})
    .filter(([, level]) => (level ?? 0) >= 1)
    .map(([key]) => key);
  const pool = [...keywords, ...actions];
  if (!pool.length) {
    return `${character.name} does not know any abilities.`;
  }
  return pool;
}

function bumpKeyword(keyword: keyof UnitKeywords, characterKey = 'player'): string {
  const learner = resolveLearner(characterKey);
  if (typeof learner === 'string') {
    return learner;
  }
  if (!learner.character.craftingKnowledge.keywords) {
    learner.character.craftingKnowledge.keywords = {};
  }
  const previous = learner.character.craftingKnowledge.keywords[keyword] ?? 0;
  const level = previous + 1;
  learner.character.craftingKnowledge.keywords[keyword] = level;
  return formatKnowledgeMessage(learner, formatKeywordLabel(keyword), previous, level);
}

function bumpAction(actionName: string, characterKey = 'player'): string {
  const learner = resolveLearner(characterKey);
  if (typeof learner === 'string') {
    return learner;
  }
  if (!learner.character.craftingKnowledge.actions) {
    learner.character.craftingKnowledge.actions = {};
  }
  const previous = learner.character.craftingKnowledge.actions[actionName] ?? 0;
  const level = previous + 1;
  learner.character.craftingKnowledge.actions[actionName] = level;
  const label = getActionTemplateMeta(actionName)?.label ?? formatKeywordLabel(actionName);
  return formatKnowledgeMessage(learner, label, previous, level);
}

type Learner = { character: Character; isPlayer: boolean; name: string };

function resolveLearner(characterKey = 'player'): Learner | string {
  if (characterKey !== 'player' && characterKey !== gs.player.key && !gs.characters[characterKey]) {
    return `Invalid character key: ${characterKey}.`;
  }
  const character = getActingCharacter(characterKey);
  const isPlayer = character.key === gs.player.key;
  const name = isPlayer
    ? 'You'
    : character.name?.trim() ||
      characterKey.charAt(0).toUpperCase() + characterKey.slice(1);
  return { character, isPlayer, name };
}

function formatKnowledgeMessage(
  learner: Learner,
  label: string,
  previous: number,
  level: number
): string {
  if (previous < 1) {
    return learner.isPlayer ? `You learn ${label}.` : `${learner.name} learns ${label}.`;
  }
  return learner.isPlayer
    ? `You raise your ${label} knowledge to ${level}.`
    : `${learner.name} raises their ${label} knowledge to ${level}.`;
}
