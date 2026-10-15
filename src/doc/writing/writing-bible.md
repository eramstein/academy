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

- [Unconditional changes, including character-sheet discoveries; omit or say none if not applicable]

## Options

### Option A: [Player-facing choice title]

**Text:**

[Consequences narrated after selection]

**Outcomes:**

- [State changes, relationship points, tags, cards, NPC bio additions]

### Option B: [Title]
...
```

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
