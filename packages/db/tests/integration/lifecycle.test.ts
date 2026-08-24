import { describe, expect, it } from "vitest";
import { getOwnerDb } from "#src/index";
import { contentLifecycleStatusEnum } from "#src/schema/game";
import { contentReviewLog } from "#src/schema/ops";

describe("P0.6 Task 1 — Enum in_review & content_review_log edge migration", () => {
  it("contentLifecycleStatusEnum must match spec §7.1 (in_review, not submitted)", () => {
    const enumValues = contentLifecycleStatusEnum.enumValues;
    expect(enumValues).toContain("in_review");
    expect(enumValues).not.toContain("submitted");
  });

  it("content_review_log supports edge transition logging (fromStatus, toStatus, reason, checklistSnapshot)", async () => {
    const db = getOwnerDb();
    const [log] = await db
      .insert(contentReviewLog)
      .values({
        entityType: "game_level",
        entityId: 12_345,
        contentVersion: 1,
        fromStatus: "approved",
        toStatus: "published",
        actorRole: "super_admin",
        reason: "Publishing level for production",
        checklistSnapshot: { ok: true, missing: [] },
      })
      .returning();

    expect(log).toBeDefined();
    expect(log.fromStatus).toBe("approved");
    expect(log.toStatus).toBe("published");
  });
});
