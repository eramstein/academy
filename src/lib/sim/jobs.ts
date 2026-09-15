import { ActivityType, type Job, type Schedule } from '../_model';
import { gs } from '../_state';
import { scheduleActivities } from './effects/schedule';

export function acceptJob(job: Omit<Job, 'id'>, schedule: Schedule) {
  const newJob: Job = {
    id: crypto.randomUUID(),
    ...job,
  };
  gs.player.jobs.push(newJob);
  scheduleActivities({
    activity: {
      type: ActivityType.Work,
      participants: [gs.player.key, job.employerKey],
      placeKey: job.placeKey,
    },
    schedule,
  });
  return `You have accepted the job ${job.name} from ${job.employerKey}.`;
}
