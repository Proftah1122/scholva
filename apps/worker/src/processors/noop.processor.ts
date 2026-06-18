import type { Job } from "bullmq";

export async function noopProcessor(job: Job): Promise<{ readonly jobId: string; readonly processed: true }> {
  return {
    jobId: String(job.id),
    processed: true
  };
}
