# Flavor templates

Flavor templates give a newly created card a name and a short image prompt that fit its gameplay. A heavy creature can carry trample; a fast one can carry haste. A unit prompt is a portrait of that one creature. A spell prompt depicts the effect. The catalog is `src/data/sim/card_flavor_templates.json`. This folder's browser is how we see which combinations already have a flavor, so later passes can fill the gaps.

## Fields

- **colors** — red, green, blue, black. Identity text is in `src/data/color-pie.json`.
- **cardType** — `unit` or `spell`. The catalog also has some `land` entries; the browser lists those too.
- **unitSize** — `weak`, `medium`, or `powerful`. These are the mana bands 0–3, 4–6, and 7+.
- **keywords** — one or more from `UnitKeywords`. The name and prompt should depict that mechanic.
- **unitTypes** — usually one, from `UnitType`.
- **actions** — keys from `actionTemplates` in `src/lib/sim/cards/action-templates-data.ts`.
- **cheapImage** — `false` unless the art was made with the local cheap generator.

`name` is the card title. `imagePrompt` is the subject depiction sent to image generation. `imageName` is the file slug under `public/assets/images/cards` (saved as `imageName.jpg`; `.png` / `.webp` also count as present).

## Missing images

On demand, list templates with no matching card file:

- Browser: **Missing images** in the Flavors tool (Escape → Flavors). Uses `GET /api/missing-card-images`.
- CLI: `node src/tools/flavor-templates/list-missing-images.mjs` (add `--json` for machine output).

## Color preferences

Mechanical preferences live in `src/lib/sim/cards/color-pie.ts`. A score around +3 means the trait is strongly in that color, 0 means it is acceptable, and a negative score means it should stay uncommon. Cards can still use a trait from outside their color. Those flavors are the exception. Coverage work goes to the preferred traits first. Green does not need many flying units; blue does.

The browser treats a positive score as preferred, zero as neutral, and a negative score as rare. Rare rows stay hidden until **Show rare** is on. With several colors selected, the score shown is the highest among those colors.

Unit-type preference comes from each color's weighted `unitTypes` list in `color-pie.ts` (`{ type, weight }`). `color-pie.json` holds the color identity descriptions.

## How a query matches

The count at the top is templates that satisfy every active filter together:

- every selected color is included
- card type and size match when they are set
- every selected keyword, unit type, and action is included

Extra colors or traits on the template still match. Blue, unit, weak, and flying is the number of blue weak flying units, including cards that also have another color or another keyword. Flying and haste together means templates that have both.

With no color selected, the browser shows **unit keywords**, **unit actions**, and **spell actions** matrices (`colorTraitCoverage` / `traitCoverageMatrix` in `query.ts`). Spells do not use keywords. Each cell is the number of templates of that type that include that color and trait, plus that color's preference from `color-pie.ts`.

Coverage to fill (see the `complete-flavors` skill): a preference below 0 needs nothing. A preference of 0 or 1 needs one template. A preference above 1 needs that many templates (blue flying is +2, so each size needs two blue flying units). Units are counted per color, size, and keyword or action. Spells are counted per color and action.

Once a color is selected, the coverage grid shows that count for each single trait at each size. **All** is every template of that type and size, before the trait. Clicking a cell applies that one combination to the list.

Open the browser from the navigation menu (Escape): Flavors.
