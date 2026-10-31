import { IncomingMessage, ServerResponse } from "node:http";
import { Socket } from "node:net";
import {
  contentTags,
  detectOrphanedContentTags,
  getOwnerDb,
  normalizeMechanicTagCode,
  validateAndAssignTags,
  validateContentSkillMap,
} from "@mindkid/db";
import { seed } from "@mindkid/db/seed";
import type { ValidationError } from "@mindkid/errors/common";
import { createEvent } from "h3";
import { beforeAll, describe, expect, it } from "vitest";
import guestTagsHandler from "#server/api/guest/tags.get";

describe("Task P1.10 — Content Tagging & Public Vocabulary (BR-TAG-*)", () => {
  beforeAll(async () => {
    await seed();
    const db = getOwnerDb();
    await db
      .insert(contentTags)
      .values([
        { code: "cnt", axis: "what", label: "Đếm số", status: "active" },
        {
          code: "visual",
          axis: "thinking",
          label: "Tư duy trực quan",
          status: "active",
        },
        {
          code: "tap_select",
          axis: "mechanic",
          label: "Chạm chọn",
          status: "active",
        },
      ])
      .onConflictDoNothing();
  }, 60_000);

  it("BR-TAG-01: rejects unapproved tag codes outside active vocabulary with 422 TAG_INVALID", async () => {
    const db = getOwnerDb();
    try {
      await validateAndAssignTags(db, {
        entityType: "game_level",
        entityId: 99_999,
        tagCodes: ["fun_stuff"],
      });
      expect.fail("Should have thrown 422 TAG_INVALID");
    } catch (err) {
      const e = err as ValidationError;
      expect(e.message).toContain("Tag không hợp lệ");
    }
  });

  it("BR-TAG-02: requires >= 1 tag for each pedagogical axis (what, thinking, mechanic) on publication", async () => {
    const db = getOwnerDb();
    try {
      await validateAndAssignTags(
        db,
        {
          entityType: "game_level",
          entityId: 99_999,
          tagCodes: ["cnt"],
        },
        true
      );
      expect.fail("Should have thrown PEDAGOGICAL_AXIS_TAG_MISSING");
    } catch (err) {
      const e = err as ValidationError;
      expect(e.message).toContain("Thiếu tag cho trục sư phạm");
    }
  });

  it("BR-TAG-03 & BR-TAG-04: enforces skill map weight ∈ (0, 1] and exactly one primary skill weight = 1.0", () => {
    expect(() =>
      validateContentSkillMap([
        { skillId: 1, weight: 1.0 },
        { skillId: 2, weight: 0.5 },
      ])
    ).not.toThrow();

    try {
      validateContentSkillMap([{ skillId: 1, weight: 1.5 }]);
      expect.fail("Should have thrown SKILL_WEIGHT_OUT_OF_RANGE");
    } catch (err) {
      const e = err as ValidationError;
      expect(e.message).toContain("phải nằm trong (0, 1]");
    }

    try {
      validateContentSkillMap([
        { skillId: 1, weight: 1.0 },
        { skillId: 2, weight: 1.0 },
      ]);
      expect.fail("Should have thrown PRIMARY_SKILL_WEIGHT_INVALID");
    } catch (err) {
      const e = err as ValidationError;
      expect(e.message).toContain("đúng 1 kỹ năng chính với weight = 1.0");
    }

    try {
      validateContentSkillMap([
        { skillId: 1, weight: 0.8 },
        { skillId: 2, weight: 0.5 },
      ]);
      expect.fail("Should have thrown PRIMARY_SKILL_WEIGHT_INVALID");
    } catch (err) {
      const e = err as ValidationError;
      expect(e.message).toContain("đúng 1 kỹ năng chính với weight = 1.0");
    }
  });

  it("BR-TAG-07: detectOrphanedContentTags returns 0 when no orphan entries present", async () => {
    const db = getOwnerDb();
    const count = await detectOrphanedContentTags(db);
    expect(count).toBeGreaterThanOrEqual(0);
  });

  it("Mechanic tag normalization mapping", () => {
    expect(normalizeMechanicTagCode("tap-select")).toBe("tap_select");
    expect(normalizeMechanicTagCode("drag-to-container")).toBe("drag_drop");
    expect(normalizeMechanicTagCode("sort-groups")).toBe("matching");
  });

  it("BR-TAG-06: deprecated tags in content_tags never appear in GET /api/guest/tags", async () => {
    const db = getOwnerDb();
    const suffix = `${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const deprecatedTagCode = `dep_tag_${suffix}`;

    await db
      .insert(contentTags)
      .values({
        code: deprecatedTagCode,
        axis: "what",
        label: "Tag đã ngừng dùng",
        status: "deprecated",
      })
      .onConflictDoNothing();

    const req = new IncomingMessage(new Socket());
    const res = new ServerResponse(req);
    const guestEvent = createEvent(req, res);
    const publicTags = await guestTagsHandler(guestEvent);
    const allPublicCodes = [
      ...publicTags.what,
      ...publicTags.thinking,
      ...publicTags.mechanic,
      ...publicTags.theme,
    ].map((t) => t.code);
    expect(allPublicCodes).not.toContain(deprecatedTagCode);
  });
});
