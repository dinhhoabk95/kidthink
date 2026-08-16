export type AgeBand = "3-4" | "4-5" | "5-6";

export type ClaimLadderTier =
  | "LEVEL_0_PROHIBITED"
  | "LEVEL_1_FOUNDATIONAL"
  | "LEVEL_2_PRACTICE_EVIDENCE"
  | "LEVEL_3_TRANSFER_EVIDENCE";

export interface PlaytestSessionConfig {
  hasGuardianConsent: boolean;
  hasChildAssent: boolean;
  maxDurationMinutes: number;
  ageBand: AgeBand;
  collectsPii: boolean;
  templateCode?: string;
  competencyCode?: string;
}

export type PlaytestValidationErrorCode =
  | "MISSING_GUARDIAN_CONSENT"
  | "MISSING_CHILD_ASSENT"
  | "PII_COLLECTION_FORBIDDEN"
  | "SESSION_DURATION_EXCEEDED"
  | "INVALID_AGE_BAND";

export interface PlaytestValidationResult {
  valid: boolean;
  reason?: PlaytestValidationErrorCode;
}

export interface PedagogicalMetricsInput {
  totalFirstAttempts: number;
  comprehendedFirstAttempts: number;
  totalAssistedAttempts: number;
  independentTransitions: number;
  totalRetries: number;
  strategyExplorations: number;
  totalSessions: number;
  uiBarrierFailures: number;
}

export interface EvidenceEvaluationResult {
  passed: boolean;
  taskComprehensionRate: number;
  independentTransitionRate: number;
  strategyExplorationRate: number;
  usabilityBarrierRate: number;
  failures: string[];
}

export interface StratifiedSampleGroup {
  ageBand: AgeBand;
  templateCode: string;
  sampleCount: number;
}

export interface StratifiedSampleValidationResult {
  valid: boolean;
  insufficientGroups: Array<{
    ageBand: AgeBand;
    templateCode: string;
    sampleCount: number;
    required: number;
  }>;
}

export const PEDAGOGICAL_EVIDENCE_THRESHOLDS = {
  MIN_TASK_COMPREHENSION_RATE: 0.85,
  MIN_INDEPENDENT_TRANSITION_RATE: 0.75,
  MIN_STRATEGY_EXPLORATION_RATE: 0.7,
  MAX_USABILITY_BARRIER_RATE: 0.05,
  MAX_DURATION_MINUTES_3_4: 15,
  MAX_DURATION_MINUTES_5_6: 20,
  MIN_SAMPLE_SIZE_PER_STRATA: 8,
  RETENTION_MAX_DAYS: 90,
} as const;

export const PROHIBITED_CLAIM_PATTERNS: readonly RegExp[] = [
  /\bIQ\b/i,
  /chỉ\s*số\s*thông\s*minh/i,
  /chữa\s*trị/i,
  /trị\s*liệu/i,
  /y\s*khoa/i,
  /chẩn\s*đoán/i,
  /thần\s*đồng/i,
  /tăng\s*trưởng\s*não\s*bộ\s*vượt\s*bậc/i,
  /nhân\s*quả\s*lâm\s*sàng/i,
  /clinical\s*trial/i,
  /cure/i,
  /diagnos/i,
];

export const TRANSFER_CLAIM_PATTERN: RegExp =
  /chuyển\s*giao|tổng\s*hợp\s*42\s*tuần/i;
export const PRACTICE_CLAIM_PATTERN: RegExp =
  /hỗ\s*trợ\s*luyện\s*tập|rèn\s*luyện\s*tư\s*duy|thực\s*nghiệm/i;

/**
 * BR-PED-02 & BR-PED-03 & BR-PED-06:
 * Validates playtest session parameters before initialization.
 */
export function validatePlaytestSession(
  config: PlaytestSessionConfig
): PlaytestValidationResult {
  // BR-PED-02: 100% guardian consent & child assent required
  if (!config.hasGuardianConsent) {
    return { valid: false, reason: "MISSING_GUARDIAN_CONSENT" };
  }
  if (!config.hasChildAssent) {
    return { valid: false, reason: "MISSING_CHILD_ASSENT" };
  }

  // BR-PED-03: No PII collection allowed under any circumstance
  if (config.collectsPii) {
    return { valid: false, reason: "PII_COLLECTION_FORBIDDEN" };
  }

  // Age band validation
  if (!["3-4", "4-5", "5-6"].includes(config.ageBand)) {
    return { valid: false, reason: "INVALID_AGE_BAND" };
  }

  // BR-PED-06: Max duration limits (15 min for 3-4, 20 min for 4-5 and 5-6)
  const maxAllowed =
    config.ageBand === "3-4"
      ? PEDAGOGICAL_EVIDENCE_THRESHOLDS.MAX_DURATION_MINUTES_3_4
      : PEDAGOGICAL_EVIDENCE_THRESHOLDS.MAX_DURATION_MINUTES_5_6;

  if (config.maxDurationMinutes > maxAllowed) {
    return { valid: false, reason: "SESSION_DURATION_EXCEEDED" };
  }

  return { valid: true };
}

/**
 * BR-PED-01:
 * Validates whether a public marketing or pedagogical claim stays within permitted evidence boundaries.
 */
export function validateEvidenceClaim(claimText: string): {
  allowed: boolean;
  tier: ClaimLadderTier;
  reason?: string;
} {
  for (const pattern of PROHIBITED_CLAIM_PATTERNS) {
    if (pattern.test(claimText)) {
      return {
        allowed: false,
        tier: "LEVEL_0_PROHIBITED",
        reason: `Claim matches prohibited medical/IQ pattern: ${pattern.source}`,
      };
    }
  }

  if (TRANSFER_CLAIM_PATTERN.test(claimText)) {
    return {
      allowed: true,
      tier: "LEVEL_3_TRANSFER_EVIDENCE",
    };
  }

  if (PRACTICE_CLAIM_PATTERN.test(claimText)) {
    return {
      allowed: true,
      tier: "LEVEL_2_PRACTICE_EVIDENCE",
    };
  }

  return {
    allowed: true,
    tier: "LEVEL_1_FOUNDATIONAL",
  };
}

/**
 * BR-PED-01 & Spec §7.1:
 * Evaluates core pedagogical telemetry metrics against benchmark quality gates.
 */
export function evaluatePedagogicalEvidence(
  metrics: PedagogicalMetricsInput
): EvidenceEvaluationResult {
  const taskComprehensionRate =
    metrics.totalFirstAttempts > 0
      ? metrics.comprehendedFirstAttempts / metrics.totalFirstAttempts
      : 0;

  const independentTransitionRate =
    metrics.totalAssistedAttempts > 0
      ? metrics.independentTransitions / metrics.totalAssistedAttempts
      : 0;

  const strategyExplorationRate =
    metrics.totalRetries > 0
      ? metrics.strategyExplorations / metrics.totalRetries
      : 0;

  const usabilityBarrierRate =
    metrics.totalSessions > 0
      ? metrics.uiBarrierFailures / metrics.totalSessions
      : 0;

  const failures: string[] = [];

  if (
    taskComprehensionRate <
    PEDAGOGICAL_EVIDENCE_THRESHOLDS.MIN_TASK_COMPREHENSION_RATE
  ) {
    failures.push(
      `TASK_COMPREHENSION_BELOW_THRESHOLD: ${Math.round(taskComprehensionRate * 100)}% < ${Math.round(PEDAGOGICAL_EVIDENCE_THRESHOLDS.MIN_TASK_COMPREHENSION_RATE * 100)}% required`
    );
  }

  if (
    independentTransitionRate <
    PEDAGOGICAL_EVIDENCE_THRESHOLDS.MIN_INDEPENDENT_TRANSITION_RATE
  ) {
    failures.push(
      `INDEPENDENT_TRANSITION_BELOW_THRESHOLD: ${Math.round(independentTransitionRate * 100)}% < ${Math.round(PEDAGOGICAL_EVIDENCE_THRESHOLDS.MIN_INDEPENDENT_TRANSITION_RATE * 100)}% required`
    );
  }

  if (
    strategyExplorationRate <
    PEDAGOGICAL_EVIDENCE_THRESHOLDS.MIN_STRATEGY_EXPLORATION_RATE
  ) {
    failures.push(
      `STRATEGY_EXPLORATION_BELOW_THRESHOLD: ${Math.round(strategyExplorationRate * 100)}% < ${Math.round(PEDAGOGICAL_EVIDENCE_THRESHOLDS.MIN_STRATEGY_EXPLORATION_RATE * 100)}% required`
    );
  }

  if (
    usabilityBarrierRate >
    PEDAGOGICAL_EVIDENCE_THRESHOLDS.MAX_USABILITY_BARRIER_RATE
  ) {
    failures.push(
      `USABILITY_BARRIERS_EXCEEDED: ${Math.round(usabilityBarrierRate * 100)}% > ${Math.round(PEDAGOGICAL_EVIDENCE_THRESHOLDS.MAX_USABILITY_BARRIER_RATE * 100)}% max allowed`
    );
  }

  return {
    passed: failures.length === 0,
    taskComprehensionRate,
    independentTransitionRate,
    strategyExplorationRate,
    usabilityBarrierRate,
    failures,
  };
}

/**
 * BR-PED-05:
 * Validates stratified sample sizes to ensure no age band or template is underrepresented.
 */
export function validateStratifiedSampling(
  groups: readonly StratifiedSampleGroup[]
): StratifiedSampleValidationResult {
  const insufficientGroups = groups
    .filter(
      (g) =>
        g.sampleCount <
        PEDAGOGICAL_EVIDENCE_THRESHOLDS.MIN_SAMPLE_SIZE_PER_STRATA
    )
    .map((g) => ({
      ageBand: g.ageBand,
      templateCode: g.templateCode,
      sampleCount: g.sampleCount,
      required: PEDAGOGICAL_EVIDENCE_THRESHOLDS.MIN_SAMPLE_SIZE_PER_STRATA,
    }));

  return {
    valid: insufficientGroups.length === 0,
    insufficientGroups,
  };
}
