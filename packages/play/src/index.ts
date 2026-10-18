export {
  computeRemainingPlaySeconds,
  type PlayBudgetStatsInput,
} from "@mindkid/shared";
export {
  awardChildBadges,
  type CurriculumCompletedProgressRef,
  type CurriculumEnrollmentRef,
  type CurriculumWeekItemRef,
  computeNewChildBadges,
  evaluateStrandCompletion,
  evaluateWeekCurriculumCompletion,
  hasCompletedAnyCurriculumWeek,
  hasCompletedAnyStrand,
  type StrandSkillRef,
} from "#src/badges";
export { completePlaySession } from "#src/complete";
export {
  checkMasteryEligibility,
  type MasteryEligibilityResult,
} from "#src/eligibility";
export {
  ALLOWED_EVENT_NAMES,
  EVENT_PAYLOAD_FIELDS,
  PII_FIELDS,
} from "#src/events/catalog";
export { cleanEventPayload } from "#src/events/sanitize";
export {
  type EventPayload,
  EventPayloadSchema,
  type IngestEventItem,
  type TelemetryEvent,
  type TelemetryEventRecord,
  TelemetryEventRecordSchema,
  TelemetryEventSchema,
  validateBatchPayload,
  validateSequenceNumbers,
  validateTelemetryEvent,
  validateTelemetryEventRecord,
} from "#src/events/validate";
export { ingestPlayEvents, insertIngestedEventsBatch } from "#src/ingest";
export type { IngestOptions } from "#src/session/ownership";
export { sweepAbandonedSessions } from "#src/sweep";
