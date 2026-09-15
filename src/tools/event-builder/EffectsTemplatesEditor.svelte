<script lang="ts">
  import { PLACES } from '@/data/sim/places';
  import {
    ActivityType,
    ClassType,
    DayPeriod,
    JobType,
    ResourceType,
    type EventEffectsTemplate,
    type Job,
    type Schedule,
    type ScheduledActivity,
  } from '@/lib/_model';
  import { SceneEffectTemplates } from '@/lib/sim/effects/_templates';
  import { WEEK_DAYS } from '@/lib/sim/time';

  let {
    effects,
    onChange,
    title = 'Effects',
    description = '',
    nested = false,
  }: {
    effects: EventEffectsTemplate[];
    onChange: (effects: EventEffectsTemplate[]) => void;
    title?: string;
    description?: string;
    nested?: boolean;
  } = $props();

  const effectNames = Object.keys(SceneEffectTemplates);
  const resourceTypes = Object.values(ResourceType);
  const activityTypes = Object.values(ActivityType);
  const classTypes = Object.values(ClassType);
  const jobTypes = Object.values(JobType);
  const periods = Object.values(DayPeriod);
  const placeKeys = Object.keys(PLACES);
  const weekDays = WEEK_DAYS.map((name, index) => ({ name, value: index + 1 }));

  type ActivityArgs = Omit<ScheduledActivity, 'day' | 'period'> & { classType?: ClassType };

  type ScheduleActivityArgs = {
    activity: ActivityArgs;
    schedule: Schedule;
  };

  type JobArgs = { job: Omit<Job, 'id'> };

  function defaultScheduleArgs(): ScheduleActivityArgs {
    return {
      activity: {
        type: ActivityType.Social,
        participants: ['player'],
        placeKey: placeKeys[0] ?? '',
      },
      schedule: {
        date: {
          day: 0,
          period: DayPeriod.Evening,
        },
      },
    };
  }

  function defaultRecurrence() {
    return {
      maxCount: 24,
      daysOfWeek: [1, 2, 3, 4, 5],
      period: DayPeriod.Evening,
    };
  }

  function defaultJobArgs(): JobArgs {
    return {
      job: {
        jobType: JobType.Mentoring,
        name: '',
        description: '',
        payPerActivity: 10,
        employerKey: '',
        placeKey: placeKeys[0] ?? '',
        schedule: {
          date: {
            day: 0,
            period: DayPeriod.Afternoon,
          },
          recurrence: { ...defaultRecurrence(), period: DayPeriod.Afternoon },
        },
      },
    };
  }

  function defaultArgs(effectTemplate: string): Record<string, any> {
    switch (effectTemplate) {
      case 'getDeck':
        return { deckKey: 'base_red' };
      case 'addResource':
        return { resourceType: ResourceType.MagicDust, amount: 1 };
      case 'scheduleActivity':
        return defaultScheduleArgs();
      case 'getJob':
        return defaultJobArgs();
      default:
        return {};
    }
  }

  function update(next: EventEffectsTemplate[]) {
    onChange(next);
  }

  function addEffect() {
    const effectTemplate = effectNames[0] ?? 'getDeck';
    update([...effects, { effectTemplate, args: defaultArgs(effectTemplate) }]);
  }

  function removeEffect(index: number) {
    update(effects.filter((_, i) => i !== index));
  }

  function setEffectTemplate(index: number, effectTemplate: string) {
    update(
      effects.map((effect, i) =>
        i === index ? { effectTemplate, args: defaultArgs(effectTemplate) } : effect
      )
    );
  }

  function setArg(index: number, key: string, value: unknown) {
    update(
      effects.map((effect, i) =>
        i === index ? { ...effect, args: { ...effect.args, [key]: value } } : effect
      )
    );
  }

  function normalizeScheduleArgs(raw: Record<string, any>): ScheduleActivityArgs {
    const defaults = defaultScheduleArgs();
    const legacyDate = raw.date;
    const legacyRecurrence = raw.recurrence;
    const { day: _day, period: _period, ...activityRest } = raw.activity ?? {};
    return {
      activity: {
        ...defaults.activity,
        ...activityRest,
      },
      schedule: {
        ...defaults.schedule,
        ...(raw.schedule ?? {}),
        date: {
          ...defaults.schedule.date,
          ...(legacyDate ?? {}),
          ...(raw.schedule?.date ?? {}),
        },
        recurrence: raw.schedule?.recurrence ?? legacyRecurrence,
      },
    };
  }

  function scheduleArgs(effect: EventEffectsTemplate): ScheduleActivityArgs {
    return normalizeScheduleArgs(effect.args);
  }

  function withoutEmptyRecurrence(schedule: Schedule): Schedule {
    const next: Schedule = { ...schedule };
    if (!next.recurrence) {
      delete next.recurrence;
    }
    return next;
  }

  function writeScheduleArgs(index: number, next: ScheduleActivityArgs) {
    update(
      effects.map((effect, i) =>
        i === index
          ? {
              ...effect,
              args: {
                activity: next.activity,
                schedule: withoutEmptyRecurrence(next.schedule),
              },
            }
          : effect
      )
    );
  }

  function normalizeJobArgs(raw: Record<string, any>): JobArgs {
    const defaults = defaultJobArgs();
    return {
      job: {
        ...defaults.job,
        ...(raw.job ?? {}),
        schedule: {
          ...(raw.job?.schedule ?? defaults.job.schedule),
          date: {
            ...defaults.job.schedule.date,
            ...(raw.job?.schedule?.date ?? {}),
          },
        },
      },
    };
  }

  function jobArgs(effect: EventEffectsTemplate): JobArgs {
    return normalizeJobArgs(effect.args);
  }

  function writeJobArgs(index: number, next: JobArgs) {
    const job = { ...next.job, schedule: withoutEmptyRecurrence(next.job.schedule) };
    update(effects.map((effect, i) => (i === index ? { ...effect, args: { job } } : effect)));
  }

  function setJobField(index: number, key: keyof Omit<Job, 'id'>, value: unknown) {
    const current = jobArgs(effects[index]);
    writeJobArgs(index, { job: { ...current.job, [key]: value } });
  }

  // The schedule controls are shared, so read and write it through the owning template's args.
  function currentSchedule(index: number): Schedule {
    const effect = effects[index];
    return effect.effectTemplate === 'getJob'
      ? jobArgs(effect).job.schedule
      : scheduleArgs(effect).schedule;
  }

  function setSchedule(index: number, schedule: Schedule) {
    const effect = effects[index];
    if (effect.effectTemplate === 'getJob') {
      writeJobArgs(index, { job: { ...jobArgs(effect).job, schedule } });
    } else {
      writeScheduleArgs(index, { ...scheduleArgs(effect), schedule });
    }
  }

  function setDateField(index: number, key: 'day' | 'period', value: unknown) {
    const schedule = currentSchedule(index);
    setSchedule(index, {
      ...schedule,
      date: {
        ...(schedule.date ?? { day: 0, period: DayPeriod.Evening }),
        [key]: value,
      },
    });
  }

  function setActivityField(index: number, key: keyof ActivityArgs, value: unknown) {
    const current = scheduleArgs(effects[index]);
    const activity = { ...current.activity, [key]: value } as ActivityArgs;
    if (key === 'type' && value !== ActivityType.Class) {
      delete activity.classType;
    }
    if (key === 'type' && value === ActivityType.Class && !activity.classType) {
      activity.classType = ClassType.Artificery;
    }
    writeScheduleArgs(index, { ...current, activity });
  }

  function setParticipants(index: number, raw: string) {
    const participants = raw
      .split(',')
      .map((part) => part.trim())
      .filter(Boolean);
    setActivityField(index, 'participants', participants);
  }

  function setRecurring(index: number, enabled: boolean) {
    const schedule = currentSchedule(index);
    if (enabled) {
      setSchedule(index, {
        ...schedule,
        recurrence: schedule.recurrence ?? defaultRecurrence(),
      });
    } else {
      const { recurrence: _, ...rest } = schedule;
      setSchedule(index, rest);
    }
  }

  function setRecurrenceField(
    index: number,
    key: 'maxCount' | 'daysOfWeek' | 'period',
    value: unknown
  ) {
    const schedule = currentSchedule(index);
    setSchedule(index, {
      ...schedule,
      recurrence: {
        ...(schedule.recurrence ?? defaultRecurrence()),
        [key]: value,
      },
    });
  }

  function toggleDayOfWeek(index: number, dayOfWeek: number) {
    const days = [...(currentSchedule(index).recurrence?.daysOfWeek ?? [])];
    const next = days.includes(dayOfWeek)
      ? days.filter((day) => day !== dayOfWeek)
      : [...days, dayOfWeek].sort((a, b) => a - b);
    setRecurrenceField(index, 'daysOfWeek', next);
  }
</script>

<div class="effects-editor" class:nested>
  <div class="section-header">
    <div class="title-block">
      <h3 class:panel-title={!nested}>{title}</h3>
      {#if description}
        <p class="desc">{description}</p>
      {/if}
    </div>
    <button type="button" class="btn ghost" onclick={addEffect}>Add</button>
  </div>

  {#if effects.length === 0}
    <p class="hint">None</p>
  {:else}
    <ul class="stack">
      {#each effects as effect, i (i)}
        {@const args = effect.effectTemplate === 'scheduleActivity' ? scheduleArgs(effect) : null}
        {@const job = effect.effectTemplate === 'getJob' ? jobArgs(effect) : null}
        <li class="effect-item">
          <div class="effect-row">
            <select
              class="input template"
              value={effect.effectTemplate}
              aria-label="Effect template"
              onchange={(e) => setEffectTemplate(i, (e.currentTarget as HTMLSelectElement).value)}
            >
              {#each effectNames as name (name)}
                <option value={name}>{name}</option>
              {/each}
            </select>

            {#if effect.effectTemplate === 'getDeck'}
              <input
                class="input arg"
                value={effect.args.deckKey ?? ''}
                placeholder="deck key"
                aria-label="Deck key"
                oninput={(e) => setArg(i, 'deckKey', (e.currentTarget as HTMLInputElement).value)}
              />
            {:else if effect.effectTemplate === 'addResource'}
              <select
                class="input arg"
                value={effect.args.resourceType ?? ResourceType.MagicDust}
                aria-label="Resource type"
                onchange={(e) =>
                  setArg(i, 'resourceType', (e.currentTarget as HTMLSelectElement).value)}
              >
                {#each resourceTypes as type (type)}
                  <option value={type}>{type}</option>
                {/each}
              </select>
              <input
                class="input narrow"
                type="number"
                min="0"
                value={effect.args.amount ?? 0}
                aria-label="Amount"
                oninput={(e) =>
                  setArg(i, 'amount', Number((e.currentTarget as HTMLInputElement).value))}
              />
            {/if}

            <button
              type="button"
              class="btn icon danger"
              onclick={() => removeEffect(i)}
              aria-label="Remove effect">×</button
            >
          </div>

          {#if args}
            <div class="schedule-fields">
              <select
                class="input"
                value={args.activity.type}
                aria-label="Activity type"
                onchange={(e) =>
                  setActivityField(i, 'type', (e.currentTarget as HTMLSelectElement).value)}
              >
                {#each activityTypes as type (type)}
                  <option value={type}>{type}</option>
                {/each}
              </select>

              {#if args.activity.type === ActivityType.Class}
                <select
                  class="input"
                  value={args.activity.classType ?? ClassType.Artificery}
                  aria-label="Class type"
                  onchange={(e) =>
                    setActivityField(i, 'classType', (e.currentTarget as HTMLSelectElement).value)}
                >
                  {#each classTypes as type (type)}
                    <option value={type}>{type}</option>
                  {/each}
                </select>
              {/if}

              <select
                class="input"
                value={args.activity.placeKey}
                aria-label="Place"
                onchange={(e) =>
                  setActivityField(i, 'placeKey', (e.currentTarget as HTMLSelectElement).value)}
              >
                {#each placeKeys as placeKey (placeKey)}
                  <option value={placeKey}>{PLACES[placeKey].name}</option>
                {/each}
              </select>

              <input
                class="input participants"
                value={args.activity.participants.join(', ')}
                placeholder="participants (comma-separated)"
                aria-label="Participants"
                oninput={(e) => setParticipants(i, (e.currentTarget as HTMLInputElement).value)}
              />

              {@render scheduleFields(i, args.schedule)}
            </div>
          {/if}

          {#if job}
            <div class="schedule-fields">
              <select
                class="input"
                value={job.job.jobType}
                aria-label="Job type"
                onchange={(e) =>
                  setJobField(i, 'jobType', (e.currentTarget as HTMLSelectElement).value)}
              >
                {#each jobTypes as type (type)}
                  <option value={type}>{type}</option>
                {/each}
              </select>

              <input
                class="input arg"
                value={job.job.name}
                placeholder="job name"
                aria-label="Job name"
                oninput={(e) => setJobField(i, 'name', (e.currentTarget as HTMLInputElement).value)}
              />

              <input
                class="input arg"
                value={job.job.employerKey}
                placeholder="employer key"
                aria-label="Employer key"
                oninput={(e) =>
                  setJobField(i, 'employerKey', (e.currentTarget as HTMLInputElement).value)}
              />

              <select
                class="input"
                value={job.job.placeKey}
                aria-label="Place"
                onchange={(e) =>
                  setJobField(i, 'placeKey', (e.currentTarget as HTMLSelectElement).value)}
              >
                {#each placeKeys as placeKey (placeKey)}
                  <option value={placeKey}>{PLACES[placeKey].name}</option>
                {/each}
              </select>

              <input
                class="input narrow"
                type="number"
                min="0"
                value={job.job.payPerActivity}
                aria-label="Pay per activity"
                title="Gold per work activity"
                oninput={(e) =>
                  setJobField(
                    i,
                    'payPerActivity',
                    Number((e.currentTarget as HTMLInputElement).value)
                  )}
              />

              <input
                class="input participants"
                value={job.job.description}
                placeholder="description"
                aria-label="Job description"
                oninput={(e) =>
                  setJobField(i, 'description', (e.currentTarget as HTMLInputElement).value)}
              />

              {@render scheduleFields(i, job.job.schedule)}
            </div>
          {/if}
        </li>
      {/each}
    </ul>
  {/if}
</div>

{#snippet scheduleFields(i: number, schedule: Schedule)}
  <input
    class="input narrow"
    type="number"
    min="0"
    value={schedule.date?.day ?? 0}
    aria-label="Days from now"
    title="Days from now"
    oninput={(e) => setDateField(i, 'day', Number((e.currentTarget as HTMLInputElement).value))}
  />
  {#if !schedule.recurrence}
    <select
      class="input"
      value={schedule.date?.period ?? DayPeriod.Evening}
      aria-label="Period"
      onchange={(e) => setDateField(i, 'period', (e.currentTarget as HTMLSelectElement).value)}
    >
      {#each periods as period (period)}
        <option value={period}>{period}</option>
      {/each}
    </select>
  {/if}

  <label class="check">
    <input
      type="checkbox"
      checked={!!schedule.recurrence}
      onchange={(e) => setRecurring(i, (e.currentTarget as HTMLInputElement).checked)}
    />
    Recurring
  </label>

  {#if schedule.recurrence}
    <input
      class="input narrow"
      type="number"
      min="1"
      value={schedule.recurrence.maxCount ?? 24}
      aria-label="Max count"
      title="Max occurrences"
      oninput={(e) =>
        setRecurrenceField(i, 'maxCount', Number((e.currentTarget as HTMLInputElement).value))}
    />
    <select
      class="input"
      value={schedule.recurrence.period ?? schedule.date?.period ?? DayPeriod.Evening}
      aria-label="Recurrence period"
      onchange={(e) =>
        setRecurrenceField(i, 'period', (e.currentTarget as HTMLSelectElement).value)}
    >
      {#each periods as period (period)}
        <option value={period}>{period}</option>
      {/each}
    </select>
    <div class="days" role="group" aria-label="Days of week">
      {#each weekDays as day (day.value)}
        <label class="check day">
          <input
            type="checkbox"
            checked={schedule.recurrence.daysOfWeek?.includes(day.value) ?? false}
            onchange={() => toggleDayOfWeek(i, day.value)}
          />
          {day.name.slice(0, 3)}
        </label>
      {/each}
    </div>
  {/if}
{/snippet}

<style>
  .effects-editor {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
    min-width: 0;
  }

  .effects-editor.nested {
    margin-top: 0.35rem;
    padding-top: 0.5rem;
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
    gap: 0.5rem;
  }

  .effect-item {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }

  .effect-row {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    flex-wrap: wrap;
  }

  .schedule-fields {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.4rem;
    padding: 0.45rem;
    border: 1px solid rgba(175, 142, 103, 0.25);
    border-radius: 3px;
    background: rgba(175, 142, 103, 0.06);
  }

  .input {
    padding: 0.35rem 0.5rem;
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

  .template {
    width: 9.5rem;
    flex-shrink: 0;
  }

  .arg {
    width: 9rem;
    min-width: 0;
  }

  .narrow {
    width: 4.5rem;
  }

  .participants {
    min-width: 12rem;
    flex: 1 1 12rem;
  }

  .days {
    display: flex;
    flex-wrap: wrap;
    gap: 0.35rem 0.55rem;
    width: 100%;
  }

  .check {
    display: inline-flex;
    align-items: center;
    gap: 0.3rem;
    color: var(--color-cream);
    font-size: 0.8rem;
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
    padding: 0.3rem 0.55rem;
    border-radius: 3px;
    border: 1px solid transparent;
    font: inherit;
    font-size: 0.8rem;
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
    padding: 0.2rem 0.45rem;
    line-height: 1;
    font-size: 1.1rem;
    background: transparent;
    color: var(--color-cream);
    border-color: rgba(175, 142, 103, 0.25);
  }

  .btn.danger {
    color: #fca5a5;
    border-color: rgba(220, 38, 38, 0.35);
  }

  .btn.icon:hover {
    background: rgba(255, 255, 255, 0.06);
  }
</style>
