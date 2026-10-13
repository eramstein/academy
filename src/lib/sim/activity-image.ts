import { ActivityType, type ScheduledActivity } from '@/lib/_model';
import { gs } from '@/lib/_state';
import { getActivityImageRefs, getJobImagePath, type ImageRef } from '@/lib/_utils/asset-paths';

/**
 * Illustration candidates for a scheduled activity (same order as Location):
 * job art when working, else activity participant art (built-in, then mods).
 */
export function getActivityIllustrationRefs(activity: ScheduledActivity): ImageRef[] {
  if (activity.type === ActivityType.Work && activity.jobId) {
    const job = gs.player.jobs.find((j) => j.id === activity.jobId);
    if (job) {
      return [
        {
          url: getJobImagePath(job.name),
          stored: `jobs/${job.name}.jpg`,
        },
      ];
    }
  }

  const others = activity.participants.filter((key) => key !== gs.player.key);
  if (others.length === 0) return [];

  return getActivityImageRefs(activity.type, others, activity.placeKey);
}

/** Full asset URLs for a scheduled activity's illustration candidates. */
export function getActivityImageCandidates(activity: ScheduledActivity): string[] {
  return getActivityIllustrationRefs(activity).map((ref) => ref.url);
}

/** First candidate whose image loads; undefined if none exist. */
export function probeFirstExistingImage(candidates: ImageRef[]): Promise<ImageRef | undefined> {
  if (candidates.length === 0) return Promise.resolve(undefined);

  return new Promise((resolve) => {
    let index = 0;
    const img = new Image();
    let current: ImageRef | undefined;

    const tryNext = () => {
      if (index >= candidates.length) {
        resolve(undefined);
        return;
      }
      current = candidates[index++];
      img.src = current.url;
    };

    img.onload = () => resolve(current);
    img.onerror = tryNext;
    tryNext();
  });
}
