import { type ResourceType } from '@/lib/_model';
import { gs } from '@/lib/_state';

export interface AddResourceParameters {
  resourceType: ResourceType;
  amount: number;
}

export function addResource(parameters: AddResourceParameters): string {
  const { resourceType, amount } = parameters;
  gs.player.resources[resourceType] += amount;
  return `You gain ${amount} ${formatResourceType(resourceType)}.`;
}

function formatResourceType(resourceType: ResourceType): string {
  return resourceType.replace('_', ' ').toLowerCase();
}
