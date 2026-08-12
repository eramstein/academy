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
Once there are no actions available, the scene ends and the next scene is set, based either on the next scheduled activity or the player's choice of next place.
*/

export function setSceneEvents() {
  gs.scene.event = undefined;
  // test which events trigger based on context
  initialEnrollmentEvent();
  // ... all others. TODO: more elegant way to do this.
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
    setSceneEvents();
  } else {
    gs.scene.selectingNextPlace = true;
  }
}

export function selectNextScene(placeKey: string) {
  gs.player.placeKey = placeKey;
  gs.scene.selectingNextPlace = false;
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
            type: EventOutcomeType.Action,
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
