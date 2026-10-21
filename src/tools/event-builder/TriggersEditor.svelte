<script lang="ts">
  import {
    ActivityType,
    DayPeriod,
    EventTriggerType,
    RelationTag,
    type EventTrigger,
    type EventTriggerParameters,
  } from '@/lib/_model';
  import { WEEK_DAYS } from '@/lib/sim/time';

  let {
    triggers,
    onChange,
    title = 'Triggers',
    description = '',
    emptyHint = 'No triggers.',
    nested = false,
  }: {
    triggers: EventTrigger[];
    onChange: (triggers: EventTrigger[]) => void;
    title?: string;
    description?: string;
    emptyHint?: string;
    nested?: boolean;
  } = $props();

  const triggerTypes = Object.values(EventTriggerType);
  const periods = Object.values(DayPeriod);
  const activityTypes = Object.values(ActivityType);
  const relationParameters = ['friendship', 'respect', 'love', 'rivalry'] as const;
  const relationTagValues = Object.values(RelationTag);
  const weekDays = WEEK_DAYS.map((name, index) => ({ name, value: index + 1 }));

  function defaultParams<T extends EventTriggerType>(triggerType: T): EventTriggerParameters[T] {
    const defaults: EventTriggerParameters = {
      [EventTriggerType.Day]: { day: 1 },
      [EventTriggerType.Period]: { periods: [DayPeriod.Morning] },
      [EventTriggerType.ActivityType]: { activityType: ActivityType.Class },
      [EventTriggerType.Place]: { placeKey: '' },
      [EventTriggerType.CharacterPresent]: { characterKey: '' },
      [EventTriggerType.RelationParameter]: {
        characterKey: '',
        relationParameter: 'friendship',
        value: 0,
      },
      [EventTriggerType.ActivityHistory]: {
        characterKey: '',
        activityType: ActivityType.Social,
        value: 1,
      },
      [EventTriggerType.DayOfWeek]: { daysOfWeek: [6, 7] },
      [EventTriggerType.ScheduledActivity]: {},
      [EventTriggerType.MatchesWon]: { characterKey: '', count: 1 },
      [EventTriggerType.MatchesLost]: { characterKey: '', count: 1 },
      [EventTriggerType.LeaguesWon]: { characterKey: '', count: 1 },
      [EventTriggerType.StoryTag]: { tag: '', value: 1 },
      [EventTriggerType.RelationTag]: {
        characterKey: '',
        relationTag: RelationTag.EmmaSmitten,
      },
      [EventTriggerType.KnownTraits]: { characterKey: '', count: 1 },
      [EventTriggerType.LastMatchWon]: {},
      [EventTriggerType.LastMatchLost]: {},
    };
    return defaults[triggerType];
  }

  function periodList(
    trigger: Extract<EventTrigger, { triggerType: EventTriggerType.Period }>
  ): DayPeriod[] {
    if (trigger.parameters.periods?.length) return trigger.parameters.periods;
    if (trigger.parameters.period) return [trigger.parameters.period];
    return [];
  }

  function replace(index: number, trigger: EventTrigger) {
    const next = [...triggers];
    next[index] = trigger;
    onChange(next);
  }

  function togglePeriod(index: number, period: DayPeriod) {
    const trigger = triggers[index];
    if (trigger?.triggerType !== EventTriggerType.Period) return;
    const current = periodList(trigger);
    const next = current.includes(period)
      ? current.filter((p) => p !== period)
      : [...current, period];
    replace(index, { ...trigger, parameters: { periods: next } });
  }

  function toggleDayOfWeek(index: number, day: number) {
    const trigger = triggers[index];
    if (trigger?.triggerType !== EventTriggerType.DayOfWeek) return;
    const current = trigger.parameters.daysOfWeek ?? [];
    const next = current.includes(day) ? current.filter((d) => d !== day) : [...current, day];
    replace(index, { ...trigger, parameters: { daysOfWeek: next.sort((a, b) => a - b) } });
  }

  function setTriggerType(index: number, triggerType: EventTriggerType) {
    replace(index, { triggerType, parameters: defaultParams(triggerType) } as EventTrigger);
  }

  function addTrigger() {
    onChange([
      ...triggers,
      { triggerType: EventTriggerType.Day, parameters: defaultParams(EventTriggerType.Day) },
    ]);
  }

  function removeTrigger(index: number) {
    onChange(triggers.filter((_, i) => i !== index));
  }
</script>

<div class="triggers-editor" class:nested>
  <div class="section-header">
    <div class="title-block">
      <h3 class:panel-title={!nested}>{title}</h3>
      {#if description}
        <p class="desc">{description}</p>
      {/if}
    </div>
    <button type="button" class="btn ghost" onclick={addTrigger}>Add</button>
  </div>

  {#if triggers.length === 0}
    <p class="hint">{emptyHint}</p>
  {:else}
    <ul class="stack">
      {#each triggers as trigger, i (i)}
        <li class="inline-row">
          <select
            class="input type-select"
            value={trigger.triggerType}
            aria-label="Trigger type"
            onchange={(e) =>
              setTriggerType(i, (e.currentTarget as HTMLSelectElement).value as EventTriggerType)}
          >
            {#each triggerTypes as type (type)}
              <option value={type}>{type}</option>
            {/each}
          </select>

          {#if trigger.triggerType === EventTriggerType.Day}
            <input
              class="input narrow"
              type="number"
              min="0"
              placeholder="day"
              bind:value={trigger.parameters.day}
              aria-label="Day (exact)"
            />
            <input
              class="input narrow"
              type="number"
              min="0"
              placeholder="minDay"
              bind:value={trigger.parameters.minDay}
              aria-label="Min day"
            />
          {:else if trigger.triggerType === EventTriggerType.Period}
            <div class="days" role="group" aria-label="Periods">
              {#each periods as period (period)}
                <label class="check day">
                  <input
                    type="checkbox"
                    checked={periodList(trigger).includes(period)}
                    onchange={() => togglePeriod(i, period)}
                  />
                  {period}
                </label>
              {/each}
            </div>
          {:else if trigger.triggerType === EventTriggerType.DayOfWeek}
            <div class="days" role="group" aria-label="Days of week">
              {#each weekDays as day (day.value)}
                <label class="check day">
                  <input
                    type="checkbox"
                    checked={trigger.parameters.daysOfWeek?.includes(day.value) ?? false}
                    onchange={() => toggleDayOfWeek(i, day.value)}
                  />
                  {day.name.slice(0, 3)}
                </label>
              {/each}
            </div>
          {:else if trigger.triggerType === EventTriggerType.ActivityType}
            <select
              class="input param-select"
              bind:value={trigger.parameters.activityType}
              aria-label="Activity"
            >
              {#each activityTypes as activity (activity)}
                <option value={activity}>{activity}</option>
              {/each}
            </select>
          {:else if trigger.triggerType === EventTriggerType.Place}
            <input
              class="input param-input"
              bind:value={trigger.parameters.placeKey}
              placeholder="place key"
              aria-label="Place key"
            />
          {:else if trigger.triggerType === EventTriggerType.CharacterPresent}
            <input
              class="input param-input"
              bind:value={trigger.parameters.characterKey}
              placeholder="character key"
              aria-label="Character key"
            />
          {:else if trigger.triggerType === EventTriggerType.RelationParameter}
            <input
              class="input param-input"
              bind:value={trigger.parameters.characterKey}
              placeholder="character key"
              aria-label="Character key"
            />
            <select
              class="input param-select"
              bind:value={trigger.parameters.relationParameter}
              aria-label="Relation parameter"
            >
              {#each relationParameters as param (param)}
                <option value={param}>{param}</option>
              {/each}
            </select>
            <input
              class="input narrow"
              type="number"
              bind:value={trigger.parameters.value}
              aria-label="Relation threshold"
              title="Negative: ≤ value; non-negative: ≥ value"
            />
          {:else if trigger.triggerType === EventTriggerType.ActivityHistory}
            <input
              class="input param-input"
              bind:value={trigger.parameters.characterKey}
              placeholder="character key"
              aria-label="Character key"
            />
            <select
              class="input param-select"
              bind:value={trigger.parameters.activityType}
              aria-label="Activity"
            >
              {#each activityTypes as activity (activity)}
                <option value={activity}>{activity}</option>
              {/each}
            </select>
            <input
              class="input narrow"
              type="number"
              min="1"
              bind:value={trigger.parameters.value}
              aria-label="Activity history count"
              title="Requires activityHistory[activityType] ≥ value"
            />
          {:else if trigger.triggerType === EventTriggerType.ScheduledActivity}
            <span
              class="param-hint"
              title="Matches when the current activity's eventId equals this event's key"
              >activity.eventId = this key</span
            >
          {:else if trigger.triggerType === EventTriggerType.MatchesWon}
            <input
              class="input param-input"
              bind:value={trigger.parameters.characterKey}
              placeholder="character key"
              aria-label="Character key"
            />
            <input
              class="input narrow"
              type="number"
              min="1"
              bind:value={trigger.parameters.count}
              aria-label="Matches won count"
              title="Requires matchesRecord.won ≥ count against this character"
            />
          {:else if trigger.triggerType === EventTriggerType.MatchesLost}
            <input
              class="input param-input"
              bind:value={trigger.parameters.characterKey}
              placeholder="character key"
              aria-label="Character key"
            />
            <input
              class="input narrow"
              type="number"
              min="1"
              bind:value={trigger.parameters.count}
              aria-label="Matches lost count"
              title="Requires matchesRecord.lost ≥ count against this character"
            />
          {:else if trigger.triggerType === EventTriggerType.LeaguesWon}
            <input
              class="input param-input"
              bind:value={trigger.parameters.characterKey}
              placeholder="character key"
              aria-label="Character key"
            />
            <input
              class="input narrow"
              type="number"
              min="1"
              bind:value={trigger.parameters.count}
              aria-label="Leagues won count"
              title="Requires league.pastWinners appearances ≥ count for this character"
            />
          {:else if trigger.triggerType === EventTriggerType.StoryTag}
            <input
              class="input param-input"
              bind:value={trigger.parameters.tag}
              placeholder="story tag"
              aria-label="Story tag"
            />
            <input
              class="input narrow"
              type="number"
              bind:value={trigger.parameters.value}
              aria-label="Story tag value"
              title="Requires storyTags[tag] ≥ value; -1 = tag absent"
            />
          {:else if trigger.triggerType === EventTriggerType.RelationTag}
            <input
              class="input param-input"
              bind:value={trigger.parameters.characterKey}
              placeholder="character key"
              aria-label="Character key"
            />
            <select
              class="input param-input"
              bind:value={trigger.parameters.relationTag}
              aria-label="Relation tag"
            >
              {#each relationTagValues as tag (tag)}
                <option value={tag}>{tag}</option>
              {/each}
            </select>
            <input
              class="input narrow"
              type="number"
              bind:value={trigger.parameters.value}
              placeholder="1"
              aria-label="Relation tag value"
              title="Omit or ≥1 = has tag; -1 = tag absent"
            />
          {:else if trigger.triggerType === EventTriggerType.LastMatchWon}
            <span class="param-hint">Player won the most recent match</span>
          {:else if trigger.triggerType === EventTriggerType.LastMatchLost}
            <span class="param-hint">Player lost the most recent match</span>
          {:else if trigger.triggerType === EventTriggerType.KnownTraits}
            <input
              class="input param-input"
              bind:value={trigger.parameters.characterKey}
              placeholder="character key"
              aria-label="Character key"
            />
            <input
              class="input narrow"
              type="number"
              min="1"
              bind:value={trigger.parameters.count}
              aria-label="Known traits count"
              title="Requires knownTraits.length ≥ count for this character"
            />
          {/if}

          <button
            type="button"
            class="btn icon danger"
            onclick={() => removeTrigger(i)}
            aria-label="Remove trigger">×</button
          >
        </li>
      {/each}
    </ul>
  {/if}
</div>

<style>
  .triggers-editor {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
    min-width: 0;
  }

  .triggers-editor.nested {
    margin-top: 0.15rem;
    padding-top: 0.45rem;
    border-top: 1px solid rgba(175, 142, 103, 0.2);
  }

  .section-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 0.5rem;
  }

  .title-block {
    display: flex;
    flex-direction: column;
    gap: 0.15rem;
    min-width: 0;
  }

  h3 {
    margin: 0;
    font-size: 0.75rem;
    font-weight: 600;
    color: var(--color-muted-label);
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }

  h3.panel-title {
    font-size: 0.85rem;
    color: var(--color-brass);
  }

  .desc {
    margin: 0;
    color: var(--color-muted-label);
    font-size: 0.75rem;
  }

  .stack {
    margin: 0;
    padding: 0;
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
  }

  .inline-row {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    flex-wrap: wrap;
  }

  .input {
    padding: 0.4rem 0.55rem;
    background: var(--color-data);
    border: 1px solid rgba(175, 142, 103, 0.35);
    border-radius: 3px;
    color: var(--color-cream);
    font: inherit;
    font-size: 0.9rem;
  }

  .input:focus {
    outline: 1px solid var(--color-brass);
    border-color: var(--color-brass);
  }

  .narrow {
    width: 4.5rem;
  }

  .type-select {
    width: 12.5rem;
    flex-shrink: 0;
  }

  .param-select {
    width: 9rem;
  }

  .param-input {
    width: 10rem;
  }

  .param-hint {
    color: #a89880;
    font-size: 0.85rem;
  }

  .days {
    display: flex;
    flex-wrap: wrap;
    gap: 0.35rem 0.55rem;
    flex: 1;
    min-width: 0;
  }

  .check {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    cursor: pointer;
    font-size: 0.9rem;
    white-space: nowrap;
  }

  .check.day {
    font-size: 0.75rem;
  }

  .hint {
    margin: 0;
    color: var(--color-muted-label);
    font-size: 0.8rem;
  }

  .btn {
    padding: 0.4rem 0.75rem;
    border-radius: 3px;
    border: 1px solid transparent;
    font: inherit;
    font-size: 0.85rem;
    cursor: pointer;
  }

  .btn.ghost {
    background: transparent;
    color: var(--color-cream);
    border-color: rgba(175, 142, 103, 0.35);
  }

  .btn.ghost:hover {
    background: rgba(255, 255, 255, 0.06);
  }

  .btn.icon {
    padding: 0.15rem 0.4rem;
    line-height: 1;
    font-size: 1.1rem;
    background: transparent;
    color: var(--color-cream);
    border-color: rgba(175, 142, 103, 0.25);
  }

  .btn.icon:hover {
    background: rgba(255, 255, 255, 0.06);
  }

  .btn.danger {
    color: #fca5a5;
    border-color: rgba(220, 38, 38, 0.35);
  }
</style>
