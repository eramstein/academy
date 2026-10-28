# Academy Game Design

## Overall Gameplay Overview

Academy is a single player hybrid strategy and role playing game.

The strategy part is a trading card game similar to Magic the Gathering, played on a board. Each card is unique. The player gathers and customizes cards over the course of the game, builds decks, and participates in tournaments against AI opponents of increasing diffculty. It is a complex game in itself, and will be documented separately.

The role playing part is where the players gets to acquire and improve cards. It involves meeting NPCs, learning about their stories and building relationships with them, collecting resources and improving skills.

The 2 aspects should interact with each other: doing well in the RPG allows to get new cards and improve them, while doing good in the TCG allows to get resources, improve relations with NPCs and advance quests.

A "playthrough" follows the student years of the main character, a few "in game years", corresponding to around a hundred hours of gameplay. It's a long campaign, but with replayability.

## RPG Facet Overview

### Setting

The setting is a fantasy variation of real world late middle age, in Western Europe.
The player is a student in a magic university (the Academy) focused on crafting. Not spells and wands, think more artificery and alchemy. They learn to craft magic items by training on magic cards, and play each other in leagues to test their skills.
The geographic scope is centered around the academy, the surrounding small town, and a few wildderness locations around it (forest, mountains, lake...).
There are a couple dozen NPCs, mostly fellow students, but also teachers, shop owners, etc...

The general tone of the game is wholesome and humoristic.

### Pacing, granularity, high level presentation

The game is emulating old school "chose your own adventure" books, with much more details and possibilities. It is not real time, uses static illustrattions and text, a few sound effects and light UI animations. It presents itself as an illustrated book being written udner our eyes, with the book page on the left (narration and images appearing top down as the game unfolds, with small UI elements at the bottom for the player to chose actions), and game state data on the right (location, NPCs, resources, deck building, etc...).

Space: there are a dozen of discrete places (school courtyard, classroom, village inn, dark forest, etc...), with no notion of distances. Each charater is at a given location, and that's it.

Time: each "turn" of the game is a day period (morning, afternoon, evening). During a period, the player can generally take one long action and multiple short actions, subject to specific restrictions.

The weekly gameplay loop is structured around academy activities:

- **Weekday mornings — artificery classes:** create new cards and discover new card abilities.
- **Weekday afternoons — enchanting classes:** fine-tune decks by mutating existing cards.
- **League matches:** TCG matches are interspersed with classes, with occasional tournaments against other schools.
- **Evenings — free time:** the player can visit a location and interact with NPCs there, or take part in a previously scheduled activity (such as an adventure, a date, or co-studying). Scheduled activities can resolve as standard activities with gameplay options—for example, co-studying can improve skills the partner already possesses—or as authored narrative events.

Short actions are generally not limited per period, but **social interactions are limited to one per period** to prevent players from repeatedly clicking through relationship arcs. Other exceptions may apply.

The overall pacing—including the rate of relationship-arc progression, how much players should be encouraged to spread their attention across NPCs, and the balance between classes, matches and free time—remains to be tuned through playtesting.

### Card collection and crafting

Cards are the central feature of the game. They are the glue between the TCG, which uses them to win matches, and the RPG, which acquires and improves them.

They can be units, spells, or lands. They can have effects selected from a very wide array of action types (damage, movement...), target options, ranges, some of them being unique. They are aligned with colors (red, green, blue, black, each having distinct themes, strengths and weaknesses, with 2 color combinations representing specific regional mythology/foklore, e.g. red/green is Midguard). They are balanced against a mana cost, the higher the cost the more powerful they are allowed to be.

Unlike tradionnal TCGs, each card is unique, with it own name, gameplay stats (which can eveolves over the playthrough) and illustration. It represents an item crafted by a character in the game.

Cards are created during artificery lessons, either via conjuration (choice between random procedurally generated cards, with any keyword or ability) or invocation (ability to create custom cards, but within the limit of your crafting knowledge). They can then further be fine tuned in enchantment classes (remove stats to make them cheaper, or vice versa). The player can use crafting resources (ingredients) to get more flexibility or power when crafting, and level skills and knowledge that open more possibilities in terms of gameplay capabilities of the created cards.

The RPG facet lets the player acquire cards (gifts from NPCs, quest rewards...), resources (common or unique) and level up skills to help them improve their card collection.

Some rare late game cards will be "legendary". They will have their own "free will" and act as NPCs: give you quests, give you special powers in the RPG in exchange of special extra difficulty during a match (e.g. reroll attribute checks...) etc... This is a mechanic to let the TCG aspect influence the RPG in more diverse ways than tournament results.

### Crafting knowledge loop

Invocation and Enchantment allow the players to create highly custom cards that fit a precise need in their deck. However, they are limited to the keywords and action types they already know. To unlock new knowledge, the player must first use Conjuration to get random cards with new abilities, and then play them in actual matches to raise their knowledge and finally use these abilities in custom card creations.

Conjure -> play and learn -> Invoke and Enchant

### Artifacts crafting

Players can accumulate color mastery points, for each color of magic. These can be acquired during card crafting (based on the erudition skill) or during study activities.

Mastery points are used to create artificery devices that can be used during card crafting, TCG battles, or RPG events. Artifacts can provide a variety of buffs, battle global effects, unique card or crafting effects, unlock features like color combinations or RPG places.

Artifacts are built during Enchantment classes or a study activity. They present the currently possible crafts by color, and spend color mastery points.

### Characters, relationships and events

The RPG facet is very much focused on characters. There will be a few (maybe 10) that will be deeply developped, with their own story, personality and ambitions.

As the playthrough develops, relationships with these NPCs form character arcs: personal side stories about friendships, romances, rivalries, and other shared experiences. Each NPC relationship has its own **mini-book**, accessible from that NPC's character sheet, collecting the text and illustrations that tell the player's story with that character. Experiencing and developing these stories should be intrinsically interesting and rewarding, not merely a way to earn mechanical bonuses.

Relationships also open gameplay opportunities, such as access to unique powerful cards, resources, skills, jobs, items, locations, or other NPCs.

Story and character development combine "hard data" in the game state (gold, resources, TCG win rates, personality tags, relationship type tags, etc.) with "narrative nodes": hand-written events presented in the choose-your-own-adventure interface, often with player choices.

Each NPC relationship has **four numeric values: friendship, respect, love, and rivalry**. These are cumulative, quantitative measures used as flexible conditions for event triggers, **not goals or progress bars in themselves**. For example, an event might require love ≥ 5, but many different interactions and choices could lead to that value. The meaningful progression is the evolving, illustrated relationship story, rather than maximizing a number.

This events system aims at the following:

- Be rich and flexible. This is not about having a few plots with a few branches each to chose from. We want each playthrough to be a unique combination of events and stories. Not all events have to occur every playthrough.
- Offer interesting decisions and outcome. Some events might just exist to be funny or develop a character's story, but most should offer strategic decisions to the player. Will you pursue this or this NPC as a long term team mate? Which of this powerful unique cards do you pick?

To that end, events are organized as small stand alone narrative nodes (e.g. Emma asks you to help her gather resources in a dangerous place), and the glue between them is the hard game state. All sorts of trigger criteria can be used (relation levels, past occured events, available resources, time/place, present characters...) to define if an event happens at each period.

Most events have a direct effect mutating the game state, and also several options the player can chose from which affect the game state further, and unlock potential future events.

### Event implementation and resolution (current design)

Events are authored at design time in JSON files and loaded into a database when the application starts. As events occur, they are removed from the pool of potential events, so an event is normally encountered only once per playthrough.

Each event defines a set of trigger conditions. These can refer to previous events having occurred, specific player choices in previous events, numeric game-state thresholds, time and location, characters currently present, and other game-state conditions. Together, these conditions allow small groups of related events (mini-arcs) to depend on earlier outcomes without requiring a single fixed story path.

Each game period, the game queries events whose trigger conditions are satisfied. Events have an optional **`manualTrigger`** string attribute that controls how an eligible event starts:

- **Absent `manualTrigger` (default):** the event plays automatically when eligible and selected by the event scheduling logic.
- **Present `manualTrigger`:** the string is the player-facing label of an action added to the existing action list at the bottom of the illustrated book, alongside contextual actions such as **Craft card**. The event becomes available when its usual trigger conditions are met, but only plays when the player selects that action.

The same rich trigger conditions determine **eligibility** in both cases; `manualTrigger` changes only **activation**. A manual event does not execute merely because it becomes eligible. This lets authored events be proactively initiated by the player without requiring the player to guess which of the four generic socialization actions might conceal an event. It also avoids adding a separate event-specific interaction menu.

**How to prioritize or schedule multiple eligible automatic events remains an open design question**; the aim is to preserve variety while allowing ongoing stories to develop coherently. Presentation of multiple simultaneously available manual actions can be refined through playtesting.

An event is one root beat plus an optional tree of later beats called nodes. The root is what the scheduler starts. Each node has its own text, optional entry triggers, illustration, emotion, entry effects, conditional passages, and options. Showing the root stamps the event once; moving through nodes does not stamp it again and does not advance time. A node is how a conversation continues right now. A follow-up event is still a separate event: its own key, its own once-only stamp, and it may wait for another day or place.

When an event occurs:

1. Its root narrative is presented in the illustrated book interface, optionally accompanied by a dedicated scene illustration or an NPC portrait with a specific emotion.
2. The event may apply root effects to the game state, regardless of the player's subsequent choice. Each root effect is an effect/trigger couple: omit the trigger (the default) and it always applies; when triggers are set, every one must match or that effect is skipped. These checks run when the event fires, before options and before the event's once-only stamp. Node entry effects and option outcomes remain plain effect lists with no per-effect triggers.
3. The player is presented with a set of authored options.
4. The selected option resolves either through a deterministic game-state effect or through a skill check, which determines the outcome and resulting state changes.
5. If that option names a next node — or the skill-check branch names one — that node is shown immediately, with its own text, image, and options. Entry triggers are judged when the previous beat's choices are built: a choice is hidden when every way forward leads to a locked node. A node with no available options ends the event. A branch that points at a locked node ends the event on that branch instead of opening it.
6. Otherwise the event ends. Its occurrence, the player's choice, and relevant results can then be referenced by other events' trigger conditions. Remember a branch with a story tag on the option that leads there; the node path itself is not a separate event id.

Conditional event options and text (current implementation)

Individual event options may define trigger conditions using the existing game-state criteria. An option is displayed only when its conditions are satisfied. This allows choices to depend on previous encounters, relationships, skills, resources, or other state. The same conditions can gate a node, but they are read before the choice's effects, so a choice cannot unlock the node it opens.

The root narrative and each node's narrative support conditional text passages, which are resolved according to game state when that beat is shown. Root-event effects can use the same trigger vocabulary for optional per-effect gates, as in step 2 above.

Current limitation: Conditional text passages within an individual option's post-choice narrative are not supported. Each option has a fixed outcome text. Variations that need a different following scene belong in another node, or in a follow-up event.

### Small talk and scene director (current design)

Ordinary NPC conversations are intended to deliver **useful information** and make characters and the Academy feel connected and alive, without relying solely on hand-scripted major events or generating every scene from scratch. The scene director chooses a `ChatTopic` from current simulation state, then resolves it into dialogue using pre-written `ChatTopicTexts`. Texts may be generic across speakers and places, or tailored to an NPC, activity, or location. The topic is metadata; the text is its narrative realization. See `scene-director.md` for the authoritative selection procedure.

Available topics include:

- **Lore:** world/Academy background, NPC hints, circulating news, and reports of offscreen or missed events. Public lore may be shared widely; some lore is private or excludes particular speakers.
- **Memory:** a character's meaningful or funny experience, used for callbacks, personal color, or running jokes; normally known only by NPCs who experienced or learned about it.
- **NPC routine:** information about a character's actual scheduled activities, derived from simulation routines.
- **Evergreen conversation:** general characterization or atmosphere when other topics are less relevant.

Initial topics and pre-written texts can ship with the game. New topics arise from NPC routines and event effects, with other sources possible later (for example TCG results). When Antonio chats with an NPC, the director filters to topics the NPC knows, ranks candidates with configurable weights (including a preference for topics with NPC-specific text and penalties for recent repetition), and selects one. For that topic, NPC-specific text takes precedence if available; matching activity/location variants are preferred; unused or least-recently-used variants are favored. Conversations record the chosen topic, text, and day to reduce repetition. Runtime LLM generation may serve as a fallback where no suitable pre-written text is available.

**Event authoring: `add_chat_topic`.** Hand-authored events should selectively leave conversational traces through plain effect bullets; the authoring skill converts them to `type: "add_chat_topic"`. The effect has a stable `key`, `type` (`memory` or `lore`), and `text`; optional `knownByNpcKeys`, `excludeNpcKeys`, `npcKey` (speaker-specific wording), `useOnlyOnce`, and `priority` (0–3) control delivery. Runtime fills `generatedOnDay`; the scene director favors fresher and higher-priority topics. These are **not** the old separate rumor and NPC-memory data structures.

```markdown
- Add memory `emma_memory_first_impression` for emma: Antonio attempted to introduce himself but couldn't find his words. Emma noticed and teased him.
- Add lore `emma_lore_public_promising`, exclude emma: Emma is the most promising new student at the academy.
- Add lore `emma_lore_public_promising`, speaker elsa: Emma is the most promising new student at the academy. I'm super jealous.
- Add lore `academy_lore_tuition_scandal` (use once): Someone paid three years of savings for a single term.
```

A memorable or funny experience usually deserves a **memory** for the relevant NPC(s); a declined activity or an important offscreen development can produce **lore** explaining what the NPC did independently. Spectacular public achievements may produce public lore and a separate private memory. Avoid manufacturing gossip about secrets or romantic confidences that others could not know.

**Effect timing matters:** root `## Effects` apply when an event starts; option `**Outcomes:**` apply only for the chosen branch; node entry effects apply on entering that node. Put choice-dependent memories and offscreen/decline lore in the corresponding outcomes. A topic is not itself a world-state mutation or quest condition: use regular state/tag/relationship effects for those consequences as well. For full writing conventions and additional syntax (including `known by`, `exclude`, and `speaker`), see `writing-bible.md`.
