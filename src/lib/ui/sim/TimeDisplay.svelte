<script lang="ts">
  import { gs } from '@/lib/_state/main.svelte';

  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
</script>

<div class="time-display">
  <span class="day">{dayNames[gs.time.day % 7]}</span>
  <span class="period">{gs.time.period}</span>
</div>

<style>
  .time-display {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: flex-start;
    line-height: 1.2;
  }

  .day {
    font-size: 0.9rem;
    font-weight: bold;
    color: #ffd700;
  }

  .period {
    font-size: 0.75rem;
    color: #cccccc;
    text-transform: capitalize;
  }
</style>
