import { TriggerType, type BattleState, type Card, type CardColor, type Player, type UnitDeployed } from '@/lib/_model';
import { bs } from '@/lib/_state';
import { getAbilityCost, getCardBudget } from '@/lib/sim/cards/card-budget';
import { laneValue } from './lane';
import { exchange, landLifeValue } from './valuations/config';
import { AI_PLAYER_ID, WeightPreset, type ScoreBreakdown, type ScoreTerminal } from './model';

export interface PositionWeights {
  aiLifeWeight: number;
  opponentLifeWeight: number;
  boardWeight: number;
  /** Scales the AI's unit total inside the board term. Lower → happier to take retaliate. */
  ownUnitWeight: number;
  /** Scales the opponent's unit total. Higher → happier to chip/kill blockers. */
  enemyUnitWeight: number;
  landWeight: number;
  handWeight: number;
  colorWeight: number;
}

export interface ScoreCredits {
  mana: number;
  color: number;
  latent: number;
}

let activePreset = WeightPreset.Normal;

export function setActivePreset(preset: WeightPreset) {
  activePreset = preset;
}

export function getActivePreset(): WeightPreset {
  return activePreset;
}

export function weightsFor(preset: WeightPreset): PositionWeights {
  if (preset === WeightPreset.Aggro) {
    return {
      aiLifeWeight: exchange.aiLifeAggro,
      opponentLifeWeight: exchange.opponentLifeAggro,
      boardWeight: exchange.boardWeightAggro,
      ownUnitWeight: exchange.ownUnitWeightAggro,
      enemyUnitWeight: exchange.enemyUnitWeightAggro,
      landWeight: exchange.landWeight,
      handWeight: exchange.handWeight,
      colorWeight: exchange.colorWeight,
    };
  }
  if (preset === WeightPreset.Defend) {
    return {
      aiLifeWeight: exchange.aiLifeDefend,
      opponentLifeWeight: exchange.opponentLifeDefend,
      boardWeight: exchange.boardWeight,
      ownUnitWeight: exchange.ownUnitWeightDefend,
      enemyUnitWeight: exchange.enemyUnitWeightDefend,
      landWeight: exchange.landWeight,
      handWeight: exchange.handWeight,
      colorWeight: exchange.colorWeight,
    };
  }
  return {
    aiLifeWeight: exchange.aiLifeNormal,
    opponentLifeWeight: exchange.opponentLife,
    boardWeight: exchange.boardWeight,
    ownUnitWeight: exchange.ownUnitWeight,
    enemyUnitWeight: exchange.enemyUnitWeight,
    landWeight: exchange.landWeight,
    handWeight: exchange.handWeight,
    colorWeight: exchange.colorWeight,
  };
}

export function valueUnit(unit: UnitDeployed): number {
  const printedPowerStat = unit.power - (unit.untilEndOfTurn?.power ?? 0);
  const colors = (unit.colors ?? []).map((entry) => entry.color);
  const onDeployCost = (unit.abilities ?? [])
    .filter((ability) => ability.trigger?.type === TriggerType.OnDeploy)
    .reduce((sum, ability) => sum + getAbilityCost(ability, colors), 0);
  const printed = getCardBudget({ ...unit, power: printedPowerStat }) - onDeployCost;
  const healthBudget = unit.maxHealth * 2;
  const threat = printed - healthBudget - printedPowerStat * 4 + unit.power * 4;
  const ratio = unit.maxHealth > 0 ? Math.max(0, unit.health) / unit.maxHealth : 0;
  const durability = healthBudget * Math.sqrt(ratio);
  const value = threat + durability;
  return Number.isFinite(value) ? value : 0;
}

export function boardShare(): number {
  let ai = 0;
  let human = 0;
  for (const unit of bs.units) {
    const value = valueUnit(unit);
    if (unit.ownerPlayerId === AI_PLAYER_ID) ai += value;
    else human += value;
  }
  const total = ai + human;
  if (total === 0) return 0.5;
  return ai / total;
}

/** Unspent mana that can still pay toward a card in hand this turn. Pass skips this credit. */
export function manaCreditFor(player: Player): number {
  let pool = player.mana;
  const cards = player.hand
    .filter((card) => colorsMet(card, player.colors) && card.cost > 0)
    .sort((a, b) => a.cost - b.cost || a.instanceId.localeCompare(b.instanceId));
  let useful = 0;
  for (const card of cards) {
    if (pool <= 0) break;
    const spend = Math.min(pool, card.cost);
    useful += spend;
    pool -= spend;
  }
  return useful * exchange.manaPoint;
}

export function colorProgress(baseline: BattleState, playerId: number): number {
  const before = baseline.players[playerId];
  const now = bs.players[playerId];
  let credit = 0;
  for (const card of now.hand) {
    if (!before.hand.some((existing) => existing.instanceId === card.instanceId)) continue;
    const required = colorPipsRequired(card);
    if (required <= 0) continue;
    const metBefore = colorPipsMet(card, before.colors);
    const metNow = colorPipsMet(card, now.colors);
    const closed = metNow - metBefore;
    if (closed <= 0) continue;
    const budget = getCardBudget(card);
    const opened = !colorsMet(card, before.colors) && colorsMet(card, now.colors);
    if (opened && now.mana >= card.cost) {
      credit += exchange.colorUnlockFraction * budget;
    } else if (!colorsMet(card, now.colors)) {
      credit += exchange.colorPartialFraction * budget * (closed / required);
    }
  }
  return credit;
}

export function emptyCredits(): ScoreCredits {
  return { mana: 0, color: 0, latent: 0 };
}

export function scorePosition(
  baseline: BattleState,
  favoringPlayerId: number,
  credits: ScoreCredits
): Omit<ScoreBreakdown, 'id'> {
  const weights = weightsFor(activePreset);
  const otherId = favoringPlayerId === 0 ? 1 : 0;
  const self = bs.players[favoringPlayerId];
  const other = bs.players[otherId];
  const baseSelf = baseline.players[favoringPlayerId];
  const baseOther = baseline.players[otherId];
  const selfLost = baseSelf.life - self.life;
  const otherLost = baseOther.life - other.life;
  const life = weights.opponentLifeWeight * otherLost - weights.aiLifeWeight * selfLost;
  const board =
    weights.boardWeight *
    (weights.ownUnitWeight * unitValue(favoringPlayerId) -
      weights.enemyUnitWeight * unitValue(otherId));
  const lands = weights.landWeight * (landValue(self) - landValue(other));
  const hand = weights.handWeight * handTerm(favoringPlayerId);
  const color = weights.colorWeight * credits.color;
  const score = life + board + lands + hand + color + credits.mana + credits.latent;
  return {
    terminal: terminalFor(favoringPlayerId),
    score: Number.isFinite(score) ? score : 0,
    life,
    board,
    lands,
    hand,
    color,
    mana: credits.mana,
    latent: credits.latent,
  };
}

export function lossBreakdown(): Omit<ScoreBreakdown, 'id'> {
  return {
    terminal: 'loss',
    score: Number.NEGATIVE_INFINITY,
    life: 0,
    board: 0,
    lands: 0,
    hand: 0,
    color: 0,
    mana: 0,
    latent: 0,
  };
}

function terminalFor(playerId: number): ScoreTerminal {
  const otherId = playerId === 0 ? 1 : 0;
  if (bs.playerIdWon !== null) return bs.playerIdWon === playerId ? 'win' : 'loss';
  const selfDead = bs.players[playerId].life <= 0;
  const otherDead = bs.players[otherId].life <= 0;
  if (otherDead && !selfDead) return 'win';
  if (selfDead) return 'loss';
  return 'none';
}

function unitValue(playerId: number): number {
  return bs.units
    .filter((unit) => unit.ownerPlayerId === playerId)
    .reduce((sum, unit) => sum + valueUnit(unit) + laneValue(unit), 0);
}

function landValue(player: Player): number {
  return player.lands.reduce((sum, land) => {
    if (land.isRuined) return sum + exchange.ruinedLand;
    return sum + exchange.standingLand + Math.max(0, land.health) * landLifeValue;
  }, 0);
}

function handTerm(playerId: number): number {
  const aiHand = bs.players[AI_PLAYER_ID].hand.reduce(
    (sum, card) => sum + exchange.handFraction * getCardBudget(card),
    0
  );
  const humanCount = bs.players[0].hand.length * exchange.opponentCard;
  if (playerId === AI_PLAYER_ID) return aiHand - humanCount;
  return humanCount - aiHand;
}

function colorsMet(card: Card, colors: Partial<Record<CardColor, number>>): boolean {
  return card.colors.every((entry) => (colors[entry.color] ?? 0) >= entry.count);
}

function colorPipsRequired(card: Card): number {
  return card.colors.reduce((sum, entry) => sum + entry.count, 0);
}

function colorPipsMet(card: Card, colors: Partial<Record<CardColor, number>>): number {
  return card.colors.reduce(
    (sum, entry) => sum + Math.min(entry.count, colors[entry.color] ?? 0),
    0
  );
}
