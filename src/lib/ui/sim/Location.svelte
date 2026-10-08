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
  const activityPath = $derived.by(() => {
    if (!activity || matchedJob) return undefined;
    const others = activity.participants.filter((key) => key !== gs.player.key);
    if (others.length === 0) return undefined;
    return getActivityImagePath(activity.type, others);
  });

  let imagePath = $state(getPlaceImagePath(gs.player.placeKey));

  $effect(() => {
    const job = jobPath;
    const place = placePath;
    const activityCandidate = activityPath;

    if (job) {
      imagePath = job;
      return;
    }

    if (!activityCandidate) {
      imagePath = place;
      return;
    }

    imagePath = place;
    let cancelled = false;
    const img = new Image();
    img.onload = () => {
      if (!cancelled) imagePath = activityCandidate;
    };
    img.onerror = () => {
      if (!cancelled) imagePath = place;
    };
    img.src = activityCandidate;

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
