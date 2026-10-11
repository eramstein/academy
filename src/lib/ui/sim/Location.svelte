<script lang="ts">
  import { ActivityType } from '@/lib/_model';
  import { gs } from '@/lib/_state/main.svelte';
  import {
    getActivityImagePath,
    getJobImagePath,
    getPlaceImagePath,
  } from '@/lib/_utils/asset-paths';
  import { getCurrentScheduledActivity } from '@/lib/sim/schedule';

  const activity = $derived(getCurrentScheduledActivity());
  const matchedJob = $derived(
    activity?.type === ActivityType.Work && activity.jobId
      ? gs.player.jobs.find((j) => j.id === activity.jobId)
      : undefined
  );
  const placePath = $derived(getPlaceImagePath(gs.player.placeKey));
  const jobPath = $derived(matchedJob ? getJobImagePath(matchedJob.name) : undefined);
  const activityPaths = $derived.by(() => {
    if (!activity || matchedJob) return [];
    const others = activity.participants.filter((key) => key !== gs.player.key);
    if (others.length === 0) return [];
    return getActivityImagePath(activity.type, others, gs.player.placeKey);
  });

  let imagePath = $state(getPlaceImagePath(gs.player.placeKey));

  $effect(() => {
    const job = jobPath;
    const place = placePath;
    const candidates = activityPaths;

    if (job) {
      imagePath = job;
      return;
    }

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
