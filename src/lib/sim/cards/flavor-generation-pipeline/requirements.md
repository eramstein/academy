# Flavor Generation Pipeline

## High level overview and intergration in the wider gameplay

The goal of this pipeline is to use AI to generate card names and images from their gameplay properties, store them in JSON files at design time and a local database at runtime, and query them at runtime.

Unlike typical card games, the cards don't exist as the game starts. They get created by the player as the game goes. The game card creation actions (conjuration, invocation) will generate a "gameplay template" (gameplay properties such as keywords), and the card generation pipeline will then either find an existing a "flavor template" and image file that match this gameplay template, or use AI to produce new ones and store them for later re-use.

## Data model

Gampeplay template:

- card type (unit or spell)
- colors
- power level (weak/medium/powerful, derived from mana cost (0-3 is weak, 4-6 is medium, 7+ is powerful))
- (optional) keywords (for units only)
- (optional) action templates names (extracted from those used in abilities in case of units)
- (optional) unit types (for units only)

Flavor template:

- evertything from the game template (this will be used to query them to see if one already matches a given new gameplay template)
- name
- image file name
- image prompt for AI generation
- "cheap image" flag (whether it was a quick local generation or a better quality API call)

## Generation tools

We'll use AI to generate a new Flavor template from a given Gameplay template.

The first step is to create the card name, a prompt for the image generation, and a unit type if it wasn't already in teh gameplay temlplate. This will be done by the same remote LLM API we use in lib/llm (e.g. Mistral).

The second step is to pass the image generation prompt to a local Comfy API that will generate a quick and cheap image locally, and tagged as such in the flavor template.

In parrallel, an ongoing polling process will over time replace the cheap images with better ones from a remote API, managing the limits of the API (e.g. 6 images a day).

Card images should be 512\*512 JPG files. The "npm run images" acript can help ensure this format.

## Persistence

The generated images will be in public/assets/images/cards

The flavor templates will be stored at design time as data in src/data/sim/card_flavor_templates.json

At runtime, when a new game is started with initSim, we need to start keeping track of which flavor templates have been used for a card already or not. A local IndexedDB table will be used for that.

## Querying and matching

For a given gameplay template, we'll need to check if we already have a matching unused flavor template.

This should be done using some fuzzy search: score flavor templates based on matching properties with the given gameplay template, and if at least one is above a given threshold (to be tweaked later), return the best scoring one.

## Logic flow

1. The player performs a conjuration or invocation action: this requests a new card generation using the getUnitTemplate or getSpellTemplate functions (note: these function currently use a simple pickFlavorTemplate function that needs to be replaced by this new process).
2. A gameplay template is created (we can simply derive it from the templateParameters we already are creating, it's pretty close)
3. We look up the database for a matching existing and unused flavor template. If yes, return it and use it.
4. If no existing flavor template matches, we create one.
   4.1. Call remote LLM to get name, image prompt and optionnally unit type
   4.2. Call local Comfy API to generate a cheap image
   4.3. Store the image in the assets folder, and add the flavor template to the JSON file.
5. Return the generated flavor template so that the conjuration or invocation action can continue and use the name and image file name.
