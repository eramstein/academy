import rawTemplates from '@/data/sim/card_flavor_templates.json';
import { CardColor, UnitType } from '@/lib/_model';
import type { UnitKeywords } from '@/lib/_model';
import { actionTemplates } from '@/lib/sim/cards/action-templates-data';
import { colorPie } from '@/lib/sim/cards/color-pie';
import { formatKeywordLabel, KEYWORD_KEYS } from '@/lib/sim/cards/keywords';
import type { PowerLevel } from '@/lib/sim/cards/flavor-generation-pipeline/types';

export type { PowerLevel };

export const FLAVOR_COLORS: CardColor[] = [
  CardColor.Red,
  CardColor.Green,
  CardColor.Blue,
  CardColor.Black,
];

export const POWER_LEVELS: PowerLevel[] = ['weak', 'medium', 'powerful'];

export const CARD_TYPES = ['unit', 'spell', 'land'] as const;

export type CoverageFacet = 'keyword' | 'unitType' | 'action';

export type PreferenceTier = 'preferred' | 'neutral' | 'rare';

export interface FlavorRecord {
  name: string;
  imageName: string;
  imagePrompt: string;
  cardType: string;
  unitSize: string;
  cheapImage: boolean;
  colors: string[];
  keywords: string[];
  unitTypes: string[];
  actions: string[];
}

export interface FlavorQuery {
  /** Template must include every selected color. */
  colors: CardColor[];
  cardType: string | null;
  unitSize: PowerLevel | null;
  /** Template must include every selected keyword. */
  keywords: string[];
  unitTypes: string[];
  actions: string[];
  text: string;
}

export interface CoverageCell {
  size: PowerLevel;
  count: number;
}

export interface CoverageRow {
  key: string;
  label: string;
  score: number;
  tier: PreferenceTier;
  hint: string;
  cells: CoverageCell[];
}

export interface CoverageSection {
  id: string;
  title: string;
  cardType: string;
  facet: CoverageFacet;
  anyCells: CoverageCell[];
  rows: CoverageRow[];
}

export interface ColorSummary {
  color: CardColor;
  total: number;
  counts: Record<string, number>;
}

/** One trait's coverage for a single color: catalog count + color-pie preference. */
export interface ColorTraitStat {
  key: string;
  label: string;
  preference: number;
  tier: PreferenceTier;
  count: number;
}

/** Keyword and action coverage for one color and one card type. */
export interface ColorTraitCoverage {
  color: CardColor;
  cardType: 'unit' | 'spell';
  keywords: ColorTraitStat[];
  actions: ColorTraitStat[];
}

export interface TraitMatrixCell {
  color: CardColor;
  preference: number;
  tier: PreferenceTier;
  count: number;
}

/** One trait across all colors (for the overview matrix). */
export interface TraitMatrixRow {
  key: string;
  label: string;
  cells: TraitMatrixCell[];
}

const ACTION_LABELS: Record<string, string> = {};
for (const [key, factory] of Object.entries(actionTemplates)) {
  try {
    ACTION_LABELS[key] = factory({
      damage: 1,
      health: 1,
      amount: 1,
      counters: 1,
      cardCount: 1,
      duration: 1,
      count: 1,
    }).label;
  } catch {
    ACTION_LABELS[key] = formatKeywordLabel(key);
  }
}

export function actionLabel(key: string): string {
  return ACTION_LABELS[key] ?? formatKeywordLabel(key);
}

export function traitLabel(kind: CoverageFacet, key: string): string {
  if (kind === 'action') return actionLabel(key);
  return formatKeywordLabel(key);
}

export function createEmptyQuery(): FlavorQuery {
  return {
    colors: [],
    cardType: null,
    unitSize: null,
    keywords: [],
    unitTypes: [],
    actions: [],
    text: '',
  };
}

export function isQueryEmpty(query: FlavorQuery): boolean {
  return (
    query.colors.length === 0 &&
    query.cardType === null &&
    query.unitSize === null &&
    query.keywords.length === 0 &&
    query.unitTypes.length === 0 &&
    query.actions.length === 0 &&
    query.text.trim() === ''
  );
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === 'string' && item.length > 0);
}

function normalizeOne(entry: unknown, index: number): FlavorRecord {
  const row = entry && typeof entry === 'object' ? (entry as Record<string, unknown>) : {};
  const name = typeof row.name === 'string' && row.name ? row.name : `Untitled ${index + 1}`;
  const imageName =
    typeof row.imageName === 'string' && row.imageName ? row.imageName : `untitled_${index + 1}`;
  const imagePrompt = typeof row.imagePrompt === 'string' ? row.imagePrompt : name;
  return {
    name,
    imageName,
    imagePrompt,
    cardType: typeof row.cardType === 'string' ? row.cardType : 'unit',
    unitSize: typeof row.unitSize === 'string' ? row.unitSize : 'weak',
    cheapImage: row.cheapImage === true,
    colors: asStringArray(row.colors),
    keywords: asStringArray(row.keywords),
    unitTypes: asStringArray(row.unitTypes),
    actions: asStringArray(row.actions),
  };
}

export function normalizeFlavorTemplates(raw: unknown): FlavorRecord[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((entry, index) => normalizeOne(entry, index));
}

export const flavorCatalog: FlavorRecord[] = normalizeFlavorTemplates(rawTemplates);

export function queryLabel(query: FlavorQuery): string {
  const parts: string[] = [
    query.colors.length
      ? query.colors.map((color) => formatKeywordLabel(color)).join(' + ')
      : 'Any color',
    query.cardType ? formatKeywordLabel(query.cardType) : 'Any type',
    query.unitSize ? formatKeywordLabel(query.unitSize) : 'Any size',
  ];
  for (const key of query.keywords) parts.push(traitLabel('keyword', key));
  for (const key of query.unitTypes) parts.push(traitLabel('unitType', key));
  for (const key of query.actions) parts.push(traitLabel('action', key));
  const text = query.text.trim();
  if (text) parts.push(`"${text}"`);
  return parts.join(' · ');
}

function textMatches(template: FlavorRecord, text: string): boolean {
  const needle = text.trim().toLowerCase();
  if (!needle) return true;
  return (
    template.name.toLowerCase().includes(needle) ||
    template.imagePrompt.toLowerCase().includes(needle) ||
    template.imageName.toLowerCase().includes(needle)
  );
}

export function matchesFlavorQuery(template: FlavorRecord, query: FlavorQuery): boolean {
  if (query.cardType && template.cardType !== query.cardType) return false;
  if (query.unitSize && template.unitSize !== query.unitSize) return false;
  for (const color of query.colors) {
    if (!template.colors.includes(color)) return false;
  }
  for (const keyword of query.keywords) {
    if (!template.keywords.includes(keyword)) return false;
  }
  for (const unitType of query.unitTypes) {
    if (!template.unitTypes.includes(unitType)) return false;
  }
  for (const action of query.actions) {
    if (!template.actions.includes(action)) return false;
  }
  return textMatches(template, query.text);
}

export function filterFlavorTemplates(
  templates: FlavorRecord[],
  query: FlavorQuery
): FlavorRecord[] {
  return templates
    .filter((template) => matchesFlavorQuery(template, query))
    .sort((a, b) => a.name.localeCompare(b.name) || a.imageName.localeCompare(b.imageName));
}

export function summarizeByColor(templates: FlavorRecord[]): ColorSummary[] {
  return FLAVOR_COLORS.map((color) => {
    const counts: Record<string, number> = {};
    for (const cardType of CARD_TYPES) counts[cardType] = 0;
    let total = 0;
    for (const template of templates) {
      if (!template.colors.includes(color)) continue;
      total += 1;
      counts[template.cardType] = (counts[template.cardType] ?? 0) + 1;
    }
    return { color, total, counts };
  });
}

function countColorTrait(
  templates: FlavorRecord[],
  color: CardColor,
  cardType: 'unit' | 'spell',
  facet: 'keyword' | 'action',
  key: string
): number {
  let count = 0;
  for (const template of templates) {
    if (template.cardType !== cardType) continue;
    if (!template.colors.includes(color)) continue;
    if (facet === 'keyword' && !template.keywords.includes(key)) continue;
    if (facet === 'action' && !template.actions.includes(key)) continue;
    count += 1;
  }
  return count;
}

/**
 * Trait × color matrix for units or spells: count of templates of that type
 * that include the color and the trait, plus that color's preference score.
 */
export function traitCoverageMatrix(
  templates: FlavorRecord[],
  facet: 'keyword' | 'action',
  cardType: 'unit' | 'spell'
): TraitMatrixRow[] {
  const keys =
    facet === 'keyword'
      ? collectKeys(KEYWORD_KEYS, templates, (template) => template.keywords)
      : collectKeys(Object.keys(actionTemplates), templates, (template) => template.actions);

  return keys
    .map((key) => ({
      key,
      label: traitLabel(facet, key),
      cells: FLAVOR_COLORS.map((color) => {
        const preference = scoreFor(color, facet, key);
        return {
          color,
          preference,
          tier: tierForScore(preference),
          count: countColorTrait(templates, color, cardType, facet, key),
        };
      }),
    }))
    .sort((a, b) => a.label.localeCompare(b.label));
}

/**
 * For each color, split by unit and spell: how many templates cover each
 * keyword (units only) and action, and the color-pie preference for that
 * combination. Keywords and actions are sorted by preference (preferred first).
 */
export function colorTraitCoverage(templates: FlavorRecord[]): ColorTraitCoverage[] {
  const cardTypes = ['unit', 'spell'] as const;

  function toStats(rows: TraitMatrixRow[], colorIndex: number): ColorTraitStat[] {
    return rows
      .map((row) => {
        const cell = row.cells[colorIndex];
        return {
          key: row.key,
          label: row.label,
          preference: cell.preference,
          tier: cell.tier,
          count: cell.count,
        };
      })
      .sort((a, b) => b.preference - a.preference || a.label.localeCompare(b.label));
  }

  return cardTypes.flatMap((cardType) => {
    const keywordRows =
      cardType === 'unit' ? traitCoverageMatrix(templates, 'keyword', cardType) : [];
    const actionRows = traitCoverageMatrix(templates, 'action', cardType);

    return FLAVOR_COLORS.map((color, colorIndex) => ({
      color,
      cardType,
      keywords: toStats(keywordRows, colorIndex),
      actions: toStats(actionRows, colorIndex),
    }));
  });
}

function keywordScore(color: CardColor, keyword: string): number {
  const prefs = colorPie[color].keywordsPreferences;
  if (Object.prototype.hasOwnProperty.call(prefs, keyword)) {
    return prefs[keyword as keyof UnitKeywords];
  }
  return -1;
}

function actionScore(color: CardColor, action: string): number {
  const prefs = colorPie[color].actionPreferences;
  if (Object.prototype.hasOwnProperty.call(prefs, action)) {
    return prefs[action];
  }
  return -2;
}

function unitTypeScore(color: CardColor, unitType: string): number {
  return colorPie[color].unitTypes.includes(unitType as UnitType) ? 3 : -1;
}

function scoreFor(color: CardColor, facet: CoverageFacet, key: string): number {
  if (facet === 'keyword') return keywordScore(color, key);
  if (facet === 'unitType') return unitTypeScore(color, key);
  return actionScore(color, key);
}

export function tierForScore(score: number): PreferenceTier {
  if (score > 0) return 'preferred';
  if (score === 0) return 'neutral';
  return 'rare';
}

function bestScore(colors: CardColor[], facet: CoverageFacet, key: string): number {
  return Math.max(...colors.map((color) => scoreFor(color, facet, key)));
}

function preferenceHint(colors: CardColor[], facet: CoverageFacet, key: string): string {
  return colors
    .map((color) => {
      const score = scoreFor(color, facet, key);
      const printed = score > 0 ? `+${score}` : `${score}`;
      return `${formatKeywordLabel(color)} ${printed}`;
    })
    .join(' · ');
}

function includesColors(template: FlavorRecord, colors: CardColor[]): boolean {
  return colors.every((color) => template.colors.includes(color));
}

function countWhere(
  templates: FlavorRecord[],
  colors: CardColor[],
  cardType: string,
  size: PowerLevel,
  facet?: CoverageFacet,
  key?: string
): number {
  let count = 0;
  for (const template of templates) {
    if (template.cardType !== cardType) continue;
    if (template.unitSize !== size) continue;
    if (!includesColors(template, colors)) continue;
    if (facet === 'keyword' && key && !template.keywords.includes(key)) continue;
    if (facet === 'unitType' && key && !template.unitTypes.includes(key)) continue;
    if (facet === 'action' && key && !template.actions.includes(key)) continue;
    count += 1;
  }
  return count;
}

function cellsFor(
  templates: FlavorRecord[],
  colors: CardColor[],
  cardType: string,
  facet?: CoverageFacet,
  key?: string
): CoverageCell[] {
  return POWER_LEVELS.map((size) => ({
    size,
    count: countWhere(templates, colors, cardType, size, facet, key),
  }));
}

function collectKeys(
  known: readonly string[],
  templates: FlavorRecord[],
  read: (template: FlavorRecord) => string[]
): string[] {
  const keys = new Set<string>(known);
  for (const template of templates) {
    for (const key of read(template)) keys.add(key);
  }
  return [...keys];
}

function selectedKeys(query: FlavorQuery, facet: CoverageFacet): string[] {
  if (facet === 'keyword') return query.keywords;
  if (facet === 'unitType') return query.unitTypes;
  return query.actions;
}

function sectionFor(
  templates: FlavorRecord[],
  colors: CardColor[],
  cardType: string,
  facet: CoverageFacet,
  title: string,
  keys: string[],
  query: FlavorQuery,
  includeRare: boolean
): CoverageSection {
  const selected = new Set(selectedKeys(query, facet));
  const rows = keys
    .map((key) => {
      const score = bestScore(colors, facet, key);
      return {
        key,
        label: traitLabel(facet, key),
        score,
        tier: tierForScore(score),
        hint: preferenceHint(colors, facet, key),
        cells: cellsFor(templates, colors, cardType, facet, key),
      };
    })
    .sort((a, b) => b.score - a.score || a.label.localeCompare(b.label))
    .filter((row) => includeRare || row.tier !== 'rare' || selected.has(row.key));

  return {
    id: `${cardType}-${facet}`,
    title,
    cardType,
    facet,
    anyCells: cellsFor(templates, colors, cardType),
    rows,
  };
}

export function keywordOptions(templates: FlavorRecord[]): string[] {
  return collectKeys(KEYWORD_KEYS, templates, (template) => template.keywords).sort((a, b) =>
    traitLabel('keyword', a).localeCompare(traitLabel('keyword', b))
  );
}

export function unitTypeOptions(templates: FlavorRecord[]): string[] {
  return collectKeys(Object.values(UnitType), templates, (template) => template.unitTypes).sort(
    (a, b) => traitLabel('unitType', a).localeCompare(traitLabel('unitType', b))
  );
}

export function actionOptions(templates: FlavorRecord[]): string[] {
  return collectKeys(Object.keys(actionTemplates), templates, (template) => template.actions).sort(
    (a, b) => traitLabel('action', a).localeCompare(traitLabel('action', b))
  );
}

export function coverageSections(
  templates: FlavorRecord[],
  colors: CardColor[],
  cardType: string | null,
  includeRare: boolean,
  query: FlavorQuery
): CoverageSection[] {
  if (colors.length === 0) return [];
  const keywords = collectKeys(KEYWORD_KEYS, templates, (template) => template.keywords);
  const unitTypes = collectKeys(
    Object.values(UnitType),
    templates,
    (template) => template.unitTypes
  );
  const actions = collectKeys(
    Object.keys(actionTemplates),
    templates,
    (template) => template.actions
  );
  const show = (type: string) => cardType === null || cardType === type;
  const sections: CoverageSection[] = [];

  if (show('unit')) {
    sections.push(
      sectionFor(
        templates,
        colors,
        'unit',
        'keyword',
        'Unit keywords',
        keywords,
        query,
        includeRare
      ),
      sectionFor(
        templates,
        colors,
        'unit',
        'unitType',
        'Unit types',
        unitTypes,
        query,
        includeRare
      ),
      sectionFor(templates, colors, 'unit', 'action', 'Unit actions', actions, query, includeRare)
    );
  }
  if (show('spell')) {
    sections.push(
      sectionFor(templates, colors, 'spell', 'action', 'Spell actions', actions, query, includeRare)
    );
  }
  if (show('land')) {
    sections.push(
      sectionFor(templates, colors, 'land', 'action', 'Land actions', actions, query, includeRare)
    );
  }
  return sections;
}

function sameStrings(left: string[], right: string[]): boolean {
  if (left.length !== right.length) return false;
  const a = [...left].sort();
  const b = [...right].sort();
  return a.every((value, index) => value === b[index]);
}

/** True when the list filters are exactly this coverage cell. */
export function coverageCellIsActive(
  query: FlavorQuery,
  cardType: string,
  size: PowerLevel,
  facet: CoverageFacet,
  key: string | null
): boolean {
  if (query.text.trim()) return false;
  if (query.cardType !== cardType) return false;
  if (query.unitSize !== size) return false;
  const keywords = facet === 'keyword' && key ? [key] : [];
  const unitTypes = facet === 'unitType' && key ? [key] : [];
  const actions = facet === 'action' && key ? [key] : [];
  return (
    sameStrings(query.keywords, keywords) &&
    sameStrings(query.unitTypes, unitTypes) &&
    sameStrings(query.actions, actions)
  );
}
