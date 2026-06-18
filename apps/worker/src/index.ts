import "dotenv/config";
import { Worker, type ConnectionOptions } from "bullmq";
import { loadWorkerConfig } from "./config.js";
import { noopProcessor } from "./processors/noop.processor.js";
import { QUEUES } from "./queues/queue-names.js";

const config = loadWorkerConfig(process.env);
const connection: ConnectionOptions = {
  url: config.REDIS_URL,
  maxRetriesPerRequest: null
};

const worker = new Worker(QUEUES.AI_PIPELINE, noopProcessor, {
  connection,
  concurrency: config.WORKER_CONCURRENCY
});

worker.on("ready", () => {
  console.log("scholva-worker ready");
});

worker.on("failed", (job, error) => {
  console.error({ jobId: job?.id, error }, "worker job failed");
});
