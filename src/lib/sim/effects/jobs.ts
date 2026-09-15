import type { Job } from '@/lib/_model';
import { gs } from '@/lib/_state';
import { acceptJob } from '../jobs';

export interface GetJobParameters {
  job: Omit<Job, 'id'>;
}

export function getJob(parameters: GetJobParameters): string {
  const { job } = parameters;
  if (!gs.characters[job.employerKey]) {
    return `Invalid employer key: ${job.employerKey}.`;
  }
  if (!gs.places[job.placeKey]) {
    return `Invalid place key: ${job.placeKey}.`;
  }
  return acceptJob(job, job.schedule);
}
