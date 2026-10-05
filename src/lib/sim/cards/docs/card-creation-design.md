In this TCG each card is unique. They are created by players at run time, with the exception of those in base decks.

There are 2 action types that create cards, associated with the artificery class:

- Conjure: top down design, the player describes the flavor of the card (e.g. a huge dragon) and the game generates the name, image and gameplay characteristics (stats, keywords...). This is the mechanism to learn new keywords and ability types, with random results.
- Invoke: bottom up design, the player defines gameplay stats from those he knows already, and the game generates the card with an appropriate mana cost. This is the mechanism to complete a deck with cards matching its strartegy.

There are 2 action types that modify cards, associated with the enchantment class:

- Augment: makes the card stronger in exchange of extra mana cost
- Distill: makes the card cheaper at the expense of its gameplay stats

Cards have a power budget based on their mana cost, this budget can be used to "buy" gameplay stats. For example, a 3 mana cost card has a budget of 18, and one health point costs 2 budget points.

The player has CardCraftingSkills {
mastery: number;
erudition: number;
inspiration: number;
}

Mastery is used to increase the chance of extra budget when creating of modifying a card. 1 point of mastery gives 0.2 point of extra budget. The rule is extraBudget = floor(mastery \* 0.2) + resrt as a % chance for an extra point.The game automatically spends the extra points for extra stats.

Erudition sets the chance of levelling up skills. TBD.

Inspiration sets the scope of what can happen:

- on conjuration, chance of seeing new keywords or action types, and number of options generated
- on invocation, how many ingredients can be used (how precisely you can define the card you craft)
- on augment/distill, by how mana points the card can be changed

In addition to the player skills, ingredients can be used when crafting. Using N ingredients adds to the corresponding skill for the duration of that craft.

- mithril adds to mastery
- magic dust adds to inspiration
- moxes add to erudition
