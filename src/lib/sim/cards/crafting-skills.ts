import {
  CardColor,
  ResourceType,
  isSpellCard,
  isUnitCard,
  type CardCraftingSkills,
  type CardTemplate,
  type Character,
  type UnitKeywords,
} from '@/lib/_model';
import { getAbilityActionNames } from './ability-templates';
import { ACTION_TEMPLATE_KEYS, getActionTemplateMeta, getActionTemplateNameForEffect } from './action-templates';
import { formatKeywordLabel, KEYWORD_KEYS, NUMERIC_KEYWORDS } from './keywords';

/**
 * Card crafting formulas from card-creation-design.md.
 *
 * A skill of n yields floor(n * 0.25) points for sure, plus a (n % 4) * 25%
 * chance of one more. Mastery 9 → 2 points, and a 25% chance of a third.
 * Resources add to a skill for that craft only:
 * mithril → mastery, magic dust → inspiration, moxes → erudition.
 */

export const SKILL_RATE = 0.25;
export const KNOWLEDGE_BASE = 0.25;
export const CONJURE_OPTION_BASE = 2;
export const DISCOVERY_BASE = 0.2;
export const DISCOVERY_PER_INSPIRATION = 0.1;

export type CraftMode = 'conjure' | 'invoke' | 'enchant';

export interface SkillStack {
  skill: number;
  fromResource: number;
  total: number;
  /** Plural resource name, e.g. "moxes". */
  resourceName: string;
}

/** Guaranteed points plus the chance of one extra. */
export interface PointRoll {
  expected: number;
  sure: number;
  chance: number;
}

export interface CraftProfile {
  mode: CraftMode;
  mastery: SkillStack;
  erudition: SkillStack;
  inspiration: SkillStack;
  /** Mastery → bonus budget spent automatically on stats. */
  extraBudget: PointRoll;
  /** Base 25% plus the erudition formula. Levels above 1 are stored only. */
  knowledge: PointRoll;
  /** Invoke ingredient cap and enchant mana-cost delta. The inspiration total. */
  scope: number;
  /** Conjure: base 2 visions plus the inspiration formula. */
  conjureOptions: PointRoll;
  /** Conjure: chance one option includes an unknown keyword or action. */
  discoveryChance: number;
}

export interface KnowledgeGain {
  kind: 'color' | 'keyword' | 'action';
  key: string;
  label: string;
  level: number;
  /** True when this craft raised the trait from 0 to at least 1. */
  unlocked: boolean;
}

type KnowledgeRef = {
  kind: KnowledgeGain['kind'];
  key: string;
};

export function pointRoll(expected: number): PointRoll {
  const value = Math.max(0, expected);
  const sure = Math.floor(value);
  return { expected: value, sure, chance: value - sure };
}

/** floor(expected) points, then one more with probability equal to the fraction. */
export function rollPoints(expected: number, rng: () => number = Math.random): number {
  const { sure, chance } = pointRoll(expected);
  return sure + (rng() < chance ? 1 : 0);
}

export function rollConjureOptionCount(
  inspiration: number,
  rng: () => number = Math.random
): number {
  return rollPoints(CONJURE_OPTION_BASE + Math.max(0, inspiration) * SKILL_RATE, rng);
}

export function rollDiscoveryIndex(
  chance: number,
  optionCount: number,
  rng: () => number = Math.random
): number {
  if (optionCount <= 0 || rng() >= chance) return -1;
  return Math.floor(rng() * optionCount);
}

export function formatPointRoll(roll: PointRoll): string {
  const pct = `${Math.round(roll.chance * 100)}%`;
  if (roll.sure <= 0 && roll.chance <= 0) return '0';
  if (roll.chance <= 0.001) return String(roll.sure);
  if (roll.sure <= 0) return pct;
  return `${roll.sure} + ${pct}`;
}

/** Chance of the bonus point, as an integer 0–100. */
export function percentThreshold(chance: number): number {
  return Math.round(Math.max(0, Math.min(1, chance)) * 100);
}

/**
 * A d100 face that matches whether the fractional roll succeeded.
 * Hit → 1…need; miss → need+1…100. Used only for display.
 */
export function displayPercentRoll(
  hit: boolean,
  need: number,
  rng: () => number = Math.random
): number {
  if (need <= 0) return 100;
  if (need >= 100) return 1;
  if (hit) return 1 + Math.floor(rng() * need);
  return need + 1 + Math.floor(rng() * (100 - need));
}

export function formatSkillSource(stack: SkillStack): string {
  const resource =
    stack.fromResource > 0 ? `${stack.fromResource} ${resourceLabel(stack)}` : '';
  if (stack.skill > 0 && resource) return `Skill ${stack.skill} + ${resource}`;
  if (resource) return resource;
  return `Skill ${stack.skill}`;
}

export function knowledgeSource(stack: SkillStack): string {
  const skill = formatSkillSource(stack);
  if (stack.total <= 0) return '25% base';
  return `25% base · ${skill}`;
}

export function craftProfile(
  skills: CardCraftingSkills | undefined,
  resources: { type: ResourceType; count: number }[] | undefined,
  mode: CraftMode
): CraftProfile {
  const bonus = resourceBonus(resources);
  const mastery = stack(skills?.mastery ?? 0, bonus.mastery, 'mithril');
  const erudition = stack(skills?.erudition ?? 0, bonus.erudition, 'moxes');
  const inspiration = stack(skills?.inspiration ?? 0, bonus.inspiration, 'magic dust');
  const discovery = Math.min(
    1,
    DISCOVERY_BASE + DISCOVERY_PER_INSPIRATION * inspiration.total
  );
  return {
    mode,
    mastery,
    erudition,
    inspiration,
    extraBudget: pointRoll(mastery.total * SKILL_RATE),
    knowledge: pointRoll(KNOWLEDGE_BASE + erudition.total * SKILL_RATE),
    scope: inspiration.total,
    conjureOptions: pointRoll(CONJURE_OPTION_BASE + inspiration.total * SKILL_RATE),
    discoveryChance: discovery,
  };
}

/**
 * Spend `points` knowledge increments on traits printed on the card.
 * Each point raises one random associated color, keyword, or action by 1.
 * Values above 1 are kept for later; unlocking still only requires 1.
 */
export function applyKnowledgeGains(
  character: Character,
  template: CardTemplate,
  points: number,
  actionNames?: string[],
  also?: CardTemplate
): KnowledgeGain[] {
  const pool = knowledgePool(template, actionNames);
  if (also) {
    for (const ref of knowledgePool(also)) {
      if (!pool.some((entry) => entry.kind === ref.kind && entry.key === ref.key)) {
        pool.push(ref);
      }
    }
  }
  if (!pool.length || points <= 0) return [];

  const gains = new Map<string, KnowledgeGain>();
  for (let i = 0; i < points; i++) {
    const ref = pool[Math.floor(Math.random() * pool.length)];
    const gain = bumpKnowledge(character, ref);
    gains.set(`${gain.kind}:${gain.key}`, gain);
  }
  return [...gains.values()];
}

export function describeKnowledgeGains(gains: KnowledgeGain[]): string {
  if (!gains.length) return '';
  const parts = gains.map((gain) =>
    gain.unlocked ? `learnt ${gain.label}` : `raised ${gain.label} to ${gain.level}`
  );
  return `Erudition: ${joinList(parts)}.`;
}

function resourceBonus(resources: { type: ResourceType; count: number }[] | undefined): {
  mastery: number;
  erudition: number;
  inspiration: number;
} {
  const bonus = { mastery: 0, erudition: 0, inspiration: 0 };
  for (const resource of resources ?? []) {
    const count = Math.max(0, resource.count);
    if (resource.type === ResourceType.Mithril) bonus.mastery += count;
    else if (resource.type === ResourceType.Moxes) bonus.erudition += count;
    else if (resource.type === ResourceType.MagicDust) bonus.inspiration += count;
  }
  return bonus;
}

function stack(skill: number, fromResource: number, resourceName: string): SkillStack {
  const base = Math.max(0, skill);
  const added = Math.max(0, fromResource);
  return { skill: base, fromResource: added, total: base + added, resourceName };
}

function resourceLabel(entry: SkillStack): string {
  if (entry.resourceName === 'moxes') return entry.fromResource === 1 ? 'mox' : 'moxes';
  return entry.resourceName;
}

function knowledgePool(template: CardTemplate, actionNames?: string[]): KnowledgeRef[] {
  const pool: KnowledgeRef[] = [];
  for (const color of new Set(template.colors?.map((entry) => entry.color) ?? [])) {
    pool.push({ kind: 'color', key: color });
  }
  if (isUnitCard(template)) {
    for (const key of Object.keys(template.keywords ?? {}) as (keyof UnitKeywords)[]) {
      if (template.keywords?.[key]) pool.push({ kind: 'keyword', key });
    }
  }
  const names = actionNames?.length ? actionNames : actionNamesOn(template);
  for (const name of new Set(names)) {
    if (name) pool.push({ kind: 'action', key: name });
  }
  return pool;
}

function actionNamesOn(template: CardTemplate): string[] {
  if (isUnitCard(template)) {
    return (template.abilities ?? []).flatMap(getAbilityActionNames);
  }
  if (isSpellCard(template)) {
    return template.actions
      .map((action) => getActionTemplateNameForEffect(action.effect.name))
      .filter((name): name is string => !!name);
  }
  return [];
}

function bumpKnowledge(character: Character, ref: KnowledgeRef): KnowledgeGain {
  if (!character.craftingKnowledge) {
    character.craftingKnowledge = {};
  }
  const knowledge = character.craftingKnowledge;
  if (ref.kind === 'color') {
    if (!knowledge.colors) knowledge.colors = {};
    const key = ref.key as CardColor;
    const previous = knowledge.colors[key] ?? 0;
    const level = previous + 1;
    knowledge.colors[key] = level;
    return { kind: ref.kind, key: ref.key, label: formatKeywordLabel(ref.key), level, unlocked: previous < 1 };
  }
  if (ref.kind === 'keyword') {
    if (!knowledge.keywords) knowledge.keywords = {};
    const key = ref.key as keyof UnitKeywords;
    const previous = knowledge.keywords[key] ?? 0;
    const level = previous + 1;
    knowledge.keywords[key] = level;
    return {
      kind: ref.kind,
      key: ref.key,
      label: formatKeywordLabel(ref.key),
      level,
      unlocked: previous < 1,
    };
  }
  if (!knowledge.actions) knowledge.actions = {};
  const previous = knowledge.actions[ref.key] ?? 0;
  const level = previous + 1;
  knowledge.actions[ref.key] = level;
  const label = getActionTemplateMeta(ref.key)?.label ?? formatKeywordLabel(ref.key);
  return { kind: ref.kind, key: ref.key, label, level, unlocked: previous < 1 };
}

function joinList(names: string[]): string {
  if (names.length <= 1) return names[0] ?? '';
  if (names.length === 2) return `${names[0]} and ${names[1]}`;
  return `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;
}

export function knownKeys(record: Partial<Record<string, number>> | undefined): Set<string> {
  return new Set(
    Object.entries(record ?? {})
      .filter(([, level]) => (level ?? 0) >= 1)
      .map(([key]) => key)
  );
}

export function unknownKeywords(character: Character): (keyof UnitKeywords)[] {
  const known = knownKeys(character.craftingKnowledge?.keywords);
  return KEYWORD_KEYS.filter((key) => !known.has(key));
}

export function unknownActions(character: Character): string[] {
  const known = knownKeys(character.craftingKnowledge?.actions);
  return ACTION_TEMPLATE_KEYS.filter((name) => !known.has(name));
}

export function isNumericKeyword(key: string): boolean {
  return NUMERIC_KEYWORDS.has(key as keyof UnitKeywords);
}
