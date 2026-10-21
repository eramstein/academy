import { RumorType, type Rumor } from '@/lib/_model';
import { gs } from '@/lib/_state';

const rumorModules = import.meta.glob('@/data/sim/rumors/*.json', {
  eager: true,
  import: 'default',
}) as Record<string, Rumor[]>;

/** Load authored seed rumors from `src/data/sim/rumors/*.json` into `gs.rumors`. */
export function loadRumors(): void {
  gs.rumors = Object.values(rumorModules).flat().map((rumor) => ({ ...rumor }));
}

export interface AddRumorParameters {
  text: string;
  /** NPC (or player) the rumor is about. */
  aboutNpcKey?: string;
  /** Who the player heard it from. */
  fromNpcKey?: string;
  /** Days from now when the rumor becomes active; stored as an absolute day. */
  fromDay?: number;
  /** Days from now when the rumor expires; stored as an absolute day. */
  untilDay?: number;
}

/** Appends a rumor to `gs.rumors`. */
export function addRumor(parameters: AddRumorParameters): string {
  const { text, aboutNpcKey, fromNpcKey, fromDay, untilDay } = parameters;

  if (typeof text !== 'string' || !text.trim()) {
    return `Invalid rumor text: ${text}.`;
  }
  if (aboutNpcKey !== undefined && !isValidCharacterKey(aboutNpcKey)) {
    return `Invalid aboutNpcKey: ${aboutNpcKey}.`;
  }
  if (fromNpcKey !== undefined && !isValidCharacterKey(fromNpcKey)) {
    return `Invalid fromNpcKey: ${fromNpcKey}.`;
  }
  if (fromDay !== undefined && (typeof fromDay !== 'number' || !Number.isFinite(fromDay))) {
    return `Invalid rumor fromDay: ${fromDay}.`;
  }
  if (untilDay !== undefined && (typeof untilDay !== 'number' || !Number.isFinite(untilDay))) {
    return `Invalid rumor untilDay: ${untilDay}.`;
  }

  if (!gs.rumors) {
    gs.rumors = [];
  }

  const rumor: Rumor = { text: text.trim() };
  if (aboutNpcKey) {
    rumor.aboutNpcKey = aboutNpcKey;
  }
  if (fromNpcKey) {
    rumor.fromNpcKey = fromNpcKey;
  }
  if (fromDay !== undefined) {
    rumor.fromDay = gs.time.day + fromDay;
  }
  if (untilDay !== undefined) {
    rumor.untilDay = gs.time.day + untilDay;
  }
  gs.rumors.push(rumor);

  // Silent: pair with narrate for player-facing prose.
  return '';
}

/** Drops rumors whose `untilDay` is before the current day. */
export function cleanExpiredRumors(): void {
  if (!gs.rumors?.length) {
    return;
  }
  const day = gs.time.day;
  gs.rumors = gs.rumors.filter((rumor) => rumor.untilDay === undefined || rumor.untilDay >= day);
}

/** Adds a Match rumor for a league result if none already exists. */
export function recordMatchRumor(opponentKey: string, won: boolean): void {
  if (gs.rumors.some((rumor) => rumor.rumorType === RumorType.Match)) {
    return;
  }
  const opponentName = gs.characters[opponentKey]?.name ?? opponentKey;
  gs.rumors.push({
    text: won
      ? `${gs.player.name} defeated ${opponentName} in a league match.`
      : `${opponentName} defeated ${gs.player.name} in a league match.`,
    aboutNpcKey: opponentKey,
    rumorType: RumorType.Match,
  });
}

function isValidCharacterKey(key: string): boolean {
  return key === 'player' || key === gs.player.key || !!gs.characters[key];
}
