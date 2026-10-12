<script lang="ts">
  import { gs } from '@/lib/_state/main.svelte';
  import { getPlaceImagePath } from '@/lib/_utils/asset-paths';
  import { getActivityImageCandidates } from '@/lib/sim/activity-image';
  import { getCurrentScheduledActivity } from '@/lib/sim/schedule';

  const activity = $derived(getCurrentScheduledActivity());
  const placePath = $derived(getPlaceImagePath(gs.player.placeKey));
  const eventImagePath = $derived(gs.scene.image);
  const activityPaths = $derived(activity ? getActivityImageCandidates(activity) : []);

  let imagePath = $state(getPlaceImagePath(gs.player.placeKey));

  $effect(() => {
    const eventImage = eventImagePath;
    if (eventImage) {
      imagePath = eventImage;
      return;
    }

    const place = placePath;
    const candidates = activityPaths;

    if (candidates.length === 0) {
      imagePath = place;
      return;
    }

    imagePath = place;
    let cancelled = false;
    let index = 0;
    let current: string | undefined;
    const img = new Image();

    const tryNext = () => {
      if (cancelled) return;
      if (index >= candidates.length) {
        imagePath = place;
        return;
      }
      current = candidates[index++];
      img.src = current;
    };

    img.onload = () => {
      if (!cancelled && current) imagePath = current;
    };
    img.onerror = tryNext;
    tryNext();

    return () => {
      cancelled = true;
    };
  });
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
