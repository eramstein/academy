import { ActivityType, type ScheduledActivity } from '@/lib/_model';
import { gs } from '@/lib/_state';
import { getActivityImageRelPath, getAssetPath } from '@/lib/_utils/asset-paths';

/**
 * Illustration candidates for a scheduled activity (same order as Location):
 * job art when working, else activity participant art. Paths are relative to `images/`.
 */
export function getActivityImageRelCandidates(activity: ScheduledActivity): string[] {
  if (activity.type === ActivityType.Work && activity.jobId) {
    const job = gs.player.jobs.find((j) => j.id === activity.jobId);
    if (job) {
      return [`jobs/${job.name}.jpg`];
    }
  }

  const others = activity.participants.filter((key) => key !== gs.player.key);
  if (others.length === 0) return [];

  return getActivityImageRelPath(activity.type, others, activity.placeKey);
}

/** Full asset URLs for a scheduled activity's illustration candidates. */
export function getActivityImageCandidates(activity: ScheduledActivity): string[] {
  return getActivityImageRelCandidates(activity).map((rel) => getAssetPath(`images/${rel}`));
}

/** First candidate whose image loads; undefined if none exist. */
export function probeFirstExistingImageRel(relPaths: string[]): Promise<string | undefined> {
  if (relPaths.length === 0) return Promise.resolve(undefined);

  return new Promise((resolve) => {
    let index = 0;
    const img = new Image();
    let current: string | undefined;

    const tryNext = () => {
      if (index >= relPaths.length) {
        resolve(undefined);
        return;
      }
      current = relPaths[index++];
      img.src = getAssetPath(`images/${current}`);
    };

    img.onload = () => resolve(current);
    img.onerror = tryNext;
    tryNext();
  });
}
