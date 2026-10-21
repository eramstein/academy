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
  eventTemplateEffectApplies,
  getManualSceneTriggers,
  getPlayableManualTrigger,
  getSceneEventByKey,
  getTriggeredSceneEvent,
  nodeIsEnterable,
  recordEventOccured,
  sceneEventForNode,
} from './events';
import { narrateText } from './narration';
import { updateNpcLocations } from './npc';
import { getCurrentScheduledActivity, narrateScheduledActivity } from './schedule';
import { nextPeriod } from './time';

function effectsIncludeNarrate(effects?: EventEffect[]): boolean {
  return effects?.some((effect) => effect.type === EventEffectType.Narrate) ?? false;
}

function effectsIncludeStartMatch(effects?: EventEffect[]): boolean {
  return effects?.some((effect) => effect.type === EventEffectType.StartMatch) ?? false;
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
After one event has already fired this period, further matches are parked as pendingPeriodEvent
(a single continue button) so narration does not chain automatically.
A long action advances the period and ends the scene; the next scene is set based either on the next scheduled activity or the player's choice of next place.
Optionless events resolve immediately (narrate + effects) and do not hold the scene.
An option nextNode (or a skill-check successNode / failureNode) opens another beat of the same event
instead of ending it. That beat does not stamp the event again.
A start_match effect defers nextNode and follow_up_event until the Battle view closes
(see resumeEventAfterBattle).
*/

export function syncManualSceneTriggers() {
  gs.scene.manualTriggers = getManualSceneTriggers();
}

function parkPendingPeriodEvent(eventKey: string, label: string) {
  gs.scene.pendingPeriodEvent = { eventKey, label };
  gs.scene.event = undefined;
  gs.scene.actions = [];
  gs.scene.manualTriggers = [];
}

export function setSceneEvents() {
  gs.scene.event = undefined;
  gs.scene.pendingPeriodEvent = undefined;
  // Keep resolving optionless events in one pass; stop when the player must choose.
  // After one event this period, park the next match behind a continue button.
  const resolvedKeys = new Set<string>();
  while (true) {
    const triggeredEvent = getTriggeredSceneEvent();
    if (!triggeredEvent || resolvedKeys.has(triggeredEvent.event.key)) break;
    if (gs.scene.eventsThisPeriod >= 1) {
      const label = triggeredEvent.template.title?.trim() || 'Continue';
      parkPendingPeriodEvent(triggeredEvent.event.key, label);
      return;
    }
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

/** Player clicked the continue button for a second (or later) event this period. */
export function playPendingPeriodEvent() {
  const pending = gs.scene.pendingPeriodEvent;
  if (!pending) return;
  gs.scene.pendingPeriodEvent = undefined;
  const triggered = getTriggeredSceneEvent();
  if (!triggered || triggered.event.key !== pending.eventKey) {
    // Triggers may have changed; re-scan instead of forcing a stale key.
    setSceneEvents();
    return;
  }
  setEvent(triggered.event, triggered.template);
  if (sceneWaitingOnEventChoice()) {
    gs.scene.actions = [];
    gs.scene.manualTriggers = [];
  } else {
    setSceneEvents();
  }
}

/** Destination chosen when this option was offered. Effects do not retarget it. */
function continuationNode(option: EventOption, success?: boolean): string | undefined {
  if (success === undefined || !option.outcome.attributeCheck) {
    return option.outcome.nextNode;
  }
  return success ? option.outcome.successNode : option.outcome.failureNode;
}

/**
 * Show a later beat of the event already in progress.
 * Does not consume the template or stamp its story tag again.
 * On-enter effects run before passages and options are resolved, so a story tag
 * set here can gate this beat's passages and choices.
 */
function presentEventNode(template: EventTemplate, nodeKey: string) {
  const node = template.nodes?.[nodeKey];
  if (!node) {
    if (!sceneWaitingOnEventChoice()) setSceneEvents();
    return;
  }
  let openedFollowUp = false;
  if (node.effects) {
    for (const entry of node.effects) {
      if (eventTemplateEffectApplies(entry, template.key)) {
        if (entry.effect.type === EventEffectType.FollowUpEvent) {
          openedFollowUp = true;
        }
        applyEffect(entry.effect);
      }
    }
  }
  // A follow-up event effect may have claimed the scene (and narrated already).
  if (sceneWaitingOnEventChoice()) return;
  // Optionless follow-ups narrate and clear the scene; don't re-narrate this bridge node.
  if (openedFollowUp) {
    setSceneEvents();
    return;
  }
  const event = sceneEventForNode(template, nodeKey);
  if (!event) {
    if (!sceneWaitingOnEventChoice()) setSceneEvents();
    return;
  }
  narrateText(event.text, {
    ...(node.title ? { title: node.title } : {}),
    characterKey: template.characterArc,
    ...(node.emotion ? { emotion: node.emotion } : {}),
    ...(node.image ? { image: node.image, imageSize: node.imageSize, eventKey: template.key } : {}),
  });
  if (template.characterArc && event.text.trim()) {
    appendRelationArcText(template.characterArc, event.text);
  }
  if (event.options.length > 0) {
    gs.scene.event = event;
    gs.scene.actions = [];
    gs.scene.manualTriggers = [];
    return;
  }
  setSceneEvents();
}

export async function selectOption(option: EventOption) {
  console.log('selectOption', option, gs.scene.event);
  const template = gs.scene.event?.key
    ? getSceneEventByKey(gs.scene.event.key)?.template
    : undefined;
  const characterArc = template?.characterArc;
  // Clear so a follow_up_event effect can claim the scene; otherwise setSceneEvents would wipe it.
  // Keep gs.scene.image until place change or a later event sets a new one.
  gs.scene.event = undefined;
  let success: boolean | undefined;
  const deferredFollowUps: EventEffect[] = [];
  const applyOptionEffects = (effects?: EventEffect[]) => {
    effects?.forEach((effect) => {
      // With start_match, follow-ups must wait until the Battle view closes.
      if (effect.type === EventEffectType.FollowUpEvent) {
        deferredFollowUps.push(effect);
        return;
      }
      applyOptionEffect(effect, characterArc);
    });
  };
  let appliedEffects: EventEffect[] | undefined;
  if (option.outcome.attributeCheck) {
    const check = option.outcome.attributeCheck;
    const result = await attributeCheck(
      gs.player.attributes[check.attribute],
      skillCheckDifficulty[check.difficulty],
      check.attribute,
      undefined,
      undefined,
      {
        // Authored narrate effects already describe the outcome — don't LLM on top.
        skipLlmNarration: (rolled) =>
          effectsIncludeNarrate(rolled.success ? check.successEffects : check.failureEffects),
      }
    );
    success = result.success;
    appliedEffects = success ? check.successEffects : check.failureEffects;
    applyOptionEffects(appliedEffects);
  } else if (option.outcome.effects) {
    appliedEffects = option.outcome.effects;
    applyOptionEffects(appliedEffects);
  }
  const nextNode = continuationNode(option, success);
  // Only defer when THIS option started a match. A leftover ongoingBattle must not
  // swallow nextNode (e.g. Join the performance → after_performance).
  if (effectsIncludeStartMatch(appliedEffects) && gs.ongoingBattle) {
    if (nextNode && template) {
      gs.ongoingBattle.resume = { eventKey: template.key, nextNode };
    }
    if (deferredFollowUps.length) {
      gs.ongoingBattle.resumeFollowUps = deferredFollowUps
        .map((effect) => effect.parameters?.eventKey)
        .filter((key): key is string => typeof key === 'string' && key.length > 0);
    }
    gs.scene.actions = [];
    return;
  }
  deferredFollowUps.forEach((effect) => applyOptionEffect(effect, characterArc));
  if (nextNode && template) {
    presentEventNode(template, nextNode);
    return;
  }
  if (option.outcome.action) {
    await performAction(option.outcome.action);
  } else if (!sceneWaitingOnEventChoice()) {
    setSceneEvents();
  }
}

/**
 * Call when leaving the Battle view. Clears `ongoingBattle` and, if a `start_match`
 * option parked a `nextNode` and/or `follow_up_event`s, applies them (node triggers
 * see `lastMatchWon`).
 */
export function resumeEventAfterBattle() {
  gs.ongoingBattle = null;
  const resume = gs.scene.pendingEventResume;
  const followUps = gs.scene.pendingFollowUpEvents;
  gs.scene.pendingEventResume = undefined;
  gs.scene.pendingFollowUpEvents = undefined;
  if (resume) {
    const resolved = getSceneEventByKey(resume.eventKey);
    if (resolved && nodeIsEnterable(resolved.template, resume.nextNode)) {
      presentEventNode(resolved.template, resume.nextNode);
    }
  }
  if (followUps?.length) {
    for (const eventKey of followUps) {
      applyEffect({
        type: EventEffectType.FollowUpEvent,
        parameters: { eventKey },
      });
      if (sceneWaitingOnEventChoice()) return;
    }
  }
  if (resume || followUps?.length) {
    if (!sceneWaitingOnEventChoice()) setSceneEvents();
    return;
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
    for (const entry of template.effects) {
      if (eventTemplateEffectApplies(entry, template.key)) {
        applyEffect(entry.effect);
      }
    }
  }
  recordEventOccured(template, event.text);
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
