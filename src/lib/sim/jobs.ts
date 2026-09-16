import {
  ActionType,
  ActivityType,
  JobType,
  type Attributes,
  type Job,
  type Schedule,
} from '../_model';
import { gs } from '../_state';
import { attributeCheck, skillCheckDifficulty } from './attribute-checks';
import { scheduleActivities } from './effects/schedule';
import { narrateJobResult, narrateText } from './narration';
import { getCurrentScheduledActivity } from './schedule';

const attributePerJobType: Record<JobType, keyof Attributes & string> = {
  [JobType.Mentoring]: 'intelligence',
  [JobType.Coaching]: 'charisma',
};

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
      jobId: newJob.id,
    },
    schedule,
  });
  return `You have accepted the job ${job.name} from ${job.employerKey}.`;
}

export function performJob(job: Job) {
  const attribute = attributePerJobType[job.jobType] ?? 'intelligence';
  const result = attributeCheck(
    gs.player.attributes[attribute],
    skillCheckDifficulty.medium,
    attribute
  );
  const pay = result.success ? job.payPerActivity : 0;
  gs.player.gold += pay;
  narrateJobResult(job, result.success, pay);
  return '';
}

export function quitJob(job: Job): string {
  gs.player.jobs = gs.player.jobs.filter((j) => j.id !== job.id);
  return `You have quit the job ${job.name}.`;
}

export function getJobActions() {
  const activity = getCurrentScheduledActivity();
  if (activity?.type !== ActivityType.Work) {
    return [];
  }
  const job = gs.player.jobs.find((j) => j.id === activity.jobId);
  if (!job) {
    return [];
  }
  narrateText(job.description);
  return [
    {
      label: 'Perform Job',
      actionType: ActionType.PerformJob,
      isLongAction: true,
      actionParameters: {
        job,
      },
    },
  ];
}
