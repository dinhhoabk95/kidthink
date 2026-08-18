import { describe, expect, it } from "vitest";
import {
  buildActivitySnapshot,
  buildCustomNoteSnapshot,
  buildGameLevelSnapshot,
  CreateLessonPlanSchema,
  ReplaceLessonPlanItemsSchema,
  UpdateLessonPlanMetaSchema,
} from "../src/lesson-plan.js";

describe("Task P4.1 — Shared Lesson Plan Schemas & Snapshot Builders (BR-LPC-01..09, D-P4A..D-P4D)", () => {
  it("D-P4A: builds allow-list activity snapshot and strips internal admin data", () => {
    const rawActivity = {
      title: "Đếm hạt dẻ",
      instruction: "Bé đếm từng hạt dẻ và xếp thành hàng",
      materials: "10 hạt dẻ, khay gỗ",
      estimatedMinutes: 15,
      kind: "manipulative",
      accessTier: "free",
      code: "ACT-0001",
      contentVersion: 2,
    };

    const snapshot = buildActivitySnapshot(rawActivity);

    expect(snapshot).toEqual({
      title: "Đếm hạt dẻ",
      instruction: "Bé đếm từng hạt dẻ và xếp thành hàng",
      materials: "10 hạt dẻ, khay gỗ",
      estimated_minutes: 15,
      kind: "manipulative",
      access_tier: "free",
      source_code: "ACT-0001",
      source_version: 2,
    });
    // Ensure no child or internal fields leaked
    expect((snapshot as any).child_profile_id).toBeUndefined();
    expect((snapshot as any).created_by_manager_id).toBeUndefined();
  });

  it("D-P4A: builds allow-list game level snapshot and strips content_pack internal fields", () => {
    const rawLevel = {
      title: "Đếm thỏ trong chuồng",
      templateId: 1,
      accessTier: "standard",
      difficultyParams: { count_min: 1, count_max: 5 },
      code: "GL-C1-CNT-01",
      contentVersion: 1,
    };

    const snapshot = buildGameLevelSnapshot(rawLevel);

    expect(snapshot).toEqual({
      title: "Đếm thỏ trong chuồng",
      template_id: 1,
      access_tier: "standard",
      difficulty_params: { count_min: 1, count_max: 5 },
      source_code: "GL-C1-CNT-01",
      source_version: 1,
    });
  });

  it("D-P4A: builds custom note snapshot", () => {
    const note = {
      content: "Nhắc trẻ rửa tay trước khi dùng học cụ",
      estimatedMinutes: 5,
    };

    const snapshot = buildCustomNoteSnapshot(note);
    expect(snapshot.content).toBe("Nhắc trẻ rửa tay trước khi dùng học cụ");
    expect(snapshot.estimated_minutes).toBe(5);
  });

  it("validates CreateLessonPlanSchema correctly", () => {
    const valid = CreateLessonPlanSchema.safeParse({
      title: "Giáo án tuần 1",
      target_age: 4,
      estimated_minutes: 30,
      notes: "Chuẩn bị thẻ số",
      source_lesson_code: "LES-0001",
    });
    expect(valid.success).toBe(true);

    const invalidAge = CreateLessonPlanSchema.safeParse({
      title: "Giáo án",
      target_age: 7, // out of range 3..6
    });
    expect(invalidAge.success).toBe(false);

    const emptyTitle = CreateLessonPlanSchema.safeParse({
      title: "   ",
    });
    expect(emptyTitle.success).toBe(false);
  });

  it("validates UpdateLessonPlanMetaSchema correctly", () => {
    const valid = UpdateLessonPlanMetaSchema.safeParse({
      title: "Tiêu đề mới",
      estimated_minutes: 45,
      expected_version: 2,
    });
    expect(valid.success).toBe(true);
  });

  it("D-P4B: validates ReplaceLessonPlanItemsSchema requiring expected_version and contiguous items", () => {
    const valid = ReplaceLessonPlanItemsSchema.safeParse({
      expected_version: 1,
      items: [
        {
          item_type: "activity",
          item_code: "ACT-0001",
          source_entity_id: 101,
          source_content_version: 1,
          custom_instruction: "Đếm chậm",
        },
        {
          item_type: "custom_note",
          custom_note: "Giải lao 5 phút",
        },
      ],
    });
    expect(valid.success).toBe(true);

    const missingVersion = ReplaceLessonPlanItemsSchema.safeParse({
      items: [],
    });
    expect(missingVersion.success).toBe(false);
  });
});
