/**
 * Spec sở hữu: docs/specs/07-addon/lesson-plan-creator.md
 * Business rules: BR-LPC-01..09, D-P4A..D-P4D
 */

import { z } from "zod";

export type LessonPlanItemType = "activity" | "game_level" | "custom_note";

export interface ActivitySnapshot {
  readonly title: string;
  readonly instruction?: string | null;
  readonly materials_vi?: string | null;
  readonly estimated_minutes?: number | null;
  readonly kind: string;
  readonly access_tier: string;
  readonly source_code: string;
  readonly source_version: number;
}

export interface GameLevelSnapshot {
  readonly title: string;
  readonly template_id?: number | null;
  readonly access_tier: string;
  readonly difficulty_params?: Record<string, unknown> | null;
  readonly source_code: string;
  readonly source_version: number;
}

export interface CustomNoteSnapshot {
  readonly content: string;
  readonly estimated_minutes?: number | null;
}

export type LessonPlanItemSnapshot =
  | ActivitySnapshot
  | GameLevelSnapshot
  | CustomNoteSnapshot;

export interface LessonPlanItem {
  id: number;
  lesson_plan_id: number;
  position: number;
  item_type: LessonPlanItemType;
  item_code: string | null;
  source_entity_id: number | null;
  source_content_version: number | null;
  custom_instruction: string | null;
  snapshot: LessonPlanItemSnapshot;
  created_at: string;
  has_update?: boolean;
  latest_version?: number;
}

export interface LessonPlanSummary {
  id: number;
  uuid: string;
  user_id: number;
  title: string;
  target_age: number | null;
  estimated_minutes: number | null;
  notes: string | null;
  source_lesson_code: string | null;
  version: number;
  item_count: number;
  created_at: string;
  updated_at: string;
}

export interface LessonPlanDetail extends LessonPlanSummary {
  items: LessonPlanItem[];
}

export function buildActivitySnapshot(activity: {
  titleVi: string;
  instructionVi?: string | null;
  materialsVi?: string | null;
  estimatedMinutes?: number | null;
  kind: string;
  accessTier: string;
  code: string;
  contentVersion: number;
}): ActivitySnapshot {
  return {
    title: activity.titleVi,
    instruction: activity.instructionVi ?? null,
    materials_vi: activity.materialsVi ?? null,
    estimated_minutes: activity.estimatedMinutes ?? null,
    kind: activity.kind,
    access_tier: activity.accessTier,
    source_code: activity.code,
    source_version: activity.contentVersion,
  };
}

export function buildGameLevelSnapshot(level: {
  titleVi: string;
  templateId?: number | null;
  accessTier: string;
  difficultyParams?: Record<string, unknown> | null;
  code: string;
  contentVersion: number;
}): GameLevelSnapshot {
  return {
    title: level.titleVi,
    template_id: level.templateId ?? null,
    access_tier: level.accessTier,
    difficulty_params: level.difficultyParams ?? null,
    source_code: level.code,
    source_version: level.contentVersion,
  };
}

export function buildCustomNoteSnapshot(note: {
  content: string;
  estimatedMinutes?: number | null;
}): CustomNoteSnapshot {
  return {
    content: note.content,
    estimated_minutes: note.estimatedMinutes ?? null,
  };
}

export const CreateLessonPlanSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Tiêu đề không được để trống")
    .max(200, "Tiêu đề tối đa 200 ký tự"),
  target_age: z
    .number()
    .int("Độ tuổi phải là số nguyên")
    .min(3, "Độ tuổi tối thiểu là 3")
    .max(6, "Độ tuổi tối đa là 6")
    .optional()
    .nullable(),
  estimated_minutes: z
    .number()
    .int("Thời lượng phải là số nguyên")
    .min(1, "Thời lượng tối thiểu là 1 phút")
    .max(180, "Thời lượng tối đa là 180 phút")
    .optional()
    .nullable(),
  notes: z
    .string()
    .max(2000, "Ghi chú tối đa 2000 ký tự")
    .optional()
    .nullable(),
  source_lesson_code: z.string().max(50).optional().nullable(),
});

export type CreateLessonPlanInput = z.infer<typeof CreateLessonPlanSchema>;

export const UpdateLessonPlanMetaSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Tiêu đề không được để trống")
    .max(200, "Tiêu đề tối đa 200 ký tự")
    .optional(),
  target_age: z
    .number()
    .int("Độ tuổi phải là số nguyên")
    .min(3, "Độ tuổi tối thiểu là 3")
    .max(6, "Độ tuổi tối đa là 6")
    .optional()
    .nullable(),
  estimated_minutes: z
    .number()
    .int("Thời lượng phải là số nguyên")
    .min(1, "Thời lượng tối thiểu là 1 phút")
    .max(180, "Thời lượng tối đa là 180 phút")
    .optional()
    .nullable(),
  notes: z
    .string()
    .max(2000, "Ghi chú tối đa 2000 ký tự")
    .optional()
    .nullable(),
  expected_version: z.number().int().min(1).optional(),
});

export type UpdateLessonPlanMetaInput = z.infer<
  typeof UpdateLessonPlanMetaSchema
>;

export const LessonPlanItemInputSchema = z.object({
  item_type: z.enum(["activity", "game_level", "custom_note"]),
  item_code: z.string().max(50).optional().nullable(),
  source_entity_id: z.number().int().optional().nullable(),
  source_content_version: z.number().int().optional().nullable(),
  custom_instruction: z.string().max(1000).optional().nullable(),
  custom_note: z.string().max(2000).optional().nullable(),
});

export type LessonPlanItemInput = z.infer<typeof LessonPlanItemInputSchema>;

export const ReplaceLessonPlanItemsSchema = z.object({
  expected_version: z
    .number()
    .int("expected_version phải là số nguyên")
    .min(1, "Thiếu expected_version"),
  items: z
    .array(LessonPlanItemInputSchema)
    .max(50, "Tối đa 50 mục trong giáo án"),
});

export type ReplaceLessonPlanItemsInput = z.infer<
  typeof ReplaceLessonPlanItemsSchema
>;

export const RefreshLessonPlanItemSchema = z.object({
  position: z.number().int().min(0, "Vị trí không hợp lệ"),
});

export type RefreshLessonPlanItemInput = z.infer<
  typeof RefreshLessonPlanItemSchema
>;
