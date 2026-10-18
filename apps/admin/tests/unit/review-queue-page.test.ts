import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("Content Review Queue Pages (/studio/review) — BR-CRQ-01, BR-CRQ-02, BR-CRQ-07", () => {
  const reviewIndexContent = readFileSync(
    join(import.meta.dirname, "../../app/pages/studio/review/index.vue"),
    "utf-8"
  );
  const reviewDetailContent = readFileSync(
    join(import.meta.dirname, "../../app/pages/studio/review/[id].vue"),
    "utf-8"
  );

  it("Scenario: BR-CRQ-01 — review queue index has no bulk-reject or multi-select controls", () => {
    expect(reviewIndexContent).not.toContain("bulk-reject");
    expect(reviewIndexContent).not.toContain("confirmBulkReject");
    expect(reviewIndexContent).not.toContain("isBulkRejectModalOpen");
    expect(reviewIndexContent).not.toContain("Từ chối cả lô");
    expect(reviewIndexContent).not.toContain("Từ chối hàng loạt");
  });

  it("Scenario: BR-CRQ-02 — review detail loads correct endpoint by entityType (game_level, lesson, activity)", () => {
    expect(reviewDetailContent).toContain("/api/managers/levels/");
    expect(reviewDetailContent).toContain("/api/managers/lessons/");
    expect(reviewDetailContent).toContain("teaching-view");
    expect(reviewDetailContent).toContain("/api/managers/activities/");
  });

  it("Scenario: BR-CRQ-07 — displays entity-specific 6-group checklist (GAME_LEVEL_CHECKLIST_GROUPS vs LESSON_ACTIVITY_CHECKLIST_GROUPS)", () => {
    expect(reviewDetailContent).toContain("GAME_LEVEL_CHECKLIST_GROUPS");
    expect(reviewDetailContent).toContain("LESSON_ACTIVITY_CHECKLIST_GROUPS");
    expect(reviewDetailContent).toContain("child_language");
    expect(reviewDetailContent).toContain("material_safety");
    expect(reviewDetailContent).toContain("home_feasibility");
    expect(reviewDetailContent).toContain("observational_assessment");
    expect(reviewDetailContent).toContain("lifecycle_references");
  });

  it("Scenario: BR-CRQ-02 — locks Approve button until preview/teaching view is opened and all checklist groups are checked", () => {
    expect(reviewDetailContent).toContain("hasPreviewed");
    expect(reviewDetailContent).toContain("canApprove");
    expect(reviewDetailContent).toContain("openTeachingPreview");
    expect(reviewDetailContent).toContain(':disabled="!canApprove');
  });

  it("Scenario: BR-ALV-05 — includes 'Xem lịch sử' link to /audit with entity_type and entity_id", () => {
    expect(reviewDetailContent).toContain("/audit?entity_type=");
    expect(reviewDetailContent).toContain("Xem lịch sử");
  });
});
