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
