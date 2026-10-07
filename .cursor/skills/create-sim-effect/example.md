# Worked example

Request: _"add an effect that changes how a character feels about the player: parameters are the
character key, which relation parameter, and by how much."_

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

## 4. `src/tools/event-builder/EffectsTemplatesEditor.svelte`

Add the option list next to the other ones at the top of the script:

```ts
const relationParameters = ['friendship', 'respect', 'love', 'rivalry'] as const;
```

Add the defaults case:

```ts
      case EventEffectType.ChangeRelation:
        return { characterKey: '', relationParameter: 'friendship', amount: 1 };
```

Extend the parameter chain inside `.effect-row`, after the `AddResource` branch:

```svelte
            {:else if effect.type === EventEffectType.ChangeRelation}
              <input
                class="input arg"
                value={effect.parameters.characterKey ?? ''}
                placeholder="character key"
                aria-label="Character key"
                oninput={(e) =>
                  setParameter(i, 'characterKey', (e.currentTarget as HTMLInputElement).value)}
              />
              <select
                class="input arg"
                value={effect.parameters.relationParameter ?? 'friendship'}
                aria-label="Relation parameter"
                onchange={(e) =>
                  setParameter(i, 'relationParameter', (e.currentTarget as HTMLSelectElement).value)}
              >
                {#each relationParameters as param (param)}
                  <option value={param}>{param}</option>
                {/each}
              </select>
              <input
                class="input narrow"
                type="number"
                value={effect.parameters.amount ?? 0}
                aria-label="Amount"
                oninput={(e) =>
                  setParameter(i, 'amount', Number((e.currentTarget as HTMLInputElement).value))}
              />
```

No `min` on the amount input, since a negative amount is meaningful here.

## 5. `.cursor/skills/create-sim-event/SKILL.md`

New row in the _Effects_ table:

```md
| `change_relation` | `{ characterKey, relationParameter: "friendship" \| "respect" \| "love" \| "rivalry", amount: 1 }` |
```

And a sentence under the table, because the sign matters and the interaction with relation triggers
is easy to miss:

```md
`change_relation` takes a signed `amount`; a negative value damages the relation. Remember that a
`relation_parameter` trigger resets the relation to 0 when the event fires, so an event that both
requires and grants friendship ends up at the granted amount.
```

## 6. `.cursor/skills/create-sim-event/scripts/validate-events.mjs`

New case in `checkEffect`:

```js
    case 'change_relation':
      checkOneOf(where, 'characterKey', parameters.characterKey, characterKeys);
      checkOneOf(where, 'relationParameter', parameters.relationParameter, [
        'friendship',
        'respect',
        'love',
        'rivalry',
      ]);
      if (typeof parameters.amount !== 'number') errors.push(`${where}: amount must be a number`);
      break;
```

## Authoring it into an event

```json
{
  "type": "change_relation",
  "parameters": { "characterKey": "molly", "relationParameter": "friendship", "amount": 1 }
}
```
