<script lang="ts">
  import { PLACES } from '@/data/sim/places';
  import {
    ActivityType,
    CardColor,
    ClassType,
    DayPeriod,
    Emotion,
    EventEffectType,
    JobType,
    PossessionType,
    RelationTag,
    ResourceType,
    SubscriptionType,
    type EventEffect,
    type Job,
    type Schedule,
    type ScheduledActivity,
  } from '@/lib/_model';
  import { TransactionType } from '@/lib/sim/actions/transaction';
  import { ACTION_TEMPLATE_KEYS } from '@/lib/sim/cards/action-templates';
  import { KEYWORD_KEYS } from '@/lib/sim/cards/keywords';
  import { WEEK_DAYS } from '@/lib/sim/time';

  let {
    effects,
    onChange,
    title = 'Effects',
    description = '',
    nested = false,
    allowAdd = true,
  }: {
    effects: EventEffect[];
    onChange: (effects: EventEffect[]) => void;
    title?: string;
    description?: string;
    nested?: boolean;
    /** When false, hide Add (e.g. single-effect slot inside a couple editor). */
    allowAdd?: boolean;
  } = $props();

  const effectTypes = Object.values(EventEffectType);
  const resourceTypes = Object.values(ResourceType);
  const subscriptionTypes = Object.values(SubscriptionType);
  const cardColors = Object.values(CardColor);
  const abilityKeys = [...KEYWORD_KEYS, ...ACTION_TEMPLATE_KEYS];
  const activityTypes = Object.values(ActivityType);
  const classTypes = Object.values(ClassType);
  const jobTypes = Object.values(JobType);
  const periods = Object.values(DayPeriod);
  const placeKeys = Object.keys(PLACES);
  const weekDays = WEEK_DAYS.map((name, index) => ({ name, value: index + 1 }));
  const attributeKeys = ['dexterity', 'intelligence', 'vitality', 'charisma', 'aura'] as const;
  const relationParameters = ['friendship', 'respect', 'love', 'rivalry'] as const;
  const relationTags = Object.values(RelationTag);
  const possessionTypes = Object.values(PossessionType);
  const emotions = Object.values(Emotion);

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

  function defaultParameters(type: EventEffectType): Record<string, any> {
    switch (type) {
      case EventEffectType.GetDeck:
        return { deckKey: 'base_red' };
      case EventEffectType.AddResource:
        return { resourceType: ResourceType.MagicDust, amount: 1 };
      case EventEffectType.AddGold:
        return { amount: 10, characterKey: 'player' };
      case EventEffectType.Subscribe:
        return {
          subscriptionType: SubscriptionType.MaterialShop,
          duration: 365,
          cost: 0,
          transactionType: TransactionType.Subscription,
        };
      case EventEffectType.ScheduleActivity:
        return defaultScheduleArgs();
      case EventEffectType.GetJob:
        return defaultJobArgs();
      case EventEffectType.FollowUpEvent:
        return { eventKey: '' };
      case EventEffectType.OfferCardGifts:
        return { count: 2, poolKeys: [] };
      case EventEffectType.GiftCardToCharacter:
        return { characterKey: '', cardKey: '', fromPlayer: true };
      case EventEffectType.TeachColor:
        return { color: CardColor.Red };
      case EventEffectType.TeachAbility:
        return {};
      case EventEffectType.Narrate:
        return { text: '' };
      case EventEffectType.LevelAttribute:
        return { attribute: 'intelligence', amount: 1, characterKey: 'player' };
      case EventEffectType.LevelUpCharacter:
        return { characterKey: '' };
      case EventEffectType.ChangeRelation:
        return { characterKey: '', relationParameter: 'friendship', amount: 1 };
      case EventEffectType.UpdateRelationArc:
        return { characterKey: '', text: '', image: '' };
      case EventEffectType.AddRelationTag:
        return { characterKey: '', relationTag: RelationTag.Friend };
      case EventEffectType.AddStoryTag:
        return { tag: '', amount: 1 };
      case EventEffectType.AddKnownTrait:
        return { characterKey: '', title: '', description: '' };
      case EventEffectType.AddMemory:
        return { characterKey: '', title: '', description: '' };
      case EventEffectType.Move:
        return { placeKey: placeKeys[0] ?? '', characterKeys: ['player'] };
      case EventEffectType.UseFocus:
        return { amount: 1 };
      case EventEffectType.StartMatch:
        return { opponentKey: '', playerDeckKey: '', isLeagueMatch: false };
      case EventEffectType.NewLeagueSeason:
        return { winnerKey: null };
      case EventEffectType.AddPossession:
        return {
          type: PossessionType.Clothing,
          name: '',
          description: '',
          characterKey: 'player',
        };
      case EventEffectType.AddRumor:
        return { text: '' };
      default:
        return {};
    }
  }

  function update(next: EventEffect[]) {
    onChange(next);
  }

  function addEffect() {
    const type = effectTypes[0] ?? EventEffectType.GetDeck;
    update([...effects, { type, parameters: defaultParameters(type) }]);
  }

  function removeEffect(index: number) {
    update(effects.filter((_, i) => i !== index));
  }

  function setEffectType(index: number, type: EventEffectType) {
    update(
      effects.map((effect, i) =>
        i === index ? { type, parameters: defaultParameters(type) } : effect
      )
    );
  }

  function setParameter(index: number, key: string, value: unknown) {
    update(
      effects.map((effect, i) =>
        i === index ? { ...effect, parameters: { ...effect.parameters, [key]: value } } : effect
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

  function scheduleArgs(effect: EventEffect): ScheduleActivityArgs {
    return normalizeScheduleArgs(effect.parameters);
  }

  function withoutEmptyScheduleFlags(schedule: Schedule): Schedule {
    const next: Schedule = { ...schedule };
    if (!next.recurrence) {
      delete next.recurrence;
    }
    if (!next.nextFree) {
      delete next.nextFree;
    }
    return next;
  }

  function writeScheduleArgs(index: number, next: ScheduleActivityArgs) {
    update(
      effects.map((effect, i) =>
        i === index
          ? {
              ...effect,
              parameters: {
                activity: next.activity,
                schedule: withoutEmptyScheduleFlags(next.schedule),
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

  function jobArgs(effect: EventEffect): JobArgs {
    return normalizeJobArgs(effect.parameters);
  }

  function writeJobArgs(index: number, next: JobArgs) {
    const job = { ...next.job, schedule: withoutEmptyScheduleFlags(next.job.schedule) };
    update(effects.map((effect, i) => (i === index ? { ...effect, parameters: { job } } : effect)));
  }

  function setJobField(index: number, key: keyof Omit<Job, 'id'>, value: unknown) {
    const current = jobArgs(effects[index]);
    writeJobArgs(index, { job: { ...current.job, [key]: value } });
  }

  // The schedule controls are shared, so read and write it through the owning effect's parameters.
  function currentSchedule(index: number): Schedule {
    const effect = effects[index];
    return effect.type === EventEffectType.GetJob
      ? jobArgs(effect).job.schedule
      : scheduleArgs(effect).schedule;
  }

  function setSchedule(index: number, schedule: Schedule) {
    const effect = effects[index];
    if (effect.type === EventEffectType.GetJob) {
      writeJobArgs(index, { job: { ...jobArgs(effect).job, schedule } });
    } else {
      writeScheduleArgs(index, { ...scheduleArgs(effect), schedule });
    }
  }

  function setDateField(index: number, key: 'day' | 'period' | 'dayOfWeek', value: unknown) {
    const schedule = currentSchedule(index);
    const date: NonNullable<Schedule['date']> = {
      ...(schedule.date ?? { day: 0, period: DayPeriod.Evening }),
    };
    if (key === 'dayOfWeek' && (value == null || value === '')) {
      delete date.dayOfWeek;
    } else {
      date[key] = value as never;
    }
    setSchedule(index, { ...schedule, date });
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

  function setNextFree(index: number, enabled: boolean) {
    const schedule = currentSchedule(index);
    if (enabled) {
      setSchedule(index, { ...schedule, nextFree: true });
    } else {
      const { nextFree: _, ...rest } = schedule;
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
    {#if allowAdd}
      <button type="button" class="btn ghost" onclick={addEffect}>Add</button>
    {/if}
  </div>

  {#if effects.length === 0}
    <p class="hint">None</p>
  {:else}
    <ul class="stack">
      {#each effects as effect, i (i)}
        {@const args =
          effect.type === EventEffectType.ScheduleActivity ? scheduleArgs(effect) : null}
        {@const job = effect.type === EventEffectType.GetJob ? jobArgs(effect) : null}
        <li class="effect-item">
          <div class="effect-row">
            <select
              class="input template"
              value={effect.type}
              aria-label="Effect type"
              onchange={(e) =>
                setEffectType(i, (e.currentTarget as HTMLSelectElement).value as EventEffectType)}
            >
              {#each effectTypes as type (type)}
                <option value={type}>{type}</option>
              {/each}
            </select>

            {#if effect.type === EventEffectType.GetDeck}
              <input
                class="input arg"
                value={effect.parameters.deckKey ?? ''}
                placeholder="deck key"
                aria-label="Deck key"
                oninput={(e) =>
                  setParameter(i, 'deckKey', (e.currentTarget as HTMLInputElement).value)}
              />
            {:else if effect.type === EventEffectType.AddResource}
              <select
                class="input arg"
                value={effect.parameters.resourceType ?? ResourceType.MagicDust}
                aria-label="Resource type"
                onchange={(e) =>
                  setParameter(i, 'resourceType', (e.currentTarget as HTMLSelectElement).value)}
              >
                {#each resourceTypes as type (type)}
                  <option value={type}>{type}</option>
                {/each}
              </select>
              <input
                class="input narrow"
                type="number"
                min="0"
                value={effect.parameters.amount ?? 0}
                aria-label="Amount"
                oninput={(e) =>
                  setParameter(i, 'amount', Number((e.currentTarget as HTMLInputElement).value))}
              />
            {:else if effect.type === EventEffectType.AddGold}
              <input
                class="input narrow"
                type="number"
                value={effect.parameters.amount ?? 0}
                aria-label="Gold amount"
                oninput={(e) =>
                  setParameter(i, 'amount', Number((e.currentTarget as HTMLInputElement).value))}
              />
              <input
                class="input arg"
                value={effect.parameters.characterKey ?? 'player'}
                placeholder="character key"
                aria-label="Character key"
                oninput={(e) =>
                  setParameter(i, 'characterKey', (e.currentTarget as HTMLInputElement).value)}
              />
            {:else if effect.type === EventEffectType.Subscribe}
              <select
                class="input arg"
                value={effect.parameters.subscriptionType ?? SubscriptionType.MaterialShop}
                aria-label="Subscription type"
                onchange={(e) =>
                  setParameter(i, 'subscriptionType', (e.currentTarget as HTMLSelectElement).value)}
              >
                {#each subscriptionTypes as type (type)}
                  <option value={type}>{type}</option>
                {/each}
              </select>
              <input
                class="input narrow"
                type="number"
                min="1"
                value={effect.parameters.duration ?? 365}
                aria-label="Duration days"
                oninput={(e) =>
                  setParameter(i, 'duration', Number((e.currentTarget as HTMLInputElement).value))}
              />
              <input
                class="input narrow"
                type="number"
                min="0"
                value={effect.parameters.cost ?? 0}
                aria-label="Cost"
                oninput={(e) =>
                  setParameter(i, 'cost', Number((e.currentTarget as HTMLInputElement).value))}
              />
            {:else if effect.type === EventEffectType.StartMatch}
              <input
                class="input arg"
                value={effect.parameters.opponentKey ?? ''}
                placeholder="opponent key"
                aria-label="Opponent key"
                oninput={(e) =>
                  setParameter(i, 'opponentKey', (e.currentTarget as HTMLInputElement).value)}
              />
              <input
                class="input arg"
                value={effect.parameters.playerDeckKey ?? ''}
                placeholder="player deck (optional)"
                aria-label="Player deck key"
                oninput={(e) =>
                  setParameter(i, 'playerDeckKey', (e.currentTarget as HTMLInputElement).value)}
              />
              <label class="check">
                <input
                  type="checkbox"
                  checked={!!effect.parameters.isLeagueMatch}
                  onchange={(e) =>
                    setParameter(i, 'isLeagueMatch', (e.currentTarget as HTMLInputElement).checked)}
                />
                League match
              </label>
            {:else if effect.type === EventEffectType.NewLeagueSeason}
              <input
                class="input arg"
                value={effect.parameters.winnerKey ?? ''}
                placeholder="winner key (optional)"
                aria-label="Winner key"
                oninput={(e) => {
                  const value = (e.currentTarget as HTMLInputElement).value.trim();
                  setParameter(i, 'winnerKey', value || null);
                }}
              />
            {:else if effect.type === EventEffectType.UseFocus}
              <input
                class="input narrow"
                type="number"
                min="0"
                value={effect.parameters.amount ?? 0}
                aria-label="Focus amount"
                oninput={(e) =>
                  setParameter(i, 'amount', Number((e.currentTarget as HTMLInputElement).value))}
              />
            {:else if effect.type === EventEffectType.FollowUpEvent}
              <input
                class="input arg"
                value={effect.parameters.eventKey ?? ''}
                placeholder="event key"
                aria-label="Follow-up event key"
                oninput={(e) =>
                  setParameter(i, 'eventKey', (e.currentTarget as HTMLInputElement).value)}
              />
            {:else if effect.type === EventEffectType.OfferCardGifts}
              <input
                class="input narrow"
                type="number"
                min="1"
                value={effect.parameters.count ?? 2}
                aria-label="Gift count"
                oninput={(e) =>
                  setParameter(i, 'count', Number((e.currentTarget as HTMLInputElement).value))}
              />
              <input
                class="input participants"
                value={(effect.parameters.poolKeys ?? []).join(', ')}
                placeholder="pool keys (comma-separated)"
                aria-label="Pool keys"
                oninput={(e) =>
                  setParameter(
                    i,
                    'poolKeys',
                    (e.currentTarget as HTMLInputElement).value
                      .split(',')
                      .map((part) => part.trim())
                      .filter(Boolean)
                  )}
              />
            {:else if effect.type === EventEffectType.GiftCardToCharacter}
              <input
                class="input arg"
                value={effect.parameters.characterKey ?? ''}
                placeholder="character key"
                aria-label="Character key"
                oninput={(e) =>
                  setParameter(i, 'characterKey', (e.currentTarget as HTMLInputElement).value)}
              />
              <input
                class="input arg"
                value={effect.parameters.cardKey ?? ''}
                placeholder="card key"
                aria-label="Card key"
                oninput={(e) =>
                  setParameter(i, 'cardKey', (e.currentTarget as HTMLInputElement).value)}
              />
              <label class="check">
                <input
                  type="checkbox"
                  checked={effect.parameters.fromPlayer !== false}
                  aria-label="Transfer from player"
                  onchange={(e) =>
                    setParameter(i, 'fromPlayer', (e.currentTarget as HTMLInputElement).checked)}
                />
                from player
              </label>
            {:else if effect.type === EventEffectType.TeachColor}
              <select
                class="input arg"
                value={effect.parameters.color ?? CardColor.Red}
                aria-label="Card color"
                onchange={(e) =>
                  setParameter(i, 'color', (e.currentTarget as HTMLSelectElement).value)}
              >
                {#each cardColors as color (color)}
                  <option value={color}>{color}</option>
                {/each}
              </select>
              <input
                class="input arg"
                value={effect.parameters.characterKey ?? ''}
                placeholder="character key (optional)"
                aria-label="Character key"
                oninput={(e) => {
                  const value = (e.currentTarget as HTMLInputElement).value.trim();
                  setParameter(i, 'characterKey', value || undefined);
                }}
              />
            {:else if effect.type === EventEffectType.TeachAbility}
              <select
                class="input arg"
                value={effect.parameters.ability ?? ''}
                aria-label="Ability key"
                onchange={(e) => {
                  const value = (e.currentTarget as HTMLSelectElement).value;
                  setParameter(i, 'ability', value || undefined);
                }}
              >
                <option value="">(random)</option>
                {#each abilityKeys as key (key)}
                  <option value={key}>{key}</option>
                {/each}
              </select>
              <input
                class="input arg"
                value={effect.parameters.characterKey ?? ''}
                placeholder="character key (optional)"
                aria-label="Character key"
                oninput={(e) => {
                  const value = (e.currentTarget as HTMLInputElement).value.trim();
                  setParameter(i, 'characterKey', value || undefined);
                }}
              />
            {:else if effect.type === EventEffectType.Narrate}
              <textarea
                class="input narrate-text"
                value={effect.parameters.text ?? ''}
                placeholder="narration text"
                aria-label="Narration text"
                rows="4"
                oninput={(e) =>
                  setParameter(i, 'text', (e.currentTarget as HTMLTextAreaElement).value)}
              ></textarea>
            {:else if effect.type === EventEffectType.LevelAttribute}
              <select
                class="input arg"
                value={effect.parameters.attribute ?? 'intelligence'}
                aria-label="Attribute"
                onchange={(e) =>
                  setParameter(i, 'attribute', (e.currentTarget as HTMLSelectElement).value)}
              >
                {#each attributeKeys as attr (attr)}
                  <option value={attr}>{attr}</option>
                {/each}
              </select>
              <input
                class="input narrow"
                type="number"
                value={effect.parameters.amount ?? 1}
                aria-label="Amount"
                oninput={(e) =>
                  setParameter(i, 'amount', Number((e.currentTarget as HTMLInputElement).value))}
              />
              <input
                class="input arg"
                value={effect.parameters.characterKey ?? 'player'}
                placeholder="character key"
                aria-label="Character key"
                oninput={(e) =>
                  setParameter(i, 'characterKey', (e.currentTarget as HTMLInputElement).value)}
              />
            {:else if effect.type === EventEffectType.LevelUpCharacter}
              <input
                class="input arg"
                value={effect.parameters.characterKey ?? ''}
                placeholder="character key"
                aria-label="Character key"
                oninput={(e) =>
                  setParameter(i, 'characterKey', (e.currentTarget as HTMLInputElement).value)}
              />
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
                  setParameter(
                    i,
                    'relationParameter',
                    (e.currentTarget as HTMLSelectElement).value
                  )}
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
            {:else if effect.type === EventEffectType.UpdateRelationArc}
              <input
                class="input arg"
                value={effect.parameters.characterKey ?? ''}
                placeholder="character key"
                aria-label="Character key"
                oninput={(e) =>
                  setParameter(i, 'characterKey', (e.currentTarget as HTMLInputElement).value)}
              />
              <input
                class="input arg"
                value={effect.parameters.text ?? ''}
                placeholder="arc text"
                aria-label="Text"
                oninput={(e) =>
                  setParameter(i, 'text', (e.currentTarget as HTMLInputElement).value)}
              />
              <input
                class="input arg"
                value={effect.parameters.image ?? ''}
                placeholder="folder/file.png"
                aria-label="Image path"
                oninput={(e) =>
                  setParameter(i, 'image', (e.currentTarget as HTMLInputElement).value)}
              />
            {:else if effect.type === EventEffectType.AddRelationTag}
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
                value={effect.parameters.relationTag ?? RelationTag.Friend}
                aria-label="Relation tag"
                onchange={(e) =>
                  setParameter(i, 'relationTag', (e.currentTarget as HTMLSelectElement).value)}
              >
                {#each relationTags as tag (tag)}
                  <option value={tag}>{tag}</option>
                {/each}
              </select>
            {:else if effect.type === EventEffectType.AddStoryTag}
              <input
                class="input arg"
                value={effect.parameters.tag ?? ''}
                placeholder="story tag"
                aria-label="Story tag"
                oninput={(e) => setParameter(i, 'tag', (e.currentTarget as HTMLInputElement).value)}
              />
              <input
                class="input narrow"
                type="number"
                value={effect.parameters.amount ?? 1}
                aria-label="Amount"
                oninput={(e) =>
                  setParameter(i, 'amount', Number((e.currentTarget as HTMLInputElement).value))}
              />
            {:else if effect.type === EventEffectType.AddKnownTrait}
              <input
                class="input arg"
                value={effect.parameters.characterKey ?? ''}
                placeholder="character key"
                aria-label="Character key"
                oninput={(e) =>
                  setParameter(i, 'characterKey', (e.currentTarget as HTMLInputElement).value)}
              />
              <input
                class="input arg"
                value={effect.parameters.title ?? ''}
                placeholder="trait title"
                aria-label="Known trait title"
                oninput={(e) =>
                  setParameter(i, 'title', (e.currentTarget as HTMLInputElement).value)}
              />
              <input
                class="input arg"
                value={effect.parameters.description ?? ''}
                placeholder="trait description"
                aria-label="Known trait description"
                oninput={(e) =>
                  setParameter(i, 'description', (e.currentTarget as HTMLInputElement).value)}
              />
            {:else if effect.type === EventEffectType.AddMemory}
              <input
                class="input arg"
                value={effect.parameters.characterKey ?? ''}
                placeholder="character key"
                aria-label="Character key"
                oninput={(e) =>
                  setParameter(i, 'characterKey', (e.currentTarget as HTMLInputElement).value)}
              />
              <input
                class="input arg"
                value={effect.parameters.title ?? ''}
                placeholder="memory title"
                aria-label="Memory title"
                oninput={(e) =>
                  setParameter(i, 'title', (e.currentTarget as HTMLInputElement).value)}
              />
              <input
                class="input arg"
                value={effect.parameters.description ?? ''}
                placeholder="memory description"
                aria-label="Memory description"
                oninput={(e) =>
                  setParameter(i, 'description', (e.currentTarget as HTMLInputElement).value)}
              />
              <select
                class="input arg"
                value={effect.parameters.emotion ?? ''}
                aria-label="Memory emotion"
                onchange={(e) => {
                  const value = (e.currentTarget as HTMLSelectElement).value;
                  setParameter(i, 'emotion', value || undefined);
                }}
              >
                <option value="">(no emotion)</option>
                {#each emotions as value (value)}
                  <option {value}>{value}</option>
                {/each}
              </select>
            {:else if effect.type === EventEffectType.AddPossession}
              <select
                class="input arg"
                value={effect.parameters.type ?? PossessionType.Clothing}
                aria-label="Possession type"
                onchange={(e) =>
                  setParameter(i, 'type', (e.currentTarget as HTMLSelectElement).value)}
              >
                {#each possessionTypes as type (type)}
                  <option value={type}>{type}</option>
                {/each}
              </select>
              <input
                class="input arg"
                value={effect.parameters.name ?? ''}
                placeholder="name"
                aria-label="Possession name"
                oninput={(e) =>
                  setParameter(i, 'name', (e.currentTarget as HTMLInputElement).value)}
              />
              <input
                class="input arg"
                value={effect.parameters.description ?? ''}
                placeholder="description"
                aria-label="Possession description"
                oninput={(e) =>
                  setParameter(i, 'description', (e.currentTarget as HTMLInputElement).value)}
              />
              <input
                class="input narrow"
                type="number"
                min="1"
                value={effect.parameters.count ?? ''}
                placeholder="count"
                aria-label="Possession count"
                oninput={(e) => {
                  const raw = (e.currentTarget as HTMLInputElement).value;
                  setParameter(i, 'count', raw === '' ? undefined : Number(raw));
                }}
              />
              <input
                class="input arg"
                value={effect.parameters.characterKey ?? 'player'}
                placeholder="character key"
                aria-label="Character key"
                oninput={(e) =>
                  setParameter(i, 'characterKey', (e.currentTarget as HTMLInputElement).value)}
              />
            {:else if effect.type === EventEffectType.AddRumor}
              <input
                class="input arg"
                value={effect.parameters.text ?? ''}
                placeholder="rumor text"
                aria-label="Rumor text"
                oninput={(e) =>
                  setParameter(i, 'text', (e.currentTarget as HTMLInputElement).value)}
              />
              <input
                class="input arg"
                value={effect.parameters.aboutNpcKey ?? ''}
                placeholder="about character key"
                aria-label="About character key"
                oninput={(e) => {
                  const value = (e.currentTarget as HTMLInputElement).value;
                  setParameter(i, 'aboutNpcKey', value || undefined);
                }}
              />
              <input
                class="input arg"
                value={effect.parameters.fromNpcKey ?? ''}
                placeholder="from character key"
                aria-label="From character key"
                oninput={(e) => {
                  const value = (e.currentTarget as HTMLInputElement).value;
                  setParameter(i, 'fromNpcKey', value || undefined);
                }}
              />
              <input
                class="input narrow"
                type="number"
                value={effect.parameters.fromDay ?? ''}
                placeholder="from day"
                aria-label="From day (offset)"
                oninput={(e) => {
                  const raw = (e.currentTarget as HTMLInputElement).value;
                  setParameter(i, 'fromDay', raw === '' ? undefined : Number(raw));
                }}
              />
              <input
                class="input narrow"
                type="number"
                value={effect.parameters.untilDay ?? ''}
                placeholder="until day"
                aria-label="Until day (offset)"
                oninput={(e) => {
                  const raw = (e.currentTarget as HTMLInputElement).value;
                  setParameter(i, 'untilDay', raw === '' ? undefined : Number(raw));
                }}
              />
            {:else if effect.type === EventEffectType.Move}
              <select
                class="input arg"
                value={effect.parameters.placeKey ?? placeKeys[0] ?? ''}
                aria-label="Place"
                onchange={(e) =>
                  setParameter(i, 'placeKey', (e.currentTarget as HTMLSelectElement).value)}
              >
                {#each placeKeys as placeKey (placeKey)}
                  <option value={placeKey}>{PLACES[placeKey].name}</option>
                {/each}
              </select>
              <input
                class="input participants"
                value={(effect.parameters.characterKeys ?? []).join(', ')}
                placeholder="character keys (comma-separated)"
                aria-label="Character keys"
                oninput={(e) =>
                  setParameter(
                    i,
                    'characterKeys',
                    (e.currentTarget as HTMLInputElement).value
                      .split(',')
                      .map((key) => key.trim())
                      .filter(Boolean)
                  )}
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

              <input
                class="input arg"
                value={args.activity.eventId ?? ''}
                placeholder="event id (optional)"
                aria-label="Event id"
                title="When set, the scheduled_activity trigger on that event fires while this activity is current"
                oninput={(e) => {
                  const value = (e.currentTarget as HTMLInputElement).value.trim();
                  setActivityField(i, 'eventId', value || undefined);
                }}
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
    aria-label={schedule.nextFree || schedule.date?.dayOfWeek != null
      ? 'Earliest days from now'
      : 'Days from now'}
    title={schedule.date?.dayOfWeek != null
      ? 'Minimum day offset before the target weekday'
      : schedule.nextFree
        ? 'Earliest day offset — first free slot at or after this many days from now'
        : 'Days from now (0 = today)'}
    oninput={(e) => setDateField(i, 'day', Number((e.currentTarget as HTMLInputElement).value))}
  />
  {#if !schedule.recurrence}
    <select
      class="input"
      value={schedule.date?.dayOfWeek ?? ''}
      aria-label="Weekday"
      title="Next occurrence of this weekday (1=Mon … 7=Sun). Leave as Any day for a plain day offset."
      onchange={(e) => {
        const raw = (e.currentTarget as HTMLSelectElement).value;
        setDateField(i, 'dayOfWeek', raw === '' ? undefined : Number(raw));
      }}
    >
      <option value="">Any day</option>
      {#each weekDays as day (day.value)}
        <option value={day.value}>{day.name}</option>
      {/each}
    </select>
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

  <label
    class="check"
    title={schedule.date?.dayOfWeek != null
      ? 'If that weekday/period is busy, use the same weekday next week'
      : 'Start at days-from-now; if that period is busy, use the next free day with the same period'}
  >
    <input
      type="checkbox"
      checked={!!schedule.nextFree}
      onchange={(e) => setNextFree(i, (e.currentTarget as HTMLInputElement).checked)}
    />
    Next free
  </label>

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

  .narrate-text {
    flex: 1 1 100%;
    width: 100%;
    min-height: 4.5rem;
    resize: vertical;
    line-height: 1.4;
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
