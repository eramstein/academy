import type { ResourceType } from '../_model';
import { gs } from '../_state';

export function spendResources(resources: { type: ResourceType; count: number }[]): boolean {
  for (const resource of resources) {
    if (gs.player.resources[resource.type] < resource.count) {
      return false;
    }
  }
  for (const resource of resources) {
    gs.player.resources[resource.type] -= resource.count;
  }
  return true;
}
