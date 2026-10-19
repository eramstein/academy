import {
  CardColor,
  isSpellCard,
  isUnitCard,
  StatusType,
  UnitType,
  type ActionDefinition,
  type CardTemplate,
} from '@/lib/_model';
import { ResourceType } from '@/lib/_model/enums-sim';
import { addKeyword } from './keywords';

export const COMMON_RESOURCE_TYPES: ResourceType[] = [
  ResourceType.MagicDust,
  ResourceType.Mithril,
  ResourceType.Moxes,
];

export const UNIQUE_RESOURCE_TYPES: ResourceType[] = [
  ResourceType.MollysBeads,
  ResourceType.SchlupakMushrooms,
  ResourceType.SchlupakDreamspheres,
  ResourceType.SchlupakSpores,
];

const CONTROL_STATUS_TYPES = new Set<StatusType>([
  StatusType.Mezz,
  StatusType.Daze,
  StatusType.Root,
  StatusType.Stun,
]);

export function isUniqueResource(type: ResourceType): boolean {
  return UNIQUE_RESOURCE_TYPES.includes(type);
}

/** Resources selectable in a craft; uniques only when creating cards. */
export function craftableResourceTypes(includeUnique: boolean): ResourceType[] {
  const all = Object.values(ResourceType);
  return includeUnique ? all : all.filter((type) => !isUniqueResource(type));
}

/** Unit types unique resources require — merge onto CardCreationParameters before flavor. */
export function unitTypesFromUniqueResources(
  resources: { type: ResourceType; count: number }[] | undefined
): UnitType[] {
  const types: UnitType[] = [];
  for (const resource of resources ?? []) {
    if (resource.count <= 0 || !isUniqueResource(resource.type)) continue;
    if (resource.type === ResourceType.MollysBeads && !types.includes(UnitType.Beast)) {
      types.push(UnitType.Beast);
    }
  }
  return types;
}

/** Ensure unique-resource unit types are on creation params before gameplay / flavor. */
export function mergeUniqueResourceUnitTypes<
  T extends { resources?: { type: ResourceType; count: number }[]; unitTypes?: UnitType[] },
>(parameters: T): T {
  const added = unitTypesFromUniqueResources(parameters.resources);
  if (!added.length) return parameters;
  const unitTypes = [...(parameters.unitTypes ?? [])];
  let changed = false;
  for (const type of added) {
    if (!unitTypes.includes(type)) {
      unitTypes.push(type);
      changed = true;
    }
  }
  return changed ? { ...parameters, unitTypes } : parameters;
}

export function applyUniqueResourceEffects(cardTemplate: CardTemplate, resourceType: ResourceType) {
  switch (resourceType) {
    case ResourceType.MollysBeads:
      return applyMollysBeadsEffects(cardTemplate);
    case ResourceType.SchlupakMushrooms:
      return applySchlupakMushroomsEffects(cardTemplate);
    case ResourceType.SchlupakDreamspheres:
      return applySchlupakDreamspheresEffects(cardTemplate);
    case ResourceType.SchlupakSpores:
      return applySchlupakSporesEffects(cardTemplate);
  }
}

/** Apply effects for every unique resource present in the craft selection. */
export function applyUniqueResourcesFromSelection(
  cardTemplate: CardTemplate,
  resources: { type: ResourceType; count: number }[] | undefined
) {
  for (const resource of resources ?? []) {
    if (resource.count > 0 && isUniqueResource(resource.type)) {
      applyUniqueResourceEffects(cardTemplate, resource.type);
    }
  }
}

function forEachCardAction(cardTemplate: CardTemplate, fn: (action: ActionDefinition) => void) {
  if (isSpellCard(cardTemplate)) {
    for (const action of cardTemplate.actions) fn(action);
    return;
  }
  if (isUnitCard(cardTemplate)) {
    for (const ability of cardTemplate.abilities ?? []) {
      for (const action of ability.actions) fn(action);
    }
  }
}

// Molly's beads add a green requirement, 1 health and the beast unit type
function applyMollysBeadsEffects(cardTemplate: CardTemplate) {
  if (!cardTemplate.colors.map((c) => c.color).includes(CardColor.Green)) {
    cardTemplate.colors.push({ color: CardColor.Green, count: 1 });
  } else {
    cardTemplate.colors.find((c) => c.color === CardColor.Green)!.count++;
  }
  if (isUnitCard(cardTemplate)) {
    cardTemplate.maxHealth++;
    if (!cardTemplate.unitTypes) {
      cardTemplate.unitTypes = [];
    }
    if (!cardTemplate.unitTypes.includes(UnitType.Beast)) {
      cardTemplate.unitTypes.push(UnitType.Beast);
    }
  }
}

// Schlupak mushrooms: creatures get poisonous +1 and retaliate +1;
// spells with damageUnit get +1 damage
function applySchlupakMushroomsEffects(cardTemplate: CardTemplate) {
  if (isUnitCard(cardTemplate)) {
    addKeyword(cardTemplate, 'poisonous', 1);
    cardTemplate.retaliate++;
    return;
  }
  if (isSpellCard(cardTemplate)) {
    for (const action of cardTemplate.actions) {
      if (action.effect.name !== 'damageUnit') continue;
      const damage = Number(action.effect.args.damage) || 0;
      action.effect.args.damage = damage + 1;
    }
  }
}

// Schlupak dreamspheres: +1 duration on mezz / daze / root / stun
// (spell effects or unit abilities)
function applySchlupakDreamspheresEffects(cardTemplate: CardTemplate) {
  forEachCardAction(cardTemplate, (action) => {
    if (action.effect.name !== 'applyUnitStatus') return;
    if (!CONTROL_STATUS_TYPES.has(action.effect.args.statusType)) return;
    const duration = Number(action.effect.args.duration) || 0;
    action.effect.args.duration = duration + 1;
  });
}

// Schlupak spores: +1 count on bounceUnit / cycleCards / drawCards
function applySchlupakSporesEffects(cardTemplate: CardTemplate) {
  forEachCardAction(cardTemplate, (action) => {
    const name = action.effect.name;
    if (name === 'drawCard') {
      const cardCount = Number(action.effect.args.cardCount) || 0;
      action.effect.args.cardCount = cardCount + 1;
      return;
    }
    if (name === 'bounceUnit' || name === 'cycleCards') {
      for (const target of action.targets ?? []) {
        target.count = (Number(target.count) || 1) + 1;
      }
    }
  });
}
