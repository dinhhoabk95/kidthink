import { AppError } from "@mindkid/errors/base";
import { z } from "zod";

/**
 * Child profile canonical closed columns definition.
 * Reference: child-data-compliance.md §7.1 and schema-play-telemetry.md §7.1
 * BR-CDC-01 & BR-SPT-01: Exactly 12 columns, closed list.
 */
export const CHILD_PROFILE_CLOSED_COLUMNS = [
  "id",
  "uuid",
  "user_id",
  "display_name",
  "birth_year",
  "avatar_id",
  "relationship",
  "current_curriculum_id",
  "daily_play_cap_minutes",
  "status",
  "purge_at",
  "created_at",
  "updated_at",
] as const;

export type ChildProfileClosedColumn =
  (typeof CHILD_PROFILE_CLOSED_COLUMNS)[number];

export const CHILD_RELATIONSHIP_VALUES = ["child", "student", "other"] as const;
export type ChildRelationship = (typeof CHILD_RELATIONSHIP_VALUES)[number];

export const CHILD_STATUS_VALUES = [
  "active",
  "archived",
  "pending_deletion",
] as const;
export type ChildStatus = (typeof CHILD_STATUS_VALUES)[number];

export const AVATAR_PRESET_IDS = Array.from(
  { length: 12 },
  (_, i) => `avatar-preset-${String(i + 1).padStart(2, "0")}`
) as string[];

export function isValidAvatarPreset(avatarId: string): boolean {
  return AVATAR_PRESET_IDS.includes(avatarId);
}

export function deriveAgeBand(
  birthYear: number,
  currentYear: number = new Date().getFullYear()
): "3-4" | "4-5" | "5-6" {
  const age = currentYear - birthYear;
  if (age <= 3) {
    return "3-4";
  }
  if (age === 4) {
    return "4-5";
  }
  return "5-6";
}

/**
 * BR-CDC-04: avatar_id must be a preset ID, never an image path, URL, or data URI.
 */
export function isValidAvatarId(avatarId: string): boolean {
  if (!avatarId || typeof avatarId !== "string") {
    return false;
  }
  const lower = avatarId.toLowerCase();
  if (
    lower.includes("/") ||
    lower.includes("\\") ||
    lower.includes("http") ||
    lower.includes("data:")
  ) {
    return false;
  }
  return true;
}

/**
 * BR-CDC-01 & §7.1: Birth year range is [currentYear - 7, currentYear - 2].
 * Pure function accepting currentYear to remain testable.
 */
export function getValidBirthYearRange(currentYear: number): {
  minYear: number;
  maxYear: number;
} {
  return {
    minYear: currentYear - 7,
    maxYear: currentYear - 2,
  };
}

export function isValidBirthYear(
  birthYear: number,
  currentYear: number
): boolean {
  const { minYear, maxYear } = getValidBirthYearRange(currentYear);
  return (
    Number.isInteger(birthYear) && birthYear >= minYear && birthYear <= maxYear
  );
}

/**
 * Zod schema for child profile creation/modification payload.
 * Enforces strict object (no extra fields allowed) and strict type checks.
 * BR-CDC-01: Strict closed field list.
 */
export const createChildProfileSchema = z
  .object({
    display_name: z.string().trim().min(1).max(40),
    birth_year: z.number().int(),
    avatar_id: z.string().trim().min(1).max(24).refine(isValidAvatarId, {
      message: "INVALID_AVATAR_ID_PRESET",
    }),
    relationship: z.enum(CHILD_RELATIONSHIP_VALUES).optional(),
    current_curriculum_id: z.number().int().optional(),
    daily_play_cap_minutes: z.number().int().min(1).max(720).optional(),
  })
  .strict();

export type CreateChildProfileInput = z.infer<typeof createChildProfileSchema>;

export class ChildFieldNotAllowedError extends AppError<{
  readonly unallowedFields: readonly string[];
}> {
  readonly unallowedFields: readonly string[];

  constructor(unallowedFields: readonly string[]) {
    super({
      code: "CHILD_FIELD_NOT_ALLOWED",
      status: 400,
      message: `Child profile payload contains unallowed fields: [${unallowedFields.join(", ")}]`,
      details: { unallowedFields },
      name: "ChildFieldNotAllowedError",
    });
    this.unallowedFields = unallowedFields;
  }
}

/**
 * Validates raw input for child profile creation or update.
 * Throws ChildFieldNotAllowedError (400) if unallowed fields are provided,
 * WITHOUT echoing any raw values of those fields.
 */
export function parseChildProfileInput(
  rawInput: unknown,
  currentYear: number
): CreateChildProfileInput {
  if (typeof rawInput !== "object" || rawInput === null) {
    throw new ChildFieldNotAllowedError(["payload_not_object"]);
  }

  const obj = rawInput as Record<string, unknown>;
  const allowedInputKeys = new Set([
    "display_name",
    "birth_year",
    "avatar_id",
    "relationship",
    "current_curriculum_id",
    "daily_play_cap_minutes",
  ]);

  const unallowedFields = Object.keys(obj).filter(
    (key) => !allowedInputKeys.has(key)
  );

  if (unallowedFields.length > 0) {
    throw new ChildFieldNotAllowedError(unallowedFields);
  }

  const parsed = createChildProfileSchema.parse(rawInput);

  if (!isValidBirthYear(parsed.birth_year, currentYear)) {
    throw new Error("INVALID_BIRTH_YEAR");
  }

  return parsed;
}

export interface SafeExternalPayload {
  total_users_count?: number;
  aggregate_completion_rate?: number;
  level_code?: string;
  [key: string]: unknown;
}

/**
 * BR-CDC-06: Enforces payload hygiene for external AI / LLM providers.
 * Throws runtime error if individual child PII fields (child_uuid, display_name, birth_year) are passed.
 */
export function buildExternalProviderPayload(
  input: SafeExternalPayload
): Record<string, unknown> {
  const forbiddenFields = [
    "child_uuid",
    "display_name",
    "birth_year",
    "user_id",
    "email",
    "full_name",
  ];

  for (const field of forbiddenFields) {
    if (field in input && input[field] !== undefined) {
      throw new Error(
        `BR-CDC-06 VIOLATION: External provider payload must not contain child PII field: ${field}`
      );
    }
  }

  return { ...input };
}
