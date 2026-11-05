import { RelationTag, type Npc } from '@/lib/_model';
import { getLoadedModInteractions } from '@/lib/mods';
import { gs } from '@/lib/_state';
import type { InteractionTemplate, InteractionTriggers, InteractionValue } from './types';

const INTERACTION_TYPE_PREFIX = 'interaction:';
const RELATION_TAGS = new Set<string>(Object.values(RelationTag));

/** Built-in templates. Optional mod templates load from mods/<id>/interactions.json. */
const builtInTemplates: InteractionTemplate[] = [];

/** Socialize "How?" option value for a concrete interaction. */
export function encodeInteractionType(key: string): string {
  return `${INTERACTION_TYPE_PREFIX}${key}`;
}

export function decodeInteractionType(value: string): string | undefined {
  if (!value.startsWith(INTERACTION_TYPE_PREFIX)) return undefined;
  const key = value.slice(INTERACTION_TYPE_PREFIX.length);
  return key || undefined;
}

export interface InteractionOffer {
  key: string;
  label: string;
  icon: string;
}

export function getInteractionTemplate(key: string): InteractionTemplate | undefined {
  return allTemplates().find((template) => template.key === key);
}

export function interactionIcon(key: string): string {
  return getInteractionTemplate(key)?.icon ?? 'taunt';
}

/** Interactions this NPC can start right now. One button each, not a single "Interact". */
export function listInteractions(characterKey: string): InteractionOffer[] {
  const npc = gs.characters[characterKey];
  if (!npc) return [];
  return allTemplates()
    .filter((template) => interactionAvailable(template, npc))
    .map((template) => ({
      key: template.key,
      label: template.label,
      icon: template.icon ?? 'taunt',
    }));
}

export function interactionAvailable(template: InteractionTemplate, npc: Npc): boolean {
  if (!template.triggers) return true;
  return triggersHold(template.triggers, npc);
}

function allTemplates(): InteractionTemplate[] {
  const fromMods = getLoadedModInteractions<unknown>()
    .map(normalizeInteractionTemplate)
    .filter((template): template is InteractionTemplate => !!template);
  const seen = new Set(builtInTemplates.map((template) => template.key));
  const extras = fromMods.filter((template) => {
    if (seen.has(template.key)) return false;
    seen.add(template.key);
    return true;
  });
  return [...builtInTemplates, ...extras];
}

function triggersHold(triggers: InteractionTriggers, npc: Npc): boolean {
  if (triggers.anyRelationTag) {
    if (!triggers.anyRelationTag.length) return false;
    const tags = new Set(npc.relationTags ?? []);
    if (!triggers.anyRelationTag.some((tag) => tags.has(tag))) return false;
  }
  return true;
}

function normalizeInteractionTemplate(raw: unknown): InteractionTemplate | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  const row = raw as Record<string, unknown>;
  if (typeof row.key !== 'string' || !row.key) return undefined;
  if (typeof row.label !== 'string' || !row.label) return undefined;
  if (typeof row.systemPrompt !== 'string' || !row.systemPrompt) return undefined;
  if (typeof row.situation !== 'string' || !row.situation) return undefined;
  if (!Array.isArray(row.actionTypes) || row.actionTypes.length === 0) return undefined;
  if (!Array.isArray(row.values) || row.values.length === 0) return undefined;
  if (!row.reactions || typeof row.reactions !== 'object') return undefined;

  const actionTypes = row.actionTypes.filter((type): type is string => typeof type === 'string');
  const values = row.values
    .map(normalizeValue)
    .filter((value): value is InteractionValue => !!value);
  if (!actionTypes.length || !values.length) return undefined;

  const reactions: Record<string, Record<string, number>> = {};
  for (const [type, deltas] of Object.entries(row.reactions as Record<string, unknown>)) {
    if (!deltas || typeof deltas !== 'object') continue;
    const numbers: Record<string, number> = {};
    for (const [key, delta] of Object.entries(deltas as Record<string, unknown>)) {
      if (typeof delta === 'number' && Number.isFinite(delta)) numbers[key] = delta;
    }
    reactions[type] = numbers;
  }

  return {
    key: row.key,
    label: row.label,
    ...(typeof row.icon === 'string' && row.icon ? { icon: row.icon } : {}),
    systemPrompt: row.systemPrompt,
    situation: row.situation,
    actionTypes,
    values,
    reactions,
    ...(normalizeNpcDescriptions(row.npcDescriptions)
      ? { npcDescriptions: normalizeNpcDescriptions(row.npcDescriptions) }
      : {}),
    ...(normalizeTriggers(row.triggers) ? { triggers: normalizeTriggers(row.triggers) } : {}),
    ...(typeof row.stopText === 'string' && row.stopText ? { stopText: row.stopText } : {}),
  };
}

function normalizeNpcDescriptions(raw: unknown): Record<string, string> | undefined {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return undefined;
  const descriptions: Record<string, string> = {};
  for (const [key, text] of Object.entries(raw as Record<string, unknown>)) {
    if (!key || typeof text !== 'string') continue;
    const trimmed = text.trim();
    if (trimmed) descriptions[key] = trimmed;
  }
  return Object.keys(descriptions).length ? descriptions : undefined;
}

function normalizeValue(raw: unknown): InteractionValue | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  const row = raw as Record<string, unknown>;
  if (typeof row.key !== 'string' || !row.key) return undefined;
  if (typeof row.label !== 'string' || !row.label) return undefined;
  if (typeof row.initial !== 'number' || !Number.isFinite(row.initial)) return undefined;
  if (!row.bands || typeof row.bands !== 'object') return undefined;

  const bands: Record<number, string> = {};
  for (const [at, label] of Object.entries(row.bands as Record<string, unknown>)) {
    const point = Number(at);
    if (!Number.isFinite(point) || typeof label !== 'string') continue;
    bands[point] = label;
  }
  if (!Object.keys(bands).length) return undefined;

  const outcomes = Array.isArray(row.outcomes)
    ? row.outcomes
        .map((entry) => {
          if (!entry || typeof entry !== 'object') return undefined;
          const outcome = entry as Record<string, unknown>;
          if (typeof outcome.threshold !== 'string' || typeof outcome.effect !== 'string') {
            return undefined;
          }
          return { threshold: outcome.threshold, effect: outcome.effect };
        })
        .filter((entry): entry is { threshold: string; effect: string } => !!entry)
    : undefined;

  return {
    key: row.key,
    label: row.label,
    initial: row.initial,
    bands,
    ...(outcomes?.length ? { outcomes } : {}),
  };
}

function normalizeTriggers(raw: unknown): InteractionTriggers | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  const row = raw as Record<string, unknown>;
  if (!Array.isArray(row.anyRelationTag)) return undefined;
  const anyRelationTag = row.anyRelationTag
    .filter((tag): tag is string => typeof tag === 'string')
    .filter((tag): tag is RelationTag => RELATION_TAGS.has(tag));
  return { anyRelationTag };
}
