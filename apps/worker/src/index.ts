import "dotenv/config";
import { Worker, type ConnectionOptions } from "bullmq";
import { loadWorkerConfig } from "./config.js";
import { processScholvaJob } from "./processors/job-processor.js";
import { QUEUES } from "./queues/queue-names.js";

const config = loadWorkerConfig(process.env);
const connection: ConnectionOptions = {
  url: config.REDIS_URL,
  maxRetriesPerRequest: null
};

const workers = Object.values(QUEUES).map((queueName) => new Worker(queueName, processScholvaJob, {
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
