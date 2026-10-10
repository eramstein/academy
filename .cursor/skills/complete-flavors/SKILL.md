---
name: complete-flavors
description: >-
  Fills gaps in src/data/sim/card_flavor_templates.json with names and short
  image prompts that match color, size, keywords, and actions. Use when the
  user asks to complete flavors, fill flavor coverage, add missing flavor
  templates, or cover color-pie keyword and action gaps.
---

# Complete flavor templates

Flavor templates live in `src/data/sim/card_flavor_templates.json`. A template is a card name plus a one-sentence image prompt that depicts the gameplay. Background is in `src/tools/flavor-templates/context.md`.

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

4. Write a JSON array of new templates and add them:

   ```
   node .cursor/skills/complete-flavors/scripts/add-flavors.mjs <file>
   ```

   The script rejects bad shapes, duplicate names, and duplicate image slugs. It does not rewrite existing entries.

5. Run `list-gaps` again with the same filters. Every combination you meant to close must show `missing 0` or disappear. Fix and re-add until that is true.

6. Tell the user which names were added, which gap each one covers, and how many gaps remain.

## What to write

Each template closes **one** gap: one keyword, or one action, not both.

- **name**: a flavorful card title. It must not be the mechanic label ("Haste", "Blue Flying Weak"). The title should still be readable as that creature or spell.
- **imagePrompt**: one short sentence. Subject only. No art-style words, no card frame, no "fantasy illustration".
- **Size**, for units: weak is small, young, or minor; medium is a full example of the thing; powerful is huge, ancient, or elite. Spell gap-fills use `unitSize: "medium"`.
- **Color**: one color, the gap's color. Depict that color's identity (red speed and aggression, green nature and savagery, blue magic and cunning, black industry and decay).
- **Unit type**: exactly one, taken from that color's `unitTypes` in `color-pie.ts`. Vary the type across a batch when the color has more than one.
- **Keywords / actions**: the single gap key. Units use either `keywords: ["flying"]` or `keywords: []` plus `actions: ["directDamage"]`. Spells use `keywords: []` and one action.
- **cheapImage**: `false`.
- **imageName**: omit it, or set the slug the script expects (lowercase, non-alphanumeric runs become `_`, trimmed, max 64 characters).

A flying unit looks airborne. A trample unit is heavy enough to crush what is behind it. Haste looks like it is already moving. A direct-damage spell depicts the strike, not a creature. A draw-cards spell depicts finding or revealing knowledge.

Do not reuse a name or slug already in the catalog. Do not add keywords that are not in `KEYWORD_KEYS`, and do not add action keys that are not in `actionTemplates`. Do not fill negative-preference combinations unless the user explicitly asks for that color and trait.

## Template shape

```json
{
  "name": "Gale Courier",
  "imagePrompt": "A small brass owl banks hard through a storm, wings already blurring.",
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
