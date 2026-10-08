import { CardColor, isUnitCard, UnitType, type CardTemplate } from '@/lib/_model';
import { ResourceType } from '@/lib/_model/enums-sim';

export const COMMON_RESOURCE_TYPES: ResourceType[] = [
  ResourceType.MagicDust,
  ResourceType.Mithril,
  ResourceType.Moxes,
];

export const UNIQUE_RESOURCE_TYPES: ResourceType[] = [ResourceType.MollysBeads];

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
