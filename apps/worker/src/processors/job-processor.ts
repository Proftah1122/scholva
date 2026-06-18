import type { Job } from "bullmq";
import { JobName } from "@scholva/shared-types";

export interface ProcessedJobResult {
  readonly jobId: string;
  readonly jobName: string;
  readonly processed: true;
  readonly idempotencyKey: string;
}

export async function processScholvaJob(job: Job): Promise<ProcessedJobResult> {
  switch (job.name) {
    case JobName.EmbedProject:
    case JobName.EmbedProblem:
    case JobName.RunMatch:
    case JobName.GenerateSuggestions:
    case JobName.SurfaceProblem:
    case JobName.WeeklyDigest:
      return complete(job);
    default:
      throw new Error(`Unsupported job: ${job.name}`);
  }
}

function complete(job: Job): ProcessedJobResult {
  return {
    jobId: String(job.id),
    jobName: job.name,
    processed: true,
    idempotencyKey: `${job.queueName}:${job.name}:${String(job.id)}`
  };
}
