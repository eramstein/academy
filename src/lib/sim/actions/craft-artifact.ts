import {
  ResourceType,
  type Action,
  type Artifact,
  type ArtifactTool,
  type ArtifactTrinket,
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

export interface ArtifactCraftView {
  artifact: Artifact;
  /** Filled cells per color bar, same order as `artifact.colorCost`. */
  filled: number[];
  missingPatternNames: string[];
  affordable: boolean;
  costs: ArtifactCostLine[];
}

export interface FillArtifactCellResult {
  bonus: boolean;
  /** True when a second cell was rolled for. False when the paid cell finished the bar. */
  rolled: boolean;
  chance: number;
  complete: boolean;
}

const COST_ALIASES: Record<string, ResourceType> = {
  magicDust: ResourceType.MagicDust,
  mox: ResourceType.Moxes,
  mollysBeads: ResourceType.MollysBeads,
  schlupakMushrooms: ResourceType.SchlupakMushrooms,
  schlupakDreamspheres: ResourceType.SchlupakDreamspheres,
  schlupakSpores: ResourceType.SchlupakSpores,
};

function resolveCostKey(raw: string): 'gold' | ResourceType | undefined {
  if (raw === 'gold') return 'gold';
  if (COST_ALIASES[raw]) return COST_ALIASES[raw];
  if ((Object.values(ResourceType) as string[]).includes(raw)) return raw as ResourceType;
  return undefined;
}

/** Dexterity × 2, plus 5 per focus spent on this action, capped at 100. */
export function artifactProgressChance(focusSpent: number): number {
  const dexterity = gs.player.attributes?.dexterity ?? 0;
  const focus = Math.max(0, focusSpent);
  return Math.min(100, Math.max(0, dexterity * 2 + focus * 5));
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
    const costs = readCostLines(artifact);
    return [
      {
        artifact,
        filled: filledCounts(artifact),
        missingPatternNames: missing.map((key) => getLoadedArtifact(key)?.name ?? key),
        affordable: costs.every((line) => line.enough),
        costs,
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
  chance: number
): FillArtifactCellResult | null {
  const artifact = getLoadedArtifact(patternKey);
  if (!artifact) return null;
  const bar = artifact.colorCost[barIndex];
  if (!bar) return null;
  const filled = filledCounts(artifact);
  if (filled[barIndex] >= bar.cost) return null;
  const mastery = gs.player.colorMasteryPoints?.[bar.color] ?? 0;
  if (mastery <= 0) return null;

  ensureCraftState();
  gs.player.colorMasteryPoints[bar.color] = mastery - 1;
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
  };
}

/** Spend gold and materials, add the artifact, and clear its progress. */
export function completeCraftedArtifact(
  patternKey: string,
  options?: { free?: boolean }
): boolean {
  const artifact = getLoadedArtifact(patternKey);
  if (!artifact) return false;
  if (!options?.free) {
    if (!isFilled(artifact, filledCounts(artifact))) return false;
    if (!spendArtifactCosts(artifact)) return false;
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

/** Resource and gold costs for an artifact pattern, with current stock. */
export function getArtifactCostLines(artifact: Artifact): ArtifactCostLine[] {
  return readCostLines(artifact);
}

function readCostLines(artifact: Artifact): ArtifactCostLine[] {
  const lines: ArtifactCostLine[] = [];
  for (const [raw, amount] of Object.entries(artifact.resourcesCost ?? {})) {
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
  return lines;
}

function spendArtifactCosts(artifact: Artifact): boolean {
  const lines = readCostLines(artifact);
  if (lines.some((line) => !line.enough)) return false;
  for (const line of lines) {
    if (line.key === 'gold') {
      gs.player.gold -= line.need;
    } else {
      gs.player.resources[line.key] -= line.need;
    }
  }
  return true;
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
