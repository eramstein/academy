---
name: create-sim-event
description: Creates or edits sim events in src/data/sim/events.json (or a gitignored mod under mods/<id>/events.json when asked) from a natural-language description, elaborating a short synopsis into event prose and mapping conditions and rewards onto triggers, option templates, and effects. Use when the user asks to add, write, or change a game event, a character arc beat (e.g. "add an event for molly where..."), or the triggers/options of an existing event.
---

# Create a sim event

Events are `EventTemplate` entries in `src/data/sim/events.json`, plus any local mods under
`mods/<mod-id>/` (gitignored). The runtime and event builder merge `events.json` first, then each
mod's `events.json` in folder-name order. Each event declares _when_ it fires (triggers), _what the
player reads_ (text), and _what happens_ (event effects and player options). The type lives in
`src/lib/_model/model-sim.ts`; the runtime that consumes it is `src/lib/sim/events.ts`.

A mod folder looks like this:

```
mods/<mod-id>/
  events.json
  images/activities/    # activity art and {character}-p-N.jpg
  images/events/        # event illustrations named by the event's image field
```

`<mod-id>` is letters, digits, `_`, and `-`. The dev server scans `mods/` at startup.

## Which file to write

- **Default:** append or edit in `src/data/sim/events.json`.
- **Only when the user asks** (e.g. "put it in a mod", "experimental", "don't commit this"):
  write to `mods/<mod-id>/events.json`. If they name a mod, use that id. Otherwise use `mods/more`.
  Create the file as `[]` if it is missing, and create the folder if needed.
- Put that mod's pictures in `mods/<mod-id>/images/events/` or `images/activities/`, not under `public/`.
- Keys are shared across the main file and every mod — never reuse a key that already exists.
- When editing an existing event, change the file that already contains that `key`. The event editor
  does the same: a mod event is written back to that mod's `events.json`.

## Request template

Free-form descriptions are fine. When the user asks for a template, or when a request is ambiguous,
use this shape:

```
Event for <npc key | main story>:
Trigger: <socialize type, relation level, day/period, place, activity, activity history count, prior events, who is present>
Synopsis: <one or two sentences to elaborate into the event text>
Emotion: <Emotion enum value> (optional; infer from synopsis when clear)
Options:
  - <label>: <reward or consequence>
  - <label>: <reward or consequence>
Always: <effects applied on trigger, before any choice> (optional)
```

Anything omitted follows the defaults below. Never invent a reward, condition, or NPC that the
request did not imply.

## Workflow

1. Read `src/data/sim/events.json` and every `mods/*/events.json` to see existing keys, arc grouping,
   and house style. Treat them as one key space.
2. Pick the key: `<npcKey>-<n>` for a character arc event, `event-<n>` for main story, using the
   next free number in that series across both files. Keys are permanent identifiers, not prose.
3. Write `text` (see _Writing the text_). Set `emotion` when appropriate (see _Emotion_).
4. Map every condition in the request to a trigger, and every outcome to an `EventEffect`.
   Verify character, place, and deck keys against the source files listed below.
5. Insert the event object after the last event of the same `characterArc` in the **target file**,
   or append it at the end of that file's array for a main-story event. Target file is
   `events.json` unless the user asked for a mod.
6. Format and validate (prettier only the file you changed):
   ```
   npx prettier --write src/data/sim/events.json
   # or, when writing a mod:
   # npx prettier --write mods/<mod-id>/events.json
   node .cursor/skills/create-sim-event/scripts/validate-events.mjs
   ```
   Fix every reported problem and re-run until it prints `OK`.
7. Report the new key, which file it was written to, the trigger conditions in plain words, and each
   option with its effect. Tell the user to reload the running page: the dev server serves the
   merged catalog through `/api/events` at init and Vite intentionally skips HMR for `events.json` and `mods/`.

If a requested outcome has no matching effect type, or a condition has no matching trigger type,
stop and say which `EventEffectType` and effect function would have to be added (see the
`create-sim-effect` skill). Do not invent type names: unknown types crash at runtime when the
event fires.

## Schema

```jsonc
{
  "key": "molly-4", // unique, permanent
  "text": "One paragraph...", // what the player reads
  "triggers": [
    /* ALL must match */
  ],
  "optionTemplates": [
    /* player choices; [] means the event is pure narration */
  ],
  "effects": [
    /* optional: applied on trigger, before options */
  ],
  "characterArc": "molly", // npc key, only for character arc events
  "emotion": "happy", // optional; how the speaking NPC presents in this beat
  "image": "molly-4.jpg", // optional; filename under public/assets/images/events/
  "imageSize": "large", // optional; "small" | "medium" | "large"
}
```

Every event triggers at most once (consumed after it fires). Property order in the file
follows the existing entries: `key`, `text`, `triggers`, `effects`, `optionTemplates`,
`characterArc`, `emotion`, `image`, `imageSize`.

## Images

When setting `image` on an event:

- Use a **`.jpg`** filename only (e.g. `emma-hospital.jpg`). Never author `.png` in
  event JSON.
- Place the file at `public/assets/images/events/{image}`.
- If the source asset is a PNG, convert it first (e.g. `node src/tools/convert-images.js`,
  which targets the events folder) and reference the resulting `.jpg`.
- For full-bleed scene art, set `imageSize` to `"large"` when the user asks for a large
  image; otherwise omit or use the size they named.

## Triggers

Every trigger in the array must match at the same time (logical AND). The engine picks the first
event in file order whose triggers all match.

| `triggerType`        | `parameters`                                                       | Notes                                                                                                                                                    |
| -------------------- | ------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `socialize`          | `{ characterKey, socializeType }`                                  | Fires only when the player socializes with that NPC using that type (`befriend`, `taunt`, `impress`, `flirt`).                                           |
| `relation_parameter` | `{ characterKey, relationParameter, value }`                       | Cumulative `relationProgress`. `relationParameter` is `friendship`, `respect`, `love` or `rivalry`. Positive `value` = "at least"; negative = "at most". |
| `character_present`  | `{ characterKey }`                                                 | The NPC is in the player's current place.                                                                                                                |
| `day`                | `{ day: 3 }`                                                       | Absolute day number; day 1 is a Monday.                                                                                                                  |
| `period`             | `{ period: "morning" }` or `{ periods: ["morning", "afternoon"] }` | Single period, or any of several. `morning`, `afternoon`, `evening`.                                                                                     |
| `day_of_week`        | `{ daysOfWeek: [6, 7] }`                                           | 1 = Monday … 7 = Sunday; matches if today is any listed weekday.                                                                                         |
| `place`              | `{ placeKey }`                                                     | The player's current place.                                                                                                                              |
| `activity_type`      | `{ activityType }`                                                 | `class`, `work`, `social`, `date`, `training`, `study`; matches the currently scheduled activity.                                                        |
| `activity_history`   | `{ characterKey, activityType, value }`                            | NPC has shared that `activityType` with the player at least `value` times (`Npc.activityHistory`).                                                       |
| `matches_won`        | `{ characterKey, count }`                                          | Player has won at least `count` matches against that NPC (`npc.matchesRecord.won`). Does not consume the count.                                          |
| `leagues_won`        | `{ characterKey, count }`                                          | Character appears at least `count` times in `league.pastWinners` (season titles). Does not consume the count. `characterKey` may be `"player"`.          |
| `scheduled_activity` | `{}`                                                               | Current scheduled activity's `eventId` equals this event's `key`. Set `eventId` on the activity when scheduling it.                                      |
| `previous_events`    | `{ "molly-1": true }`                                              | Map of event keys that must have happened first; add one entry per prerequisite.                                                                         |

Consequences of how the engine handles these:

- Prefer `socialize` for "when the player befriends / flirts / impresses / taunts this NPC"
  beats. The socialize action does **not** change `relationProgress`; it only checks for a
  matching event. If one matches, that event plays instead of the default socialize narration.
  Pair with `previous_events` (and optional `character_present`) to order arc steps.
- `relation_parameter` reads cumulative `relationProgress`, which only moves via the
  `change_relation` effect (not via socialize). It does **not** reset when an event fires. Use it
  for lasting thresholds (e.g. friendship ≥ 3), not for "just socialized" gates.
- `activity_history` does **not** consume the count; it stays on the NPC. Prefer it for "we've
  done this enough times" gates, and pair with `socialize` / `character_present` /
  `previous_events` as needed.
- `matches_won` reads cumulative league wins against that NPC (`matchesRecord.won`). It does
  **not** reset when an event fires. Pair with `character_present` / `previous_events` as needed.
- `leagues_won` counts how often `characterKey` appears in `league.pastWinners` (one entry per
  season title). It does **not** reset when an event fires. Pair with `character_present` /
  `previous_events` / ceremony `activity_type` as needed.
- `scheduled_activity` is for beats that fire when a previously scheduled activity becomes
  current. Author the activity with `eventId` set to this event's key (via `schedule_activity`),
  and put a bare `scheduled_activity` trigger on the target event.
- A scene-entry offer (no socialize) still needs `character_present` so it cannot fire while the
  NPC is elsewhere. Socialize-gated events already imply the player picked that NPC.

## Effects

Authored as `EventEffect` objects (`type` + `parameters`), matching `EventEffectType` in
`src/lib/_model/enums-sim.ts`:

| `type`                | `parameters`                                                                                                                                                       |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `add_resource`        | `{ resourceType: "magic_dust" \| "mithril" \| "moxes", amount: 10 }`                                                                                               |
| `add_gold`            | `{ amount: 10 }`                                                                                                                                                   |
| `get_deck`            | `{ deckKey: "base_red" \| "base_black" \| "base_green" }`                                                                                                          |
| `schedule_activity`   | `{ activity: { type, participants, placeKey, classType? }, schedule: { date?: { day, period }, nextFree?: true, recurrence?: { maxCount, daysOfWeek, period } } }` |
| `get_job`             | `{ job: { jobType: "mentoring" \| "coaching", name, description, payPerActivity, employerKey, placeKey, schedule } }`                                              |
| `unlock_event`        | `{ eventKey: "molly-2" }`                                                                                                                                          |
| `follow_up_event`     | `{ eventKey: "molly-2" }`                                                                                                                                          |
| `offer_card_gifts`    | `{ count: 2, poolKeys: ["molly", "base"] }`                                                                                                                        |
| `teach_color`         | `{ color?: "red" \| "blue" \| "green" \| "black", characterKey?: "molly" }`                                                                                        |
| `teach_ability`       | `{ ability?: "haste" \| "directDamage" \| …, characterKey?: "molly" }` (omit `ability` for random)                                                                 |
| `narrate`             | `{ text: "Molly looks away, a little hurt." }`                                                                                                                     |
| `level_attribute`     | `{ attribute: "dexterity" \| "intelligence" \| "vitality" \| "charisma" \| "aura", amount?: 1, characterKey?: "player" }`                                          |
| `change_relation`     | `{ characterKey, relationParameter: "friendship" \| "respect" \| "love" \| "rivalry", amount: 1 }`                                                                 |
| `update_relation_arc` | `{ characterKey, text: "You and Molly share a quiet laugh.", image?: "events/molly-f1.jpg" }`                                                                      |
| `add_relation_tag`    | `{ characterKey, relationTag: "teammate" \| "rival" \| "friend" \| "lover" \| "significant_other" }`                                                               |
| `move`                | `{ placeKey: "academy", characterKeys: ["player", "molly"] }`                                                                                                      |
| `use_focus`           | `{ amount: 1 }`                                                                                                                                                    |

`narrate` posts the given sentence to the scene. On character-arc events (`characterArc` set),
option (and attribute-check branch) `narrate` texts are mixed into the same `relationArc` beat as
the base event text (one box). Use it on options that need a reaction beat with no reward or schedule.

`level_attribute` adds `amount` (default 1) to that character's `attributes` field. Omit
`characterKey` or use `"player"` for the player; use an NPC key to level an NPC.

`change_relation` takes a signed `amount`; a negative value damages the relation. It updates
cumulative `relationProgress` (the only relation meter). Socialize actions do not change it; only
this effect (and similar authored effects) do.

`update_relation_arc` appends `{ text, image? }` to that NPC's `relationArc`. `image` is a path
under `images/` as `folder/file` (e.g. `events/molly-f1.jpg`). Mod art is `mod/<mod-id>/activities/emma-bed-2.jpg` or `mod/<mod-id>/events/emma-l1.jpg`.
Prefer `.jpg` over `.png`. The effect also narrates `text`.

`add_relation_tag` appends a `RelationTag` to that NPC's `relationTags` if it is not already
present. Use an NPC key (not `"player"`); only NPCs have relation tags.

`move` sets each listed character's `placeKey` immediately. Include `"player"` to relocate the
player; NPC keys move those NPCs. This does not schedule travel or advance time.

`use_focus` spends `amount` from the player's focus, clamped so focus cannot go below 0.

For `schedule_activity`: `schedule.date.day` is an **offset in days from now** (`0` = today), not an
absolute day. Omit `date.period` (without `nextFree`) to use the **current** period—useful for
immediate “come with me now” beats. Set `schedule.nextFree: true` to pick the soonest free slot for
`date.period` (defaults to evening) instead of a fixed offset. `participants` are character keys and
include `"player"` when the player takes part. `daysOfWeek` uses 1 for Monday through 7 for Sunday.
Never put `day`/`period` inside `activity`. To fire a specific event when the activity becomes
current, set `activity.eventId` to that event's `key` and give the target a `scheduled_activity`
trigger.

`get_job` hires the player: it adds the job and schedules the `work` activities from `job.schedule`,
which takes the same shape and day-offset rules as `schedule_activity`'s. Give a recurring job a
`recurrence`, or it turns into a single shift. `employerKey` is an NPC key (never `"player"`) and
`payPerActivity` is the gold earned per shift.

`unlock_event` clears `locked` on another event by key so it can start triggering. The target must
already exist in the merged catalog (`events.json` or any `mods/<mod-id>/events.json`).

`follow_up_event` immediately queues another event by key via `setEvent`, bypassing that event's
triggers. Prefer it on an option when the next beat should fire in the same scene. The target must
already exist in the merged catalog and not already be consumed.

`offer_card_gifts` samples `count` card templates whose `poolKeys` include every listed key
(`getCardTemplatesByPoolKeys`), then posts a `gift_card_choice` narration so the player can pick
one card into their collection. Prefer it on the event (not an option) so the offer appears with
the scene.

`teach_color` adds the color to the player's `craftingKnowledge.colors` at 1 if unknown, or
increments the existing level by 1. Provide `color`, or `characterKey` to pick from that NPC's known
colors (preferring ones the player does not know yet). With `characterKey`, if the player owns no
collection card of the taught color, they also receive the matching `base_*` deck via `get_deck`.

`teach_ability` does the same for a unit keyword (`craftingKnowledge.keywords`) or action template
(`craftingKnowledge.actions`). `ability` is optional; omit it (or leave it empty) to pick a random
keyword or action-template key. With `characterKey` and no `ability`, the random pool is restricted
to abilities that NPC already knows.

`effects` on the event fire as soon as it triggers; `effects` on an option fire only if the player
picks that option.

An option may use **either** direct `effects` **or** an `attributeCheck` (not both). With
`attributeCheck`, choosing the option rolls the player's attribute against a named difficulty
(`trivial` / `veryeasy` / `easy` / `medium` / `hard` / `extreme` / `impossible`), narrates the
check, then applies `successEffects` or `failureEffects`:

```json
{
  "text": "Bluff",
  "attributeCheck": {
    "attribute": "charisma",
    "difficulty": "medium",
    "successEffects": [
      {
        "type": "change_relation",
        "parameters": { "characterKey": "molly", "relationParameter": "friendship", "amount": 1 }
      }
    ],
    "failureEffects": [{ "type": "narrate", "parameters": { "text": "Molly sees through it." } }]
  }
}
```

`attribute` is one of `dexterity`, `intelligence`, `vitality`, `charisma`, `aura`. Either branch's
effects array may be omitted or empty.

Action templates (`optionTemplates[].actionTemplate`) start an interactive action in addition to
effects / the skill-check branch. Only `enrollmentTransaction` and `enrollmentPayment` exist, both
from `SceneActionTemplates` in `src/lib/sim/actions/_templates.ts`, and both take `args: {}`.

## Keys to verify

| Kind                                       | Source                                      |
| ------------------------------------------ | ------------------------------------------- |
| Character keys, display names, gender      | `src/data/npcs.ts` (plus `"player"`)        |
| Place keys                                 | `PLACES` in `src/data/sim/places.ts`        |
| Deck keys                                  | `getDeck` in `src/lib/sim/effects/decks.ts` |
| Resource, period, activity, class, emotion | `src/lib/_model/enums-sim.ts`               |

The validator enumerates the valid values in its error messages, so a run also doubles as a
reference when unsure.

## Emotion

`emotion` is optional on `EventTemplate`. It tags the speaking NPC's affect for this beat (portrait /
presentation), using `Emotion` from `src/lib/_model/enums-sim.ts`:

`neutral`, `happy`, `joyful`, `laughing`, `sad`, `angry`, `annoyed`, `surprised`, `provocative`,
`in_love`, `proud`, `embarrassed`.

When to set it:

- Use the value the user named, if they did.
- Otherwise, for character-arc events (`characterArc` set), infer from the synopsis and written
  text when the NPC's mood is clear (gratitude gift → `happy`, job offer with pride → `proud`,
  awkward confession → `embarrassed`, sharp rivalry → `annoyed` or `angry`).
- Prefer a specific value over `neutral` when the prose already signals a mood.

When to omit it:

- Mood is ambiguous, mixed, or not about an NPC's expression.
- Main-story events with no clear speaking NPC emotion.
- Do not invent a feeling the request and prose do not support.

Never invent enum values outside the list above.

## Writing the text

Elaborate the synopsis into **one paragraph, two to four sentences**, matching the existing entries:

- Second person present tense, addressing the player: the NPC approaches _you_.
- Use the NPC's first name from `src/data/npcs.ts`, and pronouns consistent with their gender.
- Describe the offer or situation qualitatively; keep amounts, resource names and mechanics out of
  the prose. The option labels and effects carry the numbers.
- Reference what the trigger implies (a warm friendship, a rivalry, a class in progress) so the
  event reads as a consequence of the player's history rather than a random encounter.
- Plain text only: no markdown, no line breaks. Escape quotes for spoken lines.

Option labels are short imperative phrases of one to three words: `Accept`, `Decline`, `Pay`,
`Get a Mox`, `Get some Dust`. An option with no effects and no action is a valid way to decline.

## Example

Request: _"add event for molly: when you befriend her, molly offers a choice between 2 gifts: 99
moxes, or 1 magic dust."_

```json
{
  "key": "molly-1",
  "text": "Molly approaches you and tells you she appreciated the way you made her feel welcome last time. She offers you a token of gratitude, pick your favorite.",
  "triggers": [
    {
      "triggerType": "socialize",
      "parameters": { "characterKey": "molly", "socializeType": "befriend" }
    },
    { "triggerType": "character_present", "parameters": { "characterKey": "molly" } }
  ],
  "optionTemplates": [
    {
      "text": "Get a Mox",
      "effects": [
        { "type": "add_resource", "parameters": { "resourceType": "moxes", "amount": 99 } }
      ]
    },
    {
      "text": "Get some Dust",
      "effects": [
        { "type": "add_resource", "parameters": { "resourceType": "magic_dust", "amount": 1 } }
      ]
    }
  ],
  "characterArc": "molly",
  "emotion": "happy"
}
```

Note what the request did not spell out and the defaults filled in: `character_present`,
`characterArc`, `emotion` (warm gratitude → `happy`), the key, and a paragraph of prose that
justifies the gift through Molly's friendship without naming the rewards. Map "befriend / flirt /
impress / taunt" wording to `socialize`, not to a `relation_parameter` threshold.

## Editing an existing event

Same workflow, but keep `key` unchanged so `previous_events` references elsewhere in the file keep
working. If the user does want a rename, update every `previous_events` map that mentions the old
key; the validator reports dangling references.
