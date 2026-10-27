import {
  CardColor,
  ResourceType,
  type CardCraftingSkills,
  type CardTemplate,
  type Character,
  type ColorMasteryPoints,
  type UnitKeywords,
} from '@/lib/_model';
import { ACTION_TEMPLATE_KEYS } from './action-templates';
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
export const CONJURE_OPTION_BASE = 2;
export const DISCOVERY_BASE = 0.2;
export const DISCOVERY_PER_INSPIRATION = 0.2;
/** Invoke ingredient cap / enchant mana delta ceiling. */
export const INSPIRATION_CAP = 10;

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
  /** Erudition → color tech points (same floor + chance formula as mastery). */
  knowledge: PointRoll;
  /** Invoke ingredient cap and enchant mana-cost delta. The inspiration total. */
  scope: number;
  /** Conjure: base 2 visions plus the inspiration formula. */
  conjureOptions: PointRoll;
  /** Conjure: chance one option includes an unknown keyword or action. */
  discoveryChance: number;
}

export interface KnowledgeGain {
  kind: 'color';
  key: CardColor;
  label: string;
  level: number;
  /** Level before this craft spent points on the color. */
  previous: number;
  /** True when this craft raised the color from 0 to at least 1. */
  unlocked: boolean;
}

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
  const inspiration = cappedStack(
    skills?.inspiration ?? 0,
    bonus.inspiration,
    'magic dust',
    INSPIRATION_CAP
  );
  const discovery = Math.min(1, DISCOVERY_BASE + DISCOVERY_PER_INSPIRATION * inspiration.total);
  return {
    mode,
    mastery,
    erudition,
    inspiration,
    extraBudget: pointRoll(mastery.total * SKILL_RATE),
    knowledge: pointRoll(erudition.total * SKILL_RATE),
    scope: inspiration.total,
    conjureOptions: pointRoll(CONJURE_OPTION_BASE + inspiration.total * SKILL_RATE),
    discoveryChance: discovery,
  };
}

/**
 * Spend `points` erudition increments on color tech points.
 * Each point raises one of the crafted card's colors by 1 (picked at random
 * when the card is multicolored).
 */
export function applyKnowledgeGains(
  character: Character,
  template: CardTemplate,
  points: number,
  _actionNames?: string[],
  also?: CardTemplate
): KnowledgeGain[] {
  const gains = previewKnowledgeGains(character, template, points, _actionNames, also);
  commitKnowledgeGains(character, gains);
  return gains;
}

/** Same rolls as apply, without writing to the character. */
export function previewKnowledgeGains(
  character: Character,
  template: CardTemplate,
  points: number,
  _actionNames?: string[],
  also?: CardTemplate
): KnowledgeGain[] {
  return previewColorTechGains(character, colorsOnCards(template, also), points);
}

/** Preview erudition gains for an explicit color pool (e.g. invoke pigment picks). */
export function previewColorTechGains(
  character: Character,
  colors: CardColor[],
  points: number
): KnowledgeGain[] {
  const pool = [...new Set(colors)];
  if (!pool.length || points <= 0) return [];

  const virtual = new Map<CardColor, number>();
  for (const color of pool) {
    virtual.set(color, colorTechLevel(character, color));
  }

  const gains = new Map<CardColor, KnowledgeGain>();
  for (let i = 0; i < points; i++) {
    const color = pool[Math.floor(Math.random() * pool.length)];
    const before = virtual.get(color) ?? 0;
    const level = before + 1;
    virtual.set(color, level);
    const prior = gains.get(color);
    gains.set(color, {
      kind: 'color',
      key: color,
      label: formatKeywordLabel(color),
      level,
      previous: prior?.previous ?? before,
      unlocked: (prior?.previous ?? before) < 1,
    });
  }
  return [...gains.values()];
}

/** Write predetermined color tech gains onto the player. */
export function commitKnowledgeGains(character: Character, gains: KnowledgeGain[]) {
  for (const gain of gains) {
    writeColorTechLevel(character, gain);
  }
}

export function describeKnowledgeGains(gains: KnowledgeGain[]): string {
  if (!gains.length) return '';
  const parts = gains.map((gain) => `raised ${gain.label} to ${gain.level}`);
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

function cappedStack(
  skill: number,
  fromResource: number,
  resourceName: string,
  max: number
): SkillStack {
  const base = Math.min(max, Math.max(0, skill));
  const added = Math.min(Math.max(0, fromResource), Math.max(0, max - base));
  return { skill: base, fromResource: added, total: base + added, resourceName };
}

function resourceLabel(entry: SkillStack): string {
  if (entry.resourceName === 'moxes') return entry.fromResource === 1 ? 'mox' : 'moxes';
  return entry.resourceName;
}

function colorsOnCards(...templates: (CardTemplate | undefined)[]): CardColor[] {
  const colors = new Set<CardColor>();
  for (const template of templates) {
    for (const entry of template?.colors ?? []) {
      colors.add(entry.color);
    }
  }
  return [...colors];
}

function playerColorTech(character: Character): ColorMasteryPoints | null {
  if (!('colorMasteryPoints' in character)) return null;
  return character.colorMasteryPoints ?? null;
}

function colorTechLevel(character: Character, color: CardColor): number {
  return playerColorTech(character)?.[color] ?? 0;
}

function writeColorTechLevel(character: Character, gain: KnowledgeGain) {
  const tech = playerColorTech(character);
  if (!tech) return;
  tech[gain.key] = gain.level;
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
