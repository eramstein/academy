import { TriggerType, type Player } from '@/lib/_model';
import { activateAbility } from '@/lib/ui/_helpers/targetting';
import { isActivityPayable } from '../cost';

export function usePlayerLandAbility(player: Player): boolean {
  let playedAbility = false;
  let highestPayableCard = 0;
  highestPayableCard = player.hand.sort((a, b) => b.cost - a.cost)[0].cost;
  player.lands.forEach((land) => {
    if (
      !player.abilityUsed &&
      land.abilities?.filter((a) => a.trigger.type === TriggerType.Activated).length &&
      isActivityPayable(land, land.abilities[0]) &&
      (highestPayableCard + (land.abilities[0]?.cost ?? 0) <= player.mana)
    ) {
      activateAbility(land, land.abilities[0]);
      playedAbility = true;
    }
  });
  return playedAbility;
}
