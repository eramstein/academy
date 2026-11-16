import type { Job } from '@/lib/_model';
import { gs } from '@/lib/_state';
import { acceptJob } from '../jobs';

export interface GetJobParameters {
  job: Omit<Job, 'id'>;
  /** Defaults to the player. */
  characterKey?: string;
}

export function getJob(parameters: GetJobParameters): string {
  const { job, characterKey = 'player' } = parameters;
  if (characterKey !== 'player' && characterKey !== gs.player.key && !gs.characters[characterKey]) {
    return `Invalid character key: ${characterKey}.`;
  }
  if (!gs.characters[job.employerKey]) {
    return `Invalid employer key: ${job.employerKey}.`;
  }
  if (!gs.places[job.placeKey]) {
    return `Invalid place key: ${job.placeKey}.`;
  }
  return acceptJob(job, job.schedule, characterKey);
}
