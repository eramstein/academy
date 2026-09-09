<script lang="ts">
  import { gs } from '@/lib/_state/main.svelte';
  import { getAssetPath } from '@/lib/_utils/asset-paths';

  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const sunPath = getAssetPath('images/ui/sun.svg');
</script>

<div class="time-display">
  <span class="sun" style="--icon: url('{sunPath}')" aria-hidden="true"></span>
  <span class="label">{dayNames[gs.time.day % 7]} {gs.time.period}</span>
</div>

<style>
  .time-display {
    display: flex;
    flex-shrink: 0;
    align-items: center;
    gap: 0.45rem;
    line-height: 1.2;
  }

  .sun {
    display: block;
    width: 1rem;
    height: 1rem;
    background: var(--color-golden);
    mask: var(--icon) center / contain no-repeat;
    -webkit-mask: var(--icon) center / contain no-repeat;
  }

  .label {
    font-size: 0.85rem;
    font-weight: 600;
    color: var(--color-golden);
    text-transform: capitalize;
    white-space: nowrap;
  }
</style>
