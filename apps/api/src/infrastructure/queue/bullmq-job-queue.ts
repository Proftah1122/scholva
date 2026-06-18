import { Queue, type ConnectionOptions } from "bullmq";
import { JobName, type UUID } from "@scholva/shared-types";
import type { JobQueuePort } from "../../application/ports/job-queue.port.js";

const QUEUES = {
  AI_PIPELINE: "ai-pipeline",
  MATCHING: "matching",
  SUGGESTIONS: "suggestions"
} as const;

export class BullMQJobQueue implements JobQueuePort {
  private readonly aiPipeline: Queue;
  private readonly matching: Queue;
  private readonly suggestions: Queue;

  constructor(redisUrl: string) {
    const connection: ConnectionOptions = {
      url: redisUrl,
      maxRetriesPerRequest: null
    };
    this.aiPipeline = new Queue(QUEUES.AI_PIPELINE, { connection });
    this.matching = new Queue(QUEUES.MATCHING, { connection });
    this.suggestions = new Queue(QUEUES.SUGGESTIONS, { connection });
  }

  async enqueueEmbedProject(projectId: UUID): Promise<void> {
    await this.aiPipeline.add(JobName.EmbedProject, { projectId }, { jobId: `${JobName.EmbedProject}:${projectId}` });
  }

  async enqueueEmbedProblem(problemId: UUID): Promise<void> {
    await this.aiPipeline.add(JobName.EmbedProblem, { problemId }, { jobId: `${JobName.EmbedProblem}:${problemId}` });
  }

  async enqueueRunMatch(problemId: UUID): Promise<void> {
    await this.matching.add(JobName.RunMatch, { problemId }, { jobId: `${JobName.RunMatch}:${problemId}` });
  }

  async enqueueGenerateSuggestions(scholarId: UUID): Promise<void> {
    await this.suggestions.add(JobName.GenerateSuggestions, { scholarId }, { jobId: `${JobName.GenerateSuggestions}:${scholarId}` });
  }

  async enqueueSurfaceProblem(problemId: UUID): Promise<void> {
    await this.suggestions.add(JobName.SurfaceProblem, { problemId }, { jobId: `${JobName.SurfaceProblem}:${problemId}` });
  }
}

export class InlineNoopJobQueue implements JobQueuePort {
  async enqueueEmbedProject(): Promise<void> {}
  async enqueueEmbedProblem(): Promise<void> {}
  async enqueueRunMatch(): Promise<void> {}
  async enqueueGenerateSuggestions(): Promise<void> {}
  async enqueueSurfaceProblem(): Promise<void> {}
}
