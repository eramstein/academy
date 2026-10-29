import {
  ResourceType,
  type Action,
  type Artifact,
  type ArtifactResourceCost,
  type ArtifactTool,
  type ArtifactTrinket,
  type CardColor,
} from '@/lib/_model';
import { ActionType } from '@/lib/_model/enums-sim';
import { gs } from '@/lib/_state';
import { getLoadedArtifact } from '../artifacts';

/** Where artifact crafting is offered. */
const WORKSHOP_PLACE = 'academy-workshop';

export interface CraftArtifactParameters {
  outcome?: 'paused' | 'completed';
  patternKey?: string;
  name?: string;
}

export interface ArtifactCostLine {
  key: 'gold' | ResourceType;
  label: string;
  need: number;
  have: number;
  enough: boolean;
}

export interface ArtifactCostAlternative {
  lines: ArtifactCostLine[];
  /** True when this alternative alone can be paid from current stock. */
  enough: boolean;
}

export interface ArtifactPieceCostView {
  name: string;
  alternatives: ArtifactCostAlternative[];
  /** First alternative that is enough on its own, else 0. */
  suggestedIndex: number;
  /** True when at least one alternative is enough on its own. */
  enough: boolean;
}

export interface ArtifactCraftView {
  artifact: Artifact;
  /** Filled cells per color bar, same order as `artifact.colorCost`. */
  filled: number[];
  missingPatternNames: string[];
  /** True when some one-alternative-per-piece combo can be paid together. */
  affordable: boolean;
  /** Combo of alternative indices that can be paid together, or null. */
  affordableChoices: number[] | null;
  pieces: ArtifactPieceCostView[];
}

export type ArtifactCellPayment = 'mastery' | 'dreamsphere';

export interface FillArtifactCellResult {
  bonus: boolean;
  /** True when a second cell was rolled for. False when the paid cell finished the bar. */
  rolled: boolean;
  chance: number;
  complete: boolean;
  payment: ArtifactCellPayment;
}

const COST_ALIASES: Record<string, ResourceType> = {
  magicDust: ResourceType.MagicDust,
  magic_dust: ResourceType.MagicDust,
  mox: ResourceType.Moxes,
  mollysBeads: ResourceType.MollysBeads,
  mollys_beads: ResourceType.MollysBeads,
  schlupakMushrooms: ResourceType.SchlupakMushrooms,
  schlupak_mushrooms: ResourceType.SchlupakMushrooms,
  schlupakDreamspheres: ResourceType.Dreamspheres,
  dreamspheres: ResourceType.Dreamspheres,
  schlupakSpores: ResourceType.SchlupakSpores,
  schlupak_spores: ResourceType.SchlupakSpores,
  ithildinCrystal: ResourceType.IthildinCrystal,
  ithildin_crystal: ResourceType.IthildinCrystal,
};

function resolveCostKey(raw: string): 'gold' | ResourceType | undefined {
  if (raw === 'gold') return 'gold';
  if (COST_ALIASES[raw]) return COST_ALIASES[raw];
  if ((Object.values(ResourceType) as string[]).includes(raw)) return raw as ResourceType;
  return undefined;
}

/**
 * Extra-cell chance for a crafting session.
 * Take your time guarantees 100%; otherwise dexterity × 2 + 5 per focus, capped at 100.
 */
export function artifactProgressChance(focusSpent: number, takeYourTime = false): number {
  if (takeYourTime) return 100;
  const dexterity = gs.player.attributes?.dexterity ?? 0;
  const focus = Math.max(0, focusSpent);
  return Math.min(100, Math.max(0, dexterity * 2 + focus * 5));
}

export function dreamsphereStock(): number {
  return gs.player.resources?.[ResourceType.Dreamspheres] ?? 0;
}

export function canPayArtifactCell(
  color: CardColor,
  payment: ArtifactCellPayment
): boolean {
  if (payment === 'dreamsphere') return dreamsphereStock() > 0;
  return (gs.player.colorMasteryPoints?.[color] ?? 0) > 0;
}

export function getCraftArtifactActions(): Action[] {
  if (gs.player.placeKey !== WORKSHOP_PLACE) return [];
  if (getCraftablePatterns().length === 0) return [];
  return [
    {
      label: 'Craft Artifact',
      actionType: ActionType.CraftArtifact,
      isLongAction: true,
      actionParameters: {},
    },
  ];
}

export function getCraftablePatterns(): ArtifactCraftView[] {
  const known = [...new Set(gs.player.artifacts?.patterns ?? [])];
  const views = known.flatMap((patternKey) => {
    const artifact = getLoadedArtifact(patternKey);
    if (!artifact) return [];
    const missing = (artifact.requiredPatterns ?? []).filter((key) => !known.includes(key));
    const pieces = readPieceViews(artifact);
    const affordableChoices = findAffordablePieceChoices(pieces);
    return [
      {
        artifact,
        filled: filledCounts(artifact),
        missingPatternNames: missing.map((key) => getLoadedArtifact(key)?.name ?? key),
        affordable: affordableChoices !== null,
        affordableChoices,
        pieces,
      },
    ];
  });
  views.sort((a, b) => {
    const rankA = craftRank(a);
    const rankB = craftRank(b);
    if (rankA !== rankB) return rankA - rankB;
    return a.artifact.name.localeCompare(b.artifact.name);
  });
  return views;
}

export function spendCraftFocus(amount: number): number {
  const available = Math.max(0, gs.player.focus ?? 0);
  const spent = Math.max(0, Math.min(Math.floor(amount), available));
  gs.player.focus = available - spent;
  return spent;
}

export function fillArtifactCell(
  patternKey: string,
  barIndex: number,
  chance: number,
  payment: ArtifactCellPayment = 'mastery'
): FillArtifactCellResult | null {
  const artifact = getLoadedArtifact(patternKey);
  if (!artifact) return null;
  const bar = artifact.colorCost[barIndex];
  if (!bar) return null;
  const filled = filledCounts(artifact);
  if (filled[barIndex] >= bar.cost) return null;
  if (!canPayArtifactCell(bar.color, payment)) return null;

  ensureCraftState();
  if (payment === 'dreamsphere') {
    gs.player.resources[ResourceType.Dreamspheres] = dreamsphereStock() - 1;
  } else {
    const mastery = gs.player.colorMasteryPoints?.[bar.color] ?? 0;
    gs.player.colorMasteryPoints[bar.color] = mastery - 1;
  }
  filled[barIndex] += 1;

  const percent = Math.min(100, Math.max(0, chance));
  let bonus = false;
  let rolled = false;
  if (filled[barIndex] < bar.cost) {
    rolled = true;
    if (Math.random() * 100 < percent) {
      filled[barIndex] += 1;
      bonus = true;
    }
  }

  writeFilled(artifact, filled);
  return {
    bonus,
    rolled,
    chance: percent,
    complete: isFilled(artifact, filled),
    payment,
  };
}

/** Spend gold and materials, add the artifact, and clear its progress. */
export function completeCraftedArtifact(
  patternKey: string,
  options?: { free?: boolean; pieceChoices?: number[] }
): boolean {
  const artifact = getLoadedArtifact(patternKey);
  if (!artifact) return false;
  if (!options?.free) {
    if (!isFilled(artifact, filledCounts(artifact))) return false;
    if (!spendArtifactCosts(artifact, options?.pieceChoices)) return false;
  }

  ensureCraftState();
  const copy = structuredClone(artifact);
  if ('skillBonuses' in copy) {
    gs.player.artifacts.tools.push(copy as ArtifactTool);
  } else if ('attributeBonuses' in copy) {
    gs.player.artifacts.trinkets.push(copy as ArtifactTrinket);
  } else {
    gs.player.artifacts.tools.push(copy as ArtifactTool);
  }
  gs.player.artifactProgress = gs.player.artifactProgress.filter(
    (entry) => entry.key !== patternKey
  );
  return true;
}

export function craftArtifact(parameters: CraftArtifactParameters): string {
  const name = parameters.name?.trim() || 'artifact';
  if (parameters.outcome === 'completed') {
    return `You finish the ${name}.`;
  }
  return `You set the ${name} aside. The work can wait.`;
}

function craftRank(view: ArtifactCraftView): number {
  if (view.filled.some((count) => count > 0)) return 0;
  if (view.missingPatternNames.length > 0) return 2;
  return 1;
}

function ensureCraftState() {
  if (!gs.player.artifacts) {
    gs.player.artifacts = { patterns: [], tools: [], trinkets: [] };
  }
  gs.player.artifacts.patterns ??= [];
  gs.player.artifacts.tools ??= [];
  gs.player.artifacts.trinkets ??= [];
  if (!Array.isArray(gs.player.artifactProgress)) {
    gs.player.artifactProgress = [];
  }
  if (!gs.player.colorMasteryPoints) {
    gs.player.colorMasteryPoints = { green: 0, blue: 0, red: 0, black: 0 };
  }
}

function filledCounts(artifact: Artifact): number[] {
  const saved = gs.player.artifactProgress?.find((entry) => entry.key === artifact.patternKey);
  return artifact.colorCost.map((entry, index) => {
    const cell = saved?.colorCost[index];
    if (!cell || cell.color !== entry.color) return 0;
    return Math.max(0, Math.min(entry.cost, cell.cost));
  });
}

function writeFilled(artifact: Artifact, filled: number[]) {
  ensureCraftState();
  const colorCost = artifact.colorCost.map((entry, index) => ({
    color: entry.color,
    cost: filled[index] ?? 0,
  }));
  const existing = gs.player.artifactProgress.find((entry) => entry.key === artifact.patternKey);
  if (existing) {
    existing.colorCost = colorCost;
    return;
  }
  gs.player.artifactProgress.push({ key: artifact.patternKey, colorCost });
}

function isFilled(artifact: Artifact, filled: number[]): boolean {
  return artifact.colorCost.every((entry, index) => (filled[index] ?? 0) >= entry.cost);
}

/** Piece costs for an artifact pattern, with current stock. */
export function getArtifactPieceCosts(artifact: Artifact): ArtifactPieceCostView[] {
  return readPieceViews(artifact);
}

/** Whether the given one-alternative-per-piece choices can be paid together. */
export function canAffordPieceChoices(pieces: ArtifactPieceCostView[], choices: number[]): boolean {
  return totalsForChoices(pieces, choices) !== null;
}

/** First combo of alternative indices that can be paid together, or null. */
export function findAffordablePieceChoices(pieces: ArtifactPieceCostView[]): number[] | null {
  if (pieces.length === 0) return [];

  const search = (
    index: number,
    remaining: Map<'gold' | ResourceType, number>
  ): number[] | null => {
    if (index >= pieces.length) return [];
    const piece = pieces[index];
    for (let alt = 0; alt < piece.alternatives.length; alt++) {
      const next = deductLines(remaining, piece.alternatives[alt].lines);
      if (!next) continue;
      const rest = search(index + 1, next);
      if (rest) return [alt, ...rest];
    }
    return null;
  };

  return search(0, stockMap());
}

function readPieceViews(artifact: Artifact): ArtifactPieceCostView[] {
  return (artifact.pieces ?? []).map((piece) => {
    const alternatives = (piece.alternativeResourcesCost ?? []).map((cost) =>
      readAlternative(cost)
    );
    const suggestedIndex = Math.max(
      0,
      alternatives.findIndex((alternative) => alternative.enough)
    );
    return {
      name: piece.name,
      alternatives,
      suggestedIndex: alternatives.some((alternative) => alternative.enough) ? suggestedIndex : 0,
      enough: alternatives.some((alternative) => alternative.enough),
    };
  });
}

function readAlternative(cost: ArtifactResourceCost): ArtifactCostAlternative {
  const lines: ArtifactCostLine[] = [];
  for (const [raw, amount] of Object.entries(cost ?? {})) {
    if (typeof amount !== 'number' || amount <= 0) continue;
    const key = resolveCostKey(raw);
    if (!key) continue;
    const have = amountOnHand(key);
    lines.push({
      key,
      label: costLabel(key),
      need: amount,
      have,
      enough: have >= amount,
    });
  }
  lines.sort((a, b) => {
    if (a.key === 'gold') return -1;
    if (b.key === 'gold') return 1;
    return a.label.localeCompare(b.label);
  });
  return {
    lines,
    enough: lines.every((line) => line.enough),
  };
}

function spendArtifactCosts(artifact: Artifact, pieceChoices?: number[]): boolean {
  const pieces = readPieceViews(artifact);
  const choices =
    pieceChoices &&
    pieceChoices.length === pieces.length &&
    canAffordPieceChoices(pieces, pieceChoices)
      ? pieceChoices
      : findAffordablePieceChoices(pieces);
  if (!choices) return false;

  const totals = totalsForChoices(pieces, choices);
  if (!totals) return false;

  for (const [key, need] of totals) {
    if (key === 'gold') {
      gs.player.gold -= need;
    } else {
      gs.player.resources[key] -= need;
    }
  }
  return true;
}

function totalsForChoices(
  pieces: ArtifactPieceCostView[],
  choices: number[]
): Map<'gold' | ResourceType, number> | null {
  if (choices.length !== pieces.length) return null;
  const totals = new Map<'gold' | ResourceType, number>();
  for (let i = 0; i < pieces.length; i++) {
    const alternative = pieces[i].alternatives[choices[i]];
    if (!alternative) return null;
    for (const line of alternative.lines) {
      totals.set(line.key, (totals.get(line.key) ?? 0) + line.need);
    }
  }
  for (const [key, need] of totals) {
    if (amountOnHand(key) < need) return null;
  }
  return totals;
}

function stockMap(): Map<'gold' | ResourceType, number> {
  const stock = new Map<'gold' | ResourceType, number>();
  stock.set('gold', amountOnHand('gold'));
  for (const type of Object.values(ResourceType)) {
    stock.set(type, amountOnHand(type));
  }
  return stock;
}

function deductLines(
  stock: Map<'gold' | ResourceType, number>,
  lines: ArtifactCostLine[]
): Map<'gold' | ResourceType, number> | null {
  const next = new Map(stock);
  for (const line of lines) {
    const have = next.get(line.key) ?? 0;
    if (have < line.need) return null;
    next.set(line.key, have - line.need);
  }
  return next;
}

function amountOnHand(key: 'gold' | ResourceType): number {
  if (key === 'gold') return gs.player.gold ?? 0;
  return gs.player.resources?.[key] ?? 0;
}

function costLabel(key: 'gold' | ResourceType): string {
  if (key === 'gold') return 'Gold';
  if (key === ResourceType.MollysBeads) return "Molly's Beads";
  return key.replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
}
