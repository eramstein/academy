import {
  ActivityType,
  type ClassActivity,
  ClassType,
  DayPeriod,
  SubscriptionType,
} from '../_model';
import { gs } from '../_state';
import { TransactionType } from './actions/transaction';
import type { NegotiateParameters } from './actions/negotiation';
import { scheduleActivity } from './schedule';
import { getWeekDay } from './time';

// this can be used to create a transaction action for the enrollment
// it is for the current term, which is 84 days (12 weeks)
// the first term starts on day 1
export function getEnrollmentTransactionParameters(): NegotiateParameters {
  const remainingDays = 84 - (gs.time.day % 84);
  return {
    cost: 900,
    transactionType: TransactionType.Subscription,
    subscriptionType: SubscriptionType.Academy,
    duration: remainingDays,
    partner: 'administrator',
  };
}

// schedule classes for the rest of the term
// the classes are scheduled for the rest of the term, starting from the current day
// classes happen monday to friday, artificery in the morning, enchanting in the afternoon
export function scheduleClassesForCurrentTerm() {
  const remainingDays = 84 - (gs.time.day % 84);
  for (let i = 0; i < remainingDays; i++) {
    // skip on weekends
    if (getWeekDay(gs.time.day + i) > 5) {
      continue;
    }
    const artificeryActivity: ClassActivity = {
      type: ActivityType.Class,
      participants: [gs.player.key],
      placeKey: 'artificery-room',
      day: gs.time.day + i,
      period: DayPeriod.Morning,
      classType: ClassType.Artificery,
    };
    const enchantingActivity: ClassActivity = {
      type: ActivityType.Class,
      participants: [gs.player.key],
      placeKey: 'enchanting-room',
      day: gs.time.day + i,
      period: DayPeriod.Afternoon,
      classType: ClassType.Enchanting,
    };
    scheduleActivity(artificeryActivity);
    scheduleActivity(enchantingActivity);
  }
}
