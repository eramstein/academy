<script lang="ts">
  import { ActivityType } from '@/lib/_model';
  import { gs } from '@/lib/_state/main.svelte';
  import { getJobImagePath, getPlaceImagePath } from '@/lib/_utils/asset-paths';
  import { getCurrentScheduledActivity } from '@/lib/sim/schedule';

  const activity = $derived(getCurrentScheduledActivity());
  const matchedJob = $derived(
    activity?.type === ActivityType.Work && activity.jobId
      ? gs.player.jobs.find((j) => j.id === activity.jobId)
      : undefined
  );
  const imagePath = $derived(
    matchedJob ? getJobImagePath(matchedJob.name) : getPlaceImagePath(gs.player.placeKey)
  );
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
