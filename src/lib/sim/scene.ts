import {
  ActionDuration,
  ActionType,
  EventOutcomeType,
  SubscriptionType,
  type SceneEvent,
  type SceneEventOption,
} from '../_model';
import { gs } from '../_state';
import { getEnrollmentTransactionParameters } from './academy';
import { performAction, setPossibleActions } from './actions';
import { narrateText } from './narration';
import { getCurrentScheduledActivity } from './schedule';
import { nextPeriod } from './time';

/* 
The scene first loops events until it runs out. Player has to react to each event by chosing an option.
Once the events are done (no new events are set), the player can get proactive and choose actions while there is still time left.
*/

export function setSceneEvents() {
  gs.scene.event = undefined;
  initialEnrollmentEvent();
  console.log('setSceneEvents', gs.scene.event);
  if (gs.scene.event === undefined) {
    setPossibleActions();
  }
}

export function selectOption(option: SceneEventOption) {
  // perform option outcome
  if (option.outcome.type === EventOutcomeType.Action && option.outcome.action) {
    performAction(option.outcome.action);
  }
  // set next event, if none then set possible actions
  setSceneEvents();
}

export function nextScene() {
  nextPeriod();
  const currentScheduledActivity = getCurrentScheduledActivity();
  if (currentScheduledActivity) {
    gs.player.placeKey = currentScheduledActivity.placeKey;
  }
  setSceneEvents();
}

function setEvent(event: SceneEvent) {
  narrateText(event.text);
  gs.scene.event = event;
}

function initialEnrollmentEvent() {
  if (
    gs.player.subscriptions[SubscriptionType.Academy] === 0 &&
    gs.player.placeKey === 'admin-office'
  ) {
    setEvent({
      text: 'After a long journey, you finally arrive at the academy. A clerk directs you to the administration office. The administrator asks you for tuition fees.',
      options: [
        {
          text: 'Negotiate',
          outcome: {
            type: EventOutcomeType.Decision,
            action: {
              actionType: ActionType.Negotiate,
              duration: ActionDuration.Short,
              actionParameters: getEnrollmentTransactionParameters() as Record<string, any>,
            },
          },
        },
        {
          text: 'Pay',
          outcome: {
            type: EventOutcomeType.Action,
            action: {
              actionType: ActionType.Transaction,
              duration: ActionDuration.Short,
              actionParameters: getEnrollmentTransactionParameters() as Record<string, any>,
            },
          },
        },
      ],
    });
  }
}
