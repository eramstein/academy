import {
  CardColor,
  isSpellCard,
  isUnitCard,
  ResourceType,
  type CardCraftingSkills,
  type CardTemplate,
  type Character,
  type UnitKeywords,
} from '@/lib/_model';
import { getAbilityActionNames } from './ability-templates';
import {
  ACTION_TEMPLATE_KEYS,
  getActionTemplateMeta,
  getActionTemplateNameForEffect,
} from './action-templates';
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
export const DISCOVERY_PER_INSPIRATION = 0.2;

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
  /** Level before this craft spent points on the trait. */
  previous: number;
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
  const resource = stack.fromResource > 0 ? `${stack.fromResource} ${resourceLabel(stack)}` : '';
  if (stack.skill > 0 && resource) return `Skill ${stack.skill} + ${resource}`;
  if (resource) return resource;
  return `Skill ${stack.skill}`;
}

export function knowledgeSource(stack: SkillStack): string {
  const skill = formatSkillSource(stack);
  if (stack.total <= 0) return '25% base';
  return `25% base · ${skill}`;
}

/** How discovery chance is built from inspiration (base + per point). */
export function discoverySource(inspiration: SkillStack): string {
  const base = `${Math.round(DISCOVERY_BASE * 100)}% base`;
  if (inspiration.total <= 0) return base;
  const per = Math.round(DISCOVERY_PER_INSPIRATION * 100);
  return `${base} · +${per}% × ${formatSkillSource(inspiration)}`;
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
  const discovery = Math.min(1, DISCOVERY_BASE + DISCOVERY_PER_INSPIRATION * inspiration.total);
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
 * Each point raises one associated color, keyword, or action by 1.
 * Unknown keywords/actions (conjure discoveries) take priority until unlocked;
 * remaining points pick at random from the full pool.
 * Values above 1 are kept for later; unlocking still only requires 1.
 */
export function applyKnowledgeGains(
  character: Character,
  template: CardTemplate,
  points: number,
  actionNames?: string[],
  also?: CardTemplate
): KnowledgeGain[] {
  const gains = previewKnowledgeGains(character, template, points, actionNames, also);
  commitKnowledgeGains(character, gains);
  return gains;
}

/** Same rolls as apply, without writing to the character. */
export function previewKnowledgeGains(
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

  const virtual = new Map<string, number>();
  for (const ref of pool) {
    virtual.set(`${ref.kind}:${ref.key}`, knowledgeLevel(character, ref));
  }

  const gains = new Map<string, KnowledgeGain>();
  for (let i = 0; i < points; i++) {
    const discoveries = pool.filter((ref) => {
      if (ref.kind !== 'keyword' && ref.kind !== 'action') return false;
      return (virtual.get(`${ref.kind}:${ref.key}`) ?? 0) < 1;
    });
    const candidates = discoveries.length ? discoveries : pool;
    const ref = candidates[Math.floor(Math.random() * candidates.length)];
    const key = `${ref.kind}:${ref.key}`;
    const before = virtual.get(key) ?? 0;
    const level = before + 1;
    virtual.set(key, level);
    const prior = gains.get(key);
    gains.set(key, {
      kind: ref.kind,
      key: ref.key,
      label: knowledgeLabel(ref),
      level,
      previous: prior?.previous ?? before,
      unlocked: (prior?.previous ?? before) < 1,
    });
  }
  return [...gains.values()];
}

/** Write predetermined knowledge gains onto the character. */
export function commitKnowledgeGains(character: Character, gains: KnowledgeGain[]) {
  for (const gain of gains) {
    writeKnowledgeLevel(character, gain);
  }
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

function knowledgeLevel(character: Character, ref: KnowledgeRef): number {
  const knowledge = character.craftingKnowledge;
  if (ref.kind === 'color') return knowledge?.colors?.[ref.key as CardColor] ?? 0;
  if (ref.kind === 'keyword') {
    return knowledge?.keywords?.[ref.key as keyof UnitKeywords] ?? 0;
  }
  return knowledge?.actions?.[ref.key] ?? 0;
}

function knowledgeLabel(ref: KnowledgeRef): string {
  if (ref.kind === 'action') {
    return getActionTemplateMeta(ref.key)?.label ?? formatKeywordLabel(ref.key);
  }
  return formatKeywordLabel(ref.key);
}

function writeKnowledgeLevel(character: Character, gain: KnowledgeGain) {
  if (!character.craftingKnowledge) {
    character.craftingKnowledge = {};
  }
  const knowledge = character.craftingKnowledge;
  if (gain.kind === 'color') {
    if (!knowledge.colors) knowledge.colors = {};
    knowledge.colors[gain.key as CardColor] = gain.level;
    return;
  }
  if (gain.kind === 'keyword') {
    if (!knowledge.keywords) knowledge.keywords = {};
    knowledge.keywords[gain.key as keyof UnitKeywords] = gain.level;
    return;
  }
  if (!knowledge.actions) knowledge.actions = {};
  knowledge.actions[gain.key] = gain.level;
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
