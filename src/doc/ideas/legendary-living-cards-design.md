# Living Legendary Cards — Design Notes

**Project:** Academy / Hordes  
**Status:** Brainstorming summary; concepts are provisional, not implemented specifications  
**Purpose:** Preserve design ideas for a future RPG ↔ TCG integration prototype.

## Core concept

Some exceptionally rare **legendary cards** are sentient. They speak to their owner during TCG matches, develop recognizable personalities and agendas, and offer optional **tactical challenges** (bargains). Fulfilling their requests grants **RPG favors**, such as special attribute-check outcomes, crafting assistance, magical resources, exploration advantages, or new quests.

This connects both sides of the game:

- **TCG → RPG:** Tactical feats earn favors, discoveries, and narrative opportunities.
- **RPG → TCG:** Quests and relationships with legendaries can unlock new card abilities, transformations, or challenge types.
- **Narrative identity:** Magical cards feel like genuine inhabitants of the world, not just equipment.
- **Optional difficulty:** Strong decks can voluntarily accept harder, distinctive win conditions without requiring a 50% baseline win rate.

**Key design test:** Does accepting a bargain cause the player to make genuinely different tactical decisions, rather than merely postpone an inevitable victory?

## Legendary personalities and requests

Each legendary may have:

- A **voice, temperament, values, and personal goals**.
- A pool of mechanically defined challenges reflecting those values.
- Characterful RPG favors and interventions.
- A persistent relationship with its owner; growing loyalty or revealed history may unlock bigger ambitions and rewards.
- Opinions about other legendaries, NPCs, and the player's tactics.

Illustrative archetypes:

| Legendary | Personality | Example bargain | Example RPG reward |
|---|---|---|---|
| **The Antler King** (green) | Regal forest spirit, values endurance and restraint | Win while losing at most one unit | One nature-related expedition check automatically succeeds |
| **The Archivist of Impossible Things** (blue) | Brilliant, pedantic scholar | Win after drawing a specified number of extra cards through effects | Bonus or special opportunity on a crafting/research check |
| **Cinder, the Unrepentant** (red) | Reckless, mischievous fire spirit | Win quickly or with a specific attack type | One-use magical courage or strength during an adventure |
| **The Count of Ashes** (black) | Calculating, sacrifice-loving aristocrat | Win after sacrificing/losing several friendly units | Necromantic reagent or limited social intervention |

These names and powers are examples, not canon.

## Three challenge formats

1. **Pre-match bargain — core format.** The player sees the objective and promised favor before play, and can prepare a deck or decline. Best for transparency, planning, and strategic risk assessment.
2. **Mid-match temptation — later signature feature.** A legendary notices the current board state and offers a tempting change of plans: for example, decline an immediate win and instead raze a particular land before finishing. Best for drama and surprise, but requires robust feasibility checks.
3. **Persistent ambition — longer character progression.** A quest across multiple matches, such as winning three games with a particular mechanic. Can lead to larger RPG quests and revelations.

Start with pre-match bargains; add the other formats after proving the core loop.

## Reusable challenge vocabulary

Build challenges from generic checks on match state and event history rather than unique code for each character.

| Category | Example | Gameplay focus |
|---|---|---|
| Victory timing | Win within a turn limit | Tempo |
| Survival | Win with no more than two friendly unit deaths | Careful trades |
| Board geography | Raze two enemy lands in different rows | Positioning and lane pressure |
| Restrictions | Win without casting spells | Deck adaptability |
| Resource behavior | Win without extra draws | Resource management |
| Finishing method | Deal lethal damage with a spell | Sequencing |
| Sacrifice | Lose/sacrifice several units and win | Sacrifice engines |
| Movement | Move a unit between rows several times | Grid-specific maneuvering |
| Legendary-specific | Trigger that card's ability three times | Deck synergy |
| Named opponent | Defeat a particular rival by a specific method | Story-linked tactics |

Combine conditions for advanced objectives. Favor challenges that engage **Hordes' grid, moving units, row combat, and razable lands** over generic time-extension objectives.

## Feasibility and presentation

- Check basic **deck feasibility** for pre-match offers (e.g., don't require flying if the deck cannot fly).
- Check the **current board state** before mid-match temptations. Avoid objectives already impossible to achieve.
- Be precise in the UI: a legendary may speak poetically, but the accepted objective must have an unambiguous rules description.
- Challenges should be difficult through tactical deviation, not arbitrary obscurity.
- The player must be free to decline without routine punishment.

## RPG favors and rewards

Possible rewards include:

- **Attribute checks:** one automatic success, reroll, or narrowly applicable critical success.
- **Crafting:** guaranteed improvement, failed-check protection, or temporary access to unusual knowledge.
- **Resources:** conjured rare ingredient or clue to a valuable resource site.
- **Exploration:** reveal a hidden location, protect against a specific wilderness hazard, or add an event option.
- **Social encounters:** limited negotiation or intimidation assistance, where thematically appropriate.
- **Narrative interventions:** the card recognizes a ruin, comments on an NPC, reveals a secret passage, or opens a new quest.

Balance favors by **scope, duration, and storage limits**. Powerful bonuses should often be single-use, context-specific, or expire after a reasonable number of opportunities. Avoid unlimited accumulation of guaranteed critical successes.

## Optional difficulty, not a replacement for balance

Legendaries are an **opt-in challenge layer** above the normal match. They can keep strong player decks engaging even when the opponent AI is weaker, but should not replace competent baseline opposition or reasonable card balance.

Potential approach: offer different bargains with different reward tiers (modest, demanding, audacious), calibrated to deck and opponent where possible. Do **not** force every match toward a 50% win rate; becoming dominant should be a valid progression fantasy. The extra reward is for taking on extra risk or restrictions.

## Avoid turning bargains into chores

- Initially allow **one active bargain per match**.
- Do not make every match demand a legendary quest for optimal progress.
- Prefer contextual favors and interesting choices over indefinitely stacking permanent bonuses.
- Prevent trivial farming through repeatable weak-opponent games, e.g. via reward eligibility, favor capacity, or diminishing returns.
- Avoid impossible, irrelevant, or overly repetitive challenges.
- Let players refuse. Personality-driven teasing is fine; blanket relationship penalties are not.

## Legendaries as miniature NPCs

Over time, cards could:

- Remember completed and failed bargains, and respond in character.
- Develop loyalty or reveal their history.
- Have conflicts with other sentient cards in the same deck.
- Give **proper RPG quests** to recover lost relics, investigate old sites, or settle their unfinished business.
- Unlock a new form, trait, card mutation, or further bargain after an RPG quest.

This produces an RPG ↔ TCG feedback cycle rather than a one-way reward faucet.

## Other ways TCG results could influence the RPG

Living cards should not be the *only* channel:

1. **Demonstrated mastery:** Significant tactical achievements unlock attention from professors, research opportunities, or unique events—not merely generic wins.
2. **Playstyle reputation:** NPCs recognize Antonio's characteristic strategies (aggressive, control-focused, unconventional), changing invitations, commissions, or opponent preparation; identities may overlap and evolve.
3. **Card provenance:** Unique cards remember creators, mutations, ownership, and important match achievements. A modest card responsible for a famous victory might become desirable to collectors or researchers.
4. **Practical demonstrations for commissions:** A patron asks Antonio to craft a card and then prove its effectiveness in a match; delivering it provides money/reputation, while keeping it may improve his deck.
5. **Ordinary relationship consequences:** Wins, losses, clever plays, and casual matches can affect respect, rivalry, friendship, prestige, and event dialogue.

## Emma-specific opportunities

- **Collaborative research:** Emma and Antonio must demonstrate a theoretical crafting breakthrough in actual matches; different outcomes influence their research and rivalry.
- **Professional commission:** A card must prove itself in a public test before a merchant pays a premium.
- **Unconventional victory:** Antonio defeats Emma by a method she considers unsound, triggering an argument, rematch, or research event.
- **Adventure bridge:** A legendary recognizes an ingredient from an expedition and offers a match challenge whose reward helps in a follow-up adventure.
- **Joint-created Falkenheim card:** Its unusual illustration could foreshadow sentience, without requiring the card to become legendary immediately. This is an optional story hook, not an established fact.

## Proposed minimal prototype

- **Two legendaries** with strongly contrasting personalities.
- **Three reusable challenge templates each**.
- **One accepted bargain per match**.
- Mostly **pre-match objectives**, possibly one scripted mid-match temptation for evaluation.
- **Three RPG favor families**: attribute-check aid, crafting intervention, and rare-resource reward.
- Persist the record of accepted, completed, and failed bargains, plus the active favor.
- Instrument whether a bargain changes moves, deck choice, perceived challenge, and enjoyment.

**Prototype success criteria:** Players understand the objectives, can realistically pursue them, make meaningful tactical sacrifices to do so, enjoy the character commentary, and value the RPG rewards without feeling obliged to grind every match.

## Open questions for later design

- Must a legendary be **included in the current deck**, drawn, or played for its bargain to activate?
- Can multiple living cards converse while only one bargain is active?
- How are challenge pools generated and feasibility evaluated efficiently?
- How much state should each legendary remember, and how should its owner relationship be represented?
- What are the precise favor inventory, expiration, and anti-farming rules?
- Which RPG effects can be expressed by the existing event-condition/effect system, and which require new support?
- How can opponent difficulty and deck archetype inform reward tiers without incentivizing exploits?

---

*Guiding principle: Winning is the baseline goal; with a living legendary involved, **how you win** becomes a meaningful choice with consequences beyond the match.*
