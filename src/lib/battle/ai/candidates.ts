import { config } from '@/lib/_config';
import {
  CardColor,
  CardType,
  TriggerType,
  isUnitCard,
  type Ability,
  type Card,
  type Land,
  type SpellCard,
  type UnitDeployed,
} from '@/lib/_model';
import { bs } from '@/lib/_state';
import { canSourcePlayAbility } from '../ability';
import { isBoardSizeFull, getEmptyCells } from '../boards';
import { canAttack, validAttackTargets } from '../combat';
import { isPayable } from '../cost';
import { canMove } from '../move';
import { buildAssignments, recognizedKillValue } from './assignments';
import { valueUnit } from './evaluate';
import { cellScore, isObviousLethal } from './heuristic';
import { type LaneBody } from './lane';
import {
  AI_PLAYER_ID,
  type Candidate,
  type RankedCandidate,
  type TargetRef,
} from './model';
import { refLabel } from './refs';

export function generateCandidates(): RankedCandidate[] {
  const ai = bs.players[AI_PLAYER_ID];
  const ranked: RankedCandidate[] = [
    {
      candidate: { id: 'pass', kind: 'pass' },
      rank: 0,
      manaCost: 0,
      instanceId: 'pass',
      primary: true,
      killValue: 0,
      obviousLethal: false,
    },
  ];

  if (!ai.abilityUsed) {
    for (const color of Object.values(CardColor)) {
      if (ai.colors[color] === undefined) continue;
      ranked.push(entry({ id: `color:${color}`, kind: 'color', color }, 0, 0, color, true, 0));
    }
    for (const land of ai.lands) {
      ranked.push(...activations('land', land.instanceId, land.abilities ?? [], land));
    }
  }

  for (const card of ai.hand) {
    if (!isPayable(card)) continue;
    if (card.type === CardType.Spell) {
      ranked.push(...spellCandidates(card));
    } else if (isUnitCard(card) && !isBoardSizeFull(ai)) {
      ranked.push(
        ...cellCandidates(
          card.instanceId,
          card.cost,
          getEmptyCells(false),
          (row, column) => ({
            id: `deploy:${card.instanceId}:${row}-${column}`,
            kind: 'deploy',
            cardId: card.instanceId,
            row,
            column,
          }),
          {
            instanceId: card.instanceId,
            ownerPlayerId: AI_PLAYER_ID,
            power: card.power,
            health: card.maxHealth,
            retaliate: card.retaliate,
            keywords: card.keywords,
          }
        )
      );
    }
  }

  const units = bs.units.filter((unit) => unit.ownerPlayerId === AI_PLAYER_ID);
  for (const unit of units) {
    if (canMove(unit)) {
      ranked.push(
        ...cellCandidates(
          unit.instanceId,
          0,
          getEmptyCells(false),
          (row, column) => ({
            id: `move:${unit.instanceId}:${row}-${column}`,
            kind: 'move',
            unitId: unit.instanceId,
            row,
            column,
          }),
          unit
        )
      );
    }
    if (canAttack(unit) && (unit.power > 0 || (unit.counters?.rage ?? 0) > 0 || unit.keywords?.poisonous)) {
      ranked.push(...attackCandidates(unit));
    }
    if (!unit.statuses.stun && !unit.statuses.mezz) {
      ranked.push(...activations('unit', unit.instanceId, unit.abilities ?? [], unit));
    }
  }
  return ranked;
}

function spellCandidates(card: Card): RankedCandidate[] {
  if (card.type !== CardType.Spell) return [];
  const spell = card as SpellCard;
  const assignments = buildAssignments(spell, spell.actions);
  return assignments.map((targets, index) => {
    const killValue = recognizedKillValue(spell.actions, targets);
    return entry(
      { id: `spell:${card.instanceId}:${index}`, kind: 'spell', cardId: card.instanceId, targets },
      killValue > 0 ? 1e6 + killValue : card.cost,
      card.cost,
      card.instanceId,
      index === 0,
      killValue
    );
  });
}

function attackCandidates(unit: UnitDeployed): RankedCandidate[] {
  const targets = validAttackTargets(unit);
  const scored = targets.map((target) => {
    const ref = attackRef(target);
    const obvious = isObviousLethal(unit, target);
    const rank = obvious ? 1e9 + unit.power : attackRank(unit, target);
    return { ref, obvious, rank };
  });
  scored.sort((a, b) => b.rank - a.rank || refLabel(a.ref).localeCompare(refLabel(b.ref)));
  const limit =
    unit.keywords?.flying || unit.keywords?.ranged ? config.maxTargetAssignments : 1;
  return scored.slice(0, limit).map((item, index) =>
    entry(
      {
        id: `attack:${unit.instanceId}:${refLabel(item.ref)}`,
        kind: 'attack',
        unitId: unit.instanceId,
        target: item.ref,
      },
      item.rank,
      0,
      unit.instanceId,
      index === 0,
      0,
      item.obvious
    )
  );
}

function activations(
  sourceKind: 'unit' | 'land',
  sourceId: string,
  abilities: Ability[],
  source: UnitDeployed | Land
): RankedCandidate[] {
  const ranked: RankedCandidate[] = [];
  (abilities ?? []).forEach((ability, abilityIndex) => {
    if (ability.trigger?.type !== TriggerType.Activated) return;
    if (!canSourcePlayAbility(source, ability)) return;
    const assignments = buildAssignments(source, ability.actions);
    assignments.forEach((targets, index) => {
      const killValue = recognizedKillValue(ability.actions, targets);
      const cost = ability.cost ?? 0;
      ranked.push(
        entry(
          {
            id: `activate:${sourceId}:${abilityIndex}:${index}`,
            kind: 'activate',
            sourceKind,
            sourceId,
            abilityIndex,
            targets,
          },
          killValue > 0 ? 1e6 + killValue : cost,
          cost,
          sourceId,
          index === 0,
          killValue
        )
      );
    });
  });
  return ranked;
}

function cellCandidates(
  instanceId: string,
  manaCost: number,
  cells: { row: number; column: number }[],
  make: (row: number, column: number) => Candidate,
  unit: (LaneBody & { position?: { row: number; column: number } }) | null
): RankedCandidate[] {
  if (cells.length === 0) return [];
  const scored = cells
    .map((cell) => ({ cell, score: cellScore(unit, cell) }))
    .sort((a, b) => b.score - a.score || a.cell.row - b.cell.row || a.cell.column - b.cell.column);
  return scored.map((item, index) => {
    const candidate = make(item.cell.row, item.cell.column);
    const rank =
      index === 0
        ? item.score >= 1e8
          ? item.score + (unit?.power ?? 0)
          : manaCost * 1000 + item.score
        : item.score;
    return entry(candidate, rank, manaCost, instanceId, index === 0, 0, false, item.cell.row);
  });
}

function attackRef(target: ReturnType<typeof validAttackTargets>[number]): TargetRef {
  if ('isPlayer' in target) return { kind: 'player', playerId: target.id };
  if ('isRuined' in target) return { kind: 'land', instanceId: target.instanceId };
  return { kind: 'unit', instanceId: target.instanceId };
}

function attackRank(unit: UnitDeployed, target: ReturnType<typeof validAttackTargets>[number]): number {
  if ('hasAttacked' in target) {
    const armor = unit.keywords?.armorPiercing ? 0 : (target.keywords?.armor ?? 0);
    const kills = unit.power + (unit.counters?.rage ?? 0) - armor >= target.health;
    return kills ? 1e6 + valueUnit(target) : valueUnit(target);
  }
  if ('isPlayer' in target) return 1e3 + unit.power;
  return 1e2 + unit.power;
}

function entry(
  candidate: Candidate,
  rank: number,
  manaCost: number,
  instanceId: string,
  primary: boolean,
  killValue: number,
  obviousLethal = false,
  row?: number
): RankedCandidate {
  return { candidate, rank, manaCost, instanceId, primary, killValue, obviousLethal, row };
}
