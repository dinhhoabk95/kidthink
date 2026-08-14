import { redactPii } from "./redactor.js";

export type LogLevel = "debug" | "info" | "warn" | "error";
export type ActorType = "guest" | "user" | "manager" | "system" | "worker";

export interface StructuredLogEntry {
  level: LogLevel;
  ts: string;
  request_id?: string;
  actor_type?: ActorType;
  actor_id?: number | string;
  route?: string;
  code?: string;
  duration_ms?: number;
  message?: string;
  [key: string]: unknown;
}

export interface ClientErrorLogInput {
  message: string;
  stack?: string;
  route?: string;
  user_agent?: string;
  context?: Record<string, unknown>;
}

/**
 * Client error log sampling rate (BR-MON-06).
 * Defaults to 0.2 (20% sample), configurable through environment.
 */
export const DEFAULT_CLIENT_ERROR_SAMPLING_RATE = 0.2;

export function getClientErrorSamplingRate(): number {
  const envVal = process.env.CLIENT_ERROR_SAMPLING_RATE;
  if (envVal !== undefined) {
    const parsed = Number(envVal);
    if (!Number.isNaN(parsed) && parsed >= 0 && parsed <= 1.0) {
      return parsed;
    }
  }
  return DEFAULT_CLIENT_ERROR_SAMPLING_RATE;
}

export function shouldSampleClientError(
  samplingRate: number = getClientErrorSamplingRate(),
  rng: () => number = Math.random
): boolean {
  if (samplingRate <= 0) {
    return false;
  }
  if (samplingRate >= 1.0) {
    return true;
  }
  return rng() < samplingRate;
}

export function getSentryDsn(): string | undefined {
  return (
    process.env.SENTRY_DSN || process.env.NUXT_PUBLIC_SENTRY_DSN || undefined
  );
}

export function isSentryConfigured(): boolean {
  const dsn = getSentryDsn();
  return typeof dsn === "string" && dsn.trim().length > 0;
}

/**
 * Formats and redacts structured log entry per spec §7.4 & BR-MON-05.
 * Strictly strips PII fields (display_name, birth_year, child_uuid, email, password, token, authorization).
 */
export function createStructuredLog(
  entry: Partial<StructuredLogEntry> & { level: LogLevel }
): StructuredLogEntry {
  const raw: StructuredLogEntry = {
    ts: entry.ts || new Date().toISOString(),
    ...entry,
  };

  return redactPii(raw);
}

export function formatLogJson(entry: StructuredLogEntry): string {
  return JSON.stringify(entry);
}
