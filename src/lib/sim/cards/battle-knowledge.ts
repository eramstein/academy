import {
  isSpellCard,
  isUnitCard,
  type Card,
  type Character,
  type CraftingKnowledgeGain,
  type UnitKeywords,
} from '@/lib/_model';
import { getRandomFromArray } from '@/lib/_utils/random';
import { getActionTemplateMeta, getActionTemplateNameForEffect } from './action-templates';
import { formatKeywordLabel } from './keywords';

type KnowledgePick =
  | { kind: 'keyword'; key: keyof UnitKeywords }
  | { kind: 'action'; key: string };

/** Keywords and action-template names practiced by playing these cards. */
export function knowledgePoolFromPlayedCards(cards: Card[]): KnowledgePick[] {
  const seen = new Set<string>();
  const pool: KnowledgePick[] = [];

  const add = (pick: KnowledgePick) => {
    const id = `${pick.kind}:${pick.key}`;
    if (seen.has(id)) return;
    seen.add(id);
    pool.push(pick);
  };

  for (const card of cards) {
    if (isUnitCard(card)) {
      for (const [key, value] of Object.entries(card.keywords ?? {}) as [
        keyof UnitKeywords,
        UnitKeywords[keyof UnitKeywords],
      ][]) {
        if (value) add({ kind: 'keyword', key });
      }
      for (const ability of card.abilities ?? []) {
        for (const action of ability.actions) {
          const name = getActionTemplateNameForEffect(action.effect.name);
          if (name) add({ kind: 'action', key: name });
        }
      }
    } else if (isSpellCard(card)) {
      for (const action of card.actions) {
        const name = getActionTemplateNameForEffect(action.effect.name);
        if (name) add({ kind: 'action', key: name });
      }
    }
  }

  return pool;
}

/**
 * Pick one keyword/action from cards played this match and bump craftingKnowledge.
 * Returns the gain for narration, or undefined if nothing to learn from.
 */
export function gainCraftingKnowledgeFromPlayedCards(
  character: Character,
  playedCards: Card[]
): CraftingKnowledgeGain | undefined {
  const pool = knowledgePoolFromPlayedCards(playedCards);
  if (!pool.length) return undefined;

  const pick = getRandomFromArray(pool);
  if (pick.kind === 'keyword') {
    if (!character.craftingKnowledge.keywords) {
      character.craftingKnowledge.keywords = {};
    }
    const previous = character.craftingKnowledge.keywords[pick.key] ?? 0;
    const level = previous + 1;
    character.craftingKnowledge.keywords[pick.key] = level;
    return {
      kind: 'keyword',
      key: pick.key,
      label: formatKeywordLabel(pick.key),
      previous,
      level,
    };
  }

  if (!character.craftingKnowledge.actions) {
    character.craftingKnowledge.actions = {};
  }
  const previous = character.craftingKnowledge.actions[pick.key] ?? 0;
  const level = previous + 1;
  character.craftingKnowledge.actions[pick.key] = level;
  return {
    kind: 'action',
    key: pick.key,
    label: getActionTemplateMeta(pick.key)?.label ?? formatKeywordLabel(pick.key),
    previous,
    level,
  };
}
