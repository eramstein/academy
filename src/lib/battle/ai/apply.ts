import { CardType, type EffectTargets, type Land, type SpellCard, type UnitCard, type UnitDeployed } from '@/lib/_model';
import { bs } from '@/lib/_state';
import { playAbility } from '../ability';
import { attackLand, attackPlayer, attackUnit, validAttackTargets } from '../combat';
import { moveUnit } from '../move';
import { usePlayerColorAbility } from '../player';
import { playSpell } from '../spell';
import { deployUnit } from '../unit';
import { AI_PLAYER_ID, type Candidate, type TargetRef } from './model';
import { refLabel, resolveAssignment, resolveRef } from './refs';

export function candidateLabel(candidate: Candidate): string {
  switch (candidate.kind) {
    case 'pass':
      return 'pass';
    case 'attack':
      return `attack ${candidate.unitId} -> ${refLabel(candidate.target)}`;
    case 'move':
      return `move ${candidate.unitId} to ${candidate.row},${candidate.column}`;
    case 'deploy':
      return `deploy ${candidate.cardId} at ${candidate.row},${candidate.column}`;
    case 'spell':
      return `spell ${candidate.cardId}`;
    case 'activate':
      return `activate ${candidate.sourceKind} ${candidate.sourceId}#${candidate.abilityIndex}`;
    case 'color':
      return `color ${candidate.color}`;
  }
}

/** Resolve ids on the current battle state and apply one candidate. Headless spells resolve inline. */
export function applyCandidate(candidate: Candidate) {
  if (candidate.kind === 'pass') return;
  if (candidate.kind === 'color') {
    usePlayerColorAbility(bs.players[AI_PLAYER_ID], candidate.color);
    return;
  }
  if (candidate.kind === 'move') {
    moveUnit(findUnit(candidate.unitId), { row: candidate.row, column: candidate.column });
    return;
  }
  if (candidate.kind === 'deploy') {
    const card = findHandCard(AI_PLAYER_ID, candidate.cardId);
    if (card.type !== CardType.Unit) throw new Error('Deploy target is not a unit');
    deployUnit(card as UnitCard, { row: candidate.row, column: candidate.column });
    return;
  }
  if (candidate.kind === 'attack') {
    const unit = findUnit(candidate.unitId);
    const target = findAttackTarget(unit, candidate.target);
    if ('hasAttacked' in target) {
      attackUnit(unit, target as UnitDeployed);
      return;
    }
    if ('isRuined' in target) {
      attackLand(unit, target as Land);
      return;
    }
    attackPlayer(unit, (target as { id: number }).id);
    return;
  }
  if (candidate.kind === 'spell') {
    const card = findHandCard(AI_PLAYER_ID, candidate.cardId);
    if (card.type !== CardType.Spell) throw new Error('Spell candidate is not a spell');
    const packed = packSpellTargets(card as SpellCard, resolveAssignment(candidate.targets));
    playSpell(card as SpellCard, packed);
    return;
  }
  const source =
    candidate.sourceKind === 'unit'
      ? findUnit(candidate.sourceId)
      : findLand(candidate.sourceId);
  const ability = source.abilities?.[candidate.abilityIndex];
  if (!ability) throw new Error('Missing ability');
  playAbility(source, ability, resolveAssignment(candidate.targets));
}

function packSpellTargets(spell: SpellCard, resolved: EffectTargets[][]): EffectTargets[][] {
  const packed: EffectTargets[][] = [];
  spell.actions.forEach((action, index) => {
    if (!action.targets?.length) return;
    packed.push(resolved[index] ?? []);
  });
  return packed;
}

function findUnit(instanceId: string): UnitDeployed {
  const unit = bs.units.find((entry) => entry.instanceId === instanceId);
  if (!unit) throw new Error(`Missing unit ${instanceId}`);
  return unit;
}

function findLand(instanceId: string): Land {
  const land = bs.players
    .flatMap((player) => player.lands)
    .find((entry) => entry.instanceId === instanceId);
  if (!land) throw new Error(`Missing land ${instanceId}`);
  return land;
}

function findHandCard(playerId: number, instanceId: string) {
  const card = bs.players[playerId].hand.find((entry) => entry.instanceId === instanceId);
  if (!card) throw new Error(`Missing card ${instanceId}`);
  return card;
}

function findAttackTarget(unit: UnitDeployed, ref: TargetRef) {
  const resolved = resolveRef(ref);
  const match = validAttackTargets(unit).find((target) => target === resolved || sameEntity(target, ref));
  if (!match) throw new Error('Attack target is not legal on this board');
  return match;
}

function sameEntity(target: UnitDeployed | Land | { id: number; isPlayer?: boolean }, ref: TargetRef) {
  if (ref.kind === 'player') return 'isPlayer' in target && target.id === ref.playerId;
  if (ref.kind === 'unit' || ref.kind === 'land') {
    return 'instanceId' in target && target.instanceId === ref.instanceId;
  }
  return false;
}
