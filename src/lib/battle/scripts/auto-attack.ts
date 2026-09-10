import { bs } from '@/lib/_state';
import { autoAttack as autoAttackUnit, canAttack } from '../combat';
import { getHumanPlayer } from '../player';
import { getOwnUnits } from '../unit';

export function autoAttackAll() {
  if (!bs.isPlayersTurn) {
    return;
  }
  const attackers = getOwnUnits(getHumanPlayer().id).filter(canAttack);
  if (attackers.length === 0) {
    return;
  }

  let index = 0;
  const attackNext = () => {
    const unit = attackers[index];
    if (canAttack(unit)) {
      autoAttackUnit(unit);
    }
    index++;
  };

  attackNext();
  if (index >= attackers.length) {
    return;
  }

  const intervalId = setInterval(() => {
    attackNext();
    if (index >= attackers.length) {
      clearInterval(intervalId);
    }
  }, 750);
}
