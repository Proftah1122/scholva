import { z } from "zod";

const configSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(3001),
  DATABASE_URL: z.string().optional(),
  DIRECT_URL: z.string().optional(),
  JWT_PRIVATE_KEY: z.string().optional(),
  JWT_PUBLIC_KEY: z.string().optional(),
  REDIS_URL: z.string().url().default("redis://localhost:6379"),
  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional()
});

export type ApiConfig = z.infer<typeof configSchema>;

export function loadConfig(env: NodeJS.ProcessEnv): ApiConfig {
  return configSchema.parse(env);
}
