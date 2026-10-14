---
name: create-sim-event
description: >-
  Compiles authored sim event markdown under src/data/sim/events/ into
  EventTemplate JSON in src/data/sim/events.json (or a gitignored mod under
  mods/<id>/events.json when asked). Maps front matter, triggers, effects, and
  options onto the schema without rewriting prose. Use when the user asks to
  create, compile, sync, or update a game event from a markdown source, or points
  at a file under src/data/sim/events/.
---

# Create a sim event (markdown → JSON)

**Source of truth for prose and intent:** markdown under `src/data/sim/events/`.
**Runtime catalog:** `EventTemplate` entries in `src/data/sim/events.json`, plus any
local mods under `mods/<mod-id>/` (gitignored). The runtime and event builder merge
`events.json` first, then each mod's `events.json` in folder-name order.

Your job is **structure only**: turn the markdown into valid JSON. **Do not rewrite,
shorten, polish, or paraphrase** event text or option narration — copy them
verbatim (paragraph breaks → `\n\n` in JSON strings).

Type: `src/lib/_model/model-sim.ts`. Consumer: `src/lib/sim/events.ts`.

A mod folder looks like:

```
mods/<mod-id>/
  events.json
  images/activities/
  images/events/
```

`<mod-id>` is letters, digits, `_`, and `-`. The dev server scans `mods/` at startup.

## Which JSON file to write

- **Default:** append or edit in `src/data/sim/events.json`.
- **Only when the user asks** (e.g. "put it in a mod", "experimental"):
  write to `mods/<mod-id>/events.json`. If they name a mod, use that id; otherwise
  `mods/more`. Create `[]` / the folder if missing.
- Keys are shared across the main file and every mod — never reuse a key.
- When updating an existing event, change the JSON file that already contains that
  `key`. Prefer matching the markdown path (`events/<npc>/…` → that NPC's
  `characterArc` group in the target file).

## Markdown source layout

Files live at `src/data/sim/events/<npc-or-arc>/<slug>.md` (or a flat path the user
names). Canonical shape:

```markdown
# Event: <Title>

**NPC:** <npc key>.          # omit or use `main` / none for main-story
**Event ID:** `<key>`        # permanent JSON key; required
**Trigger:** <plain-language conditions>
**Image:** <filename.jpg and/or small|medium|large>.   # optional
**Emotion:** <Emotion enum value>.                     # optional

## Text

<verbatim event body; blank lines = paragraph breaks>

## Effects

- <always-on outcomes when the event fires, before choices>
  - **<trait title>:** <description>     # for known traits

## Options

### Option A: <option label>

**Text:**

<option narration, verbatim>

**Outcomes:**

- <effects for this choice, or "No additional game-state effects.">

### Option B: <option label>
…
```

Optional sections:

- `## Option triggers` / per-option `**Only if:**` — conditions that gate that choice
  only (same trigger vocabulary as event `**Trigger:**`).
- Attribute checks: `**Check:** charisma medium` plus `**On success:**` /
  `**On failure:**` instead of flat outcomes (maps to `attributeCheck`).
- Empty `## Options` (or omit options) → `optionTemplates: []` (narration-only).

Folder name and `**NPC:**` should agree; `characterArc` is the NPC key for arc
events. Main-story events omit `characterArc`.

## Workflow

1. Read the markdown file the user named (and sibling docs only if keys/names are
   unclear — e.g. `src/data/npcs.ts`, `src/doc/npc/<npc>.md`).
2. Read `src/data/sim/events.json` and every `mods/*/events.json` for existing keys
   and insertion point. Treat them as one key space.
3. Build the `EventTemplate`:
   - `key` ← `**Event ID:**` (keep exactly; do not rename to “fit” house style).
   - `title` ← `# Event: …` heading text (strip the `Event:` prefix).
   - `text` ← `## Text` body, verbatim, paragraphs joined with `\n\n`.
   - `emotion` / `image` / `imageSize` ← front matter when present.
   - `characterArc` ← `**NPC:**` when it is an NPC key.
   - `triggers` ← map `**Trigger:**` (see Triggers).
   - `effects` ← map `## Effects` (see Effects).
   - `optionTemplates` ← each `### Option …`:
     - `text` ← the option **label** (heading after `Option A:`).
     - option body under `**Text:**` → a `narrate` effect with that prose
       verbatim (unless the markdown says the choice has no narration).
     - `**Outcomes:**` → further effects (skip “no additional…”).
     - Optional option-only triggers → `triggers` on that option.
4. If a key already exists, **replace** that object in place; otherwise insert after
   the last event of the same `characterArc` (or append for main story) in the
   **target** JSON file.
5. Format and validate:
   ```
   npx prettier --write src/data/sim/events.json
   # or: npx prettier --write mods/<mod-id>/events.json
   node .cursor/skills/create-sim-event/scripts/validate-events.mjs
   ```
   Fix until the script prints `OK`.
6. Report: key, target file, triggers in plain words, each option + effects. Tell
   the user to reload: `/api/events` at init; Vite skips HMR for `events.json` and
   `mods/`.

**Never invent** NPCs, rewards, or conditions the markdown did not state. If a
stated outcome has no `EventEffectType`, or a condition has no trigger type, stop
and name what `create-sim-effect` (or a new trigger) would need — do not invent
type strings (unknown types crash when the event fires).

## Prose rules (non-negotiable)

- Copy `## Text` and option `**Text:**` **exactly** (wording, punctuation, quotes).
- Preserve paragraph breaks as `\n\n`; trim only a single trailing newline on the
  whole string if needed for tidy JSON.
- Do not collapse multi-paragraph beats into one paragraph.
- Do not move option narration into the event `text` or the reverse.
- Escape JSON only as required (`"`, `\`, newlines as `\n`).

## Schema

```jsonc
{
  "key": "emma_first_encounter",
  "title": "A Rather Unfortunate First Impression",
  "text": "Paragraph one…\n\nParagraph two…",
  "triggers": [ /* ALL must match */ ],
  "effects": [ /* optional; on fire, before options */ ],
  "optionTemplates": [
    /* [] = narration only.
       Optional per-option `triggers`: ALL must match or the choice is hidden. */
  ],
  "characterArc": "emma",
  "emotion": "neutral",
  "image": "emma_first_encounter.jpg",
  "imageSize": "large"
}
```

Every event fires at most once: firing stamps `gs.storyTags[event.key]`. Empty
`triggers` means follow-up / debug only (`follow_up_event` or `/e`) — never
auto-fires. Property order: `key`, `title`, `text`, `triggers`, `effects`,
`optionTemplates`, `characterArc`, `emotion`, `image`, `imageSize`. Options:
`text`, optional `triggers`, then `effects` or `attributeCheck`, then optional
`actionTemplate`.

## Images

From `**Image:**`:

- A bare size (`small` / `medium` / `large`) → set `imageSize` only.
- A `.jpg` filename → set `image` (never author `.png` in event JSON).
- Both → set both. Asset path: `public/assets/images/events/{image}` (or the mod’s
  `images/events/`).

## Triggers

Every entry in `triggers` must match (AND). The engine picks the first event in
file order whose triggers all match.

| `triggerType`        | `parameters`                                                       | Notes                                                                                                                                                                                         |
| -------------------- | ------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `socialize`          | `{ characterKey, socializeType }`                                  | `befriend`, `taunt`, `impress`, `flirt`.                                                                                                                                                      |
| `relation_parameter` | `{ characterKey, relationParameter, value }`                       | Cumulative `relationProgress`. Positive `value` = at least; negative = at most.                                                                                                               |
| `character_present`  | `{ characterKey }`                                                 | NPC in the player's current place.                                                                                                                                                            |
| `day`                | `{ day?: 3, minDay?: 4 }`                                          | Exact day and/or `day >= minDay`. Day 1 = Monday.                                                                                                                                             |
| `period`             | `{ period: "morning" }` or `{ periods: ["morning", "afternoon"] }` | `morning`, `afternoon`, `evening`.                                                                                                                                                            |
| `day_of_week`        | `{ daysOfWeek: [6, 7] }`                                           | 1 = Monday … 7 = Sunday.                                                                                                                                                                      |
| `place`              | `{ placeKey }`                                                     | Player's current place.                                                                                                                                                                       |
| `activity_type`      | `{ activityType }`                                                 | Matches the current scheduled activity.                                                                                                                                                       |
| `activity_history`   | `{ characterKey, activityType, value }`                            | Shared that activity at least `value` times.                                                                                                                                                  |
| `matches_won`        | `{ characterKey, count }`                                          | Wins vs that NPC ≥ `count`.                                                                                                                                                                   |
| `matches_lost`       | `{ characterKey, count }`                                          | Losses vs that NPC ≥ `count`.                                                                                                                                                                 |
| `leagues_won`        | `{ characterKey, count }`                                          | Appearances in `league.pastWinners` ≥ `count`; `characterKey` may be `"player"`.                                                                                                              |
| `story_tag`          | `{ tag: "molly-f1", value: 1 }`                                    | `gs.storyTags[tag]` ≥ `value`. `value: -1` = tag absent. Event keys auto-stamp on fire.                                                                                                       |
| `relation_tag`       | `{ characterKey, relationTag }`                                    | NPC has that `RelationTag` on `relationTags`. Optional `value: -1` = tag absent.                                                                                                              |
| `scheduled_activity` | `{}`                                                               | Current activity `eventId` equals this event's `key`.                                                                                                                                         |

### Mapping plain-language `**Trigger:**`

| Markdown phrasing (examples)                         | JSON                                                                 |
| ---------------------------------------------------- | -------------------------------------------------------------------- |
| First time / when \<NPC\> is present                 | `character_present` (once-only is automatic via story tag on fire)   |
| When the player befriends / flirts / … \<NPC\>       | `socialize` + usually `character_present`                            |
| After event \<key\> / once \<key\> happened          | `story_tag` `{ tag: "<key>", value: 1 }`                             |
| Friendship / respect / … at least N                  | `relation_parameter` with positive `value`                           |
| At the library / academy-hall / …                    | `place`                                                              |
| During class / work / …                              | `activity_type`                                                      |
| Morning / afternoon / evening                        | `period`                                                             |
| Day N / on or after day N                            | `day` with `day` and/or `minDay`                                     |
| Weekend                                              | `day_of_week` `[6, 7]`                                               |
| Follow-up only / queued by another option            | `triggers: []`                                                       |
| Has / lacks relation tag (e.g. EmmaSmitten)          | `relation_tag` `{ characterKey, relationTag }` (+ optional `value: -1`) |

Prefer `socialize` for befriend/flirt/impress/taunt beats — socialize does **not**
change `relationProgress`. Prefer `relation_parameter` for lasting thresholds.
Scene-entry offers (no socialize) still need `character_present` so they cannot
fire while the NPC is elsewhere.

## Option triggers

Same types and AND logic as event triggers. Omit or leave empty → always offered.
If every option is gated and none match, the event plays with no choice — keep at
least one ungated option when the player must always respond.

## Effects

`EventEffect` objects (`type` + `parameters`). Types live in `EventEffectType`
(`src/lib/_model/enums-sim.ts`):

| `type`                | `parameters`                                                                                                                                                       |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `add_resource`        | `{ resourceType: "magic_dust" \| "mithril" \| "moxes" \| …, amount }`                                                                                              |
| `add_gold`            | `{ amount }`                                                                                                                                                       |
| `get_deck`            | `{ deckKey }`                                                                                                                                                      |
| `schedule_activity`   | `{ activity: { type, participants, placeKey, classType?, eventId? }, schedule: { date?: { day, period }, nextFree?: true, recurrence?: { … } } }`                 |
| `get_job`             | `{ job: { jobType, name, description, payPerActivity, employerKey, placeKey, schedule } }`                                                                         |
| `follow_up_event`     | `{ eventKey }`                                                                                                                                                     |
| `offer_card_gifts`    | `{ count, poolKeys }`                                                                                                                                              |
| `teach_color`         | `{ color?, characterKey? }`                                                                                                                                        |
| `teach_ability`       | `{ ability?, characterKey? }`                                                                                                                                      |
| `narrate`             | `{ text }` — use for option `**Text:**` bodies                                                                                                                     |
| `level_attribute`     | `{ attribute, amount?, characterKey? }`                                                                                                                            |
| `change_relation`     | `{ characterKey, relationParameter, amount }`                                                                                                                      |
| `update_relation_arc` | `{ characterKey, text, image? }`                                                                                                                                   |
| `add_relation_tag`    | `{ characterKey, relationTag }` — value must be the **enum string** from `RelationTag` in `enums-sim.ts` (markdown may use the member name; resolve it)          |
| `add_story_tag`       | `{ tag, amount? }`                                                                                                                                                 |
| `add_known_trait`     | `{ characterKey, title, description }` — map “Add to X's known traits: **Title:** desc”                                                                            |
| `move`                | `{ placeKey, characterKeys }`                                                                                                                                      |
| `use_focus`           | `{ amount }`                                                                                                                                                       |

Event-level `effects` run on fire; option `effects` run only if chosen.

An option uses **either** `effects` **or** `attributeCheck` (not both):

```json
{
  "text": "Bluff",
  "attributeCheck": {
    "attribute": "charisma",
    "difficulty": "medium",
    "successEffects": [],
    "failureEffects": [{ "type": "narrate", "parameters": { "text": "…" } }]
  }
}
```

Difficulties: `trivial` / `veryeasy` / `easy` / `medium` / `hard` / `extreme` /
`impossible`. Action templates on options: only `enrollmentTransaction` and
`enrollmentPayment` (`args: {}`).

`schedule_activity`: `schedule.date.day` is an **offset from today** (`0` = today).
`follow_up_event` queues by key and bypasses that event's triggers — target should
use `triggers: []`.

## Keys to verify

| Kind                                       | Source                                      |
| ------------------------------------------ | ------------------------------------------- |
| Character keys, display names, gender      | `src/data/npcs.ts` (plus `"player"`)        |
| Place keys                                 | `PLACES` in `src/data/sim/places.ts`        |
| Deck keys                                  | `getDeck` in `src/lib/sim/effects/decks.ts` |
| Resource, period, activity, class, emotion, relation tags | `src/lib/_model/enums-sim.ts`   |

The validator lists allowed values in errors — re-run it when unsure.

## Emotion

Optional. Use the markdown value if present; it must be an `Emotion` enum string
from `enums-sim.ts`. Omit when absent or unclear. Do not invent values.

## Editing

Same compile workflow. Keep `key` unchanged so `story_tag` references stay valid.
If the user renames a key in markdown, update every `story_tag` / `follow_up_event`
/ `eventId` that referenced the old key.

When re-compiling, refresh JSON fields from the markdown; do not leave stale prose
in JSON after the markdown changed.

## Example

Source: `src/data/sim/events/emma/first_impression.md` (abbreviated mapping):

- `# Event: A Rather Unfortunate First Impression` → `title`
- `**Event ID:** emma_first_encounter` → `key`
- `**NPC:** emma` → `characterArc: "emma"`
- `**Trigger:** First time Emma is present…` →
  `[{ "triggerType": "character_present", "parameters": { "characterKey": "emma" } }]`
- `**Image:** large` → `imageSize: "large"` (no filename → omit `image`)
- `**Emotion:** neutral` → `emotion: "neutral"`
- `## Text` → `text` with `\n\n` between paragraphs
- Known trait under `## Effects` → event `effects`: `add_known_trait`
- Option labels → `optionTemplates[].text`; option bodies → `narrate`; 
  `EmmaSmitten` → `add_relation_tag` with the `RelationTag.EmmaSmitten` string value
