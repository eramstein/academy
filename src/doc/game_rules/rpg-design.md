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

Cards are created during artificery lessons, either via conjuration (top down design: you set a flavor/theme, and the game generates the gameplay attributes, e.g. I ask for a dragon, I get a red 5/5/2 flying) or invocation (bottom up design: I ask for a green 2/2/0 which heals, I get a halfing druid with a matching name and illustration). They can then further be fine tuned in enchantment classes (remove stats to make them cheaper, or vice versa). The player can use crafting resources (ingredients) to get more flexibility or power when crafting, and level skills and knowledge that open more possibilities in terms of gameplay capabilities of the created cards.

The RPG facet lets the player acquire cards (gifts from NPCs, quest rewards...), resources (common or unique) and level up skills to help them improve their card collection.

Some rare late game cards will be "legendary". They will have their own "free will" and act as NPCs: give you quests, give you special powers in the RPG in exchange of special extra difficulty during a match (e.g. reroll attribute checks...) etc... This is a mechanic to let the TCG aspect influence the RPG in more diverse ways than tournament results.

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
2. The event may apply an unconditional effect to the game state, regardless of the player's subsequent choice.
3. The player is presented with a set of authored options.
4. The selected option resolves either through a deterministic game-state effect or through a skill check, which determines the outcome and resulting state changes.
5. If that option names a next node — or the skill-check branch names one — that node is shown immediately, with its own text, image, and options. Entry triggers are judged when the previous beat's choices are built: a choice is hidden when every way forward leads to a locked node. A node with no available options ends the event. A branch that points at a locked node ends the event on that branch instead of opening it.
6. Otherwise the event ends. Its occurrence, the player's choice, and relevant results can then be referenced by other events' trigger conditions. Remember a branch with a story tag on the option that leads there; the node path itself is not a separate event id.

Conditional event options and text (current implementation)

Individual event options may define trigger conditions using the existing game-state criteria. An option is displayed only when its conditions are satisfied. This allows choices to depend on previous encounters, relationships, skills, resources, or other state. The same conditions can gate a node, but they are read before the choice's effects, so a choice cannot unlock the node it opens.

The root narrative and each node's narrative support conditional text passages, which are resolved according to game state when that beat is shown.

Current limitation: Conditional text passages within an individual option's post-choice narrative are not supported. Each option has a fixed outcome text. Variations that need a different following scene belong in another node, or in a follow-up event.

### Relationship narrative design direction (to prototype)

The intended approach is a hybrid between fixed, on-rails character arcs and disconnected standalone anecdotes:

- **Numeric relationship values** (friendship, respect, love, rivalry) provide flexible prerequisites, with many ways to reach a threshold.
- **Mini-arcs** connect small groups of events through prior occurrences, choices, and outcomes, giving local narrative continuity.
- **Milestones and relationship tags** represent qualitative changes (for example, becoming significant others) and can gate later events. Major goals, such as a possible marriage, should require meaningful developments and choices rather than repeated numerical grinding.

The aim is to let different playthroughs produce different yet coherent illustrated stories with each NPC. Emma's relationship arc will be used as an initial design prototype. The precise milestone structure and event-selection rules are not yet finalized.
