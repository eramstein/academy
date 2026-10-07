# Events system overview

Events are narrative elements of the sim. They explore NPCs stories and develop their character/relationship arcs.
Mechanically, they are mutually exclusive options to get more power on the TCG side (e.g. new cards) or on the sim side (e.g. get resources).
The goal design-wise is that each event offers interesting choices to make, and that each run offers a unique combination of events.

# Event trigger logic

Events are losely organized as graphs centered around NPCs ("character arcs").
It is not structly graphs, event triggers are functions that check the game state for any sort of data, but a very common condition is presence of a NPC, relation status with that NPC, and occurence of a previous event.
Relation statuses don't grow over time, these are "points" consumed by events. Actions used on socialization are investments for event rewards.
Any socialize action should trigger an event, at least a generic one.

# Event options

Options should offer interesting strartegic choices, i.e. have equivalent value in terms of TCG power level outcomes. They should be usually positive, but some negative outcomes as a gateway for further rewards are good options too.

Rewards include:

- cards
- gold
- resources (including unique ones with interesting effects like unique ability for a card)
- jobs
- subscription
- crafting skill up
- crafting knowledge (including new colors)
- unlock new NPC
- unlock new place
- level up attribute
- maybe later if we implement team tournaments: team mate, level up NPC skills

# Recurring semi generic events

When we run out of pre written events, we could fall back on LLM generated events. e.g. +1 friendship gets a new card
