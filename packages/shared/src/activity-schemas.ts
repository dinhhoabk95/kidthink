/**
 * Spec sở hữu: docs/specs/06-admin/activity-authoring.md
 * Spec liên quan: docs/specs/05-content/activity-model.md
 */

import { z } from "zod";
import { ACTIVITY_KINDS } from "./activity-model.js";

export const activityKindSchema = z.enum(
  ACTIVITY_KINDS as unknown as [string, ...string[]]
);

export const baseActivitySchema = z.object({
  code: z
    .string()
    .regex(
      /^ACT-(?:\d{4}|C[1-6]-[A-Z]{2,5}-\d{4})$/,
      "Mã sai định dạng ACT-xxxx"
    )
    .optional(),
  title: z.string().min(1, "Tiêu đề tiếng Việt không được rỗng"),
  instruction: z.string().min(1, "Hướng dẫn không được rỗng"),
  materials: z.string().nullable().optional(),
  estimated_minutes: z
    .number()
    .int("Thời lượng phải là số nguyên")
    .min(2, "Thời lượng tối thiểu 2 phút")
    .max(20, "Thời lượng tối đa 20 phút"),
  access_tier: z
    .enum(["free", "login", "standard", "premium"])
    .default("standard"),
  skill_ids: z
    .array(z.number().int())
    .min(1, "Bắt buộc gắn ≥1 skill")
    .max(2, "Tối đa 2 skill")
    .optional(),
  learning_objective_ids: z
    .array(z.number().int())
    .min(1, "Bắt buộc gắn ≥1 LO")
    .optional(),
  expected_version: z.number().int().positive().optional(),
});

export const digitalGameActivitySchema = baseActivitySchema.extend({
  kind: z.literal("digital_game"),
  ref_type: z.literal("game_level"),
  ref_id: z.number().int().positive("ref_id phải là id game level hợp lệ"),
});

export const discussionActivitySchema = baseActivitySchema.extend({
  kind: z.literal("discussion"),
  ref_type: z.null().optional(),
  ref_id: z.null().optional(),
});

export const storytellingActivitySchema = baseActivitySchema.extend({
  kind: z.literal("storytelling"),
  ref_type: z.null().optional(),
  ref_id: z.null().optional(),
});

export const movementActivitySchema = baseActivitySchema.extend({
  kind: z.literal("movement"),
  ref_type: z.null().optional(),
  ref_id: z.null().optional(),
});

export const manipulativeActivitySchema = baseActivitySchema.extend({
  kind: z.literal("manipulative"),
  materials: z.string().min(1, "Hoạt động ngoài màn hình bắt buộc có vật liệu"),
  ref_type: z.null().optional(),
  ref_id: z.null().optional(),
});

export const worksheetActivitySchema = baseActivitySchema.extend({
  kind: z.literal("worksheet"),
  ref_type: z.literal("worksheet"),
  ref_id: z.number().int().positive().nullable().optional(),
});

export const observationActivitySchema = baseActivitySchema.extend({
  kind: z.literal("observation"),
  ref_type: z.null().optional(),
  ref_id: z.null().optional(),
});

export const miniProjectActivitySchema = baseActivitySchema.extend({
  kind: z.literal("mini_project"),
  materials: z.string().min(1, "Dự án nhỏ bắt buộc có vật liệu chuẩn bị"),
  ref_type: z.null().optional(),
  ref_id: z.null().optional(),
});

export const assessmentActivitySchema = baseActivitySchema.extend({
  kind: z.literal("assessment"),
  ref_type: z.null().optional(),
  ref_id: z.null().optional(),
});

export const homeActivitySchema = baseActivitySchema.extend({
  kind: z.literal("home_activity"),
  ref_type: z.null().optional(),
  ref_id: z.null().optional(),
});

export const activityFormSchema = z.discriminatedUnion("kind", [
  digitalGameActivitySchema,
  discussionActivitySchema,
  storytellingActivitySchema,
  movementActivitySchema,
  manipulativeActivitySchema,
  worksheetActivitySchema,
  observationActivitySchema,
  miniProjectActivitySchema,
  assessmentActivitySchema,
  homeActivitySchema,
]);

export const updateActivityFormSchema = baseActivitySchema.partial().extend({
  kind: activityKindSchema.optional(),
  ref_type: z.string().nullable().optional(),
  ref_id: z.number().int().positive().nullable().optional(),
  expected_version: z.number().int().positive().optional(),
});

export type ActivityFormData = z.infer<typeof activityFormSchema>;
export type UpdateActivityFormData = z.infer<typeof updateActivityFormSchema>;
