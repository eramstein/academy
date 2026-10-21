# Academy — Writing Bible

## Purpose and authority

This document records agreed narrative conventions for Academy's hand-authored RPG events. It is a living guide, not a restriction on experimentation. Character-specific voices belong in their character profiles; full event prose belongs in separate event files. When a scene calls for a different register, character and dramatic context take precedence over mechanical consistency.

## Narrative perspective

- Default: **second person, present tense**, addressing the player character as **you**.
- Player character: **Antonio Fibonacci**, a 23-year-old man from a modest background, entering the Academy after saving for three years to pay first-year tuition. His personality should emerge chiefly through player choices, rather than being fixed by narration.
- Interior monologue is welcome, especially for comic timing. Second-person rhetorical questions, short fragments, and an occasionally conspiratorial narrator are encouraged.
- Avoid assigning Antonio strong lasting feelings, convictions, or romantic commitments without player choice. Short situational reactions can set up a choice; persistent characterization should be opt-in.

## Overall tone

- **Lighthearted, humane, humorous, and character-driven**, in a fantasy late-medieval Academy focused on artificery, alchemy, and magical card crafting.
- Adult characters may experience attraction, flirtation, romantic tension, and rare implied sexual intimacy. Keep intimate scenes non-explicit and in keeping with the story's warmth. Illustrations, where relevant, should favor implication over graphic depiction.
- Adventures may involve danger and violence, but the game is not primarily about combat; avoid gratuitous brutality and permanent deaths of main characters.
- Let serious emotional scenes remain serious. Do not undercut every vulnerable moment with a punchline.
- Humor should arise from personalities, competing intentions, social embarrassment, irony, and reversals—not random jokes or relentless quips.

## Prose and pacing

- Literary but accessible English; vivid specifics without purple prose.
- Vary sentence length. Short sentences and fragments can punctuate a comic inner monologue, but should not become a tic.
- **Compact UI paragraphs:** use conventional paragraphs, generally 3–6 sentences each. Do not insert a paragraph break after every short sentence or comic beat; retain the rhythm within a paragraph. Break paragraphs for meaningful changes in action, speaker, scene, or emphasis.
- Dialogue may share a paragraph with surrounding narration when clear who is speaking; avoid excessive vertical whitespace. A rare isolated sentence is fine when its dramatic effect justifies the space.
- Favor concrete action, expressive gestures, and dialogue over long explanations of character psychology.
- Keep routine encounters economical and easy to read in the illustrated-book UI. Important milestones may be longer.
- Use dialogue to reveal character, not to recite background information the reader already knows.
- Write NPCs as people with independent goals and lives, not as reward dispensers orbiting Antonio.

## Player agency and outcomes

- Events present **paths and trade-offs**, not a single obviously correct response. An option may affect relationships, skills, money, resources, cards, or future story opportunities.
- The four internal relationship values are **friendship, respect, love, rivalry**. They are hidden from the player; show progress through prose, reactions, and character discoveries, not numeric meters.
- Qualitative relationship tags can enable callbacks and distinctive dialogue. Low-stakes opt-in tags may establish running jokes without implying romantic commitment.
- TCG choices matter narratively; narrative choices may affect card ownership, crafting, and future TCG performance.
- Characters' personal stories progress even without Antonio's participation. His choices may change their course, not determine whether those characters have agency.
- Important events and choices should usually leave **NPC memories** so later small talk can refer to shared experiences; selectively create **rumors** so developments can reach Antonio through other characters. Keep these distinct from permanent character-sheet discoveries and story tags.

## Relationship book versus character sheet

- **Relationship book:** chronological illustrated record of events Antonio has experienced with an NPC.
- **Character sheet:** evolving, narrative descriptions of what Antonio has actually learned about that NPC (personality, background, interests, ambitions, etc.). Discoveries should be earned in scenes; do not expose undiscovered biography.
- The character sheet should help inform choices without becoming a numerical checklist.

## Event Markdown convention

Use this structure for polished event drafts (the IDE workflow handles JSON conversion):

```markdown
# Event: [Title]

**Event ID:** `character_event_id`
**Trigger:** [Conditions in prose]
**Manual trigger:** [Optional player-facing action label; omit for automatic events]

## Text

[Shared opening narrative, second person present. Insert `{{passageName}}` where conditional prose belongs.]

## Conditional passages

### passageName

**When:** [Existing event-trigger conditions, described in prose]

[Text to insert when the conditions match.]

**Otherwise:**

[Fallback text if the conditions do not match.]

## Effects

- [Unconditional changes, including character-sheet discoveries, NPC memories, and rumors; omit or say none if not applicable]

## Options

### Option A: [Player-facing choice title]

**Text:**

[Consequences narrated after selection]

**Outcomes:**

- [State changes, relationship points, tags, cards, NPC bio additions, NPC memories, and rumors specific to this choice]

### Option B: [Title]

...
```

## NPC memories and rumors for small talk

Events should help future routine conversations feel grounded in the story. When authoring an event, consider what its participants **remember** and what other people might **hear about**. These are distinct optional effects, and neither replaces the event log, canonical game state, story tags, or character-sheet discoveries.

### NPC memories

A memory belongs to a **specific NPC** and summarizes a meaningful experience they can later mention or react to. Significant events and meaningful choices should **usually leave a memory trace** for the NPCs involved, especially when the scene changes trust, feelings, shared history, or their view of Antonio. Minor transitions and purely mechanical effects do not need one.

Use the existing `NpcMemory` shape:

```ts
interface NpcMemory {
  title: string;
  description: string;
  day: number;
  emotion?: Emotion;
  referenceCount: number;
}
```

Writing conventions:

- Explicitly name the **recipient NPC** in the Markdown effect (e.g. `NPC memory — Emma`); create separate memories for different NPCs if their knowledge or interpretation differs.
- `title`: short, identifiable topic, ideally usable for memory retrieval (e.g. `The Falkenheim victory`).
- `description`: compact, factual, self-contained summary of **what this NPC experienced or learned**, including the relevant outcome and Antonio's actual choice when it matters. Favor one or two concrete sentences over an event transcript. A small emotional interpretation is fine when supported by the scene; do not fabricate hidden intentions, confessions, or events.
- `emotion` is optional; when supplied, use an existing `Emotion` enum value, not an invented mood label. It represents the memory's emotional coloring **for the receiving NPC**.
- `day` is the in-game day the memory is created; in event Markdown, specify **current day** rather than inventing a fixed date.
- `referenceCount` starts at **0** and is incremented by the runtime when the memory is used in later dialogue. Authors should not pre-increment it.
- Prefer **branch-specific memories in option outcomes** when the player's decision or success/failure changes what happened. A shared memory under `## Effects` is suitable only if it remains accurate for every possible outcome.
- Avoid duplicates: one meaningful memory for a beat is usually better than several near-identical entries. Do not store information the NPC could not plausibly know.

Example effect notation (editorial Markdown, not a new JSON schema):

```markdown
## Effects

- NPC memory — Emma:
  - title: Chosen for Falkenheim
  - description: Emma selected Antonio as her tournament teammate because she trusts his abilities, and he accepted the challenge.
  - day: current day
  - emotion: proud
  - referenceCount: 0
```

### Rumors

A rumor is a **small-talk lead or piece of circulating news**, not necessarily an established fact. Rumors can hint at someone's habits, signal an opportunity, or report an offscreen or missed event (especially after Antonio declines to participate). They let the world continue to feel active without requiring Antonio to attend every authored event.

Use the existing `Rumor` shape:

```ts
interface Rumor {
  aboutNpcKey?: string;
  fromNpcKey?: string;
  text: string;
  fromDay?: number;
  untilDay?: number;
}
```

Writing conventions:

- `text`: short, natural information that an NPC could plausibly convey in conversation. Be specific enough to encourage a follow-up or establish a new fact, but avoid dumping full event summaries or revealing private information without a credible route for it to spread.
- `aboutNpcKey`: set when the information is meaningfully **about a particular NPC**, enabling character-related small talk; omit for general Academy or town news.
- `fromNpcKey`: set **only when that NPC is the sole speaker permitted to share the rumor**; leave unset when multiple NPCs may relay it. It is a speaker restriction, not the identity of whoever originally witnessed an event.
- `fromDay` and `untilDay`: **relative day offsets from the day the effect fires**, defining the rumor's availability period. They are not absolute calendar days. Omit an offset when no bound is needed; don't invent expiry dates for enduring conversational facts. Make time-limited opportunities expire sensibly.
- Write rumors to match what characters can reasonably know. Rumors may be incomplete or explicitly uncertain, but should not accidentally assert false canon. If gossip is unreliable, signal this in the wording.
- For **decline**, missed-opportunity, or offscreen-resolution options, consider a rumor that conveys what happened afterward without pretending Antonio was present. The rumor may have different wording depending on the resolved outcome.
- Prefer a few distinctive, useful rumors to one for every trivial action. Do not use rumors as substitutes for tags or canonical effects required by future event triggers.

Example effect notation:

```markdown
**Outcomes:**

- Rumor:
  - aboutNpcKey: emma
  - text: Emma has been playing violin at the inn on Friday evenings. Apparently she's very good.
  - fromDay: 1
  - untilDay: 14
```

For an exclusive firsthand account, add `fromNpcKey: emma`. An unset `fromNpcKey` allows the rumor to be shared by other suitable NPCs.

### Choosing where to place them

- **Shared event facts** that happen regardless of the player's options: put memories or rumors under `## Effects`.
- **Choice-dependent events, refusals, and skill-check results:** put the corresponding memories or rumors under the appropriate `**Outcomes:**` or success/failure outcome block. Never summarize a success in a memory that can also be awarded on failure.
- **Offscreen NPC developments:** a rumor can inform Antonio of the result even if he was absent; only give an NPC memory to someone who genuinely participated or learned of it.
- **Use both when appropriate:** memory records what an NPC remembers, while rumor lets others discuss a public-facing aspect of the same development. Their texts need not match because the audiences and purposes differ.
- **Avoid spoilers and contradictions:** match the chosen option, relevant tags, prior discoveries, and the timeline. In particular, do not turn unspoken feelings or private romantic moments into public gossip by default.

**Conditional event passages:** For variations in the event's main narrative, put `{{passageName}}` placeholders directly in `## Text` and define each named passage under `## Conditional passages`. Each passage can have one or more ordered **When:** variants, using the game's existing trigger logic, followed by an **Otherwise:** fallback. The first matching variant wins; the fallback applies if none match. Keep the prose of each variant compact and consistent with the surrounding paragraph. Use passages for prior-event callbacks, first-time introductions, relationship tags, or other relevant game-state differences. Omit `## Conditional passages` when the event has none. **This feature currently applies only to the event's main `text`, not option text**; keep option outcomes as ordinary static prose. Do not invent inline `if` expressions or a separate condition language.

**Illustrative example:**

```markdown
# Event: A Formidable Opponent

**Event ID:** `emma_first_match`
**Trigger:** First TCG match against Emma

## Text

Emma takes her seat across from you, carefully arranging her cards.

{{intro}}

"I do hope you've come prepared."

## Conditional passages

### intro

**When:** `emma_first_encounter` has occurred

"Antonio. We meet again," she says, with a familiar raised eyebrow. "I trust you've recovered your powers of speech."

**Otherwise:**

"Emma Delamain," she introduces herself, offering her hand. "And you must be Antonio Fibonacci. A pleasure."
```

**Event activation convention:** Events without `manualTrigger` are automatic once eligible and selected by the event scheduler. When `manualTrigger` is provided, its string is displayed as an available action in the book UI, and the event starts only if the player chooses it. Existing trigger conditions still govern availability. Use manual activation when Antonio deliberately initiates a conversation, offer, or activity; use automatic activation for encounters, consequences, and NPC-initiated developments. The manual action label is distinct from the event title and from its internal choice labels.

Keep the **choice label** distinct from the **post-choice narration**; avoid spoiling outcomes in the label. Event IDs and tags should be stable and consistent across files. This is an editorial format, not a JSON schema.

## Voice guidance: narrator

Affectionate, observant, lightly irreverent. The narrator may gently tease Antonio, particularly when his self-image clashes with what is happening, but should never despise him or deprive the player of agency. Comic exaggeration is welcome in small doses. The narrator can know the awkwardness of a situation without claiming access to every NPC's private thoughts.

**Reference rhythm (Emma first encounter, draft):**

> You should introduce yourself. Yes. That would be sensible. Or perhaps explain why you've stopped her. Also sensible. You could even try speaking. People do that, apparently.

## Character voice references

See `emma.md` for Emma's detailed voice and characterization. Add separate voice sections to other NPC files as their dialogue is developed.

## Current open editorial questions

- Typical word-count targets for incidental events, mini-arcs, and major milestones (to establish by playtesting).
- How frequently the narrator should use direct internal monologue versus external observation.
- Whether event priority needs to guarantee that introductions do not all fire together at the beginning of the school year.

## Version note

Initial guide compiled from the Emma first-encounter collaboration, October 2026. Expand with approved examples of a serious scene, romantic scene, and adventure scene when available.
