import { createIntEnumCodec } from "#src/constants/enum-codec";

export const SKILL_TIER = {
  BASIC: 1,
  CORE: 2,
  ADVANCED: 3,
} as const;
export type SkillTier = (typeof SKILL_TIER)[keyof typeof SKILL_TIER];
export type SkillTierLabel = "basic" | "core" | "advanced";
export const SKILL_TIER_VALUES = [1, 2, 3] as const;
export const SKILL_TIER_CODEC = createIntEnumCodec<SkillTier, SkillTierLabel>([
  [SKILL_TIER.BASIC, "basic"],
  [SKILL_TIER.CORE, "core"],
  [SKILL_TIER.ADVANCED, "advanced"],
]);

export const ACCESS_TIER = {
  FREE: 1,
  LOGIN: 2,
  STANDARD: 3,
  PREMIUM: 4,
} as const;
export type AccessTier = (typeof ACCESS_TIER)[keyof typeof ACCESS_TIER];
export type AccessTierLabel = "free" | "login" | "standard" | "premium";
export const ACCESS_TIER_VALUES = [1, 2, 3, 4] as const;
export const ACCESS_TIER_CODEC = createIntEnumCodec<
  AccessTier,
  AccessTierLabel
>([
  [ACCESS_TIER.FREE, "free"],
  [ACCESS_TIER.LOGIN, "login"],
  [ACCESS_TIER.STANDARD, "standard"],
  [ACCESS_TIER.PREMIUM, "premium"],
]);

export const TAG_AXIS = {
  WHAT: 1,
  THINKING: 2,
  MECHANIC: 3,
  THEME: 4,
} as const;
export type TagAxis = (typeof TAG_AXIS)[keyof typeof TAG_AXIS];
export type TagAxisLabel = "what" | "thinking" | "mechanic" | "theme";
export const TAG_AXIS_VALUES = [1, 2, 3, 4] as const;
export const TAG_AXIS_CODEC = createIntEnumCodec<TagAxis, TagAxisLabel>([
  [TAG_AXIS.WHAT, "what"],
  [TAG_AXIS.THINKING, "thinking"],
  [TAG_AXIS.MECHANIC, "mechanic"],
  [TAG_AXIS.THEME, "theme"],
]);

export const TAG_STATUS = {
  ACTIVE: 1,
  DEPRECATED: 2,
} as const;
export type TagStatus = (typeof TAG_STATUS)[keyof typeof TAG_STATUS];
export type TagStatusLabel = "active" | "deprecated";
export const TAG_STATUS_VALUES = [1, 2] as const;
export const TAG_STATUS_CODEC = createIntEnumCodec<TagStatus, TagStatusLabel>([
  [TAG_STATUS.ACTIVE, "active"],
  [TAG_STATUS.DEPRECATED, "deprecated"],
]);

export const CONTENT_ENTITY_TYPE = {
  GAME_LEVEL: 1,
  CURRICULUM: 2,
} as const;
export type ContentEntityType =
  (typeof CONTENT_ENTITY_TYPE)[keyof typeof CONTENT_ENTITY_TYPE];
export type ContentEntityTypeLabel = "game_level" | "curriculum";
export const CONTENT_ENTITY_TYPE_VALUES = [1, 2] as const;
export const CONTENT_ENTITY_TYPE_CODEC = createIntEnumCodec<
  ContentEntityType,
  ContentEntityTypeLabel
>([
  [CONTENT_ENTITY_TYPE.GAME_LEVEL, "game_level"],
  [CONTENT_ENTITY_TYPE.CURRICULUM, "curriculum"],
]);

export const PROGRAM_TYPE = {
  AGE_BASED: 1,
  JOURNEY: 2,
} as const;
export type ProgramType = (typeof PROGRAM_TYPE)[keyof typeof PROGRAM_TYPE];
export type ProgramTypeLabel = "age_based" | "journey";
export const PROGRAM_TYPE_VALUES = [1, 2] as const;
export const PROGRAM_TYPE_CODEC = createIntEnumCodec<
  ProgramType,
  ProgramTypeLabel
>([
  [PROGRAM_TYPE.AGE_BASED, "age_based"],
  [PROGRAM_TYPE.JOURNEY, "journey"],
]);

export const ENROLLMENT_STATUS = {
  ACTIVE: 1,
  COMPLETED: 2,
  PAUSED: 3,
  WITHDRAWN: 4,
  DROPPED: 5,
} as const;
export type EnrollmentStatus =
  (typeof ENROLLMENT_STATUS)[keyof typeof ENROLLMENT_STATUS];
export type EnrollmentStatusLabel =
  | "active"
  | "completed"
  | "paused"
  | "withdrawn"
  | "dropped";
export const ENROLLMENT_STATUS_VALUES = [1, 2, 3, 4, 5] as const;
export const ENROLLMENT_STATUS_CODEC = createIntEnumCodec<
  EnrollmentStatus,
  EnrollmentStatusLabel
>([
  [ENROLLMENT_STATUS.ACTIVE, "active"],
  [ENROLLMENT_STATUS.COMPLETED, "completed"],
  [ENROLLMENT_STATUS.PAUSED, "paused"],
  [ENROLLMENT_STATUS.WITHDRAWN, "withdrawn"],
  [ENROLLMENT_STATUS.DROPPED, "dropped"],
]);

export const CURRICULUM_PROGRESS_STATUS = {
  NOT_STARTED: 1,
  IN_PROGRESS: 2,
  COMPLETED: 3,
  SKIPPED: 4,
} as const;
export type CurriculumProgressStatus =
  (typeof CURRICULUM_PROGRESS_STATUS)[keyof typeof CURRICULUM_PROGRESS_STATUS];
export type CurriculumProgressStatusLabel =
  | "not_started"
  | "in_progress"
  | "completed"
  | "skipped";
export const CURRICULUM_PROGRESS_STATUS_VALUES = [1, 2, 3, 4] as const;
export const CURRICULUM_PROGRESS_STATUS_CODEC = createIntEnumCodec<
  CurriculumProgressStatus,
  CurriculumProgressStatusLabel
>([
  [CURRICULUM_PROGRESS_STATUS.NOT_STARTED, "not_started"],
  [CURRICULUM_PROGRESS_STATUS.IN_PROGRESS, "in_progress"],
  [CURRICULUM_PROGRESS_STATUS.COMPLETED, "completed"],
  [CURRICULUM_PROGRESS_STATUS.SKIPPED, "skipped"],
]);

export const PERSONAL_CURRICULUM_STATUS = {
  DRAFT: 1,
  READY: 2,
} as const;
export type PersonalCurriculumStatus =
  (typeof PERSONAL_CURRICULUM_STATUS)[keyof typeof PERSONAL_CURRICULUM_STATUS];
export type PersonalCurriculumStatusLabel = "draft" | "ready";
export const PERSONAL_CURRICULUM_STATUS_VALUES = [1, 2] as const;
export const PERSONAL_CURRICULUM_STATUS_CODEC = createIntEnumCodec<
  PersonalCurriculumStatus,
  PersonalCurriculumStatusLabel
>([
  [PERSONAL_CURRICULUM_STATUS.DRAFT, "draft"],
  [PERSONAL_CURRICULUM_STATUS.READY, "ready"],
]);

export const CUSTOM_GAME_STATUS = {
  DRAFT: 1,
  READY: 2,
} as const;
export type CustomGameStatus =
  (typeof CUSTOM_GAME_STATUS)[keyof typeof CUSTOM_GAME_STATUS];
export type CustomGameStatusLabel = "draft" | "ready";
export const CUSTOM_GAME_STATUS_VALUES = [1, 2] as const;
export const CUSTOM_GAME_STATUS_CODEC = createIntEnumCodec<
  CustomGameStatus,
  CustomGameStatusLabel
>([
  [CUSTOM_GAME_STATUS.DRAFT, "draft"],
  [CUSTOM_GAME_STATUS.READY, "ready"],
]);

export const EXPORT_JOB_KIND = {
  CURRICULUM_PLAN: 1,
} as const;
export type ExportJobKind =
  (typeof EXPORT_JOB_KIND)[keyof typeof EXPORT_JOB_KIND];
export type ExportJobKindLabel = "curriculum_plan";
export const EXPORT_JOB_KIND_VALUES = [1] as const;
export const EXPORT_JOB_KIND_CODEC = createIntEnumCodec<
  ExportJobKind,
  ExportJobKindLabel
>([[EXPORT_JOB_KIND.CURRICULUM_PLAN, "curriculum_plan"]]);

export const EXPORT_JOB_STATUS = {
  QUEUED: 1,
  PROCESSING: 2,
  DONE: 3,
  FAILED: 4,
} as const;
export type ExportJobStatus =
  (typeof EXPORT_JOB_STATUS)[keyof typeof EXPORT_JOB_STATUS];
export type ExportJobStatusLabel = "queued" | "processing" | "done" | "failed";
export const EXPORT_JOB_STATUS_VALUES = [1, 2, 3, 4] as const;
export const EXPORT_JOB_STATUS_CODEC = createIntEnumCodec<
  ExportJobStatus,
  ExportJobStatusLabel
>([
  [EXPORT_JOB_STATUS.QUEUED, "queued"],
  [EXPORT_JOB_STATUS.PROCESSING, "processing"],
  [EXPORT_JOB_STATUS.DONE, "done"],
  [EXPORT_JOB_STATUS.FAILED, "failed"],
]);

export const PLAY_COMPLETION_STATUS = {
  IN_PROGRESS: 1,
  COMPLETED: 2,
  ABANDONED: 3,
} as const;
export type PlayCompletionStatus =
  (typeof PLAY_COMPLETION_STATUS)[keyof typeof PLAY_COMPLETION_STATUS];
export type PlayCompletionStatusLabel =
  | "in_progress"
  | "completed"
  | "abandoned";
export const PLAY_COMPLETION_STATUS_VALUES = [1, 2, 3] as const;
export const PLAY_COMPLETION_STATUS_CODEC = createIntEnumCodec<
  PlayCompletionStatus,
  PlayCompletionStatusLabel
>([
  [PLAY_COMPLETION_STATUS.IN_PROGRESS, "in_progress"],
  [PLAY_COMPLETION_STATUS.COMPLETED, "completed"],
  [PLAY_COMPLETION_STATUS.ABANDONED, "abandoned"],
]);
