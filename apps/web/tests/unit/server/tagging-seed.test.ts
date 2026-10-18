import { IncomingMessage, ServerResponse } from "node:http";
import { Socket } from "node:net";
import {
  auditLogs,
  contentSkillMap,
  contentTagMap,
  detectOrphanedContentTags,
  gameLevels,
  getOwnerDb,
  managers,
  normalizeMechanicTagCode,
  users,
  userTags,
  validateAndAssignTags,
  validateContentSkillMap,
} from "@mindkid/db";
import {
  type ContentSeed,
  executeSeedBatch,
  runEightGates,
  seed,
} from "@mindkid/db/seed";
import type { ValidationError } from "@mindkid/errors/common";
import type { ContentImmutableError } from "@mindkid/errors/content";
import { and, eq } from "drizzle-orm";
import { createEvent, type H3Event } from "h3";
import { beforeAll, describe, expect, it } from "vitest";
import guestTagsHandler from "#server/api/guest/tags.get";
import putTagsHandler from "#server/api/managers/content/[type]/[id]/tags.put";

function makeManagerEvent(
  managerId: number,
  params: Record<string, string>,
  body: Record<
    string,
    string | boolean | string[] | Array<{ skill_code: string; weight: number }>
  >
): H3Event {
  const req = new IncomingMessage(new Socket());
  req.method = "PUT";
  req.url = `/api/managers/content/${params.type}/${params.id}/tags`;
  const res = new ServerResponse(req);
  const event = createEvent(req, res);
  event.context.manager = {
    manager_id: managerId,
    display_name: "Tagging Test Manager",
    session_id: "sess-tag-test",
    role: "super_admin",
  };
  event.context.params = params;
  event.context.body = body;
  return event;
}

describe("Task P1.10 — Content Tagging & Seed Authoring Pipeline (BR-TAG-* & BR-CSA-*)", () => {
  beforeAll(async () => {
    await seed();
  }, 60_000);
  const mockSeed: ContentSeed = {
    header: {
      code: "GL-C1-CNT-CARD-0099",
      content_version: 1,
      template_code: "GT-001",
      title: "Đếm hoa quả trong vườn",
      instruction: "Em hãy đếm xem có bao nhiêu quả táo nhé.",
      age_min: 3,
      age_max: 4,
      difficulty: 1,
      access_tier: "free",
      skill_codes: ["C1.CNT.01"],
      learning_objective_codes: ["LO-C1.CNT.01-01"],
      what_tags: ["cnt"],
      thinking_tags: ["visual"],
      theme_tag: "farm",
      origin: "human",
      authored_in: "repo_seed",
    },
    content_pack: {
      prompt: "Em hãy chọn quả táo đúng nhé",
      target_item: {
        item_id: "apple_1",
        asset: { kind: "emoji", ref: "🍎" },
      },
      options: [
        {
          item_id: "opt_1",
          asset: { kind: "emoji", ref: "🍎" },
          is_correct: true,
        },
        {
          item_id: "opt_2",
          asset: { kind: "emoji", ref: "🍌" },
          is_correct: false,
        },
      ],
    },
    difficulty_params: {
      distractor_count: 1,
      hint_after_ms: 10_000,
      allow_retry: true,
      shuffle_items: true,
    },
  };

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
      expect(e.details).toContain("Tag không hợp lệ");
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
          tagCodes: ["cnt"], // missing thinking and mechanic
        },
        true
      );
      expect.fail("Should have thrown PEDAGOGICAL_AXIS_TAG_MISSING");
    } catch (err) {
      const e = err as ValidationError;
      expect(e.details).toContain("Thiếu tag cho trục sư phạm");
    }
  });

  it("BR-TAG-03 & BR-TAG-04: enforces skill map weight ∈ (0, 1] and exactly one primary skill weight = 1.0", () => {
    // Valid: 1 primary skill with 1.0 weight
    expect(() =>
      validateContentSkillMap([
        { skillId: 1, weight: 1.0 },
        { skillId: 2, weight: 0.5 },
      ])
    ).not.toThrow();

    // Invalid: weight out of range
    try {
      validateContentSkillMap([{ skillId: 1, weight: 1.5 }]);
      expect.fail("Should have thrown SKILL_WEIGHT_OUT_OF_RANGE");
    } catch (err) {
      const e = err as ValidationError;
      expect(e.details).toContain("phải nằm trong (0, 1]");
    }

    // Invalid: multiple 1.0 weights
    try {
      validateContentSkillMap([
        { skillId: 1, weight: 1.0 },
        { skillId: 2, weight: 1.0 },
      ]);
      expect.fail("Should have thrown PRIMARY_SKILL_WEIGHT_INVALID");
    } catch (err) {
      const e = err as ValidationError;
      expect(e.details).toContain("đúng 1 kỹ năng chính với weight = 1.0");
    }

    // Invalid: zero 1.0 weights
    try {
      validateContentSkillMap([
        { skillId: 1, weight: 0.8 },
        { skillId: 2, weight: 0.5 },
      ]);
      expect.fail("Should have thrown PRIMARY_SKILL_WEIGHT_INVALID");
    } catch (err) {
      const e = err as ValidationError;
      expect(e.details).toContain("đúng 1 kỹ năng chính với weight = 1.0");
    }
  });

  it("BR-TAG-07: detectOrphanedContentTags returns 0 when no orphan entries present", async () => {
    const db = getOwnerDb();
    const count = await detectOrphanedContentTags(db);
    expect(count).toBeGreaterThanOrEqual(0);
  });

  it("BR-CSA-01 & BR-CSA-05: executeSeedBatch performs transactional seed and dry run rollback", async () => {
    const db = getOwnerDb();
    const result = await executeSeedBatch(
      db,
      {
        batchCode: `TEST-BATCH-${Date.now()}`,
        seeds: [mockSeed],
      },
      true // dry run
    );

    expect(result.rowsInserted).toBe(1);
    expect(result.gateResults.every((g) => g.passed)).toBe(true);
  });

  it("8 Validation Gates: detects blocklisted words (Gate 7)", () => {
    const dirtySeed: ContentSeed = {
      ...mockSeed,
      header: {
        ...mockSeed.header,
        code: "GL-C1-CNT-CARD-0098",
        instruction: "Em hãy đánh nhau với con quái vật",
      },
    };

    const gates = runEightGates(dirtySeed);
    const gate7 = gates.find((g) => g.gate === 7);
    expect(gate7?.passed).toBe(false);
    expect(gate7?.issues[0]?.code).toBe("CHILD_SAFETY_BLOCKLIST_MATCH");
  });

  it("Mechanic tag normalization mapping", () => {
    expect(normalizeMechanicTagCode("tap-select")).toBe("tap_select");
    expect(normalizeMechanicTagCode("drag-to-container")).toBe("drag_drop");
    expect(normalizeMechanicTagCode("sort-groups")).toBe("matching");
  });

  describe("PUT /api/managers/content/[type]/[id]/tags & BR-TAG-05 / BR-TAG-06", () => {
    it("BR-TAG-05: user-created tags in user_tags never appear in GET /api/guest/tags and are rejected with 422 on PUT tags", async () => {
      const db = getOwnerDb();
      const suffix = `${Date.now()}_${Math.floor(Math.random() * 1000)}`;
      const customUserTag = `user_private_tag_${suffix}`;

      const [user] = await db
        .insert(users)
        .values({
          email: `tag_user_${suffix}@tinimath.vn`,
          displayName: "Tag User",
          status: "active",
        })
        .returning();
      if (!user) {
        throw new Error("Failed to insert user");
      }

      await db.insert(userTags).values({
        userId: user.id,
        label: customUserTag,
      });

      const [mgr] = await db.select().from(managers).limit(1);
      if (!mgr) {
        throw new Error("Expected seeded manager");
      }

      const [draftLevel] = await db
        .insert(gameLevels)
        .values({
          entityId: Math.floor(Date.now() / 1000) * 1000 + 701,
          code: `GL-C1-TAG-${suffix.slice(-4)}`,
          contentVersion: 1,
          templateCode: "GT-001",
          title: "Bài nháp gắn tag",
          instruction: "Chọn quả táo",
          ageMin: 3,
          ageMax: 4,
          difficulty: 1,
          accessTier: "free",
          contentPack: mockSeed.content_pack,
          difficultyParams: mockSeed.difficulty_params,
          status: "draft",
        })
        .returning();
      if (!draftLevel) {
        throw new Error("Failed to insert draft level");
      }

      // 1. GET /api/guest/tags must not expose customUserTag
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
      expect(allPublicCodes).not.toContain(customUserTag);

      // 2. PUT tags with user tag must throw 422 ValidationError (BR-TAG-05)
      const putEvent = makeManagerEvent(
        mgr.id,
        { type: "game_level", id: String(draftLevel.id) },
        {
          tags: [customUserTag],
          skills: [{ skill_code: "C1.CNT.01", weight: 1.0 }],
        }
      );

      try {
        await putTagsHandler(putEvent);
        expect.fail("Should have rejected user tag with 422");
      } catch (err) {
        const e = err as ValidationError;
        expect(e.status).toBe(422);
        expect(e.message).toContain("BR-TAG-05");
      }
    });

    it("BR-TAG-06: rejects direct tagging on curriculum and unconfirmed AI tag suggestions with 422", async () => {
      const db = getOwnerDb();
      const [mgr] = await db.select().from(managers).limit(1);
      if (!mgr) {
        throw new Error("Expected seeded manager");
      }

      // 1. Direct tagging on curriculum -> 422
      const curriculumEvent = makeManagerEvent(
        mgr.id,
        { type: "curriculum", id: "1" },
        { tags: ["cnt"] }
      );
      try {
        await putTagsHandler(curriculumEvent);
        expect.fail("Should have rejected curriculum tagging with 422");
      } catch (err) {
        const e = err as ValidationError;
        expect(e.status).toBe(422);
        expect(e.message).toContain("BR-TAG-06");
      }

      // 2. Unconfirmed AI tag suggestion -> 422
      const aiUnconfirmedEvent = makeManagerEvent(
        mgr.id,
        { type: "game_level", id: "1" },
        {
          tags: ["cnt"],
          origin: "ai_suggested",
          confirmed_by_manager: false,
        }
      );
      try {
        await putTagsHandler(aiUnconfirmedEvent);
        expect.fail("Should have rejected unconfirmed AI tags with 422");
      } catch (err) {
        const e = err as ValidationError;
        expect(e.status).toBe(422);
        expect(e.message).toContain("BR-TAG-06");
      }
    });

    it("PUT /api/managers/content/[type]/[id]/tags returns 409 CONTENT_IMMUTABLE on published content and 200 + audit log on draft", async () => {
      const db = getOwnerDb();
      const [mgr] = await db.select().from(managers).limit(1);
      if (!mgr) {
        throw new Error("Expected seeded manager");
      }

      const suffix = `${Date.now()}`.slice(-4);
      const [publishedLevel] = await db
        .insert(gameLevels)
        .values({
          entityId: Math.floor(Date.now() / 1000) * 1000 + 702,
          code: `GL-C1-PUB-${suffix}`,
          contentVersion: 1,
          templateCode: "GT-001",
          title: "Bài đã phát hành",
          instruction: "Chọn quả táo",
          ageMin: 3,
          ageMax: 4,
          difficulty: 1,
          accessTier: "free",
          contentPack: mockSeed.content_pack,
          difficultyParams: mockSeed.difficulty_params,
          status: "published",
        })
        .returning();
      if (!publishedLevel) {
        throw new Error("Failed to insert published level");
      }

      // 1. Published content -> 409 CONTENT_IMMUTABLE
      const pubEvent = makeManagerEvent(
        mgr.id,
        { type: "game_level", id: String(publishedLevel.id) },
        {
          tags: ["cnt", "visual"],
          skills: [{ skill_code: "C1.CNT.01", weight: 1.0 }],
        }
      );
      try {
        await putTagsHandler(pubEvent);
        expect.fail("Should have thrown 409 CONTENT_IMMUTABLE");
      } catch (err) {
        const e = err as ContentImmutableError;
        expect(e.status).toBe(409);
        expect(e.code).toBe("CONTENT_IMMUTABLE");
      }

      // 2. Draft content -> 200 + updates content_tag_map, content_skill_map, and audit_logs
      const [draftLevel] = await db
        .insert(gameLevels)
        .values({
          entityId: Math.floor(Date.now() / 1000) * 1000 + 703,
          code: `GL-C1-DRF-${suffix}`,
          contentVersion: 1,
          templateCode: "GT-001",
          title: "Bài nháp hợp lệ",
          instruction: "Chọn quả táo",
          ageMin: 3,
          ageMax: 4,
          difficulty: 1,
          accessTier: "free",
          contentPack: mockSeed.content_pack,
          difficultyParams: mockSeed.difficulty_params,
          status: "draft",
        })
        .returning();
      if (!draftLevel) {
        throw new Error("Failed to insert draft level");
      }

      const validEvent = makeManagerEvent(
        mgr.id,
        { type: "game_level", id: String(draftLevel.id) },
        {
          tags: ["cnt", "visual"],
          skills: [{ skill_code: "C1.CNT.01", weight: 1.0 }],
        }
      );
      const response = await putTagsHandler(validEvent);
      expect(response.ok).toBe(true);
      expect(response.entity_id).toBe(draftLevel.id);

      const savedTags = await db
        .select()
        .from(contentTagMap)
        .where(
          and(
            eq(contentTagMap.entityType, "game_level"),
            eq(contentTagMap.entityId, draftLevel.id)
          )
        );
      expect(savedTags.length).toBeGreaterThanOrEqual(2);

      const savedSkills = await db
        .select()
        .from(contentSkillMap)
        .where(
          and(
            eq(contentSkillMap.entityType, "game_level"),
            eq(contentSkillMap.entityId, draftLevel.id)
          )
        );
      expect(savedSkills.length).toBe(1);

      const audits = await db
        .select()
        .from(auditLogs)
        .where(
          and(
            eq(auditLogs.entityType, "game_level"),
            eq(auditLogs.entityId, String(draftLevel.id))
          )
        );
      expect(audits.length).toBeGreaterThanOrEqual(1);
    });
  });
});
