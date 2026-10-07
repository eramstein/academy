---
name: create-sim-effect
description: Adds a new sim effect that mutates game state and can be triggered by events, wiring it through src/lib/sim/effects, the EventEffectType enum, the event-builder UI, and the create-sim-event skill. Use when the user asks to add, create, or extend a game effect, an event outcome or reward that the current effect types cannot express, or mentions EventEffectType or src/lib/sim/effects.
---

# Create a sim effect

An effect is a function that mutates `gs` (the game state) and returns the sentence the player
reads. Events author `EventEffect` objects directly (`type` + `parameters`); `applyEffect`
dispatches on `EventEffectType` to the effect function. Adding one means touching every link in
that chain, or the effect is unreachable or crashes at runtime.

## Request template

Free-form descriptions are fine. When the user asks for a template, or when a request is ambiguous,
use this shape:

```
Effect: <verb phrase, e.g. change a character's relation>
Parameters: <name: type, ...>
Behavior: <what changes in the game state, including edge cases>
Narration: <sentence the player reads> (optional)
```

Unspecified details follow the conventions below; do not invent extra parameters or side effects.

## Checklist

Work through all six in order:

| File                                                          | Change                                      |
| ------------------------------------------------------------- | ------------------------------------------- |
| `src/lib/sim/effects/<domain>.ts`                             | New: parameters interface + effect function |
| `src/lib/_model/enums-sim.ts`                                 | New `EventEffectType` member                |
| `src/lib/sim/effects/_effects.ts`                             | Import and register in `effectFunctions`    |
| `src/tools/event-builder/EffectsTemplatesEditor.svelte`       | `defaultParameters` case + parameter inputs |
| `.cursor/skills/create-sim-event/SKILL.md`                    | New row in the _Effects_ table              |
| `.cursor/skills/create-sim-event/scripts/validate-events.mjs` | New `case` in `checkEffect`                 |

[example.md](example.md) shows all six applied to one request.

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

## 4. Event-builder UI

The type dropdown is built from `Object.values(EventEffectType)` (minus action-only / unwired
types). Two edits in `src/tools/event-builder/EffectsTemplatesEditor.svelte` make it usable:

1. A `defaultParameters` case returning a complete, valid parameters object, so selecting the type
   never produces a half-filled effect. If the new type was filtered out of `effectTypes`, add it.
2. Parameter inputs. For flat parameters, extend the `{:else if effect.type === EventEffectType....}`
   chain inside `.effect-row` and write through `setParameter(i, 'key', value)`. For nested
   parameters, follow the `ScheduleActivity` precedent: a normalize/read/write helper trio plus a
   block rendered under the row, gated by `{@const args = ...}`.

Widget choices, following the existing rows: `<select>` over `Object.values(<Enum>)` for enum args,
`<select>` over `Object.keys(PLACES)` for places, `class="input narrow"` with
`Number(...)` coercion for numbers, `class="input arg"` for text and selects. Keep Svelte 5 runes
and `onclick`/`oninput` handlers, reuse the existing classes, and add no new styling beyond what the
row needs.

## 5. Sync the event-authoring skill

`.cursor/skills/create-sim-event/SKILL.md` lists every usable effect in its _Effects_ table; an
effect missing from it will never be authored into an event. Add a row with the snake_case `type`
and its `parameters` shape. If a parameter has a trap an author could get wrong (relative vs absolute
days, signed values, keys that must exist elsewhere), add a sentence under that table too.

Then teach the validator about the parameters. In
`.cursor/skills/create-sim-event/scripts/validate-events.mjs`, add a `case '<snake_case_type>':` to
`checkEffect` using the existing helpers: `checkOneOf(where, label, value, allowed)` for keys and
enum values, and a `typeof` push for numbers. The lists of valid characters, places, decks and enum
values are already derived from the codebase at the top of the script.

## 6. Verify

```
npx prettier --write <changed files>
npm run check
node .cursor/skills/create-sim-event/scripts/validate-events.mjs
```

`npm run check` has pre-existing errors in the battle model and in
`src/tools/event-builder/EventForm.svelte`. Confirm none of the reported errors name your files
instead of expecting a clean run.

Then report: the effect function and its parameters, the enum value / snake_case type an event
author writes, and the fact that the event skill and builder UI now expose it. Mention that an
effect is only reachable from an event once someone adds it to `events.json`, and offer to write
that event with the `create-sim-event` skill.
