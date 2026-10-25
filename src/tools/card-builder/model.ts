import {
  CardColor,
  CardType,
  CounterType,
  StatusType,
  TargetType,
  TriggerType,
  UnitType,
  type Ability,
  type ActionDefinition,
  type CardTemplate,
  type Trigger,
  type UnitCardTemplate,
  type UnitKeywords,
} from '@/lib/_model';
import { DynamicValue } from '@/lib/battle/effects/dynamic-values';
import type { UnitFilterArgs } from '@/lib/battle/effects/unit-filters';
import { KEYWORD_KEYS } from '@/lib/sim/cards/keywords';

export const NUMBER_KEYWORD_KEYS = ['armor', 'resist', 'poisonous', 'regeneration'] as const;
export const BOOLEAN_KEYWORD_KEYS = KEYWORD_KEYS.filter(
  (key): key is Exclude<keyof UnitKeywords, (typeof NUMBER_KEYWORD_KEYS)[number]> =>
    !(NUMBER_KEYWORD_KEYS as readonly string[]).includes(key)
);

export const TRIGGER_PARAMS = ['attacker', 'defender', 'mover', 'unit'] as const;

export const TARGET_OPTIONS: { value: TargetType; label: string }[] = [
  { value: TargetType.Self, label: 'Self' },
  { value: TargetType.Units, label: 'Any unit' },
  { value: TargetType.Ennemies, label: 'Enemy unit' },
  { value: TargetType.Allies, label: 'Ally unit' },
  { value: TargetType.Cell, label: 'Any cell' },
  { value: TargetType.AllyCell, label: 'Ally cell' },
  { value: TargetType.EnemyCell, label: 'Enemy cell' },
  { value: TargetType.EmptyCell, label: 'Empty cell' },
  { value: TargetType.HandCard, label: 'Card in hand' },
  { value: TargetType.GraveyardCard, label: 'Card in graveyard' },
  { value: TargetType.DeckCard, label: 'Card in deck' },
  { value: TargetType.Land, label: 'Land' },
  { value: TargetType.Player, label: 'Player' },
];

/** JSON keys match UnitFilterArgs, including the spelling `ennemies`. */
const RANGE_FLAG_KEYS = [
  'all',
  'self',
  'addSelf',
  'excludeSelf',
  'allies',
  'ennemies',
  'adjacent',
  'sameRow',
  'sameColumn',
  'inFrontOf',
] as const;

type RangeFlag = (typeof RANGE_FLAG_KEYS)[number];

export const RANGE_FLAGS: { key: RangeFlag; label: string }[] = [
  { key: 'all', label: 'All units' },
  { key: 'self', label: 'Self' },
  { key: 'addSelf', label: 'Include self' },
  { key: 'excludeSelf', label: 'Exclude self' },
  { key: 'allies', label: 'Allies' },
  { key: 'ennemies', label: 'Enemies' },
  { key: 'adjacent', label: 'Adjacent' },
  { key: 'sameRow', label: 'Same row' },
  { key: 'sameColumn', label: 'Same column' },
  { key: 'inFrontOf', label: 'In front' },
];

export type RangeDraft = Record<RangeFlag, boolean> & {
  unitType: UnitType | '';
  hasKeyword: keyof UnitKeywords | '';
};

export type KeywordDraft = Record<(typeof BOOLEAN_KEYWORD_KEYS)[number], boolean> &
  Record<(typeof NUMBER_KEYWORD_KEYS)[number], number | null> & {
    power: number | null;
    retaliate: number | null;
  };

export type ColorDraft = { color: CardColor; count: number };

export type TargetDraft = { id: number; type: TargetType; count: number };

export type ActionDraft = {
  id: number;
  effectName: string;
  args: Record<string, any>;
  targets: TargetDraft[];
};

export type AbilityDraft = {
  id: number;
  triggerType: TriggerType;
  useRange: boolean;
  range: RangeDraft;
  staticRecompute: TriggerType[];
  text: string;
  useCost: boolean;
  cost: number;
  exhausts: boolean;
  actions: ActionDraft[];
};

export type UnitDraft = {
  name: string;
  cost: number;
  colors: ColorDraft[];
  /** Comma-separated pool tags; split into `poolKeys` on serialize. */
  poolKeysText: string;
  power: number;
  maxHealth: number;
  retaliate: number;
  keywords: KeywordDraft;
  unitTypes: UnitType[];
  abilities: AbilityDraft[];
};

export type CardDraft = UnitDraft & {
  type: CardType;
  actions: ActionDraft[];
  health: number;
  includeLandRetaliate: boolean;
  ruinsAbilities: AbilityDraft[];
};

export type EffectField = {
  key: string;
  kind: 'number' | 'boolean' | 'string' | 'enum' | 'range' | 'temporary' | 'unit' | 'triggerParam';
  label: string;
  optional?: boolean;
  default?: string | number | boolean;
  /** When the value equals this, it is left out. Used for runtime defaults. */
  omitWhen?: string | number | boolean;
  options?: readonly string[];
  placeholder?: string;
};

const COUNTERS = Object.values(CounterType);
const COLORS = Object.values(CardColor);
const STATUSES = Object.values(StatusType);
const DYNAMICS = Object.values(DynamicValue);

function num(key: string, label: string, optional = false): EffectField {
  return optional
    ? { key, kind: 'number', label, optional: true }
    : { key, kind: 'number', label, default: 1 };
}

function bool(key: string, label: string, defaultValue = false): EffectField {
  return { key, kind: 'boolean', label, default: defaultValue, omitWhen: defaultValue };
}

function rangeField(): EffectField {
  return { key: 'range', kind: 'range', label: 'Range', optional: true };
}

function fromTrigger(): EffectField {
  return { key: 'fromTriggerParam', kind: 'triggerParam', label: 'From trigger', optional: true };
}

function scalesWith(): EffectField {
  return {
    key: 'dynamicValue',
    kind: 'enum',
    label: 'Scales with',
    options: DYNAMICS,
    optional: true,
  };
}

function counter(key: string, label: string): EffectField {
  return { key, kind: 'enum', label, options: COUNTERS, default: CounterType.Growth };
}

export const EFFECT_FIELDS = {
  reanimate: [],
  damagePlayer: [num('damage', 'Damage'), bool('opposingPlayer', 'Opposing player', true)],
  damageLand: [num('damage', 'Damage')],
  damageUnit: [
    num('damage', 'Damage'),
    rangeField(),
    fromTrigger(),
    scalesWith(),
    num('randomTargets', 'Random targets', true),
  ],
  healUnit: [num('health', 'Health'), rangeField()],
  addCounters: [
    counter('counterType', 'Counter'),
    num('counterValue', 'Amount'),
    rangeField(),
    fromTrigger(),
    scalesWith(),
    bool('valueIsMultiplier', 'Amount is a multiplier'),
  ],
  staticStats: [
    num('power', 'Power', true),
    num('maxHealth', 'Health', true),
    num('retaliate', 'Retaliate', true),
    rangeField(),
    scalesWith(),
    fromTrigger(),
  ],
  staticKeyword: [
    {
      key: 'abilityName',
      kind: 'string',
      label: 'Ability name',
      default: '',
      placeholder: 'uniqueName',
    },
    {
      key: 'keyword',
      kind: 'enum',
      label: 'Keyword',
      options: KEYWORD_KEYS,
      default: KEYWORD_KEYS[0],
    },
    num('keyWordValue', 'Keyword amount', true),
    rangeField(),
    bool('reset', 'Replace previous', true),
    fromTrigger(),
  ],
  temporaryEffect: [{ key: 'effect', kind: 'temporary', label: 'Until end of turn' }, rangeField()],
  untapPlayer: [],
  incrementColor: [
    { key: 'color', kind: 'enum', label: 'Color', options: COLORS, default: CardColor.Red },
  ],
  applyUnitStatus: [
    {
      key: 'statusType',
      kind: 'enum',
      label: 'Status',
      options: STATUSES,
      default: StatusType.Mezz,
    },
    num('duration', 'Turns'),
    rangeField(),
    fromTrigger(),
  ],
  summon: [
    { key: 'summonedUnit', kind: 'unit', label: 'Summoned unit' },
    bool('isRespawn', 'Summon at this position'),
    num('randomPositions', 'Random allied cells', true),
  ],
  darkRitual: [
    {
      key: 'effect',
      kind: 'enum',
      label: 'Ritual',
      options: ['damage', 'heal'],
      default: 'damage',
    },
  ],
  transferCounters: [counter('counterType', 'Counter')],
  transformCounters: [
    counter('fromCounterType', 'From'),
    counter('toCounterType', 'To'),
    rangeField(),
  ],
  drawCard: [num('cardCount', 'Cards')],
  destroyUnit: [rangeField()],
  bounceUnit: [rangeField()],
  fortifyLand: [num('amount', 'Amount')],
  refreshUnit: [rangeField()],
  forceMoveUnit: [],
  controlUnit: [],
  swapUnits: [],
  fight: [
    bool('mutual', 'Both units fight', true),
    bool('sameSidePossible', 'Same side allowed'),
    bool('targetInFront', 'Closest enemy in front'),
  ],
  cycleCards: [],
  tutorCard: [],
  regrowCard: [],
  putToDeckBottom: [],
  addMana: [num('amount', 'Mana')],
  reshuffleGraveyard: [],
  recycleCard: [],
  combine: [],
  useEnergy: [],
} satisfies Record<string, EffectField[]>;

export const ALL_EFFECT_NAMES = Object.keys(EFFECT_FIELDS).sort();

const COMPOSITE_EFFECTS = new Set(['combine', 'useEnergy']);

export function effectNames(depth = 0): string[] {
  if (depth >= 2) return ALL_EFFECT_NAMES.filter((name) => !COMPOSITE_EFFECTS.has(name));
  return ALL_EFFECT_NAMES;
}

export function fieldsFor(effectName: string): EffectField[] {
  return EFFECT_FIELDS[effectName as keyof typeof EFFECT_FIELDS] ?? [];
}

export function numericArgKeys(effectName: string): string[] {
  return fieldsFor(effectName)
    .filter((field) => field.kind === 'number')
    .map((field) => field.key);
}

export const EFFECT_NOTES: Record<string, string> = {
  reanimate: 'Targets: a graveyard unit, then a cell. Leave one out to choose it at random.',
  summon: 'Targets are cells, unless this respawns or uses random allied cells.',
  darkRitual: 'Targets: the sacrificed unit, then the unit that is damaged or healed.',
  forceMoveUnit: 'Targets: a unit, then a cell.',
  controlUnit: 'Targets: a unit, then a cell.',
  swapUnits: 'Target two units on the same side (count 2).',
  fight: 'One target fights the source. Count 2 makes the two chosen units fight.',
  cycleCards: 'Targets are the cards to cycle. Count is how many are drawn, then discarded.',
  tutorCard: 'Target a card in the deck.',
  regrowCard: 'Target a card in the graveyard.',
  recycleCard: 'Targets are graveyard cards shuffled into the deck.',
  putToDeckBottom: 'Target a card, or leave targets empty to put this card on the bottom.',
  useEnergy: 'Spends energy, then runs the effect. An empty cost spends all of it.',
  combine: "Runs each effect in order. They share this action's targets.",
};

let nextDraftId = 1;

export function uid(): number {
  nextDraftId += 1;
  return nextDraftId;
}

export function moveItem<T>(items: T[], index: number, delta: number): void {
  const next = index + delta;
  if (next < 0 || next >= items.length) return;
  const [item] = items.splice(index, 1);
  items.splice(next, 0, item);
}

export function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

export function blankKeywords(): KeywordDraft {
  const draft = { power: null, retaliate: null } as KeywordDraft;
  for (const key of BOOLEAN_KEYWORD_KEYS) draft[key] = false;
  for (const key of NUMBER_KEYWORD_KEYS) draft[key] = null;
  return draft;
}

export function blankRange(): RangeDraft {
  return {
    all: false,
    self: false,
    addSelf: false,
    excludeSelf: false,
    sameRow: false,
    sameColumn: false,
    allies: false,
    ennemies: false,
    adjacent: false,
    inFrontOf: false,
    unitType: '',
    hasKeyword: '',
  };
}

export function blankSummonedUnit(): UnitDraft {
  return {
    name: '',
    cost: 0,
    colors: [],
    poolKeysText: '',
    power: 1,
    maxHealth: 1,
    retaliate: 0,
    keywords: blankKeywords(),
    unitTypes: [],
    abilities: [],
  };
}

export function colorCount(colors: ColorDraft[], color: CardColor): number {
  return colors.find((entry) => entry.color === color)?.count ?? 0;
}

export function bumpColor(colors: ColorDraft[], color: CardColor, delta: number): void {
  const index = colors.findIndex((entry) => entry.color === color);
  const current = index === -1 ? 0 : colors[index].count;
  const next = Math.max(0, current + delta);
  if (next === 0) {
    if (index !== -1) colors.splice(index, 1);
    return;
  }
  if (index === -1) colors.push({ color, count: next });
  else colors[index].count = next;
}

export function parsePoolKeys(text: string): string[] {
  return text
    .split(',')
    .map((key) => key.trim())
    .filter(Boolean);
}

function initialValue(field: EffectField): unknown {
  switch (field.kind) {
    case 'number':
      return field.optional ? undefined : (field.default ?? 1);
    case 'boolean':
      return field.default ?? false;
    case 'string':
    case 'triggerParam':
      return '';
    case 'enum':
      return field.optional ? '' : (field.default ?? field.options?.[0] ?? '');
    case 'range':
      return undefined;
    case 'temporary':
      return blankKeywords();
    case 'unit':
      return blankSummonedUnit();
    default:
      return undefined;
  }
}

export function blankEffectArgs(name: string): Record<string, any> {
  if (name === 'combine') return { effectTemplates: [] };
  if (name === 'useEnergy') {
    const effectTemplate = 'damageUnit';
    return {
      effectTemplate,
      energyUsedForArgs: 'damage',
      energyCost: undefined,
      otherArgs: blankEffectArgs(effectTemplate),
    };
  }
  const args: Record<string, any> = {};
  for (const field of fieldsFor(name)) args[field.key] = initialValue(field);
  return args;
}

export function blankAction(effectName = 'damageUnit'): ActionDraft {
  return { id: uid(), effectName, args: blankEffectArgs(effectName), targets: [] };
}

export function blankTarget(): TargetDraft {
  return { id: uid(), type: TargetType.Units, count: 1 };
}

export function blankAbility(): AbilityDraft {
  return {
    id: uid(),
    triggerType: TriggerType.Activated,
    useRange: false,
    range: blankRange(),
    staticRecompute: [],
    text: '',
    useCost: false,
    cost: 0,
    exhausts: false,
    actions: [],
  };
}

export function blankCard(): CardDraft {
  return {
    name: '',
    type: CardType.Unit,
    cost: 1,
    colors: [],
    poolKeysText: '',
    power: 1,
    maxHealth: 1,
    retaliate: 0,
    keywords: blankKeywords(),
    unitTypes: [],
    abilities: [],
    actions: [],
    health: 1,
    includeLandRetaliate: false,
    ruinsAbilities: [],
  };
}

function asNumber(value: unknown, fallback = 0): number {
  const number = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function optionalNumber(value: unknown): number | undefined {
  if (typeof value !== 'number' || !Number.isFinite(value)) return undefined;
  return value;
}

export function serializeKeywords(
  draft: KeywordDraft,
  includeStats: boolean
): Record<string, boolean | number> | undefined {
  const out: Record<string, boolean | number> = {};
  for (const key of BOOLEAN_KEYWORD_KEYS) {
    if (draft[key]) out[key] = true;
  }
  for (const key of NUMBER_KEYWORD_KEYS) {
    const value = optionalNumber(draft[key]);
    if (value !== undefined) out[key] = value;
  }
  if (includeStats) {
    const power = optionalNumber(draft.power);
    const retaliate = optionalNumber(draft.retaliate);
    if (power !== undefined) out.power = power;
    if (retaliate !== undefined) out.retaliate = retaliate;
  }
  return Object.keys(out).length ? out : undefined;
}

export function serializeRange(range: RangeDraft | undefined): UnitFilterArgs | undefined {
  if (!range) return undefined;
  const out: UnitFilterArgs = {};
  for (const flag of RANGE_FLAGS) {
    if (range[flag.key]) out[flag.key] = true;
  }
  if (range.unitType) out.unitType = range.unitType;
  if (range.hasKeyword) out.hasKeyword = range.hasKeyword;
  return Object.keys(out).length ? out : undefined;
}

export function serializeEffectArgs(
  effectName: string,
  args: Record<string, any> | undefined,
  depth = 0
): Record<string, any> {
  const source = args ?? {};
  if (depth > 6) return {};
  if (effectName === 'combine') {
    const steps = Array.isArray(source.effectTemplates) ? source.effectTemplates : [];
    return {
      effectTemplates: steps.map((step) => ({
        name: step.effectName,
        args: serializeEffectArgs(step.effectName, step.args, depth + 1),
      })),
    };
  }
  if (effectName === 'useEnergy') {
    const effectTemplate = String(source.effectTemplate || 'damageUnit');
    const out: Record<string, any> = { effectTemplate };
    const fills = String(source.energyUsedForArgs || '').trim();
    if (fills) out.energyUsedForArgs = fills;
    const energyCost = optionalNumber(source.energyCost);
    if (energyCost !== undefined) out.energyCost = energyCost;
    const other = serializeEffectArgs(effectTemplate, source.otherArgs, depth + 1);
    if (fills) delete other[fills];
    if (Object.keys(other).length) out.otherArgs = other;
    return out;
  }

  const out: Record<string, any> = {};
  for (const field of fieldsFor(effectName)) {
    const value = source[field.key];
    switch (field.kind) {
      case 'number': {
        if (field.optional) {
          const number = optionalNumber(value);
          if (number !== undefined) out[field.key] = number;
        } else {
          out[field.key] = asNumber(value, asNumber(field.default, 1));
        }
        break;
      }
      case 'boolean': {
        const checked = Boolean(value);
        if (field.omitWhen === undefined || checked !== field.omitWhen) out[field.key] = checked;
        break;
      }
      case 'string': {
        const text = String(value ?? '');
        if (!field.optional || text.trim()) out[field.key] = text;
        break;
      }
      case 'triggerParam': {
        const text = String(value ?? '').trim();
        if (text) out[field.key] = text;
        break;
      }
      case 'enum': {
        const text = String(value ?? '');
        if (text) out[field.key] = text;
        else if (!field.optional && field.options?.[0]) out[field.key] = field.options[0];
        break;
      }
      case 'range': {
        const range = serializeRange(value as RangeDraft | undefined);
        if (range) out[field.key] = range;
        break;
      }
      case 'temporary': {
        const effect = serializeKeywords(value as KeywordDraft, true);
        if (effect) out[field.key] = effect;
        break;
      }
      case 'unit': {
        if (value) out[field.key] = serializeUnit(value as UnitDraft);
        break;
      }
      default:
        break;
    }
  }
  return out;
}

function serializeAction(action: ActionDraft): ActionDefinition {
  const out: ActionDefinition = {
    effect: {
      name: action.effectName,
      args: serializeEffectArgs(action.effectName, action.args),
    },
  };
  if (action.targets.length) {
    out.targets = action.targets.map((target) => ({
      type: target.type,
      count: asNumber(target.count, 1),
    }));
  }
  return out;
}

function serializeAbility(ability: AbilityDraft): Ability {
  const trigger: Trigger = { type: ability.triggerType };
  if (ability.useRange) {
    const range = serializeRange(ability.range);
    if (range) trigger.range = range;
  }
  if (ability.triggerType === TriggerType.Static && ability.staticRecompute.length) {
    trigger.staticRecompute = [...ability.staticRecompute];
  }
  const text = ability.text.trim();
  if (text) trigger.text = text;
  const out: Ability = { trigger, actions: ability.actions.map(serializeAction) };
  if (ability.useCost) out.cost = asNumber(ability.cost, 0);
  if (ability.exhausts) out.exhausts = true;
  return out;
}

function baseFields(source: UnitDraft) {
  const name = source.name.trim();
  const id = slugify(name);
  const poolKeys = parsePoolKeys(source.poolKeysText);
  return {
    id,
    name,
    imageFileName: id,
    cost: asNumber(source.cost, 0),
    colors: source.colors
      .filter((entry) => asNumber(entry.count, 0) > 0)
      .map((entry) => ({
        color: entry.color,
        count: asNumber(entry.count, 1),
      })),
    ...(poolKeys.length ? { poolKeys } : {}),
  };
}

function unitBody(
  unit: UnitDraft
): Pick<UnitCardTemplate, 'power' | 'maxHealth' | 'retaliate'> &
  Partial<Pick<UnitCardTemplate, 'keywords' | 'unitTypes' | 'abilities'>> {
  const keywords = serializeKeywords(unit.keywords, false);
  const abilities = unit.abilities.map(serializeAbility);
  return {
    power: asNumber(unit.power, 0),
    maxHealth: asNumber(unit.maxHealth, 0),
    retaliate: asNumber(unit.retaliate, 0),
    ...(keywords ? { keywords: keywords as UnitKeywords } : {}),
    ...(unit.unitTypes.length ? { unitTypes: [...unit.unitTypes] } : {}),
    ...(abilities.length ? { abilities } : {}),
  };
}

export function serializeUnit(unit: UnitDraft): UnitCardTemplate {
  return { ...baseFields(unit), type: CardType.Unit, ...unitBody(unit) };
}

export function serializeCard(card: CardDraft): CardTemplate {
  if (card.type === CardType.Spell) {
    return {
      ...baseFields(card),
      type: CardType.Spell,
      actions: card.actions.map(serializeAction),
    };
  }
  if (card.type === CardType.Land) {
    const abilities = card.abilities.map(serializeAbility);
    const ruinsAbilities = card.ruinsAbilities.map(serializeAbility);
    return {
      ...baseFields(card),
      type: CardType.Land,
      health: asNumber(card.health, 0),
      ...(card.includeLandRetaliate ? { retaliate: asNumber(card.retaliate, 0) } : {}),
      ...(abilities.length ? { abilities } : {}),
      ...(ruinsAbilities.length ? { ruinsAbilities } : {}),
    };
  }
  return { ...baseFields(card), type: CardType.Unit, ...unitBody(card) };
}
