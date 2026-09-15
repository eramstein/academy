---
name: create-sim-effect
description: Adds a new sim effect that mutates game state and can be triggered by events, wiring it through src/lib/sim/effects, the EventEffectType enum, the SceneEffectTemplates registry, the event-builder UI, and the create-sim-event skill. Use when the user asks to add, create, or extend a game effect, an event outcome or reward that the current effect templates cannot express, or mentions EventEffectType, SceneEffectTemplates, or src/lib/sim/effects.
---

# Create a sim effect

An effect is a function that mutates `gs` (the game state) and returns the sentence the player
reads. Events reference effects indirectly: `events.json` names an *effect template*, the template
builds one or more `EventEffect` objects, and `applyEffect` dispatches on `EventEffectType` to the
effect function. Adding one means touching every link in that chain, or the effect is unreachable
or crashes at runtime.

## Request template

Free-form descriptions are fine. When the user asks for a template, or when a request is ambiguous,
use this shape:

```
Effect: <verb phrase, e.g. change a character's relation>
Parameters: <name: type, ...>
Behavior: <what changes in the game state, including edge cases>
Narration: <sentence the player reads> (optional)
Template args: <how event args map to parameters, default: pass through> (optional)
```

Unspecified details follow the conventions below; do not invent extra parameters or side effects.

## Checklist

Work through all seven in order:

| File | Change |
|---|---|
| `src/lib/sim/effects/<domain>.ts` | New: parameters interface + effect function |
| `src/lib/_model/enums-sim.ts` | New `EventEffectType` member |
| `src/lib/sim/effects/_effects.ts` | Import and register in `effectFunctions` |
| `src/lib/sim/effects/_templates.ts` | New `SceneEffectTemplates` entry |
| `src/tools/event-builder/EffectsTemplatesEditor.svelte` | `defaultArgs` case + arg inputs |
| `.cursor/skills/create-sim-event/SKILL.md` | New row in the *Effects* table |
| `.cursor/skills/create-sim-event/scripts/validate-events.mjs` | New `case` in `checkEffect` |

[example.md](example.md) shows all seven applied to one request.

## 1. The effect file

Create `src/lib/sim/effects/<domain>.ts`, named after the domain it touches rather than the single
function (`resources.ts`, `decks.ts`, `schedule.ts`, `subscribe.ts`). Add to an existing file only
when it already owns that exact domain.

```ts
import { gs } from '@/lib/_state';

export interface <Name>Parameters {
  // only JSON-serializable values: these come from events.json
}

export function <name>(parameters: <Name>Parameters): string {
  const { ... } = parameters;
  // mutate gs in place
  return `You ...`;
}
```

Conventions:

- Mutate `gs` in place; never reassign it. It is a deeply reactive proxy, so property writes are
  what the UI observes.
- Return the player-facing sentence. `applyEffect` passes the return value straight to
  `narrateText`, so an empty string still pushes an empty narration line; return one only when the
  effect narrates by itself (as `transaction` does).
- Narration is second person present tense and ends with a period: `You gain 10 magic dust.`
- Parameters reference characters, places and decks by **string key**, never by object, because they
  are authored by hand in `events.json`. Default optional ones inside the function
  (`const { schedule = {} } = parameters`).
- Validate keys defensively and return an explanatory sentence instead of throwing, the way
  `getDeck` returns `Invalid deck key: ...`. Bad data must not break the scene loop.
- Effects apply to `gs.player` unless a character key is part of the request; in that case resolve it
  with `getActingCharacter` from `../characters`, which falls back to the player.
- Reuse sim helpers rather than reimplementing rules: `../schedule`, `../time`, `../characters`,
  `../academy`, `../deck`. Import types from `@/lib/_model` and state from `@/lib/_state`.

## 2. Enum member

Add to `EventEffectType` in `src/lib/_model/enums-sim.ts`, PascalCase name with a snake_case value:

```ts
  ChangeRelation = 'change_relation',
```

## 3. Dispatch

In `src/lib/sim/effects/_effects.ts`, import the function and its parameters type, then add an entry
to `effectFunctions`:

```ts
  [EventEffectType.ChangeRelation]: (parameters) =>
    changeRelation(parameters as ChangeRelationParameters),
```

`effectFunctions` is typed `Record<EventEffectType, ...>`, so a missing entry is a compile error.
That is the safety net: after step 2, the type-check tells you what is still unwired.

## 4. Effect template

In `src/lib/sim/effects/_templates.ts`, add a `SceneEffectTemplates` entry keyed by camelCase
template name. A template returns an **array**, so one template can expand into several effects.
Unless the request specifies a transformation, pass the args through by listing each parameter
explicitly (matching the existing entries rather than spreading `args`):

```ts
  changeRelation: (args) => [
    {
      type: EventEffectType.ChangeRelation,
      parameters: { characterKey: args.characterKey, amount: args.amount },
    },
  ],
```

The template layer is where derived or computed values belong (as `enrollmentTransaction` does for
actions), keeping `events.json` free of duplicated numbers.

## 5. Event-builder UI

The template dropdown is built from `Object.keys(SceneEffectTemplates)`, so the new template shows
up on its own. Two edits in `src/tools/event-builder/EffectsTemplatesEditor.svelte` make it usable:

1. A `defaultArgs` case returning a complete, valid args object, so selecting the template never
   produces a half-filled effect.
2. Arg inputs. For flat args, extend the `{:else if effect.effectTemplate === '...'}` chain inside
   `.effect-row` and write through `setArg(i, 'key', value)`. For nested args, follow the
   `scheduleActivity` precedent: a normalize/read/write helper trio plus a block rendered under the
   row, gated by `{@const args = ...}`.

Widget choices, following the existing rows: `<select>` over `Object.values(<Enum>)` for enum args,
`<select>` over `Object.keys(PLACES)` for places, `class="input narrow"` with
`Number(...)` coercion for numbers, `class="input arg"` for text and selects. Keep Svelte 5 runes
and `onclick`/`oninput` handlers, reuse the existing classes, and add no new styling beyond what the
row needs.

## 6. Sync the event-authoring skill

`.cursor/skills/create-sim-event/SKILL.md` lists every usable template in its *Effects* table; an
effect missing from it will never be authored into an event. Add a row with the template name and
its `args` shape. If a parameter has a trap an author could get wrong (relative vs absolute days,
signed values, keys that must exist elsewhere), add a sentence under that table too.

Then teach the validator about the args. In
`.cursor/skills/create-sim-event/scripts/validate-events.mjs`, add a `case '<templateName>':` to
`checkEffect` using the existing helpers: `checkOneOf(where, label, value, allowed)` for keys and
enum values, and a `typeof` push for numbers. The lists of valid characters, places, decks and enum
values are already derived from the codebase at the top of the script.

## 7. Verify

```
npx prettier --write <changed files>
npm run check
node .cursor/skills/create-sim-event/scripts/validate-events.mjs
```

`npm run check` has pre-existing errors in the battle model and in
`src/tools/event-builder/EventForm.svelte`. Confirm none of the reported errors name your files
instead of expecting a clean run.

Then report: the effect function and its parameters, the enum value, the template name with the args
an event author writes, and the fact that the event skill and builder UI now expose it. Mention that
an effect is only reachable from an event once someone adds it to `events.json`, and offer to write
that event with the `create-sim-event` skill.
