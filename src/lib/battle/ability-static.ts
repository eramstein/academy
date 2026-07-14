import type { Land, UnitDeployed, UnitKeywordDefinition } from '@/lib/_model/model-battle';
import { bs } from '../_state';

// removes static abilities originating from a unit
export function clearUnitStaticAbilities(
  sourcePermanent: UnitDeployed | Land,
  sourceEffectName?: string
) {
  bs.units.forEach((targetUnit) => {
    targetUnit.staticModifiers
      .filter((sm) => sm.source.sourceId === sourcePermanent.instanceId && !sm.permanent)
      .forEach((sm) => {
        if (sm.keyword) {
          removeStaticKeyword(targetUnit, sourceEffectName, sourcePermanent);
        }
      });
  });
}

export function removeStaticKeyword(
  targetUnit: UnitDeployed,
  sourceEffectName?: string,
  sourcePermanent?: UnitDeployed | Land
) {
  // adjust unit keywords
  targetUnit.staticModifiers
    .filter(
      (sm) =>
        sm.keyword &&
        (!sourcePermanent || sm.source.sourceId === sourcePermanent.instanceId) &&
        (!sourceEffectName || sm.source.effectName === sourceEffectName)
    )
    .forEach((sm) => {
      const { key, value } = sm.keyword as UnitKeywordDefinition;
      if (typeof value === 'number' && targetUnit.keywords?.[key]) {
        (targetUnit.keywords[key] as number) -= value;
      } else {
        let hadItAlready = false;
        if (targetUnit.initialKeywords?.[key]) {
          hadItAlready = true;
        } else {
          targetUnit.staticModifiers.forEach((sm) => {
            if (sm.keyword?.key === key) {
              hadItAlready = true;
            }
          });
        }
        if (!hadItAlready) {
          delete (targetUnit.keywords || {})[key];
        }
      }
    });
  // remove modifier
  targetUnit.staticModifiers = targetUnit.staticModifiers.filter(
    (sm) =>
      (!sourcePermanent || sm.source.sourceId !== sourcePermanent.instanceId) &&
      (!sourceEffectName || sm.source.effectName !== sourceEffectName)
  );
}

export function addStaticKeyword(
  targetUnit: UnitDeployed,
  keyword: UnitKeywordDefinition,
  permanent: boolean,
  effectName: string,
  sourcePermanent?: UnitDeployed | Land
) {
  // if it had it already, keep track of it so that we can restore it if the temporary effect ends
  if (
    targetUnit.staticModifiers.filter(
      (sm) =>
        (!sourcePermanent || sm.source.sourceId === sourcePermanent.instanceId) &&
        sm.source.effectName === effectName
    ).length > 0
  ) {
    (targetUnit.initialKeywords as Record<string, boolean | number>)[keyword.key] = keyword.value;
    return false;
  }
  if (!targetUnit.keywords) {
    targetUnit.keywords = {};
  }
  if (typeof keyword.value === 'number') {
    if (targetUnit.keywords[keyword.key]) {
      (targetUnit.keywords[keyword.key] as number) += keyword.value;
    } else {
      (targetUnit.keywords[keyword.key] as number) = keyword.value;
    }
  } else {
    (targetUnit.keywords[keyword.key] as boolean) = keyword.value as boolean;
  }
  targetUnit.staticModifiers.push({
    source: { sourceId: sourcePermanent?.instanceId, effectName },
    permanent,
    keyword,
  });
}
