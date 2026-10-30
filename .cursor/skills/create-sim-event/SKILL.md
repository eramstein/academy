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

**NPC:** <npc key>. # omit or use `main` / none for main-story
**Event ID:** `<key>` # permanent JSON key; required
**Trigger:** <plain-language conditions>
**Image:** <filename.jpg and/or small|medium|large>. # optional
**Emotion:** <Emotion enum value>. # optional
**Manual trigger:** <button label>. # optional; withhold auto-play

## Text

<verbatim event body; blank lines = paragraph breaks>
<optional {{ passageKey }} tokens; see Conditional passages>

## Conditional passages

<passageKey>

When: <condition>

<verbatim prose used when that condition matches>

Otherwise:

<verbatim fallback prose>

## Effects

- <always-on outcomes when the event fires, before choices>
  - **<trait title>:** <description> # for known traits

When: <optional condition; following bullets until the next When get these triggers>

- <conditional outcome for that When group>

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
- `## Conditional passages` — named snippets swapped into `{{ passageKey }}` tokens in
  `## Text` (see Passages). Omit the section when the event text is fully static.
- `**Next:** <node key>` on an option, and `## Node: <key>` sections — a later beat in
  the same event (see Multi-step events). Omit both when the event is a single beat.

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
   - `text` ← `## Text` body, verbatim, paragraphs joined with `\n\n`. Keep
     `{{ passageKey }}` tokens exactly as written.
   - `passages` ← `## Conditional passages` when present (see Passages). Omit when absent.
   - `emotion` / `image` / `imageSize` ← front matter when present. If
     `**Image:**` is only a size, still set `image` to `"<key>.jpg"`.
   - `characterArc` ← `**NPC:**` when it is an NPC key.
   - `triggers` ← map `**Trigger:**` (see Triggers).
   - `manualTrigger` ← `**Manual trigger:**` label when present (omit when absent).
   - `effects` ← map `## Effects` to `{ effect, triggers? }` couples (see Effects).
   - `optionTemplates` ← each `### Option …` that belongs to the root (before any `## Node:`):
     - `text` ← the option **label** (heading after `Option A:`).
     - option body under `**Text:**` → a `narrate` effect with that prose
       verbatim (unless the markdown says the choice has no narration).
     - `**Outcomes:**` → further effects (skip “no additional…”).
     - Optional option-only triggers → `triggers` on that option.
     - Optional `**Next:**` → `nextNode`. On a skill check, `**Next:**` under
       `**On success:**` / `**On failure:**` → `successNode` / `failureNode`.
   - `nodes` ← each `## Node:` section (see Multi-step events). Omit when there are none.
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

- Copy `## Text`, passage prose, and option `**Text:**` **exactly** (wording, punctuation, quotes).
- Keep `{{ passageKey }}` tokens in `text`. Do not expand them while compiling.
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
  "text": "Paragraph one…\n\n{{ intro }}\n\nParagraph two…",
  "passages": {
    "intro": {
      "variants": [
        {
          "triggers": [
            { "triggerType": "story_tag", "parameters": { "tag": "emma_met", "value": 1 } },
          ],
          "text": "\"Antonio. We meet again,\" she says.",
        },
      ],
      "fallback": "\"Emma Delamain,\" she introduces herself.",
    },
  },
  "triggers": [
    /* ALL must match */
  ],
  "effects": [
    /* optional; on fire, before options.
       Each entry is { effect, triggers? }. Omit triggers to always apply. */
  ],
  "optionTemplates": [
    /* [] = narration only.
       Optional per-option `triggers`: ALL must match or the choice is hidden. */
  ],
  "characterArc": "emma",
  "emotion": "neutral",
  "image": "emma_first_encounter.jpg",
  "imageSize": "large",
  // optional "manualTrigger": "Speak with Emma" — scene-action label; omit to auto-play
  // optional "nodes": { "tuition_talk": { "text": "…", "optionTemplates": [] } }
}
```

Every event fires at most once: showing the root beat stamps `gs.storyTags[event.key]`.
Later nodes in the same event do not stamp it again. Empty `triggers` means follow-up /
debug only (`follow_up_event` or `/e`) — never auto-fires. Property order: `key`, `title`,
`text`, optional `passages`, `triggers`, `effects`, `optionTemplates`, optional `nodes`,
`characterArc`, `emotion`, `image`, `imageSize`, then optional `manualTrigger`. Options:
`text`, optional `triggers`, then `effects` or `attributeCheck`, then optional
`actionTemplate`, then optional `nextNode`. Node object order: `text`, optional `passages`,
optional `triggers`, optional `effects`, `optionTemplates`, then optional `title`, `emotion`,
`image`, `imageSize`.

## Images

From `**Image:**`:

- A bare size (`small` / `medium` / `large`) → set `imageSize` **and**
  `image: "<event_key>.jpg"` (assume the asset exists; do not omit `image`).
- A `.jpg` filename → set `image` (never author `.png` in event JSON).
- Both → set both (filename wins over the default key name).
- Asset path: `public/assets/images/events/{image}` (or the mod’s
  `images/events/`).

## Triggers

Every entry in `triggers` must match (AND). The engine auto-plays the first event
in file order whose triggers all match and that has no `manualTrigger`. An event
with `manualTrigger` set to a button label is withheld: when its triggers match,
that label is a scene action, and choosing it plays the event. Empty or whitespace
`manualTrigger` is omitted (auto-play stays the default).

| `triggerType`        | `parameters`                                                       | Notes                                                                                   |
| -------------------- | ------------------------------------------------------------------ | --------------------------------------------------------------------------------------- |
| `relation_parameter` | `{ characterKey, relationParameter, value }`                       | Cumulative `relationProgress`. Positive `value` = at least; negative = at most.         |
| `character_present`  | `{ characterKey }`                                                 | NPC in the player's current place.                                                      |
| `day`                | `{ day?: 3, minDay?: 4 }`                                          | Exact day and/or `day >= minDay`. Day 1 = Monday.                                       |
| `period`             | `{ period: "morning" }` or `{ periods: ["morning", "afternoon"] }` | `morning`, `afternoon`, `evening`.                                                      |
| `day_of_week`        | `{ daysOfWeek: [6, 7] }`                                           | 1 = Monday … 7 = Sunday.                                                                |
| `place`              | `{ placeKey }`                                                     | Player's current place.                                                                 |
| `activity_type`      | `{ activityType }`                                                 | Matches the current scheduled activity.                                                 |
| `activity_history`   | `{ characterKey, activityType, value }`                            | Shared that activity at least `value` times.                                            |
| `matches_won`        | `{ characterKey, count }`                                          | Wins vs that NPC ≥ `count`.                                                             |
| `matches_lost`       | `{ characterKey, count }`                                          | Losses vs that NPC ≥ `count`.                                                           |
| `leagues_won`        | `{ characterKey, count }`                                          | Appearances in `league.pastWinners` ≥ `count`; `characterKey` may be `"player"`.        |
| `story_tag`          | `{ tag: "molly-f1", value: 1 }`                                    | `gs.storyTags[tag]` ≥ `value`. `value: -1` = tag absent. Event keys auto-stamp on fire. |
| `relation_tag`       | `{ characterKey, relationTag }`                                    | NPC has that `RelationTag` on `relationTags`. Optional `value: -1` = tag absent.        |
| `known_traits`       | `{ characterKey, count }`                                          | NPC `knownTraits.length` ≥ `count`.                                                     |
| `scheduled_activity` | `{}`                                                               | Current activity `eventId` equals this event's `key`.                                   |
| `last_match_won`     | `{}`                                                               | `gs.scene.lastMatchWon === true` after a finished battle.                               |
| `last_match_lost`    | `{}`                                                               | `gs.scene.lastMatchWon === false` after a finished battle.                              |
| `artifact_owned`     | `{ patternKey }`                                                   | Player owns that finished artifact in `artifacts.tools` or `artifacts.trinkets`.        |

### Mapping plain-language `**Trigger:**`

| Markdown phrasing (examples)                                       | JSON                                                                    |
| ------------------------------------------------------------------ | ----------------------------------------------------------------------- |
| First time / when \<NPC\> is present                               | `character_present` (once-only is automatic via story tag on fire)      |
| After event \<key\> / once \<key\> happened / \<tag\> has occurred | `story_tag` `{ tag: "<key>", value: 1 }`                                |
| \<tag\> has not occurred                                           | `story_tag` `{ tag: "<tag>", value: -1 }`                               |
| Friendship / respect / … at least N                                | `relation_parameter` with positive `value`                              |
| At the library / academy-hall / …                                  | `place`                                                                 |
| During class / work / …                                            | `activity_type`                                                         |
| Morning / afternoon / evening                                      | `period`                                                                |
| Day N / on or after day N                                          | `day` with `day` and/or `minDay`                                        |
| Weekend                                                            | `day_of_week` `[6, 7]`                                                  |
| Follow-up only / queued by another option                          | `triggers: []`                                                          |
| Has / lacks relation tag (e.g. EmmaSmitten)                        | `relation_tag` `{ characterKey, relationTag }` (+ optional `value: -1`) |
| Knows at least N traits about \<NPC\>                              | `known_traits` `{ characterKey, count }`                                |
| Last / previous match was won                                      | `last_match_won` `{}`                                                   |
| Last / previous match was lost                                     | `last_match_lost` `{}`                                                  |
| Owns / has crafted artifact \<patternKey\>                         | `artifact_owned` `{ patternKey }`                                       |

Prefer `relation_parameter` for lasting friendship / respect / love / rivalry
thresholds. Scene-entry offers still need `character_present` so they cannot fire
while the NPC is elsewhere.

## Passages

`text` stays the authored string. It may include `{{ passageKey }}` tokens (optional
spaces inside the braces). At display time the engine replaces each token with the
first passage variant whose triggers all match, or with `fallback` when none match.
That resolved string is what the player reads and what is stored on `relationArc`.
Missing tokens become empty. A variant with no triggers always matches, so give
every variant at least one trigger and put the unconditional prose in `fallback`.

Compile `## Conditional passages` into `passages`. Do not inline the chosen prose
into `text`.

```markdown
## Conditional passages

intro

When: emma_met has occurred

"Antonio. We meet again," she says, with a familiar raised eyebrow. "I trust you've recovered your powers of speech."

Otherwise:

"Emma Delamain," she introduces herself, offering her hand. "And you must be Antonio Fibonacci. A pleasure."
```

Maps to:

```json
"passages": {
  "intro": {
    "variants": [
      {
        "triggers": [{ "triggerType": "story_tag", "parameters": { "tag": "emma_met", "value": 1 } }],
        "text": "\"Antonio. We meet again,\" she says, with a familiar raised eyebrow. \"I trust you've recovered your powers of speech.\""
      }
    ],
    "fallback": "\"Emma Delamain,\" she introduces herself, offering her hand. \"And you must be Antonio Fibonacci. A pleasure.\""
  }
}
```

Rules:

- Each passage starts with a lone key line (`intro`, `passageAlreadyMet`). The same
  key must appear in `## Text` as `{{ intro }}`.
- `When:` uses the same phrasing as `**Trigger:**`. Consecutive `When:` lines before
  the prose are AND (one trigger each). The following prose, verbatim, is that
  variant's `text` (paragraphs → `\n\n`).
- A later `When:` after prose starts the next variant. First listed variant that
  matches wins.
- `Otherwise:` is optional `fallback`. One per passage, after its variants. Omit
  `fallback` in JSON when there is no Otherwise.
- Quote marks in the sample are dialogue, part of the prose — copy them.
- Several passages: repeat key / When / Otherwise blocks in the same section.
- Passage triggers are evaluated when the event is shown, before this event's
  effects run and before its own story tag is stamped.

## Option triggers

Same types and AND logic as event triggers. Omit or leave empty → always offered.
If every option is gated and none match, the event plays with no choice — keep at
least one ungated option when the player must always respond.

## Effects

Root-event and node `effects` are **couples** `{ effect, triggers? }` — not bare
`EventEffect` objects. Omit `triggers` (or use `[]`) to always apply, same as
before. When `triggers` is set, every trigger must match (AND) or that entry is
skipped. Root evaluation happens on fire, before options and before this event's
story tag is stamped. Node evaluation happens on enter, before that beat's
passages and options.

Option, skill-check, and success/failure effects stay bare `EventEffect[]`
(`type` + `parameters` only).

`EventEffect` types live in `EventEffectType` (`src/lib/_model/enums-sim.ts`):

| `type`                     | `parameters`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| -------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `add_resource`             | `{ resourceType: "magic_dust" \| "silver" \| "moxes" \| …, amount }`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `add_gold`                 | `{ amount, characterKey? }` — defaults to the player; pass an NPC key to credit that character                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| `subscribe`                | `{ subscriptionType, duration, cost?, transactionType? }` — days added to `player.subscriptions`; use `material_shop` for the materials-shop discount; `cost`/`transactionType` default to `0` / `subscription` when omitted from events                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| `get_deck`                 | `{ deckKey }`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| `schedule_activity`        | `{ activity: { type, participants, placeKey, classType?, eventId? }, schedule: { date?: { day, period, dayOfWeek? }, nextFree?: true, recurrence?: { … } } }` — `day` is days-from-now; `dayOfWeek` is 1–7 (Mon–Sun) for next matching weekday; with `nextFree`, bump to the next free slot (by day, or by week when `dayOfWeek` is set)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| `get_job`                  | `{ job: { jobType, name, description, payPerActivity, employerKey, placeKey, schedule } }`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| `follow_up_event`          | `{ eventKey }`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| `offer_card_gifts`         | `{ count, poolKeys }`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| `gift_card_to_character`   | `{ characterKey, cardKey, fromPlayer? }` — `fromPlayer` true (default): move from player; false: mint a new copy into the NPC's collection                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| `teach_color`              | `{ color?, characterKey? }`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| `teach_ability`            | `{ ability?, characterKey? }`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| `narrate`                  | `{ text }` — use for option `**Text:**` bodies                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| `level_attribute`          | `{ attribute, amount?, characterKey? }`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| `level_up_character`       | `{ characterKey }` — increments that NPC's `tcgSkill` by 1                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| `change_relation`          | `{ characterKey, relationParameter, amount }`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| `update_relation_arc`      | `{ characterKey, text, image? }`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| `add_relation_tag`         | `{ characterKey, relationTag }` — value must be the **enum string** from `RelationTag` in `enums-sim.ts` (markdown may use the member name; resolve it)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| `add_story_tag`            | `{ tag, amount? }`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| `add_known_trait`          | `{ characterKey, title, description }` — map “Add to X's known traits: **Title:** desc”                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| `add_chat_topic`           | `{ key, type, text, textKey?, knownByNpcKeys?, excludeNpcKeys?, useOnlyOnce?, priority?, npcKey?, activityType?, placeKey? }` — adds a topic and one spoken line. `type` is `lore`, `memory`, `routine`, or `evergreen`. `textKey` defaults to `key` and must be unique on that topic. Omit `knownByNpcKeys` for public info; set it so only those NPCs know the topic (a memory is usually just the event's NPCs). `excludeNpcKeys` keeps those NPCs from mentioning it. `priority` is 0–3 (default 0); higher makes the scene director more likely to pick it. `generatedOnDay` is set automatically at runtime to the current day (recency also boosts pick chance and decays over time). `npcKey` makes this line specific to one speaker. A later call with the same `key` adds another line and does not change who already knows the topic. Silent — pair with `narrate`. A repeat of the same `textKey` is skipped. |
| `move`                     | `{ placeKey, characterKeys }`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| `use_focus`                | `{ amount }`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| `start_match`              | `{ opponentKey, playerDeckKey?, isLeagueMatch? }` — markdown e.g. `Start match vs franz`. Starts Battle; pair with option `**Next:**` to resume after the fight. See Multi-step exception below for `last_match_*` gating.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| `new_league_season`        | `{ winnerKey? }` — starts a fresh league season. Omit `winnerKey` (or pass `null`) for no ceremony; set to `"player"` or an NPC key to record the winner and schedule the ceremony.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| `add_possession`           | `{ type: "clothing" \| …, name, description, count?, characterKey? }` — appends a possession to that character; defaults to the player                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| `acquire_artifact_pattern` | `{ patternKey, characterKey? }` — adds a known artifact pattern key to that character's `artifacts.patterns`; defaults to the player. `patternKey` must match an authored artifact in `src/data/sim/artifacts/`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| `gift_artifact`            | `{ patternKey, characterKey }` — moves a crafted tool or trinket matching `patternKey` from the player to that NPC. Fails with narration if the player does not own one.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| `unlock_place`             | `{ placeKey }` — sets `place.locked = false` so the place becomes visible. Guardians still gate entry until defeated. Markdown e.g. `Unlock place: hidden-cloister`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |

Lines created by `add_chat_topic` are kept on the save. Authored lines in `src/data/sim/chat_topics/` stay in those files.

### Mapping `## Effects` to couples

Bullets with no preceding `When:` → `{ "effect": { … } }` (always apply).

A `When:` line (same phrasing as `**Trigger:**`) starts a group. Consecutive
`When:` lines before the next bullet are AND. Every following effect bullet
until the next `When:` (or end of `## Effects`) gets those `triggers`.

```markdown
## Effects

- Add to Emma's known traits: **First impressions:** A striking young woman…

When: emma_met has occurred

- Change Emma friendship +1
```

```json
"effects": [
  {
    "effect": {
      "type": "add_known_trait",
      "parameters": {
        "characterKey": "emma",
        "title": "First impressions",
        "description": "A striking young woman…"
      }
    }
  },
  {
    "effect": {
      "type": "change_relation",
      "parameters": { "characterKey": "emma", "relationParameter": "friendship", "amount": 1 }
    },
    "triggers": [
      { "triggerType": "story_tag", "parameters": { "tag": "emma_met", "value": 1 } }
    ]
  }
]
```

Do not put `When:` groups under option `**Outcomes:**` — those stay bare effect
lists. Node `**On enter:**` uses the same `When:` grouping as root `## Effects`.

Event-level `effects` run on fire and node `effects` on enter (each entry gated
by its own triggers); option `effects` run only if chosen.

An option uses **either** `effects` **or** `attributeCheck` (not both). Prefer
`start_match` as an effect with `**Next:**` (battle, then resume) over an action
template. An option still uses **either** a next node **or** a legacy action
template (not both), and **either** a next node **or** `follow_up_event` (not both).
`follow_up_event` starts a different event later; `nextNode` continues this event
(immediately, or after battle when paired with `start_match`).

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
`impossible`. Action templates on options:

| Template                | `args`                                           | Notes                                                                                         |
| ----------------------- | ------------------------------------------------ | --------------------------------------------------------------------------------------------- |
| `enrollmentTransaction` | `{}` (or overrides)                              | Negotiate academy enrollment                                                                  |
| `enrollmentPayment`     | `{}` (or overrides)                              | Pay academy enrollment without negotiate                                                      |
| `purchase`              | `{ cost, items?: { resources?, possessions? } }` | Fixed-cost purchase. `possessions` is `Partial<Record<PossessionType, string>>` (type → name) |
| `invite`                | invite parameters                                | Scene invite action                                                                           |

Markdown example for a clothing purchase:

```markdown
**Outcomes:**

- No additional game-state effects.

**Action:** purchase — spend 80 gold for clothing "Evening suit"
```

```json
"actionTemplate": {
  "actionTemplate": "purchase",
  "args": {
    "cost": 80,
    "items": {
      "possessions": { "clothing": "Evening suit" }
    }
  }
}
```

`purchase` charges `cost` gold and grants each listed possession (name used as description).
Prefer `purchase` when the player must pay; use free `add_possession` when there is no cost.

`schedule_activity`: `schedule.date.day` is an **offset from today** (`0` = today).
`schedule.date.dayOfWeek` is **1–7 (Monday–Sunday)** and targets the next matching
weekday at or after that offset (period defaults to evening). With `nextFree: true`,
if the target slot is booked, bump forward a day at a time — or by **full weeks** when
`dayOfWeek` is set. Markdown examples:
`Schedule \`emma_tourney_training\` event for the next day's evening at Emma's room.`→`date.day: 1`(no nextFree).`Schedule \`emma_tourney_crafting\` event for evening in 2 days (next free) at the artificery room.`→`date.day: 2`, `date.period: evening`, `nextFree: true`, `placeKey: artificery-room`,
`activity.type: event`, `eventId`= the scheduled event key.`Schedule study for next Tuesday evening (next free) at the library.`→`date.dayOfWeek: 2`, `date.period: evening`, `nextFree: true`.
`follow_up_event`queues by key and bypasses that event's triggers — target should
use`triggers: []`.
`gift_card_to_character`takes a template`cardKey`(e.g.`happy_little_accident`).
With `fromPlayer`true/omitted it finds a matching instance in the player's collection
(exact id or`cardKey-<uuid>`). With `fromPlayer: false` it mints a new copy from the
template into the NPC's collection (no transfer).

## Multi-step events

Skip this section when the markdown has no `## Node:` and no `**Next:**`. A single-beat
event is compiled exactly as the rest of this skill describes.

The template is the root beat (`## Text`, `## Effects`, `## Options`, root `**Trigger:**`).
Each `## Node: <key>` is a later beat shown in the same scene, with no time advance and
no second story-tag stamp. `follow_up_event` is still how a choice starts a _different_
event (its own key, its own once-only stamp, any later day or place).

Full shape to copy: `.cursor/skills/create-sim-event/multi-step.example.md`. Do not compile
that file into `events.json`. The snippet below is only an excerpt.

```markdown
### Option A: Ask about the tuition

**Next:** tuition_talk

**Text:**

You ask what the ledger is for.

**Outcomes:**

- No additional game-state effects.

## Node: tuition_talk

**Title:** The ledger
**Image:** emma_tuition.jpg medium
**Emotion:** concerned
**Trigger:** emma_met has occurred

**On enter:**

- Add story tag emma_heard_tuition

When: Emma friendship is at least 3

- Change Emma respect +1

**Passages:**

greeting

When: emma_met has occurred

"You already know what this costs."

Otherwise:

She has not said the number aloud before.

She sets the ledger between you. {{ greeting }}

### Option A: Pay it

**Outcomes:**

- Lose 5 gold

### Option B: Refuse

**Next:** refused
```

Compile rules:

- Node key ← the `## Node: <key>` text. Letters, digits, `_`, `-`. It is not an event key
  and must not collide with the requirement that `nextNode` names a node in this event.
- Everything after a `## Node:` belongs to that node until the next `## Node:` or end of file.
  Root `## Text`, `## Effects`, `## Options`, and `## Conditional passages` stay above the
  first `## Node:`.
- Optional meta, in any order, before the prose: `**Title:**`, `**Image:**` (same rules as
  the root image), `**Emotion:**`, `**Trigger:**`. `**Trigger:**` uses the same phrasing as
  the event trigger. Omit it to make the node always enterable. Several conditions in that
  line are AND, same as the root.
- `**On enter:**` → node `effects` as `{ effect, triggers? }` couples (same bullets and
  `When:` grouping as `## Effects`). Omit when there are none. Do not put
  `follow_up_event` here if the node also has options.
- `**Passages:**` → node `passages`, same key / `When:` / `Otherwise:` shape as
  `## Conditional passages`. The node's prose keeps `{{ passageKey }}` tokens.
- Prose after the meta (and after `**On enter:**` / `**Passages:**` when present) → node
  `text`, verbatim, paragraphs joined with `\n\n`. It runs until the first `### Option` or
  the next `## Node:`.
- `### Option` blocks inside the node → that node's `optionTemplates`, with the same label /
  `**Text:**` / `**Outcomes:**` / `**Only if:**` / `**Check:**` rules as root options.
  A node with no options → `optionTemplates: []` (the beat is narrated, then the event ends).
- `**Next:** <key>` on an option → `nextNode`. Place it with the option meta (next to
  `**Text:**`), not inside the prose. Omit it to end the event on that choice.
- Skill check: a `**Next:**` directly under `**On success:**` → `successNode`. Directly under
  `**On failure:**` → `failureNode`. A `**Next:**` on the option itself still applies to a
  branch that has no node of its own. Do not invent a next node the markdown did not name.
- Node **entry** triggers (`**Trigger:**`) are evaluated when the previous beat's options
  are built, before that beat's effects and before the chosen option's effects. A choice is
  hidden when every way forward is a locked or missing node. Do not use those prior effects
  to unlock the node the choice opens; entry state is not visible yet. Once the node opens,
  its `**On enter:**` effects run first, then passages and options resolve — so a story tag
  set on enter _can_ gate that same beat's passages and choices.
- **Exception — `start_match`:** that effect starts Battle and defers `**Next:**` until the
  player returns to Sim. `lastMatchWon` is set when the fight ends, then the parked node is
  entered and _its_ option / passage triggers are judged. Do **not** put `last_match_won` /
  `last_match_lost` on the hub node named by `**Next:**` (it must stay enterable before the
  match). Use an ungated hub, then gate child options, passages, or further `**Next:**`
  targets with those triggers. `matches_won` / `matches_lost` are career totals vs an NPC —
  not “this bout.”
- Cycles are allowed. Every `nextNode` / `successNode` / `failureNode` must name a node in
  this event's `nodes`.

```json
"nodes": {
  "tuition_talk": {
    "text": "She sets the ledger between you. {{ greeting }}",
    "passages": {
      "greeting": {
        "variants": [
          {
            "triggers": [
              { "triggerType": "story_tag", "parameters": { "tag": "emma_met", "value": 1 } }
            ],
            "text": "\"You already know what this costs.\""
          }
        ],
        "fallback": "She has not said the number aloud before."
      }
    },
    "triggers": [
      { "triggerType": "story_tag", "parameters": { "tag": "emma_met", "value": 1 } }
    ],
    "effects": [
      {
        "effect": { "type": "add_story_tag", "parameters": { "tag": "emma_heard_tuition" } }
      }
    ],
    "optionTemplates": [
      {
        "text": "Pay it",
        "effects": [
          { "type": "add_gold", "parameters": { "amount": -5 } }
        ]
      }
    ],
    "title": "The ledger",
    "emotion": "concerned",
    "image": "emma_tuition.jpg",
    "imageSize": "medium"
  }
}
```

`**On enter:**` with a `When:` group (same as root `## Effects`):

```markdown
**On enter:**

- Add story tag emma_heard_tuition

When: Emma friendship is at least 3

- Change Emma respect +1
```

```json
"effects": [
  {
    "effect": { "type": "add_story_tag", "parameters": { "tag": "emma_heard_tuition" } }
  },
  {
    "effect": {
      "type": "change_relation",
      "parameters": { "characterKey": "emma", "relationParameter": "respect", "amount": 1 }
    },
    "triggers": [
      {
        "triggerType": "relation_parameter",
        "parameters": { "characterKey": "emma", "relationParameter": "friendship", "value": 3 }
      }
    ]
  }
]
```

## Keys to verify

| Kind                                                      | Source                                      |
| --------------------------------------------------------- | ------------------------------------------- |
| Character keys, display names, gender                     | `src/data/npcs.ts` (plus `"player"`)        |
| Place keys                                                | `PLACES` in `src/data/sim/places.ts`        |
| Deck keys                                                 | `getDeck` in `src/lib/sim/effects/decks.ts` |
| Resource, period, activity, class, emotion, relation tags | `src/lib/_model/enums-sim.ts`               |

The validator lists allowed values in errors — re-run it when unsure.

## Emotion

Optional. Use the markdown value if present; it must be an `Emotion` enum string
from `enums-sim.ts`. Omit when absent or unclear. Do not invent values.

## Editing

Same compile workflow. Keep `key` unchanged so `story_tag` references stay valid.
If the user renames a key in markdown, update every `story_tag` / `follow_up_event`
/ `eventId` that referenced the old key.

When re-compiling, refresh JSON fields from the markdown; do not leave stale prose
in JSON after the markdown changed. Drop `nodes` (and option `nextNode` /
`successNode` / `failureNode`) when the markdown no longer has those beats. Keep node
keys stable when the prose is edited, the same way event keys stay stable.

## Example

Source: `src/data/sim/events/emma/first_impression.md` (abbreviated mapping):

- `# Event: A Rather Unfortunate First Impression` → `title`
- `**Event ID:** emma_first_encounter` → `key`
- `**NPC:** emma` → `characterArc: "emma"`
- `**Trigger:** First time Emma is present…` →
  `[{ "triggerType": "character_present", "parameters": { "characterKey": "emma" } }]`
- `**Image:** large` → `imageSize: "large"`, `image: "<key>.jpg"`
  (e.g. `emma_first_encounter.jpg`)
- `**Emotion:** neutral` → `emotion: "neutral"`
- `## Text` → `text` with `\n\n` between paragraphs
- Known trait under `## Effects` → event `effects` couple:
  `{ "effect": { "type": "add_known_trait", … } }` (no `triggers` unless a `When:` group)
- Option labels → `optionTemplates[].text`; option bodies → `narrate`;
  `EmmaSmitten` → `add_relation_tag` with the `RelationTag.EmmaSmitten` string value
