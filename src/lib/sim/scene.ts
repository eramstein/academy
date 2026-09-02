import { type SceneEvent, type EventOption, EventOutcomeType } from '../_model';
import { gs } from '../_state';
import type { StoredEventTemplate } from '../_state/event-templates';
import { performAction, setPossibleActions } from '@/lib/sim/actions';
import { applyEffect } from '@/lib/sim/effects';
import { consumeEventTemplate, getTriggeredSceneEvent } from './events';
import { narrateText } from './narration';
import { updateNpcLocations } from './npc';
import { getCurrentScheduledActivity } from './schedule';
import { nextPeriod } from './time';

/* 
The scene first loops events until it runs out. Player has to react to each event by chosing an option.
Once the events are done (no new events are set), the player can get proactive and choose actions.
A long action advances the period and ends the scene; the next scene is set based either on the next scheduled activity or the player's choice of next place.
*/

export function setSceneEvents() {
  gs.scene.event = undefined;
  const triggeredEvent = getTriggeredSceneEvent();
  if (triggeredEvent) {
    setEvent(triggeredEvent.event, triggeredEvent.template);
  }
  console.log('setSceneEvents', gs.scene.event);
  if (gs.scene.event === undefined) {
    setPossibleActions();
  }
}

export function selectOption(option: EventOption) {
  // perform option outcome
  if (option.outcome.type === EventOutcomeType.Action && option.outcome.action) {
    performAction(option.outcome.action);
  }
  if (option.outcome.effects) {
    option.outcome.effects.forEach((effect) => {
      applyEffect(effect);
    });
  }
  // set next event, if none then set possible actions
  setSceneEvents();
}

export function nextScene() {  
  nextPeriod();
  updateNpcLocations();
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

export function setEvent(event: SceneEvent, template?: StoredEventTemplate) {
  narrateText(event.text);
  gs.scene.event = event.options.length > 0 ? event : undefined;
  if (template?.triggersOnce) {
    consumeEventTemplate(template);
  }
}
