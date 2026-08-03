<script lang="ts">
  import { ActivityType, DayPeriod, type ClassActivity, type ScheduledActivity } from '@/lib/_model';
  import { gs } from '@/lib/_state/main.svelte';

  const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const periods = [DayPeriod.Morning, DayPeriod.Afternoon, DayPeriod.Evening];

  /** Weeks relative to the current game week's Monday. */
  let weekOffset = $state(0);

  /** Monday of the week containing `day` (day 1 = Monday). */
  function mondayOfWeek(day: number): number {
    const dow = ((day % 7) + 7) % 7; // 0=Sun, 1=Mon, … 6=Sat
    return dow === 0 ? day - 6 : day - (dow - 1);
  }

  function activityLabel(activity: ScheduledActivity): string {
    if (activity.type === ActivityType.Class && 'classType' in activity) {
      return (activity as ClassActivity).classType;
    }
    return activity.type;
  }

  function placeName(placeKey: string): string {
    return gs.places[placeKey]?.name ?? placeKey;
  }

  const weekStart = $derived(mondayOfWeek(gs.time.day) + weekOffset * 7);
  const weekEnd = $derived(weekStart + 6);
  const weekDays = $derived(Array.from({ length: 7 }, (_, i) => weekStart + i));
  const canGoPrev = $derived(weekStart - 7 >= 0);

  const activityGrid = $derived(
    periods.map((period) =>
      weekDays.map((day) =>
        gs.scheduledActivities.filter((a) => a.day === day && a.period === period),
      ),
    ),
  );
</script>

<div class="schedule">
  <div class="week-nav">
    {#if canGoPrev}
      <button type="button" class="nav-btn" onclick={() => weekOffset--}>← Prev</button>
    {:else}
      <span class="nav-spacer"></span>
    {/if}
    <span class="week-label">Days {weekStart}–{weekEnd}</span>
    <button type="button" class="nav-btn" onclick={() => weekOffset++}>Next →</button>
  </div>

  <div class="week-grid">
    <div class="corner"></div>
    {#each weekDays as day, i (day)}
      <div class="day-header" class:today={day === gs.time.day}>
        <span class="day-label">{dayLabels[i]}</span>
        <span class="day-number">Day {day}</span>
      </div>
    {/each}

    {#each periods as period, pi (period)}
      <div class="period-header">{period}</div>
      {#each weekDays as day, di (day)}
        <div
          class="cell"
          class:today={day === gs.time.day}
          class:current={day === gs.time.day && period === gs.time.period}
        >
          {#each activityGrid[pi][di] as activity (activity.type + '-' + activity.placeKey)}
            <div class="activity" data-type={activity.type}>
              <span class="activity-name">{activityLabel(activity)}</span>
              <span class="activity-place">{placeName(activity.placeKey)}</span>
            </div>
          {:else}
            <span class="empty">—</span>
          {/each}
        </div>
      {/each}
    {/each}
  </div>
</div>

<style>
  .schedule {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    min-height: 0;
  }

  .week-nav {
    display: grid;
    grid-template-columns: 1fr auto 1fr;
    align-items: center;
    gap: 0.75rem;
  }

  .nav-btn {
    padding: 0.35rem 0.65rem;
    background: transparent;
    border: 1px solid rgba(255, 255, 255, 0.15);
    border-radius: 4px;
    color: #cccccc;
    font-size: 0.85rem;
    cursor: pointer;
    width: fit-content;
  }

  .week-nav > :first-child {
    justify-self: start;
  }

  .week-nav > :last-child {
    justify-self: end;
  }

  .nav-btn:hover {
    background: rgba(255, 255, 255, 0.08);
    color: white;
  }

  .nav-spacer {
    min-height: 1px;
  }

  .week-label {
    font-size: 0.9rem;
    color: #e8e8e8;
    font-variant-numeric: tabular-nums;
  }

  .week-grid {
    display: grid;
    grid-template-columns: auto repeat(7, minmax(0, 1fr));
    gap: 0.35rem;
    min-height: 0;
  }

  .corner {
    min-width: 0;
  }

  .day-header {
    display: flex;
    flex-direction: column;
    gap: 0.1rem;
    padding: 0.4rem;
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 4px;
    background: rgba(255, 255, 255, 0.03);
    text-align: center;
  }

  .day-header.today {
    border-color: rgba(191, 161, 74, 0.45);
    background: rgba(191, 161, 74, 0.08);
  }

  .day-label {
    font-size: 0.8rem;
    font-weight: 600;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: #cccccc;
  }

  .day-header.today .day-label {
    color: var(--color-golden);
  }

  .day-number {
    font-size: 0.75rem;
    color: #888888;
    font-variant-numeric: tabular-nums;
  }

  .period-header {
    display: flex;
    align-items: center;
    padding: 0.4rem 0.6rem 0.4rem 0;
    font-size: 0.8rem;
    font-weight: 600;
    letter-spacing: 0.04em;
    text-transform: capitalize;
    color: #cccccc;
    white-space: nowrap;
  }

  .cell {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
    min-width: 0;
    min-height: 2.5rem;
    padding: 0.4rem;
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 4px;
    background: rgba(255, 255, 255, 0.03);
  }

  .cell.today {
    border-color: rgba(191, 161, 74, 0.25);
    background: rgba(191, 161, 74, 0.04);
  }

  .cell.current {
    border-color: rgba(191, 161, 74, 0.45);
    background: rgba(191, 161, 74, 0.08);
  }

  .activity {
    display: flex;
    flex-direction: column;
    gap: 0.1rem;
    font-size: 0.8rem;
    line-height: 1.25;
  }

  .activity-name {
    color: #e8e8e8;
    text-transform: capitalize;
  }

  .activity-place {
    color: #888888;
    font-size: 0.75rem;
  }

  .empty {
    color: #555555;
    font-size: 0.8rem;
  }
</style>
