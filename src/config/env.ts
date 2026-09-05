import { z } from "zod";

const logLevelSchema = z.enum(["trace", "debug", "info", "warn", "error", "fatal", "silent"]);
const fallbackAppUrl = "http://localhost:3000";
const fallbackAuthSecret = "development-only-auth-secret-change-before-production";

export const serverEnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  APP_NAME: z.string().min(1).default("Rifas Online"),
  APP_URL: z.string().url().default(fallbackAppUrl),
  NEXT_PUBLIC_APP_URL: z.string().url().default(fallbackAppUrl),
  DATABASE_URL: z.string().url(),
  DIRECT_URL: z.string().url().optional(),
  AUTH_SECRET: z.string().min(32).default(fallbackAuthSecret),
  LOG_LEVEL: logLevelSchema.default("info"),
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;

export function parseServerEnv(input: NodeJS.ProcessEnv | Record<string, string | undefined>) {
  return serverEnvSchema.parse(input);
}

let cachedEnv: ServerEnv | null = null;

export function getEnv() {
  cachedEnv ??= parseServerEnv(process.env);
  return cachedEnv;
}

export const env = new Proxy({} as ServerEnv, {
  get(_target, property: keyof ServerEnv) {
    return getEnv()[property];
  },
});
