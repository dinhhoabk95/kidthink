export interface RetryPolicy {
  maxAttempts: number;
  backoffType: "exponential" | "fixed" | "none";
  backoffDelayMs: number;
  alertOnFailImmediately?: boolean;
}

export interface JobDefinition {
  name: string;
  schedule: string;
  idempotencyKeyFormat: string;
  timeoutSeconds: number;
  ownerStep: string;
  retryPolicy: RetryPolicy;
}

export const JOB_REGISTRY: readonly JobDefinition[] = [
  {
    name: "rollup:session",
    schedule: "event",
    idempotencyKeyFormat: "session_uuid",
    timeoutSeconds: 30,
    ownerStep: "P1.7",
    retryPolicy: {
      maxAttempts: 3,
      backoffType: "exponential",
      backoffDelayMs: 5000,
    },
  },
  {
    name: "rollup:daily",
    schedule: "02:00 ICT",
    idempotencyKeyFormat: "date_ict",
    timeoutSeconds: 600,
    ownerStep: "P1.5",
    retryPolicy: {
      maxAttempts: 3,
      backoffType: "exponential",
      backoffDelayMs: 5000,
    },
  },
  {
    name: "sweep:abandoned",
    schedule: "every 10m",
    idempotencyKeyFormat: "window_start",
    timeoutSeconds: 120,
    ownerStep: "P1.6",
    retryPolicy: {
      maxAttempts: 3,
      backoffType: "exponential",
      backoffDelayMs: 5000,
    },
  },
  {
    name: "entitlement:expire",
    schedule: "00:05 ICT",
    idempotencyKeyFormat: "date_ict",
    timeoutSeconds: 300,
    ownerStep: "P1.5",
    retryPolicy: {
      maxAttempts: 3,
      backoffType: "exponential",
      backoffDelayMs: 5000,
    },
  },
  {
    name: "order:expire",
    schedule: "every 1 hour",
    idempotencyKeyFormat: "hour",
    timeoutSeconds: 120,
    ownerStep: "P2.3",
    retryPolicy: {
      maxAttempts: 3,
      backoffType: "exponential",
      backoffDelayMs: 5000,
    },
  },
  {
    name: "entitlement:soft-unlock-expire",
    schedule: "every 1 hour",
    idempotencyKeyFormat: "hour",
    timeoutSeconds: 120,
    ownerStep: "P2.3",
    retryPolicy: {
      maxAttempts: 3,
      backoffType: "exponential",
      backoffDelayMs: 5000,
    },
  },
  {
    name: "account:purge",
    schedule: "03:00 ICT",
    idempotencyKeyFormat: "date_ict",
    timeoutSeconds: 900,
    ownerStep: "P1.14",
    retryPolicy: {
      maxAttempts: 1,
      backoffType: "none",
      backoffDelayMs: 0,
      alertOnFailImmediately: true,
    },
  },
  {
    name: "email:send",
    schedule: "event",
    idempotencyKeyFormat: "notification_id",
    timeoutSeconds: 30,
    ownerStep: "P0.9b",
    retryPolicy: {
      maxAttempts: 5,
      backoffType: "exponential",
      backoffDelayMs: 30_000,
    },
  },
  {
    name: "image:cleanup-orphan",
    schedule: "04:00 ICT Sunday",
    idempotencyKeyFormat: "week",
    timeoutSeconds: 900,
    ownerStep: "P2.7",
    retryPolicy: {
      maxAttempts: 3,
      backoffType: "exponential",
      backoffDelayMs: 5000,
    },
  },
  {
    name: "backup:postgres",
    schedule: "01:00 ICT",
    idempotencyKeyFormat: "date_ict",
    timeoutSeconds: 1800,
    ownerStep: "P0.8",
    retryPolicy: {
      maxAttempts: 2,
      backoffType: "fixed",
      backoffDelayMs: 300_000,
    },
  },
  {
    name: "backup:verify",
    schedule: "05:00 ICT Monday",
    idempotencyKeyFormat: "week",
    timeoutSeconds: 1800,
    ownerStep: "P0.8b",
    retryPolicy: {
      maxAttempts: 2,
      backoffType: "fixed",
      backoffDelayMs: 300_000,
    },
  },
  {
    name: "report:manual-grants-monthly",
    schedule: "00:00 ICT 1st of month",
    idempotencyKeyFormat: "month_ict",
    timeoutSeconds: 300,
    ownerStep: "P2.4",
    retryPolicy: {
      maxAttempts: 3,
      backoffType: "exponential",
      backoffDelayMs: 5000,
    },
  },
] as const;

export type RegisteredJobName = (typeof JOB_REGISTRY)[number]["name"];

export function getJobDefinition(name: string): JobDefinition | undefined {
  return JOB_REGISTRY.find((j) => j.name === name);
}

/**
 * Deterministic jobId generator from job payload and business key.
 */
export function buildDeterministicJobId(
  name: string,
  businessKey: string | number
): string {
  const def = getJobDefinition(name);
  if (!def) {
    throw new Error(`Job ${name} is not registered in JOB_REGISTRY`);
  }
  return `${name}:${businessKey}`;
}

/**
 * Validates registry compliance for worker consumers and owner steps.
 */
export function validateJobRegistryConsumers(
  implementedConsumerNames: string[],
  currentSequenceStep = "P1.5"
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Order of sequence steps to know which steps are past/current
  const stepOrder = [
    "P0.7",
    "P0.8",
    "P0.8b",
    "P0.9b",
    "P0.10",
    "P0.11",
    "P1.1",
    "P1.2",
    "P1.3",
    "P1.4",
    "P1.5",
    "P1.6",
    "P1.7",
    "P1.14",
    "P2.3",
    "P2.4",
    "P2.7",
  ];

  const currentIdx = stepOrder.indexOf(currentSequenceStep);

  // 1. Consumer is not in registry -> RED
  for (const consumer of implementedConsumerNames) {
    if (!JOB_REGISTRY.some((j) => j.name === consumer)) {
      errors.push(
        `Consumer '${consumer}' is implemented in worker but not registered in JOB_REGISTRY`
      );
    }
  }

  // 2. Job with owner_step <= currentSequenceStep has no consumer -> RED
  for (const job of JOB_REGISTRY) {
    const jobStepIdx = stepOrder.indexOf(job.ownerStep);
    if (
      jobStepIdx !== -1 &&
      jobStepIdx <= currentIdx &&
      !implementedConsumerNames.includes(job.name)
    ) {
      errors.push(
        `Job '${job.name}' (owner_step: ${job.ownerStep}) must have an active consumer by step ${currentSequenceStep}`
      );
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
