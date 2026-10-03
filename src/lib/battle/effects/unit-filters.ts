import {
  CardType,
  isDeployedUnit,
  isPosition,
  type Land,
  type Player,
  type Position,
  type UnitDeployed,
  type UnitKeywords,
} from '@/lib/_model';
import { UnitType } from '@/lib/_model/enums-battle';
import { bs } from '@/lib/_state';
import { getAdjacentUnits, getClosestEnnemyInRow } from '../unit';

export interface UnitFilterArgs {
  // references
  unit?: UnitDeployed;
  land?: Land;
  position?: Position;
  player?: Player;
  all?: boolean;
  // relative to the references
  self?: boolean;
  addSelf?: boolean;
  excludeSelf?: boolean;
  sameRow?: boolean;
  sameColumn?: boolean;
  allies?: boolean;
  ennemies?: boolean;
  adjacent?: boolean;
  inFrontOf?: boolean;
  // absolute
  unitType?: UnitType;
  hasKeyword?: keyof UnitKeywords;
}

export function filterUnits(filterArgs: UnitFilterArgs): UnitDeployed[] {
  if (filterArgs.all) {
    return bs.units;
  }
  if (filterArgs.self && filterArgs.unit) {
    return [filterArgs.unit];
  }
  const relativeToPlayerId =
    filterArgs.player?.id ?? filterArgs.unit?.ownerPlayerId ?? filterArgs.land?.ownerPlayerId;
  const relativeToPosition = filterArgs.position ??
    filterArgs.unit?.position ?? { row: filterArgs.land?.position ?? 0, column: 0 };
  const closestEnnemyInRow =
    filterArgs.inFrontOf && filterArgs.unit ? getClosestEnnemyInRow(filterArgs.unit) : undefined;
  let validUnits = bs.units.filter((u) => {
    let valid = true;
    if (filterArgs.sameRow && u.position.row !== relativeToPosition?.row) {
      valid = false;
    }
    if (filterArgs.inFrontOf && closestEnnemyInRow?.instanceId !== u.instanceId) {
      valid = false;
    }
    if (filterArgs.sameColumn && u.position.column !== relativeToPosition?.column) {
      valid = false;
    }
    if (filterArgs.allies && u.ownerPlayerId !== relativeToPlayerId) {
      valid = false;
    }
    if (filterArgs.ennemies && u.ownerPlayerId === relativeToPlayerId) {
      valid = false;
    }
    if (
      filterArgs.adjacent &&
      filterArgs.unit &&
      !getAdjacentUnits(u.position).includes(filterArgs.unit)
    ) {
      valid = false;
    }
    if (
      filterArgs.adjacent &&
      filterArgs.position &&
      !getAdjacentUnits(filterArgs.position).includes(u)
    ) {
      valid = false;
    }
    if (filterArgs.unitType && !u.unitTypes?.includes(filterArgs.unitType)) {
      valid = false;
    }
    if (filterArgs.hasKeyword && !u.keywords?.[filterArgs.hasKeyword]) {
      valid = false;
    }
    return valid;
  });
  if (filterArgs.addSelf && filterArgs.unit) {
    validUnits.push(filterArgs.unit);
  }
  if (filterArgs.excludeSelf && filterArgs.unit) {
    validUnits = validUnits.filter((u) => u.instanceId !== filterArgs.unit!.instanceId);
  }
  return validUnits;
}

export function getRangeLabel(filterArgs: UnitFilterArgs) {
  const labels = [];
  if (filterArgs.all) {
    labels.push('all units');
  }
  if (filterArgs.sameRow) {
    labels.push('same row');
  }
  if (filterArgs.sameColumn) {
    labels.push('same column');
  }
  if (filterArgs.adjacent) {
    labels.push('adjacent');
  }
  if (filterArgs.allies) {
    labels.push('allies');
  }
  if (filterArgs.ennemies) {
    labels.push('ennemies');
  }
  if (filterArgs.inFrontOf) {
    labels.push('in front of');
  }
  if (filterArgs.unitType) {
    labels.push('with ' + filterArgs.unitType);
  }
  if (filterArgs.hasKeyword) {
    labels.push('has ' + filterArgs.hasKeyword);
  }
  if (filterArgs.excludeSelf) {
    labels.push('(others)');
  }
  return labels.length > 0 ? `Range: ${labels.join(' ')}.` : '';
}

// helper function to loop units.
// if there are targets, we assume the first one is the units to loop on
// else, only use the range (e.g. all ennemies)
export function getUnitsInRange(
  targets: UnitDeployed[][] | Position[][] | undefined, // assumption: 1st one is units
  range: UnitFilterArgs | undefined,
  sourcePermanent: UnitDeployed | Land,
  player: Player
): UnitDeployed[] {
  let unitsInRange: UnitDeployed[] = [];
  if (targets && targets[0]?.length) {
    const unitsToLoop = targets.filter(isDeployedUnit);
    const positionsToLoop = targets.filter(isPosition);
    unitsToLoop.flat().forEach((u) => {
      unitsInRange = [...unitsInRange, ...(range ? filterUnits({ unit: u, ...range }) : [u])];
    });
    positionsToLoop.flat().forEach((p) => {
      unitsInRange = [...unitsInRange, ...(range ? filterUnits({ position: p, ...range }) : [])];
    });
  } else if (range) {
    const params = { player, ...range };
    if (sourcePermanent?.type === CardType.Unit) {
      params.unit = sourcePermanent as UnitDeployed;
    } else if (sourcePermanent?.type === CardType.Land) {
      params.land = sourcePermanent as Land;
    }
    unitsInRange = filterUnits(params);
  } else if (sourcePermanent && sourcePermanent.type === CardType.Unit) {
    unitsInRange = [sourcePermanent as UnitDeployed];
  }
  return unitsInRange;
}

export function getUnitFromTriggerParam(triggerParams: any, triggerParam: string): UnitDeployed[] {
  if (triggerParams[triggerParam]?.type === CardType.Unit) {
    return [triggerParams[triggerParam]] as UnitDeployed[];
  }
  return [];
}
