---
name: create-sim-event
description: Creates or edits sim events in src/data/sim/events.json from a natural-language description, elaborating a short synopsis into event prose and mapping conditions and rewards onto triggers, option templates, and effect templates. Use when the user asks to add, write, or change a game event, a character arc beat (e.g. "add an event for molly where..."), or the triggers/options of an existing event.
---

# Create a sim event

Events are `EventTemplate` entries in `src/data/sim/events.json`. Each one declares *when* it fires
(triggers), *what the player reads* (text), and *what happens* (event effects and player options).
The type lives in `src/lib/_model/model-sim.ts`; the runtime that consumes it is
`src/lib/sim/events.ts`.

## Request template

Free-form descriptions are fine. When the user asks for a template, or when a request is ambiguous,
use this shape:

```
Event for <npc key | main story>:
Trigger: <relation level, day/period, place, activity, prior events, who is present>
Synopsis: <one or two sentences to elaborate into the event text>
Options:
  - <label>: <reward or consequence>
  - <label>: <reward or consequence>
Always: <effects applied on trigger, before any choice> (optional)
```

Anything omitted follows the defaults below. Never invent a reward, condition, or NPC that the
request did not imply.

## Workflow

1. Read `src/data/sim/events.json` to see existing keys, arc grouping, and house style.
2. Pick the key: `<npcKey>-<n>` for a character arc event, `event-<n>` for main story, using the
   next free number in that series. Keys are permanent identifiers, not prose.
3. Write `text` (see *Writing the text*).
4. Map every condition in the request to a trigger, and every outcome to an effect template.
   Verify character, place, and deck keys against the source files listed below.
5. Insert the event object after the last event of the same `characterArc`, or append it at the end
   of the array for a main-story event.
6. Format and validate:
   ```
   npx prettier --write src/data/sim/events.json
   node .cursor/skills/create-sim-event/scripts/validate-events.mjs
   ```
   Fix every reported problem and re-run until it prints `OK`.
7. Report the new key, the trigger conditions in plain words, and each option with its effect. Tell
   the user to reload the running page: the dev server serves this file through `/api/events` at
   init and Vite intentionally skips HMR for it.

If a requested outcome has no matching effect template, or a condition has no matching trigger type,
stop and say which template would have to be added (`SceneEffectTemplates` in
`src/lib/sim/effects/_templates.ts`, plus an `EventEffectType` and an effect function). Do not
invent template names: unknown names crash at runtime when the event fires.

## Schema

```jsonc
{
  "key": "molly-4",              // unique, permanent
  "text": "One paragraph...",    // what the player reads
  "triggers": [ /* ALL must match */ ],
  "optionTemplates": [ /* player choices; [] means the event is pure narration */ ],
  "triggersOnce": true,          // set true unless the event is meant to repeat
  "effectsTemplates": [ /* optional: applied on trigger, before options */ ],
  "characterArc": "molly"        // npc key, only for character arc events
}
```

Property order in the file follows the existing entries: `key`, `text`, `triggers`,
`effectsTemplates`, `optionTemplates`, `triggersOnce`, `characterArc`.

## Triggers

Every trigger in the array must match at the same time (logical AND). The engine picks the first
event in file order whose triggers all match.

| `triggerType` | `parameters` | Notes |
|---|---|---|
| `relation_parameter` | `{ characterKey, relationParameter, value }` | `relationParameter` is `friendship`, `respect`, `love` or `rivalry`. Positive `value` means "at least"; negative means "at most". |
| `character_present` | `{ characterKey }` | The NPC is in the player's current place. |
| `day` | `{ day: 3 }` | Absolute day number; day 1 is a Monday. |
| `period` | `{ period: "morning" }` | `morning`, `afternoon`, `evening`. |
| `place` | `{ placeKey }` | The player's current place. |
| `activity_type` | `{ activityType }` | `class`, `work`, `social`, `date`, `training`; matches the currently scheduled activity. |
| `previous_events` | `{ "molly-1": true }` | Map of event keys that must have happened first; add one entry per prerequisite. |

Two consequences of how the engine handles these:

- A `relation_parameter` trigger **consumes** the relation value: when the event fires, that
  relation resets to 0. So an arc that gates `molly-2` on friendship 1 after `molly-1` already
  spent friendship 1 needs the player to earn it again. Combine with `previous_events` for ordering.
- A "character offers you something" event needs `character_present` in addition to the relation
  trigger, otherwise it can fire while the NPC is elsewhere. Existing arc events always pair them.

## Effects

Effect templates, from `SceneEffectTemplates`:

| `effectTemplate` | `args` |
|---|---|
| `addResource` | `{ resourceType: "magic_dust" \| "mithril" \| "moxes", amount: 10 }` |
| `getDeck` | `{ deckKey: "base_red" \| "base_black" \| "base_green" }` |
| `scheduleActivity` | `{ activity: { type, participants, placeKey, classType? }, schedule: { date?: { day, period }, recurrence?: { maxCount, daysOfWeek, period } } }` |
| `getJob` | `{ job: { jobType: "mentoring" \| "coaching", name, description, payPerActivity, employerKey, placeKey, schedule } }` |

For `scheduleActivity`: `schedule.date.day` is an **offset in days from now** (`0` = today), not an
absolute day. `participants` are character keys and include `"player"` when the player takes part.
`daysOfWeek` uses 1 for Monday through 7 for Sunday. Never put `day`/`period` inside `activity`.

`getJob` hires the player: it adds the job and schedules the `work` activities from `job.schedule`,
which takes the same shape and day-offset rules as `scheduleActivity`'s. Give a recurring job a
`recurrence`, or it turns into a single shift. `employerKey` is an NPC key (never `"player"`) and
`payPerActivity` is the gold earned per shift.

`effectsTemplates` on the event fire as soon as it triggers; `effectsTemplates` on an option fire
only if the player picks that option.

Action templates (`optionTemplates[].actionTemplate`) start an interactive action instead of
applying an effect. Only `enrollmentTransaction` and `enrollmentPayment` exist, both from
`SceneActionTemplates` in `src/lib/sim/actions/_templates.ts`, and both take `args: {}`.

## Keys to verify

| Kind | Source |
|---|---|
| Character keys, display names, gender | `src/data/npcs.ts` (plus `"player"`) |
| Place keys | `PLACES` in `src/data/sim/places.ts` |
| Deck keys | `getDeck` in `src/lib/sim/effects/decks.ts` |
| Resource, period, activity, class values | `src/lib/_model/enums-sim.ts` |

The validator enumerates the valid values in its error messages, so a run also doubles as a
reference when unsure.

## Writing the text

Elaborate the synopsis into **one paragraph, two to four sentences**, matching the existing entries:

- Second person present tense, addressing the player: the NPC approaches *you*.
- Use the NPC's first name from `src/data/npcs.ts`, and pronouns consistent with their gender.
- Describe the offer or situation qualitatively; keep amounts, resource names and mechanics out of
  the prose. The option labels and effects carry the numbers.
- Reference what the trigger implies (a warm friendship, a rivalry, a class in progress) so the
  event reads as a consequence of the player's history rather than a random encounter.
- Plain text only: no markdown, no line breaks. Escape quotes for spoken lines.

Option labels are short imperative phrases of one to three words: `Accept`, `Decline`, `Pay`,
`Get a Mox`, `Get some Dust`. An option with no effects and no action is a valid way to decline.

## Example

Request: *"add event for molly: if friendship is 1, molly offers a choice between 2 gifts: 99 moxes,
or 1 magic dust."*

```json
{
  "key": "molly-1",
  "text": "Molly approaches you and tells you she appreciated the way you made her feel welcome last time. She offers you a token of gratitude, pick your favorite.",
  "triggers": [
    {
      "triggerType": "relation_parameter",
      "parameters": { "characterKey": "molly", "relationParameter": "friendship", "value": 1 }
    },
    { "triggerType": "character_present", "parameters": { "characterKey": "molly" } }
  ],
  "optionTemplates": [
    {
      "text": "Get a Mox",
      "effectsTemplates": [
        { "effectTemplate": "addResource", "args": { "resourceType": "moxes", "amount": 99 } }
      ]
    },
    {
      "text": "Get some Dust",
      "effectsTemplates": [
        { "effectTemplate": "addResource", "args": { "resourceType": "magic_dust", "amount": 1 } }
      ]
    }
  ],
  "triggersOnce": true,
  "characterArc": "molly"
}
```

Note what the request did not spell out and the defaults filled in: `character_present`,
`triggersOnce`, `characterArc`, the key, and a paragraph of prose that justifies the gift through
Molly's friendship without naming the rewards.

## Editing an existing event

Same workflow, but keep `key` unchanged so `previous_events` references elsewhere in the file keep
working. If the user does want a rename, update every `previous_events` map that mentions the old
key; the validator reports dangling references.
