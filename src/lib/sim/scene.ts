import { performAction, setPossibleActions } from '@/lib/sim/actions';
import { applyEffect } from '@/lib/sim/effects';
import { appendRelationArcText } from '@/lib/sim/effects/relations';
import {
  type EventEffect,
  type EventOption,
  type EventTemplate,
  type SceneEvent,
  type ScheduledActivity,
} from '../_model';
import { EventEffectType } from '../_model/enums-sim';
import { gs } from '../_state';
import { attributeCheck, skillCheckDifficulty } from './attribute-checks';
import {
  consumeEventTemplate,
  getManualSceneTriggers,
  getPlayableManualTrigger,
  getSceneEventByKey,
  getTriggeredSceneEvent,
  recordEventOccured,
} from './events';
import { narrateText } from './narration';
import { updateNpcLocations } from './npc';
import { getCurrentScheduledActivity, narrateScheduledActivity } from './schedule';
import { nextPeriod } from './time';

function effectsIncludeNarrate(effects?: EventEffect[]): boolean {
  return effects?.some((effect) => effect.type === EventEffectType.Narrate) ?? false;
}

/** Apply an option effect; for character-arc events, mix narrate prose into the same arc beat. */
function applyOptionEffect(effect: EventEffect, characterArc?: string) {
  applyEffect(effect);
  if (!characterArc || effect.type !== EventEffectType.Narrate) {
    return;
  }
  const text = typeof effect.parameters?.text === 'string' ? effect.parameters.text.trim() : '';
  if (!text) {
    return;
  }
  appendRelationArcText(characterArc, text);
}

/** True when the player must pick an option before the scene continues. */
export function sceneWaitingOnEventChoice(event = gs.scene.event): boolean {
  return (event?.options?.length ?? 0) > 0;
}

/* 
The scene first loops events until it runs out. Player has to react to each event by chosing an option.
Once the events are done (no new events are set), the player can get proactive and choose actions.
Events with manualTrigger are skipped here and offered as scene-action buttons instead.
A long action advances the period and ends the scene; the next scene is set based either on the next scheduled activity or the player's choice of next place.
Optionless events resolve immediately (narrate + effects) and do not hold the scene.
*/

export function syncManualSceneTriggers() {
  gs.scene.manualTriggers = getManualSceneTriggers();
}

export function setSceneEvents() {
  gs.scene.event = undefined;
  // Keep resolving optionless events in one pass; stop when the player must choose.
  const resolvedKeys = new Set<string>();
  while (true) {
    const triggeredEvent = getTriggeredSceneEvent();
    if (!triggeredEvent || resolvedKeys.has(triggeredEvent.event.key)) break;
    resolvedKeys.add(triggeredEvent.event.key);
    setEvent(triggeredEvent.event, triggeredEvent.template);
    if (sceneWaitingOnEventChoice()) break;
  }
  console.log('setSceneEvents', gs.scene.event);
  if (!sceneWaitingOnEventChoice()) {
    console.log('no event choices, setting possible actions');
    gs.scene.event = undefined;
    setPossibleActions();
  } else {
    gs.scene.manualTriggers = [];
  }
}

export async function selectOption(option: EventOption) {
  console.log('selectOption', option, gs.scene.event);
  const characterArc = gs.scene.event?.key
    ? getSceneEventByKey(gs.scene.event.key)?.template.characterArc
    : undefined;
  // Clear so a follow_up_event effect can claim the scene; otherwise setSceneEvents would wipe it.
  // Keep gs.scene.image until place change or a later event sets a new one.
  gs.scene.event = undefined;
  if (option.outcome.attributeCheck) {
    const check = option.outcome.attributeCheck;
    const { success } = await attributeCheck(
      gs.player.attributes[check.attribute],
      skillCheckDifficulty[check.difficulty],
      check.attribute,
      undefined,
      undefined,
      {
        // Authored narrate effects already describe the outcome — don't LLM on top.
        skipLlmNarration: (result) =>
          effectsIncludeNarrate(result.success ? check.successEffects : check.failureEffects),
      }
    );
    const branched = success ? check.successEffects : check.failureEffects;
    branched?.forEach((effect) => applyOptionEffect(effect, characterArc));
  } else if (option.outcome.effects) {
    option.outcome.effects.forEach((effect) => {
      applyOptionEffect(effect, characterArc);
    });
  }
  if (option.outcome.action) {
    await performAction(option.outcome.action);
  } else if (!sceneWaitingOnEventChoice()) {
    setSceneEvents();
  }
}

export function startScene() {
  updateNpcLocations();
  const currentScheduledActivity = getCurrentScheduledActivity();
  console.log('nextScene', currentScheduledActivity);
  if (currentScheduledActivity) {
    setCurrentActivity(currentScheduledActivity);
    setSceneEvents();
  } else {
    gs.scene.selectingNextPlace = true;
  }
}

export function setCurrentActivity(currentScheduledActivity: ScheduledActivity) {
  if (gs.player.placeKey !== currentScheduledActivity.placeKey) {
    gs.scene.image = undefined;
  }
  gs.player.placeKey = currentScheduledActivity.placeKey;
  currentScheduledActivity.participants.forEach((participant) => {
    if (participant === gs.player.key) {
      return;
    }
    gs.characters[participant].placeKey = currentScheduledActivity.placeKey;
    gs.characters[participant].activityHistory[currentScheduledActivity.type] =
      (gs.characters[participant].activityHistory[currentScheduledActivity.type] || 0) + 1;
  });
  narrateScheduledActivity(currentScheduledActivity);
}

export function nextScene() {
  nextPeriod();
  startScene();
}

export function selectNextScene(placeKey: string) {
  gs.player.placeKey = placeKey;
  gs.scene.selectingNextPlace = false;
  gs.scene.image = undefined;
  console.log('selectNextScene', placeKey, gs.scene.selectingNextPlace);
  setSceneEvents();
}

export function setEvent(event: SceneEvent, template: EventTemplate) {
  // Only skip re-entry while waiting on the same choosable event. Optionless leftovers
  // (e.g. from /e) must not block re-resolution or clear-and-restore of actions.
  if (event.text === gs.scene.event?.text && sceneWaitingOnEventChoice()) {
    return;
  }
  narrateText(event.text, {
    title: template.title,
    characterKey: template.characterArc,
    emotion: template.emotion,
    image: template.image,
    imageSize: template.imageSize,
    eventKey: template.key,
  });
  // Claim the scene only when there are choices. Effects may still install a follow-up.
  gs.scene.event = sceneWaitingOnEventChoice(event) ? event : undefined;
  consumeEventTemplate(template);
  if (template.effects) {
    template.effects.forEach((effect) => applyEffect(effect));
  }
  recordEventOccured(template);
  // Follow-up may have claimed the scene; drop optionless leftovers so callers restore actions.
  if (!sceneWaitingOnEventChoice()) {
    gs.scene.event = undefined;
  }
}

/** Play a manualTrigger event from its scene-action button. */
export function playManualTriggerEvent(eventKey: string) {
  const resolved = getPlayableManualTrigger(eventKey);
  if (!resolved) {
    syncManualSceneTriggers();
    return;
  }
  setEvent(resolved.event, resolved.template);
  if (sceneWaitingOnEventChoice()) {
    gs.scene.actions = [];
    gs.scene.manualTriggers = [];
  } else {
    setSceneEvents();
  }
}

/** Debug/console: fire an event by key. Optionless events resolve and restore actions. */
export function simulateEvent(templateKey: string) {
  const resolved = getSceneEventByKey(templateKey);
  if (!resolved) {
    return undefined;
  }
  setEvent(resolved.event, resolved.template);
  if (sceneWaitingOnEventChoice()) {
    gs.scene.actions = [];
    gs.scene.manualTriggers = [];
  } else {
    setSceneEvents();
  }
  return resolved.event;
}
