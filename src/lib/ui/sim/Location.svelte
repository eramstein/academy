<script lang="ts">
  import { gs } from '@/lib/_state/main.svelte';
  import { getPlaceImagePath } from '@/lib/_utils/asset-paths';

  const imagePath = $derived(getPlaceImagePath(gs.player.placeKey));
</script>

<div class="location" style="--bg-image: url('{imagePath}')"></div>

<style>
  .location {
    width: 100%;
    height: 100%;
    background-image: var(--bg-image);
    background-size: cover;
    background-position: center;
    background-repeat: no-repeat;
  }
</style>
