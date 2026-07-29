<script lang="ts">
  import { gs } from '@/lib/_state/main.svelte';

  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
</script>

<div class="time-display">
  <span class="day">{dayNames[gs.time.day % 7]}</span>
  <span class="period">{gs.time.hour}:{gs.time.minute}</span>
</div>

<style>
  .time-display {
    display: flex;
    flex-direction: column;
    font-family: 'Arial', sans-serif;
    padding-left: 30px;
    justify-content: center;
    align-items: center;
  }

  .day {
    font-size: 18px;
    font-weight: bold;
    color: #ffd700;
  }

  .period {
    font-size: 14px;
    color: #cccccc;
    text-transform: capitalize;
  }
</style>
