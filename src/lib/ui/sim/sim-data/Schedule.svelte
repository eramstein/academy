<script lang="ts">
  import {
    ActivityType,
    ClassType,
    DayPeriod,
    isClassActivity,
    type Character,
    type ScheduledActivity,
  } from '@/lib/_model';
  import { gs } from '@/lib/_state/main.svelte';
  import { getAssetPath, getUiIconPath } from '@/lib/_utils/asset-paths';
  import CharacterPortrait from '../characters/CharacterPortrait.svelte';
  import League from './League.svelte';

  const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const periods = [DayPeriod.Morning, DayPeriod.Afternoon, DayPeriod.Evening];
  const maxPortraits = 3;

  const periodIcon: Record<DayPeriod, string> = {
    [DayPeriod.Morning]: 'sunrise',
    [DayPeriod.Afternoon]: 'sun',
    [DayPeriod.Evening]: 'moon',
  };

  const flourishPath = getAssetPath('images/ui/decorations/page-flourish.svg');

  /** Weeks relative to the current game week's Monday. */
  let weekOffset = $state(0);

  /** Monday of the week containing `day` (day 1 = Monday). */
  function mondayOfWeek(day: number): number {
    const dow = ((day % 7) + 7) % 7; // 0=Sun, 1=Mon, … 6=Sat
    return dow === 0 ? day - 6 : day - (dow - 1);
  }

  function titleCase(value: string): string {
    return value
      .split(/[\s_]+/)
      .filter(Boolean)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  function activityTitle(activity: ScheduledActivity): string {
    if (isClassActivity(activity)) return titleCase(activity.classType);
    return titleCase(activity.type);
  }

  function activityIconName(activity: ScheduledActivity): string {
    if (isClassActivity(activity)) {
      if (activity.classType === ClassType.Enchanting) return 'gem';
      if (activity.classType === ClassType.Artificery) return 'metal_bar';
      return 'book';
    }
    switch (activity.type) {
      case ActivityType.Social:
      case ActivityType.Hangout:
        return 'mug';
      case ActivityType.Date:
        return 'heart';
      case ActivityType.Study:
      case ActivityType.Exam:
        return 'book';
      case ActivityType.Work:
        return 'coin';
      case ActivityType.Training:
      case ActivityType.Sports:
      case ActivityType.Adventure:
        return 'boot';
      case ActivityType.Tournament:
      case ActivityType.LeagueCeremony:
        return 'trophy';
      case ActivityType.Event:
        return 'calendar';
      default:
        return 'star';
    }
  }

  function placeName(placeKey: string): string {
    return gs.places[placeKey]?.name ?? placeKey;
  }

  /** Drop a leading class name so "Artificery" / "Artificery Class Room" reads as a room line. */
  function placeLabel(activity: ScheduledActivity): string {
    const place = placeName(activity.placeKey);
    const title = activityTitle(activity);
    if (place.toLowerCase().startsWith(title.toLowerCase())) {
      const rest = place.slice(title.length).trim();
      if (rest) return rest;
    }
    return place;
  }

  function participantsOf(activity: ScheduledActivity): Character[] {
    const people: Character[] = [];
    for (const key of activity.participants) {
      if (key === gs.player.key) continue;
      const character = gs.characters[key];
      if (character) people.push(character);
    }
    return people;
  }

  const weekStart = $derived(mondayOfWeek(gs.time.day) + weekOffset * 7);
  const weekEnd = $derived(weekStart + 6);
  const weekNumber = $derived(Math.floor((weekStart - 1) / 7) + 1);
  const weekDays = $derived(Array.from({ length: 7 }, (_, i) => weekStart + i));
  const canGoPrev = $derived(weekStart - 7 >= 0);

  const activityGrid = $derived(
    periods.map((period) =>
      weekDays.map((day) =>
        gs.scheduledActivities.filter((activity) => activity.day === day && activity.period === period)
      )
    )
  );
</script>

<div
  class="schedule"
  style="--flourish: url('{flourishPath}')"
>
  <header class="mast">
    {#if canGoPrev}
      <button
        type="button"
        class="nav-btn nav-back"
        aria-label="Previous week"
        onclick={() => weekOffset--}
      >
        ←
      </button>
    {:else}
      <span class="nav-spacer" aria-hidden="true"></span>
    {/if}

    <div class="title-block">
      <h2 class="title">
        <span class="flourish" aria-hidden="true"></span>
        Academy Schedule
        <span class="flourish right" aria-hidden="true"></span>
      </h2>
      <p class="week-label">
        <span class="rule" aria-hidden="true"></span>
        <span>Week {weekNumber} · Days {weekStart}–{weekEnd}</span>
        <span class="rule right" aria-hidden="true"></span>
      </p>
    </div>

    <button type="button" class="nav-btn nav-next" onclick={() => weekOffset++}>
      Next Week →
    </button>
  </header>

  <div class="board">
    <div class="period-gap" aria-hidden="true"></div>
    {#each periods as period (period)}
      <div class="period">
        <span
          class="period-icon"
          style="--icon: url('{getUiIconPath(periodIcon[period])}')"
          aria-hidden="true"
        ></span>
        <span class="period-name">{period}</span>
      </div>
    {/each}

    {#each weekDays as day, di (day)}
      {@const isToday = day === gs.time.day}
      <section class="day" class:today={isToday} aria-current={isToday ? 'date' : undefined}>
        <header class="day-head">
          <span class="dow">{dayLabels[di]}</span>
          <span class="num">{day}</span>
          {#if isToday}
            <span class="day-rule" aria-hidden="true"><i></i></span>
            <span class="today-ribbon">Today</span>
          {/if}
        </header>

        {#each periods as period, pi (period)}
          {@const activities = activityGrid[pi][di]}
          <div class="cell" class:now={isToday && period === gs.time.period}>
            {#each activities as activity, ai (`${day}-${period}-${ai}`)}
              {@const people = participantsOf(activity)}
              <article
                class="card"
                class:with-faces={people.length > 0}
                title="{activityTitle(activity)} — {placeName(activity.placeKey)}"
              >
                <div class="card-main">
                  <img
                    class="card-icon"
                    src={getUiIconPath(activityIconName(activity))}
                    alt=""
                    draggable="false"
                  />
                  <div class="card-copy">
                    <div class="card-name">{activityTitle(activity)}</div>
                    <div class="card-place">{placeLabel(activity)}</div>
                  </div>
                </div>
                {#if people.length > 0}
                  <div class="faces" title={people.map((person) => person.name).join(', ')}>
                    {#each people.slice(0, maxPortraits) as character, fi (character.key)}
                      <span class="face" style="z-index: {maxPortraits - fi}">
                        <CharacterPortrait {character} zoom={1.5} />
                      </span>
                    {/each}
                    {#if people.length > maxPortraits}
                      <span class="face more">+{people.length - maxPortraits}</span>
                    {/if}
                  </div>
                {/if}
              </article>
            {:else}
              <span class="empty-mark" aria-hidden="true"></span>
            {/each}
          </div>
        {/each}
      </section>
    {/each}
  </div>

  <League />
</div>

<style>
  .schedule {
    display: flex;
    flex-direction: column;
    gap: 0.85rem;
    width: 100%;
    max-width: 800px;
    min-width: 0;
    color: var(--color-cream);
    font-family: var(--font-narrative);
    container-type: inline-size;
  }

  .schedule,
  .nav-btn,
  .day,
  .day-head,
  .cell,
  .card,
  .period,
  .face {
    box-sizing: border-box;
  }

  .mast {
    display: grid;
    grid-template-columns: 1fr auto 1fr;
    align-items: center;
    gap: 0.65rem;
    margin-top: 0.15rem;
  }

  .mast > :first-child {
    justify-self: start;
  }

  .mast > :last-child {
    justify-self: end;
  }

  .nav-spacer {
    width: 2.3rem;
    height: 1.85rem;
  }

  .nav-btn {
    height: 1.85rem;
    padding: 0 0.8rem;
    border: 1px solid var(--color-brass);
    border-radius: 4px;
    background: var(--color-data-active);
    color: var(--color-cream);
    font-family: inherit;
    font-size: 0.82rem;
    line-height: 1;
    white-space: nowrap;
    cursor: pointer;
    box-shadow:
      inset 0 1px 0 rgba(240, 220, 170, 0.14),
      0 1px 2px rgba(0, 0, 0, 0.4);
  }

  .nav-back {
    width: 2.3rem;
    padding: 0;
    font-size: 1rem;
  }

  .nav-btn:hover {
    background: var(--color-data-hover);
    border-color: var(--color-golden);
  }

  .nav-btn:focus-visible {
    outline: 1px solid var(--color-golden);
    outline-offset: 2px;
  }

  .title-block {
    min-width: 0;
    text-align: center;
  }

  .title {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.4rem;
    margin: 0;
    color: var(--color-golden);
    font-size: clamp(1.05rem, 4.8cqi, 1.5rem);
    font-weight: 600;
    letter-spacing: 0.04em;
    line-height: 1.1;
    text-shadow: 0 1px 0 rgba(0, 0, 0, 0.45);
  }

  .flourish {
    width: 1.65rem;
    height: 1.3rem;
    flex: 0 0 auto;
    background: var(--color-brass);
    opacity: 0.92;
    mask: var(--flourish) center / contain no-repeat;
    -webkit-mask: var(--flourish) center / contain no-repeat;
  }

  .flourish.right {
    transform: scaleX(-1);
  }

  .week-label {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.55rem;
    margin: 0.28rem 0 0;
    color: var(--color-muted-label);
    font-size: 0.88rem;
    letter-spacing: 0.02em;
    white-space: nowrap;
  }

  .rule {
    width: 2.8rem;
    height: 1px;
    background: linear-gradient(90deg, transparent, var(--color-brass) 40%, var(--color-brass));
    opacity: 0.85;
  }

  .rule.right {
    background: linear-gradient(90deg, var(--color-brass), var(--color-brass) 60%, transparent);
  }

  .board {
    display: grid;
    grid-template-columns: 5.25rem repeat(3, minmax(0, 1fr));
    column-gap: 0.4rem;
    row-gap: 0.4rem;
    width: 100%;
    max-width: 800px;
    min-width: 0;
  }

  .day {
    display: grid;
    grid-column: 1 / -1;
    grid-template-columns: subgrid;
    align-items: stretch;
    min-width: 0;
  }

  .period {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: center;
    gap: 0.45rem;
    padding: 0.4rem 0.5rem;
    border: 1px solid color-mix(in srgb, var(--color-brass) 72%, transparent);
    border-radius: 4px;
    background: color-mix(in srgb, var(--color-data-active) 72%, transparent);
  }

  .period-icon {
    width: 1.7rem;
    height: 1.7rem;
    background: var(--icon) center / contain no-repeat;
  }

  .period-name {
    color: var(--color-cream);
    font-size: 0.9rem;
    letter-spacing: 0.04em;
    text-transform: capitalize;
    white-space: nowrap;
  }

  .day.today {
    z-index: 1;
    border-radius: 5px;
    background: color-mix(in srgb, var(--color-golden) 8%, transparent);
    box-shadow: inset 0 0 0 1px var(--color-golden);
  }

  .day-head,
  .cell {
    position: relative;
    min-width: 0;
  }

  .day-head {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.04rem;
    padding: 0.42rem 0.2rem 0.38rem;
    border: 1px solid color-mix(in srgb, var(--color-brass) 75%, transparent);
    border-radius: 4px;
    background: color-mix(in srgb, var(--color-data-active) 78%, transparent);
    text-align: center;
    box-shadow: inset 0 0 0 1px rgba(175, 142, 103, 0.1);
  }

  .day:not(.today) .day-head::before,
  .day:not(.today) .cell::before {
    content: '';
    position: absolute;
    top: 0;
    left: 50%;
    z-index: 1;
    width: 5px;
    height: 5px;
    background: var(--color-brass);
    transform: translate(-50%, -50%) rotate(45deg);
  }

  .dow {
    color: var(--color-cream);
    font-size: 0.76rem;
    font-weight: 600;
    letter-spacing: 0.14em;
    line-height: 1.1;
    text-transform: uppercase;
  }

  .num {
    color: var(--color-golden);
    font-size: 1.3rem;
    font-variant-numeric: tabular-nums;
    line-height: 1;
  }

  .day-rule {
    display: flex;
    align-items: center;
    width: 58%;
    margin-top: 0.16rem;
    color: var(--color-brass);
  }

  .day-rule::before,
  .day-rule::after {
    content: '';
    flex: 1;
    height: 1px;
    background: currentColor;
    opacity: 0.75;
  }

  .day-rule i {
    width: 4px;
    height: 4px;
    margin: 0 0.18rem;
    background: currentColor;
    transform: rotate(45deg);
  }

  .day.today .day-head {
    border: none;
    background: transparent;
    box-shadow: none;
  }

  .day.today .dow {
    color: var(--color-golden);
  }

  .day.today .num {
    color: var(--color-cream);
    font-size: 1.4rem;
  }

  .day.today .day-rule {
    color: var(--color-golden);
  }

  .today-ribbon {
    margin-top: 0.22rem;
    padding: 0.12rem 0.78rem 0.14rem;
    background: var(--color-ink);
    color: var(--color-golden);
    font-size: 0.64rem;
    font-weight: 700;
    letter-spacing: 0.14em;
    line-height: 1.35;
    text-transform: uppercase;
    clip-path: polygon(7% 0, 93% 0, 100% 50%, 93% 100%, 7% 100%, 0 50%);
  }

  .cell {
    display: flex;
    min-height: 6.4rem;
    flex-direction: column;
    align-items: stretch;
    justify-content: center;
    gap: 0.28rem;
    padding: 0.3rem;
    border: 1px solid color-mix(in srgb, var(--color-brass) 72%, transparent);
    border-radius: 4px;
    background: color-mix(in srgb, var(--color-data-active) 70%, transparent);
    box-shadow: inset 0 0 0 1px rgba(175, 142, 103, 0.08);
  }

  .cell:has(.card) {
    padding: 0;
    border: none;
    background: transparent;
    box-shadow: none;
  }

  .cell:has(.card)::before {
    content: none;
  }

  .cell.now::after {
    content: '';
    position: absolute;
    top: 0.45rem;
    bottom: 0.45rem;
    left: 0.12rem;
    width: 2px;
    border-radius: 1px;
    background: var(--color-golden);
  }

  .empty-mark {
    align-self: center;
    width: 9px;
    height: 9px;
    border: 1px solid var(--color-brass);
    transform: rotate(45deg);
    opacity: 0.8;
  }

  .card {
    position: relative;
    display: flex;
    flex: 1 1 auto;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.35rem;
    width: 100%;
    max-width: 100%;
    min-width: 0;
    height: 100%;
    padding: 0.55rem 0.55rem 0.5rem;
    border: 1px solid color-mix(in srgb, var(--color-brass) 82%, #5a4630);
    border-radius: 4px;
    background: var(--color-data-active);
  }

  .card.with-faces {
    justify-content: space-evenly;
    gap: 0.28rem;
  }

  .card::before {
    content: '';
    position: absolute;
    top: 0;
    left: 50%;
    z-index: 1;
    width: 5px;
    height: 5px;
    background: var(--color-brass);
    transform: translate(-50%, -50%) rotate(45deg);
  }

  .card-main {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: center;
    gap: 0.55rem;
    width: 100%;
    min-width: 0;
  }

  .card-icon {
    width: 2.7rem;
    height: 2.7rem;
    flex: 0 0 auto;
    object-fit: contain;
  }

  .card-copy {
    min-width: 0;
    max-width: 100%;
    text-align: left;
  }

  .card-name {
    display: -webkit-box;
    overflow: hidden;
    color: var(--color-cream);
    font-size: 1.05rem;
    font-weight: 600;
    line-height: 1.15;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
  }

  .card-place {
    display: -webkit-box;
    overflow: hidden;
    margin-top: 0.1rem;
    color: color-mix(in srgb, var(--color-cream) 68%, var(--color-brass));
    font-size: 0.84rem;
    font-style: italic;
    line-height: 1.15;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
  }

  .faces {
    display: flex;
    justify-content: center;
    min-width: 0;
  }

  .face {
    position: relative;
    width: 2.24rem;
    height: 2.24rem;
    flex: 0 0 auto;
    overflow: hidden;
    border: 1px solid var(--color-brass);
    border-radius: 50%;
    background: var(--color-data-active);
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.45);
  }

  .face + .face {
    margin-left: -0.55rem;
  }

  .face :global(.character-portrait) {
    border-radius: 0;
  }

  .face.more {
    display: grid;
    place-items: center;
    color: var(--color-cream);
    font-size: 0.7rem;
    line-height: 1;
  }

  @container (max-width: 760px) {
    .flourish {
      width: 1.2rem;
      height: 1rem;
    }

    .rule {
      width: 1.4rem;
    }

    .week-label {
      gap: 0.35rem;
      font-size: 0.7rem;
    }
  }
</style>
