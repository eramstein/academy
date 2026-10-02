import { config } from '@/lib/_config';
import {
  CardType,
  TriggerType,
  isUnitCard,
  type ActionDefinition,
  type Land,
  type Player,
  type Position,
  type SpellCard,
  type UnitDeployed,
} from '@/lib/_model';
import { bs, uiState } from '@/lib/_state';
import { canSourcePlayAbility } from '../ability';
import { isCellFree, isOnPlayersSide } from '../boards';
import { canAttack, validAttackTargets } from '../combat';
import { isPayable } from '../cost';
import { canMove } from '../move';
import { applyCandidate, candidateLabel } from './apply';
import { buildAssignments } from './assignments';
import {
  AI_PLAYER_ID,
  HUMAN_PLAYER_ID,
  type Candidate,
  type TargetRef,
} from './model';
import { replaceBattleState, resetBattleUiPending, snapshotBattle } from './snapshot';

const MAX_NODES = 180;
const MAX_SETUP = 4;
const REMOVAL_EFFECTS = new Set(['damageUnit', 'destroyUnit', 'bounceUnit', 'forceMoveUnit']);

export interface LethalPlan {
  reason: 'win' | 'block';
  actions: Candidate[];
}

interface Swing {
  power: number;
  trample: boolean;
  armorPiercing: boolean;
}

interface Wall {
  health: number;
  armor: number;
}

interface PlanNode {
  snap: ReturnType<typeof snapshotBattle>;
  actions: Candidate[];
  usedRemoval: boolean;
  threat: number;
}

/**
 * At the start of the AI turn, an obvious lethal is a row the opponent can already
 * kill through, or a row we can kill through with the bodies, haste, and one removal
 * we have. The normal search is one action deep, so this planner looks for a short
 * sequence that wins or blocks every such row, then the turn passes.
 */
export function planObviousLethal(): LethalPlan | null {
  const savedHeadless = uiState.isHeadless;
  const baseline = snapshotBattle();
  uiState.isHeadless = true;
  try {
    const canWin = offenseLooksPossible();
    const mustBlock = defenseThreat() > 0;
    if (!canWin && !mustBlock) return null;
    if (canWin) {
      const actions = search('win');
      replaceBattleState(baseline);
      resetBattleUiPending();
      if (actions && actions.length > 0) return { reason: 'win', actions };
    }
    if (mustBlock) {
      const actions = search('block');
      if (actions && actions.length > 0) return { reason: 'block', actions };
    }
    console.log('AI obvious lethal: no sequence, using search');
    return null;
  } finally {
    replaceBattleState(baseline);
    resetBattleUiPending();
    uiState.isHeadless = savedHeadless;
  }
}

export function candidateStillLegal(candidate: Candidate): boolean {
  if (candidate.kind === 'deploy') {
    const card = bs.players[AI_PLAYER_ID].hand.find((entry) => entry.instanceId === candidate.cardId);
    return (
      !!card &&
      isUnitCard(card) &&
      isPayable(card) &&
      isCellFree({ row: candidate.row, column: candidate.column }) &&
      isOnPlayersSide({ row: candidate.row, column: candidate.column }, AI_PLAYER_ID)
    );
  }
  if (candidate.kind === 'move') {
    const unit = bs.units.find((entry) => entry.instanceId === candidate.unitId);
    return (
      !!unit &&
      canMove(unit) &&
      isCellFree({ row: candidate.row, column: candidate.column }) &&
      isOnPlayersSide({ row: candidate.row, column: candidate.column }, AI_PLAYER_ID)
    );
  }
  if (candidate.kind === 'attack') {
    const unit = bs.units.find((entry) => entry.instanceId === candidate.unitId);
    if (!unit || !canAttack(unit)) return false;
    return validAttackTargets(unit).some((target) => sameTarget(target, candidate.target));
  }
  if (candidate.kind === 'spell') {
    const card = bs.players[AI_PLAYER_ID].hand.find((entry) => entry.instanceId === candidate.cardId);
    return !!card && card.type === CardType.Spell && isPayable(card);
  }
  if (candidate.kind === 'activate' && candidate.sourceKind === 'unit') {
    const unit = bs.units.find((entry) => entry.instanceId === candidate.sourceId);
    const ability = unit?.abilities?.[candidate.abilityIndex];
    return !!unit && !!ability && canSourcePlayAbility(unit, ability);
  }
  return false;
}

function search(mode: 'win' | 'block'): Candidate[] | null {
  const root = snapshotBattle();
  const rootThreat = mode === 'block' ? defenseThreat() : offenseShortfall();
  if (mode === 'win' && rootThreat === 0) {
    const attacks = winAttackScript();
    if (attacks && attacks.length > 0) return attacks;
  }
  const queue: PlanNode[] = [{ snap: root, actions: [], usedRemoval: false, threat: rootThreat }];
  const seen = new Set<string>([stateKey()]);
  let expanded = 0;
  while (queue.length > 0 && expanded < MAX_NODES) {
    queue.sort((a, b) => a.threat - b.threat || a.actions.length - b.actions.length);
    const node = queue.shift()!;
    expanded++;
    replaceBattleState(node.snap);
    resetBattleUiPending();
    if (node.actions.length >= MAX_SETUP) continue;
    for (const action of generate(mode, node.usedRemoval)) {
      replaceBattleState(node.snap);
      resetBattleUiPending();
      uiState.isHeadless = true;
      try {
        applyCandidate(action);
      } catch {
        continue;
      }
      const key = stateKey();
      if (seen.has(key)) continue;
      let threat = mode === 'block' ? defenseThreat() : offenseShortfall();
      if (threat > node.threat) continue;
      if (mode === 'win' && threat === 0) {
        const attacks = winAttackScript();
        if (attacks) return [...node.actions, action, ...attacks];
        threat = 1;
      }
      if (mode === 'block' && threat === 0) return [...node.actions, action];
      seen.add(key);
      queue.push({
        snap: snapshotBattle(),
        actions: [...node.actions, action],
        usedRemoval: node.usedRemoval || action.kind === 'spell' || action.kind === 'activate',
        threat,
      });
    }
  }
  return null;
}

function generate(mode: 'win' | 'block', usedRemoval: boolean): Candidate[] {
  const actions: Candidate[] = [];
  const rows = mode === 'block' ? exposedRows() : optimisticRows();
  const ai = bs.players[AI_PLAYER_ID];
  if (!isBoardFull(ai)) {
    for (const card of ai.hand) {
      if (!isUnitCard(card) || !isPayable(card)) continue;
      if (mode === 'win' && !card.keywords?.haste) continue;
      for (const row of rows) {
        for (const cell of emptyCells(row, AI_PLAYER_ID)) {
          actions.push({
            id: `deploy:${card.instanceId}:${cell.row}-${cell.column}`,
            kind: 'deploy',
            cardId: card.instanceId,
            row: cell.row,
            column: cell.column,
          });
        }
      }
    }
  }
  for (const unit of bs.units) {
    if (unit.ownerPlayerId !== AI_PLAYER_ID || !canMove(unit)) continue;
    if (mode === 'win' && !unit.keywords?.moveAndAttack) continue;
    for (const row of rows) {
      if (unit.position.row === row) continue;
      for (const cell of emptyCells(row, AI_PLAYER_ID)) {
        actions.push({
          id: `move:${unit.instanceId}:${cell.row}-${cell.column}`,
          kind: 'move',
          unitId: unit.instanceId,
          row: cell.row,
          column: cell.column,
        });
      }
    }
  }
  if (!usedRemoval) actions.push(...usefulRemovals(mode));
  return actions;
}

/** One spell or unit ability that makes the lethal math better. Not a chain of burns. */
function usefulRemovals(mode: 'win' | 'block'): Candidate[] {
  const before = mode === 'block' ? defenseThreat() : offenseShortfall();
  if (before <= 0) return [];
  const snap = snapshotBattle();
  const kept: Candidate[] = [];
  for (const candidate of removalCandidates()) {
    replaceBattleState(snap);
    resetBattleUiPending();
    uiState.isHeadless = true;
    try {
      applyCandidate(candidate);
    } catch {
      continue;
    }
    const after = mode === 'block' ? defenseThreat() : offenseShortfall();
    if (after < before) kept.push(candidate);
  }
  replaceBattleState(snap);
  resetBattleUiPending();
  return kept;
}

function removalCandidates(): Candidate[] {
  const found: Candidate[] = [];
  const ai = bs.players[AI_PLAYER_ID];
  for (const card of ai.hand) {
    if (card.type !== CardType.Spell || !isPayable(card)) continue;
    const spell = card as SpellCard;
    if (!hasRemoval(spell.actions)) continue;
    buildAssignments(spell, spell.actions).forEach((targets, index) => {
      found.push({
        id: `spell:${card.instanceId}:${index}`,
        kind: 'spell',
        cardId: card.instanceId,
        targets,
      });
    });
  }
  for (const unit of bs.units) {
    if (unit.ownerPlayerId !== AI_PLAYER_ID || unit.statuses.stun || unit.statuses.mezz) continue;
    (unit.abilities ?? []).forEach((ability, abilityIndex) => {
      if (ability.trigger?.type !== TriggerType.Activated) return;
      if (!hasRemoval(ability.actions) || !canSourcePlayAbility(unit, ability)) return;
      buildAssignments(unit, ability.actions).forEach((targets, index) => {
        found.push({
          id: `activate:${unit.instanceId}:${abilityIndex}:${index}`,
          kind: 'activate',
          sourceKind: 'unit',
          sourceId: unit.instanceId,
          abilityIndex,
          targets,
        });
      });
    });
  }
  return found;
}

function hasRemoval(actions: ActionDefinition[]): boolean {
  return actions.some((action) => REMOVAL_EFFECTS.has(action.effect.name));
}

function offenseLooksPossible(): boolean {
  const life = bs.players[HUMAN_PLAYER_ID].life;
  for (let row = 0; row < config.boardRows; row++) {
    const land = landHealth(HUMAN_PLAYER_ID, row);
    const walls = wallsInRow(HUMAN_PLAYER_ID, row, false);
    if (rowFaceDamage(optimisticAttackers(row), walls, land) >= life) return true;
    if (!hasAnyRemoval()) continue;
    for (let index = 0; index < walls.length; index++) {
      const without = walls.filter((_, wallIndex) => wallIndex !== index);
      if (rowFaceDamage(optimisticAttackers(row), without, land) >= life) return true;
    }
  }
  return false;
}

function hasAnyRemoval(): boolean {
  const ai = bs.players[AI_PLAYER_ID];
  for (const card of ai.hand) {
    if (card.type === CardType.Spell && hasRemoval((card as SpellCard).actions)) return true;
  }
  return bs.units.some(
    (unit) =>
      unit.ownerPlayerId === AI_PLAYER_ID &&
      (unit.abilities ?? []).some(
        (ability) =>
          ability.trigger?.type === TriggerType.Activated && hasRemoval(ability.actions)
      )
  );
}

function exposedRows(): number[] {
  const life = bs.players[AI_PLAYER_ID].life;
  const rows: number[] = [];
  for (let row = 0; row < config.boardRows; row++) {
    if (opponentFace(row) >= life) rows.push(row);
  }
  return rows;
}

function optimisticRows(): number[] {
  const life = bs.players[HUMAN_PLAYER_ID].life;
  const rows: number[] = [];
  for (let row = 0; row < config.boardRows; row++) {
    const face = rowFaceDamage(
      optimisticAttackers(row),
      wallsInRow(HUMAN_PLAYER_ID, row, false),
      landHealth(HUMAN_PLAYER_ID, row)
    );
    if (face >= life) rows.push(row);
  }
  return rows;
}

function defenseThreat(): number {
  const life = bs.players[AI_PLAYER_ID].life;
  if (life <= 0) return 1e9;
  let threat = 0;
  for (let row = 0; row < config.boardRows; row++) {
    const face = opponentFace(row);
    if (face >= life) threat += 1000 + face;
  }
  return threat;
}

function offenseShortfall(): number {
  const life = bs.players[HUMAN_PLAYER_ID].life;
  if (life <= 0) return 0;
  let best = life;
  for (let row = 0; row < config.boardRows; row++) {
    const face = rowFaceDamage(
      readyAttackers(row),
      wallsInRow(HUMAN_PLAYER_ID, row, false),
      landHealth(HUMAN_PLAYER_ID, row)
    );
    if (face >= life) return 0;
    best = Math.min(best, life - face);
  }
  return best;
}

/** Attacks in clearing order. Empty when the pure model was wrong about the engine. */
function winAttackScript(): Candidate[] | null {
  if (bs.players[HUMAN_PLAYER_ID].life <= 0 || bs.playerIdWon === AI_PLAYER_ID) return [];
  const snap = snapshotBattle();
  const attacks: Candidate[] = [];
  for (let step = 0; step < 12; step++) {
    if (bs.players[HUMAN_PLAYER_ID].life <= 0 || bs.playerIdWon === AI_PLAYER_ID) {
      replaceBattleState(snap);
      resetBattleUiPending();
      return attacks;
    }
    const next = pickAttack();
    if (!next) break;
    attacks.push(next);
    try {
      applyCandidate(next);
    } catch {
      break;
    }
  }
  const won = bs.players[HUMAN_PLAYER_ID].life <= 0 || bs.playerIdWon === AI_PLAYER_ID;
  replaceBattleState(snap);
  resetBattleUiPending();
  return won ? attacks : null;
}

function pickAttack(): Candidate | null {
  const life = bs.players[HUMAN_PLAYER_ID].life;
  const rows: number[] = [];
  for (let row = 0; row < config.boardRows; row++) {
    const face = rowFaceDamage(
      readyAttackers(row),
      wallsInRow(HUMAN_PLAYER_ID, row, false),
      landHealth(HUMAN_PLAYER_ID, row)
    );
    if (face >= life) rows.push(row);
  }
  if (rows.length === 0) return null;
  const row = rows[0];
  const units = bs.units.filter(
    (unit) => unit.ownerPlayerId === AI_PLAYER_ID && unit.position.row === row && canAttack(unit)
  );
  const blockers = bs.units
    .filter((unit) => unit.ownerPlayerId === HUMAN_PLAYER_ID && unit.position.row === row)
    .sort((a, b) => b.position.column - a.position.column);
  if (blockers.length > 0) {
    const front = blockers[0];
    const killers = units
      .filter((unit) => hitDamage(swingOf(unit), front.keywords?.armor ?? 0) >= front.health)
      .sort((a, b) => swingPower(a) - swingPower(b));
    return killers[0] ? attackCandidate(killers[0], front) : null;
  }
  const land = bs.players[HUMAN_PLAYER_ID].lands.find(
    (entry) => entry.position === row && !entry.isRuined && entry.health > 0
  );
  if (land) {
    const finishers = units
      .filter((unit) => swingPower(unit) >= land.health)
      .sort((a, b) => swingPower(a) - swingPower(b));
    const chip = [...units].sort((a, b) => swingPower(a) - swingPower(b));
    const chosen = finishers[0] ?? chip[0];
    return chosen ? attackCandidate(chosen, land) : null;
  }
  const face = [...units].sort((a, b) => swingPower(a) - swingPower(b));
  return face[0] ? attackCandidate(face[0], bs.players[HUMAN_PLAYER_ID]) : null;
}

function attackCandidate(
  unit: UnitDeployed,
  target: UnitDeployed | Land | Player
): Candidate | null {
  if (!validAttackTargets(unit).some((entry) => entry === target)) return null;
  const ref = attackRef(target);
  return {
    id: `attack:${unit.instanceId}:${ref.kind === 'player' ? ref.playerId : ref.instanceId}`,
    kind: 'attack',
    unitId: unit.instanceId,
    target: ref,
  };
}

function opponentFace(row: number): number {
  return rowFaceDamage(
    opponentAttackers(row),
    wallsInRow(AI_PLAYER_ID, row, true),
    landHealth(AI_PLAYER_ID, row)
  );
}

/**
 * Damage that reaches the defender after intelligent attacks.
 * The cheapest unit that can kill the front blocker does so; the rest continue.
 * Ranged still cannot hit the player while a unit is in the row, so it only
 * competes to be that cheapest clearer. Trample spills once, matching combat.
 */
function rowFaceDamage(attackers: Swing[], blockers: Wall[], land: number | null): number {
  const pool = attackers.map((attacker) => ({ ...attacker }));
  const line = blockers.map((blocker) => ({ ...blocker }));
  let landHp = land;
  while (line.length > 0) {
    const front = line[0];
    let best = -1;
    let bestPower = Infinity;
    for (let index = 0; index < pool.length; index++) {
      const damage = hitDamage(pool[index], front.armor);
      if (damage >= front.health && pool[index].power < bestPower) {
        best = index;
        bestPower = pool[index].power;
      }
    }
    if (best < 0) return 0;
    const killer = pool.splice(best, 1)[0];
    const excess = hitDamage(killer, front.armor) - front.health;
    line.shift();
    if (killer.trample && excess > 0) {
      if (line.length > 0) {
        line[0].health -= excess;
        if (line[0].health <= 0) line.shift();
      } else if (landHp !== null) {
        landHp -= excess;
        if (landHp <= 0) landHp = null;
      }
    }
  }
  let face = 0;
  while (landHp !== null && pool.length > 0) {
    let finisher = -1;
    let finisherPower = Infinity;
    for (let index = 0; index < pool.length; index++) {
      if (pool[index].power >= landHp && pool[index].power < finisherPower) {
        finisher = index;
        finisherPower = pool[index].power;
      }
    }
    if (finisher >= 0) {
      const unit = pool.splice(finisher, 1)[0];
      const excess = unit.power - landHp;
      landHp = null;
      if (unit.trample && excess > 0) face += excess;
    } else {
      let low = 0;
      for (let index = 1; index < pool.length; index++) {
        if (pool[index].power < pool[low].power) low = index;
      }
      const unit = pool.splice(low, 1)[0];
      landHp -= unit.power;
      if (landHp <= 0) landHp = null;
    }
  }
  for (const unit of pool) face += unit.power;
  return face;
}

function opponentAttackers(row: number): Swing[] {
  const swings: Swing[] = [];
  for (const unit of bs.units) {
    if (unit.ownerPlayerId !== HUMAN_PLAYER_ID || !threatensNextTurn(unit)) continue;
    if (unit.position.row === row) {
      swings.push(swingOf(unit));
    } else if (unit.keywords?.moveAndAttack && emptyCells(row, HUMAN_PLAYER_ID).length > 0) {
      swings.push(swingOf(unit));
    }
  }
  return swings;
}

function readyAttackers(row: number): Swing[] {
  return bs.units
    .filter(
      (unit) =>
        unit.ownerPlayerId === AI_PLAYER_ID &&
        unit.position.row === row &&
        canAttack(unit) &&
        swingPower(unit) > 0
    )
    .map(swingOf);
}

function optimisticAttackers(row: number): Swing[] {
  const swings = readyAttackers(row);
  let cells = emptyCells(row, AI_PLAYER_ID).length;
  for (const unit of bs.units) {
    if (cells <= 0) break;
    if (unit.ownerPlayerId !== AI_PLAYER_ID || unit.position.row === row) continue;
    if (!unit.keywords?.moveAndAttack || !canMove(unit) || swingPower(unit) <= 0) continue;
    cells--;
    swings.push(swingOf(unit));
  }
  const haste = bs.players[AI_PLAYER_ID].hand
    .filter((card) => isUnitCard(card) && !!card.keywords?.haste && isPayable(card))
    .sort((a, b) => b.power - a.power);
  for (const card of haste) {
    if (cells <= 0) break;
    cells--;
    swings.push({
      power: card.power,
      trample: !!card.keywords?.trample,
      armorPiercing: !!card.keywords?.armorPiercing,
    });
  }
  return swings;
}

function threatensNextTurn(unit: UnitDeployed): boolean {
  if (unit.health <= 0 || unit.isDying) return false;
  if (unit.statuses.stun || unit.statuses.mezz || unit.statuses.daze) return false;
  return swingPower(unit) > 0;
}

function wallsInRow(ownerId: number, row: number, attackerFromLeft: boolean): Wall[] {
  return bs.units
    .filter((unit) => unit.ownerPlayerId === ownerId && unit.position.row === row && unit.health > 0)
    .sort((a, b) =>
      attackerFromLeft ? a.position.column - b.position.column : b.position.column - a.position.column
    )
    .map((unit) => ({ health: unit.health, armor: unit.keywords?.armor ?? 0 }));
}

function landHealth(playerId: number, row: number): number | null {
  const land = bs.players[playerId].lands.find((entry) => entry.position === row);
  if (!land || land.isRuined || land.health <= 0) return null;
  return land.health;
}

function swingOf(unit: UnitDeployed): Swing {
  return {
    power: swingPower(unit),
    trample: !!unit.keywords?.trample,
    armorPiercing: !!unit.keywords?.armorPiercing,
  };
}

function swingPower(unit: UnitDeployed): number {
  return unit.power + (unit.counters?.rage ?? 0);
}

function hitDamage(attacker: Swing, armor: number): number {
  const prevented = attacker.armorPiercing ? 0 : armor;
  return Math.max(0, attacker.power - prevented);
}

function emptyCells(row: number, playerId: number): Position[] {
  const start = playerId === HUMAN_PLAYER_ID ? 0 : config.boardColumns / 2;
  const end = playerId === HUMAN_PLAYER_ID ? config.boardColumns / 2 : config.boardColumns;
  const cells: Position[] = [];
  for (let column = start; column < end; column++) {
    if (isCellFree({ row, column })) cells.push({ row, column });
  }
  return cells;
}

function isBoardFull(player: Player): boolean {
  const cap = (config.boardColumns * config.boardRows) / 2;
  return bs.units.filter((unit) => unit.ownerPlayerId === player.id).length >= cap;
}

function stateKey(): string {
  const units = bs.units
    .map((unit) => `${unit.instanceId}@${unit.position.row},${unit.position.column}:${unit.health}`)
    .sort()
    .join('|');
  const hand = bs.players[AI_PLAYER_ID].hand
    .map((card) => card.instanceId)
    .sort()
    .join(',');
  return `${bs.players[0].life}/${bs.players[1].life};${bs.players[AI_PLAYER_ID].mana};${hand};${units}`;
}

function sameTarget(target: UnitDeployed | Land | Player, ref: TargetRef): boolean {
  if (ref.kind === 'player') return 'isPlayer' in target && target.id === ref.playerId;
  if (ref.kind === 'unit' || ref.kind === 'land') {
    return 'instanceId' in target && target.instanceId === ref.instanceId;
  }
  return false;
}

function attackRef(target: UnitDeployed | Land | Player): TargetRef {
  if ('isPlayer' in target && target.isPlayer) return { kind: 'player', playerId: target.id };
  if ('isRuined' in target) return { kind: 'land', instanceId: target.instanceId };
  return { kind: 'unit', instanceId: (target as UnitDeployed).instanceId };
}

export function lethalPlanLabel(plan: LethalPlan): string {
  return `${plan.reason}: ${plan.actions.map(candidateLabel).join(' → ')}`;
}
