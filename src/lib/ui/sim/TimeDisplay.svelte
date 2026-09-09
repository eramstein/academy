<script lang="ts">
  import { DayPeriod } from '@/lib/_model';
  import { gs } from '@/lib/_state/main.svelte';
  import { getAssetPath } from '@/lib/_utils/asset-paths';

  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  const periodIcon: Record<DayPeriod, string> = {
    [DayPeriod.Morning]: 'sunrise',
    [DayPeriod.Afternoon]: 'sun',
    [DayPeriod.Evening]: 'moon',
  };

  const iconPath = $derived(getAssetPath(`images/ui/${periodIcon[gs.time.period]}.svg`));
</script>

<div class="time-display">
  <span class="icon" style="--icon: url('{iconPath}')" aria-hidden="true"></span>
  <div class="copy">
    <span class="day">{dayNames[gs.time.day % 7]}</span>
    <span class="period">{gs.time.period}</span>
  </div>
</div>

<style>
  .time-display {
    display: flex;
    flex-shrink: 0;
    align-items: center;
    gap: 0.45rem;
    padding: 0.2rem 0.35rem 0.45rem 0;
    line-height: 1.15;
  }

  .icon {
    display: block;
    width: 1.05rem;
    height: 1.05rem;
    background: var(--color-golden);
    mask: var(--icon) center / contain no-repeat;
    -webkit-mask: var(--icon) center / contain no-repeat;
  }

  .copy {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 0.18rem;
  }

  .day {
    font-size: 0.85rem;
    font-weight: 700;
    color: var(--color-golden);
    white-space: nowrap;
  }

  .period {
    font-size: 0.72rem;
    color: var(--color-cream);
    text-transform: capitalize;
    white-space: nowrap;
  }
</style>
