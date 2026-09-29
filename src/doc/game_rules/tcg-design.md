# Hordes Design

Hordes is a TCG inspired by games lile Magic and Artifact.

## Gameplay Overview

Like in most TCGs, players come with their own decks of cards. Each card is unique and can have many varied abilities. The cards are played on a small grid board. Cards are units and spells. Units attack in front of their row, damaging blocking units or lands,and then opposiing players. When a player reaches 0 hit points, the game ends.

## Cards

All cards have an id/name, rarity (common, uncommon, rare, legendary), image, a type (spell or unit), a mana cost (a number) and a color requirement.

Spells have effects that are resolved immediately and are then discarded to the graveyard zone.

Units are deployed on a cell of the board, and have additional attributes: attack damage, health (max and current), retaliation damage, various keywords (trample, haste, poison...), and activated abilities (triggers on events like on move or on deploy).

Lands are special cards deployed initially on the board, which have health points and various abilities. One of their key purpose is to let players increment their colored mana values.

## Card Abilities

Units have health and attack values. Damage remains on turn end.
They optionally have keywords and abilities.
Keywords are static, common features, such as haste or trample. They can have an associate number, like armor 3 or poison 2.
Abilities are activated (by a player), triggered, or static (always active). Triggers can be like OnDeploy or OnMove. Abilities effects can have a target (unit or cell) and/or a range (e.g. all ennemies in the same row). When an ability is played or triggered, targets are chosen and one or several actions happen.

Example of ability: "When an ennemy unit moves, you draw one card and deal one damage to target unit". This is a triggered ability, it is checked when a unit moves and triggers if it is controlled by the opponent. When it triggers, the player has to target a unit, and then 2 actions occur: draw card and do damage.

Spells are simpler: a list of actions (effect + targets). They go directly yo the graveyard after being played.

Lands have abilities like creatures, static, activated or triggered, but can't move or attack. When they are razed (0 HP), they get replaced by their razed version, which is functionnaly another land (also with abilities) but it can't be attacked or block attackers.

### Board and units interactions

The board is divided in 6 columns and 4 rows. The first player (human) controls the first 3 columns, and the second (AI opponent) the 3 other columns. The first column for each player contains Land cards, which are deployed at the start of the game automatically. The other columns can host units which can move and attack in front of their row. Each player can deploy and move units only on their own columns.

When a unit attacks, it targets the ennemy unit closest to it on the same row. If there isn't one, it attacks the land in front of it. If the land was already razed, it attacks the opponent player. Some keywords like ranged or flying can be exceptions to this.

When a unit is destroyed, it does into the "graveyard", an abstract zone disting from the board.

Units have "summoning sickness": they can't attack or move the turn they are deployed. Each unit can either move or attack in a turn, and can only move or attack once. Some keywords can be an exception to this (e.g. hatse or moveAndAttack).

### Turn sequence

Players play in turn.

When a turn starts, mana pools are reset to their previous max mana + 1, and one card is drawn. If the deck was empty, the player takes one damage.

Triggers that happen on start of turn are checked, and then the acting player can play cards, move units and attack, in any order they want. The opponent can not do anything during a player's turn.

### Mana and colors

Cards (spells and units) cost mana to play. Players start with 2 mana and then get one more each turn. Unused mana is lost at end turn.

There are 2 types of mana constraint:

- mana cost, a plain number
- color thresholds

There are 4 colors (blue, green, red, black), each card can have 1 color (most usual) or more. Color requirement are quantified like "2 green and 1 blue". Players start the game with a color threshold of 0 for each color and must increase these to play their cards.

The main way to increase color thresholds is using lands. Each player selects N lands for their deck. These cards don't get shuffled with the others, they are deployed behind the towers before the match starts and provide effects in their regions. In 1v1, there are 6 lands per player, 2 per region.

"Basic lands" have no other effect than unlocking a color, other lands can have effects like drawing a card. Each turn, players get to activate one of their lands in each region. It doesn't count as an action and doesn't pass priority. So for example they can activate their green basic land to increase their green threshold by one.

Cards get a "power budget" based on their cost and color requirements. For example a 1 mana card will typically be very weak, but can be stronger if it has high color requirements as it will require to wait to play it.

### Color pie

Like in MTG, each color will have preferred effect types, crerature profiles, strength and weaknesses.

Players can potentially play the 4 colors in their decks, but it is balanced in 2 ways: they miss out abilities of "colorless" lands, and upping color thresholds takes more time if you have more colors.

- Green (G): large units, buffs, healing, mana acceleration
- Red (R): aggressive units, randomness, direct damage
- Black (B): defensive units, reanimation, debuffs, removal
- Blue (U): small units, board manipulation, control spells, card draw

2 color combinations are thematically linked to middle ages cultures and legend:

- Miguard (RG)
- Slavic (UG)
- Hibernia (GB)
- Frankish (RB)
- Arabia (RB)
- Italia (BU)
