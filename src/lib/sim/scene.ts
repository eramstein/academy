import { performAction, setPossibleActions } from '@/lib/sim/actions';
import {
  applyEffect,
  applyEffectsWithChoicesLast,
  effectRequiresPlayerChoice,
} from '@/lib/sim/effects';
import { appendRelationArcText } from '@/lib/sim/effects/relations';
import {
  type EventEffect,
  type EventOption,
  type EventTemplate,
  type OfferedPeriodEvent,
  type SceneEvent,
  type ScheduledActivity,
} from '../_model';
import { EventEffectType } from '../_model/enums-sim';
import { gs, saveStateToLocalStorage } from '../_state';
import { attributeCheck, skillCheckDifficulty } from './attribute-checks';
import {
  consumeEventTemplate,
  eventPlaceKey,
  eventPresentCharacterKeys,
  eventTemplateEffectApplies,
  getNextMandatorySceneEvent,
  getSceneEventByKey,
  getTriggeredSilentEvent,
  listOptionalSceneEvents,
  nodeIsEnterable,
  recordEventOccured,
  sceneEventForNode,
  type StoredEventTemplate,
} from './events';
import { placeNeedsGuardian, presentGuardianEncounter } from './guardians';
import { narrateScheduledActivity, narrateText } from './narration';
import { updateNpcLocations } from './npc';
import { getCurrentScheduledActivity } from './schedule';
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
Each period plays every matching mandatory event, one after another. After the first
visible one, the next waits behind a continue button so narration does not chain.
Silent events fire for effects only: they are not narrated, never claim the scene, and
do not count toward that pacing.
If no mandatory event played, the player may start one optional event, chosen from up
to three random matches. With a scheduled activity, skipping it continues the activity.
With none, matches ignore place, and skipping opens the map.
A long action advances the period. The next scene follows the scheduled activity, or
asks where to go once events for a free period are done.
Optionless events resolve immediately (narrate + effects) and do not hold the scene.
An option nextNode (or a skill-check successNode / failureNode) opens another beat of the same event
instead of ending it. That beat does not stamp the event again.
A start_match effect defers nextNode and follow_up_event until the Battle view closes
(see resumeEventAfterBattle).
*/

const MAX_OPTIONAL_OFFERS = 3;

function parkPendingPeriodEvent(eventKey: string, label: string) {
  gs.scene.pendingPeriodEvent = { eventKey, label };
  gs.scene.event = undefined;
  gs.scene.actions = [];
}

function placePhrase(name: string): string {
  if (/^(the|a|an)\b/i.test(name) || name.includes("'")) return name;
  return `the ${name}`;
}

function eventTitle(template: Pick<EventTemplate, 'key' | 'title'>): string {
  const title = template.title?.trim();
  if (title) return title;
  return template.key.replace(/[_-]+/g, ' ');
}

function sampleEvents(events: StoredEventTemplate[], count: number): StoredEventTemplate[] {
  const copy = [...events];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, count);
}

function offeredInvitation(template: StoredEventTemplate): string | undefined {
  const text = template.invitationText?.trim();
  return text || undefined;
}

function toOfferedEvent(template: StoredEventTemplate, travel: boolean): OfferedPeriodEvent {
  const title = eventTitle(template);
  const invitationText = offeredInvitation(template);
  const characterKey = template.characterArc;
  const character = characterKey ? gs.characters[characterKey] : undefined;
  if (!travel) {
    return {
      eventKey: template.key,
      title,
      label: title,
      ...(invitationText ? { invitationText } : {}),
      ...(characterKey ? { characterKey } : {}),
      ...(template.emotion ? { emotion: template.emotion } : {}),
    };
  }

  const scriptedPlace = eventPlaceKey(template);
  const destination =
    scriptedPlace ??
    (character && character.placeKey !== gs.player.placeKey ? character.placeKey : undefined);
  const placeName = destination ? gs.places[destination]?.name : undefined;
  const label = placeName ? `Go to ${placePhrase(placeName)}` : title;
  return {
    eventKey: template.key,
    title,
    label,
    ...(invitationText ? { invitationText } : {}),
    ...(characterKey ? { characterKey } : {}),
    ...(template.emotion ? { emotion: template.emotion } : {}),
    ...(destination ? { placeKey: destination } : {}),
  };
}

/** Bring the player and the event's characters to the destination. */
function moveCastForEvent(template: EventTemplate, placeKey?: string) {
  const destination = placeKey ?? eventPlaceKey(template);
  if (!destination || !gs.places[destination]) return;
  if (gs.player.placeKey !== destination) {
    gs.player.placeKey = destination;
    gs.scene.image = undefined;
  }
  const keys = new Set(eventPresentCharacterKeys(template));
  if (template.characterArc) keys.add(template.characterArc);
  for (const key of keys) {
    const character = gs.characters[key];
    if (!character || character.key === gs.player.key) continue;
    character.placeKey = destination;
  }
}

function startEventByKey(eventKey: string, placeKey?: string): boolean {
  const resolved = getSceneEventByKey(eventKey);
  if (!resolved) return false;
  // Explicit destination (travel offer) or template.place / Place trigger.
  moveCastForEvent(resolved.template, placeKey);
  setEvent(resolved.event, resolved.template);
  if (sceneWaitingOnEventChoice()) {
    gs.scene.actions = [];
    return true;
  }
  return false;
}

/** No event is holding the scene: offer a place, or open ordinary actions. */
function settleOpenScene() {
  gs.scene.event = undefined;
  gs.scene.pendingPeriodEvent = undefined;
  gs.scene.periodEventOffer = undefined;
  if (gs.scene.awaitingPlacePick) {
    gs.scene.selectingNextPlace = true;
    gs.scene.actions = [];
    return;
  }
  gs.scene.selectingNextPlace = false;
  console.log('no event choices, setting possible actions');
  setPossibleActions();
}

function offerOptionalEvents() {
  if (gs.scene.periodEventOffer) {
    gs.scene.actions = [];
    gs.scene.selectingNextPlace = false;
    return;
  }
  const activity = getCurrentScheduledActivity();
  const travel = !activity;
  const matches = listOptionalSceneEvents(travel);
  if (matches.length === 0) {
    // Nothing to choose. Don't ask again after the player settles into the period.
    gs.scene.optionalEventResolved = true;
    settleOpenScene();
    return;
  }
  gs.scene.periodEventOffer = {
    events: sampleEvents(matches, MAX_OPTIONAL_OFFERS).map((template) =>
      toOfferedEvent(template, travel)
    ),
    skipToActivity: !travel,
  };
  gs.scene.actions = [];
  gs.scene.selectingNextPlace = false;
  gs.scene.event = undefined;
}

export function setSceneEvents() {
  gs.scene.event = undefined;
  gs.scene.pendingPeriodEvent = undefined;

  if (gs.scene.pendingOfferedEventKey) {
    const eventKey = gs.scene.pendingOfferedEventKey;
    gs.scene.pendingOfferedEventKey = undefined;
    if (startEventByKey(eventKey, gs.player.placeKey)) return;
  }

  // Drain silent events (effects only), then mandatory events. After one visible
  // event this period, park the next mandatory match behind a continue button.
  const resolvedKeys = new Set<string>();
  while (true) {
    const silentEvent = getTriggeredSilentEvent();
    if (silentEvent && !resolvedKeys.has(silentEvent.event.key)) {
      resolvedKeys.add(silentEvent.event.key);
      setEvent(silentEvent.event, silentEvent.template);
      continue;
    }
    const mandatory = getNextMandatorySceneEvent();
    if (!mandatory || resolvedKeys.has(mandatory.event.key)) break;
    if (gs.scene.eventsThisPeriod >= 1) {
      const label = mandatory.template.title?.trim() || 'Continue';
      gs.scene.periodEventOffer = undefined;
      parkPendingPeriodEvent(mandatory.event.key, label);
      return;
    }
    resolvedKeys.add(mandatory.event.key);
    gs.scene.periodEventOffer = undefined;
    setEvent(mandatory.event, mandatory.template);
    if (sceneWaitingOnEventChoice()) return;
  }

  console.log('setSceneEvents', gs.scene.event);
  if (sceneWaitingOnEventChoice()) return;
  if (gs.scene.mandatoryEventPlayed || gs.scene.optionalEventResolved) {
    settleOpenScene();
    return;
  }
  offerOptionalEvents();
}

/** Player clicked the continue button for a later mandatory event this period. */
export function playPendingPeriodEvent() {
  const pending = gs.scene.pendingPeriodEvent;
  if (!pending) return;
  gs.scene.pendingPeriodEvent = undefined;
  const triggered = getNextMandatorySceneEvent();
  if (!triggered || triggered.event.key !== pending.eventKey) {
    // Triggers may have changed; re-scan instead of forcing a stale key.
    setSceneEvents();
    return;
  }
  setEvent(triggered.event, triggered.template);
  if (sceneWaitingOnEventChoice()) {
    gs.scene.actions = [];
  } else {
    setSceneEvents();
  }
}

/** Player chose one of the period's optional events. */
export function selectOfferedEvent(eventKey: string) {
  const offer = gs.scene.periodEventOffer;
  const picked = offer?.events.find((event) => event.eventKey === eventKey);
  if (!offer || !picked) return;
  gs.scene.periodEventOffer = undefined;
  gs.scene.optionalEventResolved = true;
  gs.scene.selectingNextPlace = false;
  gs.scene.awaitingPlacePick = false;

  if (!offer.skipToActivity && picked.placeKey && placeNeedsGuardian(picked.placeKey)) {
    gs.scene.pendingOfferedEventKey = picked.eventKey;
    presentGuardianEncounter(picked.placeKey);
    return;
  }

  const placeKey = offer.skipToActivity ? undefined : picked.placeKey;
  if (startEventByKey(picked.eventKey, placeKey)) return;
  setSceneEvents();
}

/** Player declined the optional events. */
export function skipOfferedEvents() {
  const offer = gs.scene.periodEventOffer;
  if (!offer) return;
  gs.scene.periodEventOffer = undefined;
  gs.scene.optionalEventResolved = true;
  gs.scene.event = undefined;
  if (offer.skipToActivity) {
    gs.scene.selectingNextPlace = false;
    setPossibleActions();
    return;
  }
  gs.scene.selectingNextPlace = true;
  gs.scene.actions = [];
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
 * On-enter effects that mutate state (e.g. story tags) run before passages and
 * options are resolved so they can gate this beat. Choice prompts
 * (e.g. offer_card_gifts) wait until after the node's text and image.
 */
function presentEventNode(template: EventTemplate, nodeKey: string) {
  const node = template.nodes?.[nodeKey];
  if (!node) {
    if (!sceneWaitingOnEventChoice()) setSceneEvents();
    return;
  }
  let openedFollowUp = false;
  const deferredChoiceEffects: EventEffect[] = [];
  if (node.effects) {
    for (const entry of node.effects) {
      if (!eventTemplateEffectApplies(entry, template.key)) continue;
      if (effectRequiresPlayerChoice(entry.effect)) {
        deferredChoiceEffects.push(entry.effect);
        continue;
      }
      if (entry.effect.type === EventEffectType.FollowUpEvent) {
        openedFollowUp = true;
      }
      applyEffect(entry.effect);
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
  // Choice prompts after the beat's prose/image so the ask reads as the payoff.
  for (const effect of deferredChoiceEffects) {
    applyEffect(effect);
  }
  if (event.options.length > 0) {
    gs.scene.event = event;
    gs.scene.actions = [];
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
    if (!effects?.length) return;
    const choices: EventEffect[] = [];
    for (const effect of effects) {
      // With start_match, follow-ups must wait until the Battle view closes.
      if (effect.type === EventEffectType.FollowUpEvent) {
        deferredFollowUps.push(effect);
        continue;
      }
      if (effectRequiresPlayerChoice(effect)) {
        choices.push(effect);
        continue;
      }
      applyOptionEffect(effect, characterArc);
    }
    // Player prompts (gift pick, etc.) after other outcome narration/state.
    for (const effect of choices) {
      applyOptionEffect(effect, characterArc);
    }
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
  // Run actionTemplates (e.g. enrollment pay/negotiate, interaction follow-ups)
  // before nextNode / scene refresh. Interaction beats keep gs.scene.interaction
  // set between choices — that must not skip this action.
  if (option.outcome.action) {
    await performAction(option.outcome.action);
    if (sceneWaitingOnEventChoice() || gs.scene.interaction) {
      return;
    }
    deferredFollowUps.forEach((effect) => applyOptionEffect(effect, characterArc));
    if (sceneWaitingOnEventChoice() || gs.scene.interaction) {
      gs.scene.actions = [];
      return;
    }
    // performAction already resolved the scene when there were no follow-ups.
    if (deferredFollowUps.length > 0) {
      setSceneEvents();
    }
    return;
  }
  // start_interaction (effect) claims the scene before its LLM turn; do not open a
  // next node or refresh actions while the interaction owns the stage.
  if (gs.scene.interaction) {
    gs.scene.actions = [];
    return;
  }
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
    // Re-save so resume/follow-ups attached after initOngoingBattle are persisted.
    saveStateToLocalStorage();
    return;
  }
  // start_match was authored but did not open a battle — do not enter a post-match
  // node with a stale lastMatchWon from an earlier fight.
  if (effectsIncludeStartMatch(appliedEffects)) {
    deferredFollowUps.forEach((effect) => applyOptionEffect(effect, characterArc));
    if (!sceneWaitingOnEventChoice()) setSceneEvents();
    return;
  }
  if (nextNode && template) {
    deferredFollowUps.forEach((effect) => applyOptionEffect(effect, characterArc));
    presentEventNode(template, nextNode);
    return;
  }
  deferredFollowUps.forEach((effect) => applyOptionEffect(effect, characterArc));
  if (sceneWaitingOnEventChoice()) {
    gs.scene.actions = [];
    return;
  }
  setSceneEvents();
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
      if (sceneWaitingOnEventChoice()) {
        // Battle chrome was reset without updating the quicksave; persist the
        // resumed scene so reload does not restore empty pre-match actions.
        saveStateToLocalStorage();
        return;
      }
    }
  }
  if ((resume || followUps?.length) && !sceneWaitingOnEventChoice()) {
    setSceneEvents();
  }
  saveStateToLocalStorage();
}

export function startScene() {
  updateNpcLocations();
  const currentScheduledActivity = getCurrentScheduledActivity();
  console.log('nextScene', currentScheduledActivity);
  gs.scene.eventsThisPeriod = 0;
  gs.scene.mandatoryEventPlayed = false;
  gs.scene.optionalEventResolved = false;
  gs.scene.periodEventOffer = undefined;
  gs.scene.pendingPeriodEvent = undefined;
  gs.scene.pendingOfferedEventKey = undefined;
  gs.scene.selectingNextPlace = false;
  gs.scene.awaitingPlacePick = !currentScheduledActivity;
  if (currentScheduledActivity) {
    setCurrentActivity(currentScheduledActivity);
  }
  setSceneEvents();
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
  void narrateScheduledActivity(currentScheduledActivity);
}

export function nextScene() {
  nextPeriod();
  startScene();
}

export function selectNextScene(placeKey: string) {
  gs.scene.awaitingPlacePick = false;
  if (placeNeedsGuardian(placeKey)) {
    presentGuardianEncounter(placeKey);
    return;
  }
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
  // Relocate player + cast when the template names an explicit destination.
  if (template.place) moveCastForEvent(template, template.place);
  consumeEventTemplate(template);
  if (template.silent) {
    // Effects + story stamp only — no narration, scene claim, or period-limit slot.
    if (template.effects) {
      const applicable = template.effects
        .filter((entry) => eventTemplateEffectApplies(entry, template.key))
        .map((entry) => entry.effect);
      applyEffectsWithChoicesLast(applicable);
    }
    recordEventOccured(template, event.text);
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
  if (template.effects) {
    const applicable = template.effects
      .filter((entry) => eventTemplateEffectApplies(entry, template.key))
      .map((entry) => entry.effect);
    applyEffectsWithChoicesLast(applicable);
  }
  recordEventOccured(template, event.text);
  // Follow-up may have claimed the scene; drop optionless leftovers so callers restore actions.
  if (!sceneWaitingOnEventChoice()) {
    gs.scene.event = undefined;
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
  } else {
    setSceneEvents();
  }
  return resolved.event;
}
