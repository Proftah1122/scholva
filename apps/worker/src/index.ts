import "dotenv/config";
import { Worker, type ConnectionOptions } from "bullmq";
import { loadWorkerConfig } from "./config.js";
import { prisma } from "./infrastructure/prisma-client.js";
import { createScholvaJobProcessor, createWorkerServices } from "./processors/job-processor.js";
import { QUEUES } from "./queues/queue-names.js";

const config = loadWorkerConfig(process.env);
const services = createWorkerServices(config, prisma);
const processor = createScholvaJobProcessor(services);
const connection: ConnectionOptions = {
  url: config.REDIS_URL,
  maxRetriesPerRequest: null
};

const workers = Object.values(QUEUES).map((queueName) => new Worker(queueName, processor, {
  connection,
  concurrency: config.WORKER_CONCURRENCY
}));

for (const worker of workers) {
  worker.on("ready", () => {
    console.log(`scholva-worker ready: ${worker.name}`);
  });

  worker.on("failed", (job, error) => {
    console.error({ queueName: worker.name, jobId: job?.id, error }, "worker job failed");
  });
}
