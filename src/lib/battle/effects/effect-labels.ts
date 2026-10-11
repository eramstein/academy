import type { TargetDefinition, UnitEndOfTurnEffects } from '@/lib/_model/model-battle';
import { getTargetLabel } from '../target';
import { getRangeLabel, type UnitFilterArgs } from './unit-filters';

export type Amount = number | string | undefined;

export function words(key: string): string {
  return key.replace(/([A-Z])/g, ' $1').toLowerCase();
}

export function joinList(parts: string[]): string {
  if (parts.length <= 1) {
    return parts[0] ?? '';
  }
  if (parts.length === 2) {
    return `${parts[0]} and ${parts[1]}`;
  }
  return `${parts.slice(0, -1).join(', ')}, and ${parts[parts.length - 1]}`;
}

export function sentence(text: string, range?: UnitFilterArgs): string {
  const body = text.trim().replace(/\s+/g, ' ');
  const ended = /[.!?]$/.test(body) ? body : `${body}.`;
  const rangeLabel = range ? getRangeLabel(range) : '';
  return rangeLabel ? `${ended} ${rangeLabel}` : ended;
}

export function targetNoun(target: TargetDefinition | undefined): string {
  if (!target) {
    return '';
  }
  return getTargetLabel(target)
    .replace(/^to\s+/, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function triggerUnitName(param: string): string {
  switch (param) {
    case 'defender':
      return 'the defending unit';
    case 'attacker':
      return 'the attacking unit';
    case 'mover':
      return 'the moving unit';
    case 'unit':
      return 'that unit';
    default:
      return `the ${words(param)}`;
  }
}

export function countedCards(count: number | string | undefined): string {
  const n = typeof count === 'number' ? count : Number(count);
  if (!n || n < 1 || Number.isNaN(n)) {
    return 'a card';
  }
  return n === 1 ? '1 card' : `${n} cards`;
}

/** Numeric args are sometimes replaced with phrases like "equal to its energy" by effect primers. */
export function describeAmount(
  amount: Amount,
  dynamicValue?: unknown
): { equalTo?: string; number?: number } {
  if (typeof amount === 'string') {
    const trimmed = amount.trim();
    if (trimmed.startsWith('equal to')) {
      return { equalTo: trimmed };
    }
    const parsed = Number(trimmed);
    if (!Number.isNaN(parsed) && trimmed !== '') {
      return { number: parsed };
    }
    return { equalTo: trimmed };
  }
  if (typeof dynamicValue === 'string' && dynamicValue) {
    const multiplier = typeof amount === 'number' ? amount : 1;
    const dynamicLabel = dynamicValue
      .replaceAll('ennemies', 'enemies')
      .replaceAll('ennemy', 'enemy');
    const value =
      !multiplier || multiplier === 1 ? dynamicLabel : `${dynamicLabel} × ${multiplier}`;
    return { equalTo: `equal to ${value}` };
  }
  if (typeof amount === 'number') {
    return { number: amount };
  }
  return {};
}

export function affectedPhrase(
  targets: TargetDefinition[],
  options: {
    fromTriggerParam?: string;
    range?: UnitFilterArgs;
    randomTargets?: number;
  } = {}
): { self: boolean; phrase?: string; range?: UnitFilterArgs } {
  const range = options.fromTriggerParam ? undefined : options.range;
  if (options.randomTargets) {
    const n = options.randomTargets;
    const who = n === 1 ? 'a random unit' : `${n} random units`;
    if (targets[0] && range && !range.self) {
      return { self: false, phrase: `${who} in range of ${targetNoun(targets[0])}`, range };
    }
    if (targets[0]) {
      const noun = targetNoun({ ...targets[0], count: n }).replace(/\btarget\b/g, 'random');
      const phrase = /^\d/.test(noun) || noun.startsWith('a ') ? noun : `a ${noun}`;
      return { self: false, phrase, range };
    }
    return { self: false, phrase: who, range };
  }
  if (options.fromTriggerParam) {
    return { self: false, phrase: triggerUnitName(options.fromTriggerParam) };
  }
  if (targets[0]) {
    const noun = targetNoun(targets[0]);
    if (range && !range.self) {
      return { self: false, phrase: `units in range of ${noun}`, range };
    }
    return { self: false, phrase: noun, range };
  }
  if (!range || range.self) {
    return { self: true, range };
  }
  return { self: false, phrase: 'units in range', range };
}

export function cap(text: string): string {
  return text ? text.charAt(0).toUpperCase() + text.slice(1) : text;
}

export function isPluralTarget(phrase: string | undefined): boolean {
  if (!phrase) {
    return false;
  }
  return /^\d+\s/.test(phrase) || /\b(units|allies|enemies|cards|lands|cells)\b/.test(phrase);
}

export function getsClause(phrase: string | undefined, change: string, self: boolean): string {
  if (self) {
    return `Gets ${change}`;
  }
  const subject = cap(phrase ?? 'units');
  const verb = isPluralTarget(phrase) ? 'get' : 'gets';
  return `${subject} ${verb} ${change}`;
}

export function statFragment(
  label: string,
  amount: Amount,
  dynamicValue?: unknown
): string | undefined {
  if (amount === undefined || amount === 0 || amount === '0') {
    return undefined;
  }
  const described = describeAmount(amount, dynamicValue);
  if (described.equalTo) {
    if (typeof amount === 'number' && !amount) {
      return undefined;
    }
    return `${label} ${described.equalTo}`;
  }
  if (described.number === undefined || described.number === 0) {
    return undefined;
  }
  const signed = described.number > 0 ? `+${described.number}` : `${described.number}`;
  return `${signed} ${label}`;
}

export function describeTemporaryBonus(effect: UnitEndOfTurnEffects): string {
  const parts = Object.keys(effect).map((key) => {
    const value = effect[key as keyof UnitEndOfTurnEffects];
    const name = words(key);
    if (value === true || value === undefined) {
      return name;
    }
    if (typeof value === 'number') {
      if (key === 'power' || key === 'retaliate') {
        const signed = value > 0 ? `+${value}` : `${value}`;
        return `${signed} ${name}`;
      }
      return `${name} ${value}`;
    }
    return name;
  });
  return joinList(parts) || 'a temporary bonus';
}

export function magnitudeLabel(described: { equalTo?: string; number?: number }): string {
  if (described.equalTo) {
    return described.equalTo;
  }
  return String(Math.abs(described.number ?? 0));
}
