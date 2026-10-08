import { CardColor, type UnitKeywords } from '@/lib/_model';
import { gs } from '@/lib/_state';
import { getRandomFromArray } from '@/lib/_utils/random';
import { ACTION_TEMPLATE_KEYS, getActionTemplateMeta } from '../cards/action-templates';
import { formatKeywordLabel, KEYWORD_KEYS } from '../cards/keywords';
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

  let color: CardColor;
  let teacherName: string | undefined;
  if (characterKey) {
    const resolved = pickColorFromCharacter(characterKey);
    if (typeof resolved === 'string') {
      return resolved;
    }
    color = resolved.color;
    teacherName = resolved.characterName;
  } else if (requestedColor && Object.values(CardColor).includes(requestedColor)) {
    color = requestedColor;
  } else {
    return `Invalid color: ${requestedColor}.`;
  }

  const teachText = bumpColor(color);

  let gaveDeck = false;
  if (characterKey && !playerOwnsColorCard(color)) {
    const deckKey = BASE_DECK_KEY_BY_COLOR[color];
    if (deckKey) {
      // getDeck sets the color to 1; keep the level we just taught.
      const level = gs.player.craftingKnowledge.colors![color]!;
      getDeck({ deckKey });
      gs.player.craftingKnowledge.colors![color] = level;
      gaveDeck = true;
    }
  }

  if (characterKey && teacherName) {
    const label = formatKeywordLabel(color);
    const cardsClause = gaveDeck ? ' and gave you some spare cards to get you started' : '';
    narrateText(`${teacherName} taught you ${label}${cardsClause}.`);
    return '';
  }

  return teachText;
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

function bumpColor(color: CardColor): string {
  if (!gs.player.craftingKnowledge.colors) {
    gs.player.craftingKnowledge.colors = {};
  }
  const previous = gs.player.craftingKnowledge.colors[color] ?? 0;
  const level = previous + 1;
  gs.player.craftingKnowledge.colors[color] = level;
  const label = formatKeywordLabel(color);
  if (previous < 1) {
    return `You learn ${label}.`;
  }
  return `You raise your ${label} knowledge to ${level}.`;
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
  if (requested?.trim()) {
    ability = requested.trim();
  } else if (characterKey) {
    const pool = knownAbilitiesForCharacter(characterKey);
    if (typeof pool === 'string') {
      return pool;
    }
    ability = getRandomFromArray(pool);
  } else {
    ability = getRandomFromArray(ABILITY_POOL);
  }

  if (KEYWORD_KEYS.includes(ability as keyof UnitKeywords)) {
    return bumpKeyword(ability as keyof UnitKeywords);
  }
  if (ACTION_TEMPLATE_KEYS.includes(ability)) {
    return bumpAction(ability);
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

function bumpKeyword(keyword: keyof UnitKeywords): string {
  if (!gs.player.craftingKnowledge.keywords) {
    gs.player.craftingKnowledge.keywords = {};
  }
  const previous = gs.player.craftingKnowledge.keywords[keyword] ?? 0;
  const level = previous + 1;
  gs.player.craftingKnowledge.keywords[keyword] = level;
  const label = formatKeywordLabel(keyword);
  if (previous < 1) {
    return `You learn ${label}.`;
  }
  return `You raise your ${label} knowledge to ${level}.`;
}

function bumpAction(actionName: string): string {
  if (!gs.player.craftingKnowledge.actions) {
    gs.player.craftingKnowledge.actions = {};
  }
  const previous = gs.player.craftingKnowledge.actions[actionName] ?? 0;
  const level = previous + 1;
  gs.player.craftingKnowledge.actions[actionName] = level;
  const label = getActionTemplateMeta(actionName)?.label ?? formatKeywordLabel(actionName);
  if (previous < 1) {
    return `You learn ${label}.`;
  }
  return `You raise your ${label} knowledge to ${level}.`;
}
