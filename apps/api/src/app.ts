import cors from "cors";
import express from "express";
import helmet from "helmet";
import { pinoHttp } from "pino-http";
import type { Container } from "./container.js";
import { createAuthRouter } from "./delivery/http/auth.routes.js";
import { createHealthRouter } from "./delivery/http/health.routes.js";
import { createPlatformRouter } from "./delivery/http/platform.routes.js";
import { createUploadRouter } from "./delivery/http/upload.routes.js";
import { correlationIdMiddleware } from "./delivery/middleware/correlation-id.js";
import { errorHandler, notFoundHandler } from "./delivery/middleware/error-handler.js";

export function createApp(container: Container): express.Express {
  const app = express();

  app.use(correlationIdMiddleware);
  app.use(pinoHttp());
  app.use(helmet());
  app.use(cors());
  app.use(express.json({ limit: "1mb" }));

  app.use(createHealthRouter());
  app.use(createAuthRouter(container));
  app.use(createUploadRouter(container));
  app.use(createPlatformRouter(container));
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
