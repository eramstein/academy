import { BASE_DECK_GREEN, BASE_DECK_RED } from '@/data/base-deck';
import { DayPeriod, ResourceType } from '../../_model';
import type { UnitKeywords } from '../../_model/model-battle';
import { bs, getCurrentBattleState, gs, saveStateToLocalStorage } from '../../_state';
import { drawCard, tutorCard } from '../../battle/deck';
import { scheduleClassesForCurrentTerm } from '../../sim/academy';
import { ACTION_TEMPLATE_KEYS } from '../../sim/cards/action-templates';
import { KEYWORD_KEYS } from '../../sim/cards/keywords';
import { redeemBaseDeck } from '../../sim/deck';
import { completeCraftedArtifact } from '../../sim/actions/craft-artifact';
import { getLoadedArtifact, getLoadedArtifacts } from '../../sim/artifacts';
import { acquireArtifactPattern } from '../../sim/effects/artifacts';
import { addResource } from '../../sim/effects/resources';
import { newLeagueSeason } from '../../sim/league';
import { initOngoingBattle } from '../../sim/ongoing-battle';
import {
  applyEventDebugSetup,
  buildEventDebugPlan,
  formatSimulatedMessage,
} from '../../sim/event-debug';
import { simulateEvent } from '../../sim/scene';
import { openCraftArtifactAction } from '../craft-artifact-session.svelte';
import { openEventDebug } from '../event-debug-session.svelte';
import { goToPeriod } from '../../sim/time';

const PERIODS = [DayPeriod.Morning, DayPeriod.Afternoon, DayPeriod.Evening];

function resolveResource(token: string): ResourceType | undefined {
  const key = token.toLowerCase();
  const types = Object.values(ResourceType);
  return types.find((type) => type === key || type.split('_').at(-1) === key);
}

export interface CommandResult {
  ok: boolean;
  message: string;
  /** Keep the console open so the caller can show a follow-up UI. */
  keepOpen?: boolean;
}

export async function executeCommand(input: string): Promise<CommandResult> {
  const trimmed = input.trim();
  if (!trimmed.startsWith('/')) {
    return { ok: false, message: 'Commands must start with /' };
  }

  const parts = trimmed.slice(1).split(/\s+/);
  const cmd = parts[0];

  switch (cmd) {
    case 'discard-hand': {
      // /discard-hand
      bs.players[1].hand = [];
      return { ok: true, message: `Discarded opponent's hand` };
    }

    case 'draw': {
      // /draw [name prefix]
      const player = bs.players[0];
      const query = parts.slice(1).join(' ').trim().toLowerCase();
      if (!query) {
        if (player.deck.length === 0) {
          return { ok: false, message: 'Deck is empty' };
        }
        const card = player.deck[0];
        drawCard(player);
        return { ok: true, message: `Drew ${card.name}` };
      }
      const card = player.deck.find((c) => c.name.toLowerCase().startsWith(query));
      if (!card) {
        return { ok: false, message: `No deck card matching "${parts.slice(1).join(' ')}"` };
      }
      tutorCard(card.instanceId, player);
      return { ok: true, message: `Drew ${card.name}` };
    }

    case 'day': {
      // /day <day number> <1|2|3>
      const day = parseInt(parts[1], 10);
      const periodIndex = parseInt(parts[2], 10);
      if (Number.isNaN(day) || ![1, 2, 3].includes(periodIndex)) {
        return { ok: false, message: 'Usage: /day <day number> <1|2|3>' };
      }
      const period = PERIODS[periodIndex - 1];
      gs.time.day = day;
      if (gs.scheduledActivities.length === 0) {
        scheduleClassesForCurrentTerm();
      }
      goToPeriod(day, period);
      return { ok: true, message: `Went to day ${day} ${period}` };
    }

    case 'e': {
      // /e <event-key> [now]
      // now skips setup. Otherwise prerequisite tags and the scene are applied,
      // and events with alternate branches open a checklist first.
      const eventKey = parts[1];
      const immediate = parts[2] === 'now';
      if (!eventKey) {
        return { ok: false, message: 'Usage: /e <event-key> [now]' };
      }
      if (immediate) {
        const event = simulateEvent(eventKey);
        if (!event) return { ok: false, message: `Event not found: ${eventKey}` };
        return { ok: true, message: `Simulated event ${eventKey}` };
      }
      const plan = buildEventDebugPlan(eventKey);
      if (!plan) return { ok: false, message: `Event not found: ${eventKey}` };
      const hasBranches = plan.toggles.some((toggle) => toggle.group === 'branch');
      if (!hasBranches) {
        const notes = applyEventDebugSetup(
          plan,
          plan.toggles.map((toggle) => toggle.id)
        );
        const event = simulateEvent(eventKey);
        if (!event) return { ok: false, message: `Event not found: ${eventKey}` };
        return { ok: true, message: formatSimulatedMessage(eventKey, notes, plan.notices) };
      }
      openEventDebug(plan);
      return { ok: true, message: '', keepOpen: true };
    }

    case 'res': {
      // /res <dust|silver|moxes> <amount>
      const resourceType = parts[1] ? resolveResource(parts[1]) : undefined;
      const amount = parseInt(parts[2], 10);
      if (!resourceType || Number.isNaN(amount)) {
        return { ok: false, message: 'Usage: /res <dust|silver|moxes> <amount>' };
      }
      const message = addResource({ resourceType, amount });
      return { ok: true, message };
    }

    case 'learn-all': {
      // /learn-all
      const keywords = Object.fromEntries(KEYWORD_KEYS.map((key) => [key, 1])) as Partial<
        Record<keyof UnitKeywords, number>
      >;
      const actions = Object.fromEntries(ACTION_TEMPLATE_KEYS.map((name) => [name, 1]));
      gs.player.craftingKnowledge = {
        ...gs.player.craftingKnowledge,
        keywords: { ...keywords, ...gs.player.craftingKnowledge.keywords },
        actions: { ...actions, ...gs.player.craftingKnowledge.actions },
      };
      return {
        ok: true,
        message: `Learnt all ${KEYWORD_KEYS.length} keywords and ${ACTION_TEMPLATE_KEYS.length} actions`,
      };
    }

    case 'dump': {
      // /dump — quicksave + battle state JSON on clipboard
      saveStateToLocalStorage('quicksave');
      const json = JSON.stringify(getCurrentBattleState());
      try {
        await navigator.clipboard.writeText(json);
      } catch {
        return {
          ok: false,
          message: 'Quicksaved, but clipboard failed (try again from a user gesture or HTTPS)',
        };
      }
      const kb = (json.length / 1024).toFixed(1);
      return {
        ok: true,
        message: `Quicksaved; copied battle state (${kb} KB) to clipboard`,
      };
    }

    case 'battle': {
      // /battle — Base Green (player) vs Base Red (administrator)
      const foe = gs.characters.administrator;
      if (!foe) {
        return { ok: false, message: 'Foe administrator not found' };
      }
      redeemBaseDeck(BASE_DECK_GREEN, gs.player);
      redeemBaseDeck(BASE_DECK_RED, foe);
      const playerDeck = gs.player.decks.at(-1)!;
      const foeDeck = foe.decks.at(-1)!;
      bs.units = [];
      bs.playerIdWon = null;
      await initOngoingBattle(foe, playerDeck, foeDeck);
      return { ok: true, message: 'Started battle: Base Green vs Base Red' };
    }

    case 'win-league': {
      // /win-league [character-key]
      const winnerKey = parts[1] || 'player';
      newLeagueSeason(winnerKey);
      return { ok: true, message: `Started new league season; winner: ${winnerKey}` };
    }

    case 'artifact': {
      // /artifact <patternKey> — grant pattern + finished tool/trinket (no costs)
      const patternKey = parts[1];
      if (!patternKey) {
        return { ok: false, message: 'Usage: /artifact <patternKey>' };
      }
      const patternMessage = acquireArtifactPattern({ patternKey });
      if (!patternMessage.includes('acquire') && !patternMessage.includes('already know')) {
        return { ok: false, message: patternMessage };
      }
      if (!completeCraftedArtifact(patternKey, { free: true })) {
        return { ok: false, message: `Failed to craft artifact: ${patternKey}` };
      }
      const name = getLoadedArtifact(patternKey)?.name ?? patternKey;
      return { ok: true, message: `Granted pattern and crafted ${name}` };
    }

    case 'artifact-test': {
      // /artifact-test — grant every pattern and open Craft Artifact
      const all = getLoadedArtifacts();
      if (all.length === 0) {
        return { ok: false, message: 'No artifact patterns loaded' };
      }
      let added = 0;
      for (const artifact of all) {
        const message = acquireArtifactPattern({ patternKey: artifact.patternKey });
        if (message.includes('acquire')) added += 1;
      }
      openCraftArtifactAction();
      return {
        ok: true,
        message: `Granted ${added} new pattern${added === 1 ? '' : 's'} (${all.length} total); opened Craft Artifact`,
      };
    }

    default:
      return { ok: false, message: `Unknown command: ${cmd}` };
  }
}
