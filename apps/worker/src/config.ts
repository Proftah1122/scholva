import { z } from "zod";

const workerConfigSchema = z.object({
  REDIS_URL: z.string().url().default("redis://localhost:6379"),
  WORKER_CONCURRENCY: z.coerce.number().int().positive().default(3)
});

export type WorkerConfig = z.infer<typeof workerConfigSchema>;

export function loadWorkerConfig(env: NodeJS.ProcessEnv): WorkerConfig {
  return workerConfigSchema.parse(env);
}
