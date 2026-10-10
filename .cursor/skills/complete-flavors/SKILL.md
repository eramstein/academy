---
name: complete-flavors
description: >-
  Fills gaps in src/data/sim/card_flavor_templates.json with names and short
  image prompts that match color, size, keywords, and actions. Use when the
  user asks to complete flavors, fill flavor coverage, add missing flavor
  templates, or cover color-pie keyword and action gaps.
---

# Complete flavor templates

Flavor templates live in `src/data/sim/card_flavor_templates.json`. A template is a card name plus a one-sentence image prompt. A unit prompt is a portrait of the creature. A spell prompt depicts the effect. Background is in `src/tools/flavor-templates/context.md`.

## Quota

Only combinations whose color-pie preference is **0 or higher** need templates. Negative preferences stay empty.

- Preference 0 or 1: **1** template.
- Preference greater than 1: **that many** templates. Blue flying is +2, so each size needs at least 2 blue flying units.

Count a template when it **includes** that color and that one keyword or action. Extra colors or traits still count.

| Card | Combination |
| --- | --- |
| Unit | color × unitSize (`weak`, `medium`, `powerful`) × keyword |
| Unit | color × unitSize × action |
| Spell | color × action. Spells have no keyword quota and are not split by size. |

Preferences and unit types come from `src/lib/sim/cards/color-pie.ts`. Keyword meaning is in `src/lib/ui/_helpers/keywordTooltips.ts`. Action meaning is the `description` on each entry in `src/lib/sim/cards/action-templates-data.ts`. Color identity is in `src/data/color-pie.json`.

## Workflow

1. List the gaps:

   ```
   node .cursor/skills/complete-flavors/scripts/list-gaps.mjs
   ```

   Optional filters: `--color blue`, `--facet keyword`, `--facet action`.

2. Fill one batch, then stop and report what is left. A batch is one color, or 12 templates, whichever the user asked for. "Fill the gaps" with no scope means the first 12 missing templates in the script output. "Fill blue" or "fill all" means keep batching that scope until `list-gaps` prints `OK` for it.

3. Read the tooltip, action description, and color identity for every trait in the batch before naming anything.

4. If the batch includes units, allocate types before naming any of them. `--count` is the number of units only, not spells:

   ```
   node .cursor/skills/complete-flavors/scripts/allocate-types.mjs --color green --count 55
   ```

   The printed counts are the batch's unit-type quota. They must sum to `--count`. A rare type may print `0` in a small batch; leave it out.

5. Write a JSON array of new templates and add them:

   ```
   node .cursor/skills/complete-flavors/scripts/add-flavors.mjs <file>
   ```

   The script rejects bad shapes, duplicate names, and duplicate image slugs. It does not rewrite existing entries.

6. Run `list-gaps` again with the same filters. Every combination you meant to close must show `missing 0` or disappear. Fix and re-add until that is true.

7. Tell the user which names were added, which gap each one covers, and how many gaps remain.

## Unit types

`unitTypes` in `color-pie.ts` is `{ type, weight }[]`. Weight is relative probability. It does not change how many templates a keyword or action needs. Only units use it.

Spread the quota across sizes and gaps. Do not spend one type on a single mechanic. Pair a type with a mechanic its body can suggest (a massive elk for trample, a dryad whose own bark is knitting for regeneration) without letting that pairing change the counts.

**Variety.** Each card of a type is a different medieval-fantasy trope. Read the comment on `UnitType` in `src/lib/_model/enums-battle.ts` for what the type includes. Do not repeat a species, role, or image subject in the batch, and avoid creatures already common for that color in the catalog.

Use the usual medieval-fantasy version of the type. These are starting points, not a closed list:

| Type | Tropes |
| --- | --- |
| beast | wolf, bear, boar, stag, elk, lynx, ram, hound, horse, serpent, owl |
| plant | oak, yew, briar, ivy, fern, willow, nightshade, treant, tumbleweed |
| mushroom | morel, chanterelle, fly agaric, deathcap |
| human | druid, ranger, herbalist, warden, huntress, hermit |
| halfing | gardener, shirriff, burrow-delver, orchard-keeper, hill elder |
| elf | wood elf, glade page, thornbinder, wildspeaker |
| spirit | dryad, pixie, sprite, nymph, leshy, will-o'-wisp (fey, not a plant or beast) |
| elemental | living sap, loam, peat, briar, moss |
| monster | ettin, hydra, basilisk, manticore, owlbear (not a plain animal) |
| insect | beetle, mantis, wasp, moth, ant |
| giant | giant, troll, ogre |
| dwarf | smith, thane, miner, berserker |
| dragon | drake, wyrm, wyvern |
| demon | devil, imp, fiend |
| undead | skeleton, zombie, wight, ghost |
| construct | golem, automaton, brass animal |
| building | tower, gatehouse, barricade |
| greenskin | orc, goblin |

A creature belongs to the type the color actually lists. A troll is a giant when the color has giant; otherwise it can be a monster. A dryad is a spirit when the color has spirit.

The field value stays the enum string, including `halfing`. The portrait should still make that type obvious: an elf reads as an elf, a halfling as a halfling, an elemental as living matter.

## What to write

Each template closes **one** gap: one keyword, or one action, not both.

- **name**: a flavorful card title. It must not be the mechanic label ("Haste", "Blue Flying Weak"). The title should still be readable as that creature or spell.
- **imagePrompt**: one short sentence. Subject only. No art-style words, no card frame, no "fantasy illustration".
  - **Units**: the creature is the only subject and the centerpiece. Describe its silhouette, scale, and one or two signature features so it is evocative, unique, and recognizable at a glance. Do not show it acting the mechanic out on someone else, and do not add other creatures, victims, or bystanders. Suggest the keyword or action through that creature's own body: spread wings, crushing bulk, dripping fangs, bark closing over its own scar. A pose of the creature itself is fine. A scene is not.
  - **Spells**: depict the effect. A direct-damage spell depicts the strike, not a creature. A draw-cards spell depicts finding or revealing knowledge.
- **Size**, for units: weak is small, young, or minor; medium is a full example of the thing; powerful is huge, ancient, or elite. Spell gap-fills use `unitSize: "medium"`.
- **Color**: one color, the gap's color. Depict that color's identity (red speed and aggression, green nature and savagery, blue magic and cunning, black industry and decay).
- **Unit type**: exactly one string value from that color's weighted `unitTypes` (`plant`, `halfing`, not the enum key). Match the `allocate-types.mjs` counts for the batch. Spells have no unit type.
- **Keywords / actions**: the single gap key. Units use either `keywords: ["flying"]` or `keywords: []` plus `actions: ["directDamage"]`. Spells use `keywords: []` and one action.
- **cheapImage**: `false`.
- **imageName**: omit it, or set the slug the script expects (lowercase, non-alphanumeric runs become `_`, trimmed, max 64 characters).

A flying unit has a clear airborne silhouette. A trample unit is heavy and broad enough that its bulk reads as unstoppable. Haste looks lean and coiled. Poison looks venomous. Regeneration shows on the creature's own hide or bark.

Do not reuse a name or slug already in the catalog. Do not add keywords that are not in `KEYWORD_KEYS`, and do not add action keys that are not in `actionTemplates`. Do not fill negative-preference combinations unless the user explicitly asks for that color and trait.

## Template shape

```json
{
  "name": "Gale Courier",
  "imagePrompt": "A palm-sized brass owl with wings spread wide and a bright glass eye.",
  "cardType": "unit",
  "unitSize": "weak",
  "cheapImage": false,
  "colors": ["blue"],
  "keywords": ["flying"],
  "unitTypes": ["construct"]
}
```

```json
{
  "name": "Borrowed Thunder",
  "imagePrompt": "A crack of stolen lightning leaps from an open palm toward a distant figure.",
  "cardType": "spell",
  "unitSize": "medium",
  "cheapImage": false,
  "colors": ["red"],
  "keywords": [],
  "actions": ["directDamage"]
}
```
