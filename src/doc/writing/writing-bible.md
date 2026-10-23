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
- Memorable or funny events and choices should often add **memory chat topics** for later callbacks; missed opportunities and public developments can add **lore chat topics** to spread news through conversation. These complement, rather than replace, canonical effects, story tags, relationship-book entries, and character-sheet discoveries.

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

- [Unconditional changes, including character-sheet discoveries and chat topics (memory or lore); omit or say none if not applicable]

## Options

### Option A: [Player-facing choice title]

**Text:**

[Consequences narrated after selection]

**Outcomes:**

- [State changes, relationship points, tags, cards, NPC bio additions, and chat topics specific to this choice]

### Option B: [Title]

...
```

## Chat topics for small talk (`add_chat_topic`)

Events can create **chat topics** that the scene director later selects during ordinary social interactions. **The `text` in an event's `add_chat_topic` effect is already a complete, player-facing mini-scene, not a summary, factual hint, prompt for an LLM, or internal memory record.** It must be ready to display directly in the illustrated-book UI, without runtime rewriting. The topic key and access restrictions determine _when and by whom_ that text may be used; separately authored `ChatTopicTexts` can provide alternate or more specific realizations. See `scene-director.md` for selection and reuse rules.

Use **plain effect bullets** under `## Effects`, node **On enter**, or option **Outcomes** (including skill-check branches), just like known-trait additions. The event-authoring skill maps them to `add_chat_topic` with the topic `key`, subtype (`memory` or `lore`), scene `text`, and optional `knownByNpcKeys`, `excludeNpcKeys`, `npcKey`, `useOnlyOnce`, and `priority` (0–3; higher = more likely to be picked soon). Creation day is set automatically at runtime and also boosts pick chance while the topic is fresh. Do **not** write the old `NpcMemory` / `Rumor` structures. Follow the serialization conventions of the actual game schema when converting to JSON.

### How to write chat-topic scenes

- Write a **brief, complete exchange** in **second person, present tense**, addressing Antonio as _you_, with natural dialogue and one clear beat (a callback, a joke, a small sincere moment, or the delivery of useful information). Usually a short paragraph or two; do not retell the whole original event.
- The scene happens **later**, when the player chooses to chat; **do not presume it is the next day**, or that Antonio and the NPC are still in the event's original location. Avoid hard-coded "yesterday," "this morning," "here in the workshop," etc., unless the topic's runtime eligibility guarantees them.
- Make the scene **portable across locations and activities** unless it has explicit restrictions. Avoid requiring props, bystanders, or an activity that may be absent. Dialogue may allude to an earlier incident without reconstructing it.
- The memory or lore must be **recognizable in the conversation itself**, not described as a third-person database summary. Preserve character voice and an appropriate sense of how familiar the NPC and Antonio are at this point; do not assume a deeper relationship than the branch establishes.
- **Never invent canon, outcomes, secrets, promises, or changes to game state**. A chat scene recalls or reports what happened; it does not resolve another quest, grant a reward, or establish a new lasting fact.
- For **speaker-neutral public lore**, avoid named or personality-specific delivery, and do not assume the speaker personally witnessed the event. Use NPC-specific variants when the speaker's reaction is especially interesting. Do not make the subject announce their own reputation unnaturally.
- Write the text that appears **when this topic is selected**, not instructions such as "Emma teases Antonio about his mistake" or a fact such as "Antonio embarrassed himself." Those are useful editorial notes but are not valid `text` for an authored chat-topic effect.

### Memory topics: personal callbacks

Add a **memory** after a funny, moving, embarrassing, revealing, or otherwise memorable experience that an NPC can later reference. Choose selectively: routine actions and minor logistical decisions need none. Memories are normally known **only by NPCs who witnessed or learned about that outcome**.

- Put outcome-specific memories in the corresponding option or skill-check branch. A root memory must be true no matter what Antonio later chooses.
- Use a unique, stable key such as `emma_memory_first_impression`; avoid duplicate keys for different outcomes.
- Write the callback **as the NPC speaking to Antonio** (plus concise narration), not as a retrospective summary.

```markdown
## Options

### Option B: A complete failure of higher reasoning

**Outcomes:**

- Add memory `emma_memory_first_impression` for emma: "Fibonacci!" Emma greets you with unmistakable amusement. "I see you've recovered your powers of speech. The last time we met, I thought I might have to conduct the entire conversation myself." You assure her that was an exceptional circumstance. "Naturally," she says. "I'm sure your eloquence is otherwise legendary."
```

The longer form is equally valid: `Add chat topic ` followed by the topic key, `(memory), known by emma:` and the same **complete scene**.

### Lore topics: news and offscreen developments

Add **lore** for background information, hints about characters, Academy news, notable public achievements, or events Antonio declined or missed. If an NPC continues with an activity without Antonio, a later conversation can reveal what happened—but only if that offscreen outcome is actually established by the event. Particularly spectacular happenings may merit both a public lore topic and a separate personal memory.

- The text must **deliver the information in a short conversational scene**; it is not just the information statement.
- Public lore can be spoken by any eligible NPC, so write generic dialogue that does not assume a particular voice or firsthand knowledge. Private lore may be voiced specifically by its owner.
- Do not circulate confidential information unless the event explains how it became known. Report uncertain gossip as uncertain, not as established fact.
- For declines, do **not** imply Antonio was there. Use `(use once)` for a piece of gossip that should not recur.
- A speaker-specific version with the **same topic key** is an alternative telling, not a second unrelated fact. It must not contradict the generic version.

**Public world lore:**

```markdown
## Effects

- Add lore `world_lore_time`: "Funny to think we live in the nineteenth century," your companion remarks. "And the Academy still insists on keeping records as though parchment were the height of modern convenience."
```

**Private lore (only Emma knows it):**

```markdown
- Add lore `emma_lore_private_rabbit`, known by emma: "I have a pet rabbit," Emma tells you. "An excellent listener, incidentally. Less inclined to interrupt me than most of my fellow students."
```

**Public lore about Emma (everyone except Emma):**

```markdown
- Add lore `emma_lore_public_promising`, exclude emma: "Have you heard about Emma Delamain?" your companion asks. "People are calling her the Academy's most promising new student. No small expectation to live up to."
```

**Speaker-specific telling (same topic, Elsa's voice):**

```markdown
- Add lore `emma_lore_public_promising`, speaker elsa: Elsa gives a delicate sigh. "Apparently everyone has decided Emma Delamain is the Academy's most promising new student. They do so adore announcing a verdict before the competition has begun."
```

The `speaker` qualifier maps to `npcKey`; `known by` to `knownByNpcKeys`; and `exclude` to `excludeNpcKeys`. For large curated libraries, `ChatTopicTexts` may include additional variants and constraints.

**Same topic key, second line:** only adds another `text` (give it a distinct `textKey` or `npcKey`). It does **not** change `knownByNpcKeys` or `priority` — those stick from the first create. Different knowers need different topic keys (e.g. `molly_lore_…` vs `emma_lore_…`).

**Once-only gossip:**

```markdown
- Add lore `academy_lore_tuition_scandal` (use once): "Did you hear about the tuition scandal?" your companion asks. "Someone apparently handed over three years of savings for a single term. If that's an investment in knowledge, I hope the dividends are extraordinary."
```

**High-priority callback** (0–3; omit for default 0):

```markdown
- Add memory `molly_memory_pajama_dare`, known by molly, priority 2: Molly grins. "Still thinking about that dare, aren't you? Don't worry — I haven't forgotten either."
```

### Placement and authoring checklist

- **`## Effects` (root):** fires when the event starts. Add only scenes recalling/reporting facts already established before any option is chosen.
- **`**Outcomes:**` (option or success/failure):** fires only for the chosen branch. Place choice-specific memories and declined-action news here.
- **Node `On enter`:** use for facts established on entering that node, not events that may happen later in it.
- **Memories:** ask, “Would this NPC plausibly bring up this distinctive shared moment in a later chat?” If yes, write their callback as a scene.
- **Lore:** ask, “Would someone later have useful or amusing news about this?” If yes, write the delivery as dialogue from an eligible speaker.
- **Both:** when a public achievement also has a personal emotional or comic consequence, use different stable keys for the public report and the private callback.
- **Causality and portability:** check that each line is true for that branch and remains sensible days or weeks later in an unspecified chat location.
- **Do not substitute chat topics for canonical state:** any enduring world, relationship, quest, or inventory changes still need their ordinary effects.

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
