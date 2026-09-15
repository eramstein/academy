# Worked example

Request: *"add an effect that changes how a character feels about the player: parameters are the
character key, which relation parameter, and by how much."*

## 1. `src/lib/sim/effects/relations.ts` (new)

```ts
import type { Npc } from '@/lib/_model';
import { gs } from '@/lib/_state';

export interface ChangeRelationParameters {
  characterKey: string;
  relationParameter: keyof Npc['relationProgress'];
  amount: number;
}

export function changeRelation(parameters: ChangeRelationParameters): string {
  const { characterKey, relationParameter, amount } = parameters;
  const character = gs.characters[characterKey];
  if (!character) {
    return `Invalid character key: ${characterKey}.`;
  }
  character.relationProgress[relationParameter] += amount;
  const direction = amount >= 0 ? 'improves' : 'worsens';
  return `Your ${relationParameter} with ${character.name} ${direction}.`;
}
```

The character comes from `gs.characters` rather than `getActingCharacter` because only NPCs have
`relationProgress`, and an unknown key returns a sentence instead of throwing.

## 2. `src/lib/_model/enums-sim.ts`

```ts
export enum EventEffectType {
  GetDeck = 'get_deck',
  Subscribe = 'subscribe',
  AddResource = 'add_resource',
  ScheduleActivity = 'schedule_activity',
  ChangeRelation = 'change_relation',
}
```

## 3. `src/lib/sim/effects/_effects.ts`

```ts
import { changeRelation, type ChangeRelationParameters } from './relations';

const effectFunctions: Record<EventEffectType, (parameters: Record<string, any>) => string> = {
  // ...existing entries
  [EventEffectType.ChangeRelation]: (parameters) =>
    changeRelation(parameters as ChangeRelationParameters),
};
```

## 4. `src/lib/sim/effects/_templates.ts`

```ts
  changeRelation: (args) => [
    {
      type: EventEffectType.ChangeRelation,
      parameters: {
        characterKey: args.characterKey,
        relationParameter: args.relationParameter,
        amount: args.amount,
      },
    },
  ],
```

## 5. `src/tools/event-builder/EffectsTemplatesEditor.svelte`

Add the option list next to the other ones at the top of the script:

```ts
  const relationParameters = ['friendship', 'respect', 'love', 'rivalry'] as const;
```

Add the defaults case:

```ts
      case 'changeRelation':
        return { characterKey: '', relationParameter: 'friendship', amount: 1 };
```

Extend the arg chain inside `.effect-row`, after the `addResource` branch:

```svelte
            {:else if effect.effectTemplate === 'changeRelation'}
              <input
                class="input arg"
                value={effect.args.characterKey ?? ''}
                placeholder="character key"
                aria-label="Character key"
                oninput={(e) =>
                  setArg(i, 'characterKey', (e.currentTarget as HTMLInputElement).value)}
              />
              <select
                class="input arg"
                value={effect.args.relationParameter ?? 'friendship'}
                aria-label="Relation parameter"
                onchange={(e) =>
                  setArg(i, 'relationParameter', (e.currentTarget as HTMLSelectElement).value)}
              >
                {#each relationParameters as param (param)}
                  <option value={param}>{param}</option>
                {/each}
              </select>
              <input
                class="input narrow"
                type="number"
                value={effect.args.amount ?? 0}
                aria-label="Amount"
                oninput={(e) =>
                  setArg(i, 'amount', Number((e.currentTarget as HTMLInputElement).value))}
              />
```

No `min` on the amount input, since a negative amount is meaningful here.

## 6. `.cursor/skills/create-sim-event/SKILL.md`

New row in the *Effects* table:

```md
| `changeRelation` | `{ characterKey, relationParameter: "friendship" \| "respect" \| "love" \| "rivalry", amount: 1 }` |
```

And a sentence under the table, because the sign matters and the interaction with relation triggers
is easy to miss:

```md
`changeRelation` takes a signed `amount`; a negative value damages the relation. Remember that a
`relation_parameter` trigger resets the relation to 0 when the event fires, so an event that both
requires and grants friendship ends up at the granted amount.
```

## 7. `.cursor/skills/create-sim-event/scripts/validate-events.mjs`

New case in `checkEffect`:

```js
    case 'changeRelation':
      checkOneOf(where, 'characterKey', args.characterKey, characterKeys);
      checkOneOf(where, 'relationParameter', args.relationParameter, [
        'friendship',
        'respect',
        'love',
        'rivalry',
      ]);
      if (typeof args.amount !== 'number') errors.push(`${where}: amount must be a number`);
      break;
```

## Authoring it into an event

```json
{
  "effectTemplate": "changeRelation",
  "args": { "characterKey": "molly", "relationParameter": "friendship", "amount": 1 }
}
```
