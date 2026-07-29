<script lang="ts">
  import { ActivityType, type ClassActivity, type ScheduledActivity } from '@/lib/_model';
  import { gs } from '@/lib/_state/main.svelte';

  const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  /** Weeks relative to the current game week's Monday. */
  let weekOffset = $state(0);

  /** Monday of the week containing `day` (day 1 = Monday). */
  function mondayOfWeek(day: number): number {
    const dow = ((day % 7) + 7) % 7; // 0=Sun, 1=Mon, … 6=Sat
    return dow === 0 ? day - 6 : day - (dow - 1);
  }

  function formatTime(hour: number, minute: number): string {
    return `${hour}:${minute.toString().padStart(2, '0')}`;
  }

  function formatEndTime(activity: ScheduledActivity): string {
    const total = activity.hour * 60 + activity.minute + activity.duration;
    return formatTime(Math.floor(total / 60) % 24, total % 60);
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

  const activitiesByDay = $derived(
    weekDays.map((day) =>
      gs.scheduledActivities
        .filter((a) => a.day === day)
        .slice()
        .sort((a, b) => a.hour * 60 + a.minute - (b.hour * 60 + b.minute)),
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
    {#each weekDays as day, i (day)}
      <div class="day-column" class:today={day === gs.time.day}>
        <div class="day-header">
          <span class="day-label">{dayLabels[i]}</span>
          <span class="day-number">Day {day}</span>
        </div>
        <ul class="activity-list">
          {#each activitiesByDay[i] as activity (activity.day + '-' + activity.hour + '-' + activity.minute + '-' + activity.type + '-' + activity.placeKey)}
            <li class="activity" data-type={activity.type}>
              <span class="activity-time">
                {formatTime(activity.hour, activity.minute)}
                <span class="activity-end">– {formatEndTime(activity)}</span>
              </span>
              <span class="activity-name">{activityLabel(activity)}</span>
              <span class="activity-place">{placeName(activity.placeKey)}</span>
            </li>
          {:else}
            <li class="empty">—</li>
          {/each}
        </ul>
      </div>
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
    grid-template-columns: repeat(7, minmax(0, 1fr));
    gap: 0.35rem;
    min-height: 0;
  }

  .day-column {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
    min-width: 0;
    padding: 0.4rem;
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 4px;
    background: rgba(255, 255, 255, 0.03);
  }

  .day-column.today {
    border-color: rgba(191, 161, 74, 0.45);
    background: rgba(191, 161, 74, 0.08);
  }

  .day-header {
    display: flex;
    flex-direction: column;
    gap: 0.1rem;
    padding-bottom: 0.35rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  }

  .day-label {
    font-size: 0.8rem;
    font-weight: 600;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: #cccccc;
  }

  .day-column.today .day-label {
    color: var(--color-golden);
  }

  .day-number {
    font-size: 0.75rem;
    color: #888888;
    font-variant-numeric: tabular-nums;
  }

  .activity-list {
    margin: 0;
    padding: 0;
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }

  .activity {
    display: flex;
    flex-direction: column;
    gap: 0.1rem;
    font-size: 0.8rem;
    line-height: 1.25;
  }

  .activity-time {
    color: #aaaaaa;
    font-variant-numeric: tabular-nums;
  }

  .activity-end {
    color: #666666;
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
