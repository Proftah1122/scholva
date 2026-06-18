import cors from "cors";
import express from "express";
import helmet from "helmet";
import { pinoHttp } from "pino-http";
import { createHealthRouter } from "./delivery/http/health.routes.js";
import { correlationIdMiddleware } from "./delivery/middleware/correlation-id.js";
import { errorHandler, notFoundHandler } from "./delivery/middleware/error-handler.js";

export function createApp(): express.Express {
  const app = express();

  app.use(correlationIdMiddleware);
  app.use(pinoHttp());
  app.use(helmet());
  app.use(cors());
  app.use(express.json({ limit: "1mb" }));

  app.use(createHealthRouter());
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
