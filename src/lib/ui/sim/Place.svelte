<script lang="ts">
  import {
    DayPeriod,
    isClassActivity,
    type Character,
    type Place,
    type ScheduledActivity,
  } from '@/lib/_model';
  import { gs } from '@/lib/_state/main.svelte';
  import { selectSimCharacter, uiState } from '@/lib/_state/state-ui.svelte';
  import { getPlaceImagePath } from '@/lib/_utils/asset-paths';
  import { getWeekDay } from '@/lib/sim/time';
  import CharacterPortrait from './characters/CharacterPortrait.svelte';

  let { place }: { place: Place } = $props();

  const WEEK_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const PERIODS = [DayPeriod.Morning, DayPeriod.Afternoon, DayPeriod.Evening];

  const imagePath = $derived(getPlaceImagePath(place.key));
  const region = $derived(gs.regions[place.regionKey]);
  const playerHere = $derived(gs.player.placeKey === place.key);

  const present = $derived([
    ...(playerHere ? [gs.player] : []),
    ...Object.values(gs.characters).filter((character) => character.placeKey === place.key),
  ]);

  const upcoming = $derived(
    gs.scheduledActivities
      .filter(
        (activity) =>
          activity.placeKey === place.key &&
          isAtOrAfterNow(activity) &&
          activity.day <= gs.time.day + 7,
      )
      .sort(
        (a, b) => a.day - b.day || periodIndex(a.period) - periodIndex(b.period),
      ),
  );

  const happeningNow = $derived(
    upcoming.filter((activity) => activity.day === gs.time.day && activity.period === gs.time.period),
  );

  const later = $derived(
    upcoming.filter(
      (activity) => !(activity.day === gs.time.day && activity.period === gs.time.period),
    ),
  );

  function periodIndex(period: DayPeriod): number {
    return PERIODS.indexOf(period);
  }

  function isAtOrAfterNow(activity: ScheduledActivity): boolean {
    if (activity.day > gs.time.day) return true;
    if (activity.day < gs.time.day) return false;
    return periodIndex(activity.period) >= periodIndex(gs.time.period);
  }

  function activityLabel(activity: ScheduledActivity): string {
    if (isClassActivity(activity)) {
      return activity.classType;
    }
    return activity.type;
  }

  function activityWhen(activity: ScheduledActivity): string {
    const weekday = WEEK_DAYS[getWeekDay(activity.day) - 1];
    return `${weekday}, Day ${activity.day} · ${activity.period}`;
  }

  function participantNames(activity: ScheduledActivity): string {
    return activity.participants
      .map((key) => (key === gs.player.key ? gs.player.name : (gs.characters[key]?.name ?? key)))
      .join(', ');
  }

  function inspectCharacter(character: Character) {
    if (character.key === gs.player.key) {
      uiState.sim.dataTab = 'player';
      return;
    }
    selectSimCharacter(character.key);
  }
</script>

<div class="place-container" style="--bg-image: url('{imagePath}')">
  <div class="info-panel">
    <header class="identity">
      <div class="title-row">
        <h2 class="name">{place.name}</h2>
        {#if playerHere}
          <span class="here">You are here</span>
        {/if}
      </div>
      {#if region}
        <p class="region">{region.name}</p>
        <p class="muted">{region.description}</p>
      {/if}
      <p class="description">{place.description}</p>
    </header>

    <section class="section">
      <h3 class="section-title">Present</h3>
      {#if present.length > 0}
        <ul class="people">
          {#each present as character (character.key)}
            <li>
              <button
                type="button"
                class="person"
                onclick={() => inspectCharacter(character)}
              >
                <span class="portrait-frame">
                  <CharacterPortrait {character} zoom={1.2} />
                </span>
                <span class="person-name">{character.name}</span>
              </button>
            </li>
          {/each}
        </ul>
      {:else}
        <p class="empty">No one is here.</p>
      {/if}
    </section>

    {#if happeningNow.length > 0}
      <section class="section">
        <h3 class="section-title">Happening now</h3>
        <ul class="activity-list">
          {#each happeningNow as activity, i (`now-${activity.type}-${i}`)}
            <li class="activity current">
              <span class="activity-name">{activityLabel(activity)}</span>
              <span class="activity-when">{activityWhen(activity)}</span>
              {#if activity.participants.length > 0}
                <span class="activity-who">{participantNames(activity)}</span>
              {/if}
            </li>
          {/each}
        </ul>
      </section>
    {/if}

    <section class="section">
      <h3 class="section-title">Upcoming</h3>
      {#if later.length > 0}
        <ul class="activity-list">
          {#each later as activity, i (`later-${activity.type}-${activity.day}-${activity.period}-${i}`)}
            <li class="activity">
              <span class="activity-name">{activityLabel(activity)}</span>
              <span class="activity-when">{activityWhen(activity)}</span>
              {#if activity.participants.length > 0}
                <span class="activity-who">{participantNames(activity)}</span>
              {/if}
            </li>
          {/each}
        </ul>
      {:else}
        <p class="empty">Nothing scheduled here in the next 7 days.</p>
      {/if}
    </section>
  </div>
</div>

<style>
  .place-container {
    position: relative;
    width: 100%;
    height: 100%;
    background-image: var(--bg-image);
    background-size: cover;
    background-position: center;
    background-repeat: no-repeat;
  }

  .info-panel {
    position: absolute;
    left: 16px;
    right: 16px;
    bottom: 16px;
    max-height: calc(100% - 72px);
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 1rem;
    padding: 0.9rem 1rem;
    box-sizing: border-box;
    border-radius: 4px;
    border: 1px solid var(--color-golden);
    color: var(--color-cream);
    font-family: var(--font-narrative);
    background: var(--color-data) var(--data-bg) center / cover;
    scrollbar-width: thin;
    scrollbar-color: rgba(191, 161, 74, 0.4) transparent;
  }

  .identity {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
  }

  .title-row {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: 0.55rem;
  }

  .name {
    margin: 0;
    font-size: 1.15rem;
    font-weight: 600;
    line-height: 1.3;
    color: var(--color-cream);
  }

  .here {
    font-size: 0.75rem;
    font-weight: 600;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: var(--color-cream);
    border: 1px solid var(--color-golden);
    background: transparent;
    border-radius: 3px;
    padding: 0.1rem 0.4rem;
  }

  .region {
    margin: 0;
    font-size: 0.85rem;
    font-weight: 600;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: var(--color-muted-label);
  }

  .muted,
  .description,
  .empty {
    margin: 0;
    font-size: 0.85rem;
    line-height: 1.4;
    color: var(--color-muted-label);
  }

  .description {
    color: var(--color-cream);
  }

  .section {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .section-title {
    margin: 0;
    font-size: 0.8rem;
    font-weight: 600;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--color-muted-label);
    padding-bottom: 0.35rem;
    border-bottom: 1px solid rgba(191, 161, 74, 0.35);
  }

  .people {
    margin: 0;
    padding: 0;
    list-style: none;
    display: flex;
    flex-wrap: wrap;
    gap: 0.65rem;
  }

  .person {
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
    width: 112px;
    padding: 0;
    background: transparent;
    border: none;
    cursor: pointer;
    color: inherit;
    text-align: center;
  }

  .portrait-frame {
    display: block;
    width: 112px;
    height: 112px;
    overflow: hidden;
    border-radius: 6px;
    border: 1px solid var(--color-golden);
    background: var(--color-deep-brown);
  }

  .person:hover .portrait-frame {
    border-color: var(--color-golden);
  }

  .portrait-frame :global(.character-portrait) {
    border-radius: 0;
  }

  .person-name {
    font-size: 0.75rem;
    line-height: 1.3;
    color: var(--color-cream);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .activity-list {
    margin: 0;
    padding: 0;
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: 0.45rem;
  }

  .activity {
    display: flex;
    flex-direction: column;
    gap: 0.1rem;
    padding: 0.4rem 0.5rem;
    border: 1px solid var(--color-golden);
    border-radius: 4px;
    background: rgba(191, 161, 74, 0.08);
  }

  .activity.current {
    border-color: var(--color-golden);
    background: rgba(191, 161, 74, 0.12);
  }

  .activity-name {
    font-size: 0.9rem;
    text-transform: capitalize;
    color: var(--color-cream);
  }

  .activity-when {
    font-size: 0.75rem;
    color: var(--color-muted-label);
    text-transform: capitalize;
  }

  .activity-who {
    font-size: 0.8rem;
    color: var(--color-cream);
  }
</style>
