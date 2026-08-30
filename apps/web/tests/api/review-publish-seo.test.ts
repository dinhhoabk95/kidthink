import { randomUUID } from "node:crypto";
import {
  competencies,
  contentSkillMap,
  curricula,
  curriculumItems,
  gameLevels,
  gameTemplates,
  getOwnerDb,
  managers,
  playSessions,
  seoPages,
  skills,
  strands,
} from "@mindkid/db";
import { eq } from "drizzle-orm";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import guestSeoHandler from "#server/api/guest/seo-pages/[slug].get";
import versionsHandler from "#server/api/managers/content/[type]/[code]/versions.get";
import transitionHandler from "#server/api/managers/content/[type]/[id]/transition.post";
import bulkRejectHandler from "#server/api/managers/content/review-queue/bulk-reject.post";
import reviewQueueHandler from "#server/api/managers/content/review-queue/index.get";
import levelConfigHandler from "#server/api/managers/levels/[code]/config.get";
import seoPatchHandler from "#server/api/managers/seo-pages/[slug]/[version].patch";
import seoPreviewHandler from "#server/api/managers/seo-pages/[slug]/preview.get";
import seoPagesPostHandler from "#server/api/managers/seo-pages/index.post";
import { issuePreviewToken } from "#server/utils/preview-token";

const CSRF_TOKEN =
  "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";

let testManagerId = 1;
let reviewerManagerId = 2;
let testSkillId = 1;

beforeAll(async () => {
  await ensureManagersAndSkill();
});

beforeEach(async () => {
  await ensureManagersAndSkill();
});

async function ensureManagersAndSkill() {
  const db = getOwnerDb();
  let [mgr] = await db
    .select({ id: managers.id })
    .from(managers)
    .where(eq(managers.email, "review-tester@mindkid.edu.vn"));
  if (!mgr) {
    [mgr] = await db
      .insert(managers)
      .values({
        email: "review-tester@mindkid.edu.vn",
        passwordHash: "hash",
        displayName: "Review Tester",
        role: "super_admin",
        isActive: true,
      })
      .returning({ id: managers.id });
  }
  if (mgr) {
    testManagerId = mgr.id;
  }

  let [rev] = await db
    .select({ id: managers.id })
    .from(managers)
    .where(eq(managers.email, "reviewer-only@mindkid.edu.vn"));
  if (!rev) {
    [rev] = await db
      .insert(managers)
      .values({
        email: "reviewer-only@mindkid.edu.vn",
        passwordHash: "hash",
        displayName: "Content Reviewer Tester",
        role: "content_reviewer",
        isActive: true,
      })
      .returning({ id: managers.id });
  }
  if (rev) {
    reviewerManagerId = rev.id;
  }

  // Ensure test skill
  let [sk] = await db
    .select({ id: skills.id })
    .from(skills)
    .where(eq(skills.code, "C1.CNT.01"));
  if (!sk) {
    let [st] = await db.select({ id: strands.id }).from(strands).limit(1);
    if (!st) {
      let [comp] = await db
        .select({ id: competencies.id })
        .from(competencies)
        .limit(1);
      if (!comp) {
        [comp] = await db
          .insert(competencies)
          .values({
            code: "C1",
            name: "Tư duy số và số lượng",
            colorToken: "indigo",
            icon: "i-lucide-calculator",
            position: 1,
          })
          .returning({ id: competencies.id });
      }
      [st] = await db
        .insert(strands)
        .values({
          code: "C1.CNT",
          name: "Đếm và Số Lượng",
          competencyId: comp.id,
          position: 1,
        })
        .returning({ id: strands.id });
    }
    [sk] = await db
      .insert(skills)
      .values({
        code: "C1.CNT.01",
        name: "Đếm trong phạm vi 5",
        strandId: st.id,
        position: 1,
        ageMin: 3,
        ageMax: 6,
        difficulty: 1,
      })
      .returning({ id: skills.id });
  }
  if (sk) {
    testSkillId = sk.id;
  }
}

function mockEvent(
  params: Record<string, string> = {},
  query: Record<string, string> = {},
  body?: unknown,
  role: "super_admin" | "content_reviewer" = "super_admin",
  method = body ? "POST" : "GET"
) {
  const queryString = new URLSearchParams(query).toString();
  const url = queryString ? `/api/test?${queryString}` : "/api/test";
  const managerId = role === "super_admin" ? testManagerId : reviewerManagerId;
  const headersMap: Record<string, string> = {};

  return {
    method,
    path: url,
    url,
    query,
    node: {
      req: {
        method,
        url,
        headers: {
          "user-agent": "VitestTestRunner/1.0",
          "x-csrf-token": CSRF_TOKEN,
          cookie: `tm_m_csrf=${CSRF_TOKEN}`,
        },
        body,
      },
      res: {
        statusCode: 200,
        setHeader: (k: string, v: string) => {
          headersMap[k.toLowerCase()] = v;
        },
        getHeader: (k: string) => headersMap[k.toLowerCase()],
        end: () => {
          /* no-op */
        },
      },
    },
    context: {
      manager: {
        manager_id: managerId,
        id: managerId,
        display_name: "Review Tester Manager",
        session_id: "sess_rev_123",
        role,
      },
      params,
      query,
      body,
    },
    _query: query,
    _requestBody: body,
    _body: body,
  } as any;
}

function mockGuestEvent(params: Record<string, string> = {}) {
  const headersMap: Record<string, string> = {};
  const url = `/api/guest/seo-pages/${params.slug || ""}`;
  return {
    method: "GET",
    path: url,
    url,
    node: {
      req: {
        method: "GET",
        url,
        headers: {},
      },
      res: {
        statusCode: 200,
        setHeader: (k: string, v: string) => {
          headersMap[k.toLowerCase()] = v;
        },
        getHeader: (k: string) => headersMap[k.toLowerCase()],
        end: () => {
          /* no-op */
        },
      },
    },
    context: {
      params,
    },
  } as any;
}

const VALID_CONTENT_PACK = {
  prompt: "Tìm quả táo màu đỏ",
  target_item: {
    item_id: "apple_target",
    asset: { kind: "emoji", ref: "EMJ-red-apple" },
  },
  options: [
    {
      item_id: "apple_opt",
      asset: { kind: "emoji", ref: "EMJ-red-apple" },
      is_correct: true,
    },
    {
      item_id: "banana_opt",
      asset: { kind: "emoji", ref: "EMJ-banana" },
      is_correct: false,
    },
  ],
};

describe("Content Review, Publish, Versioning & SEO Admin APIs (P2.8, BR-CRQ-*, BR-PUB-*, BR-SEO-*)", () => {
  async function ensureTemplate() {
    const db = getOwnerDb();
    let [tpl] = await db
      .select()
      .from(gameTemplates)
      .where(eq(gameTemplates.code, "GT-001"));
    if (!tpl) {
      [tpl] = await db
        .insert(gameTemplates)
        .values({
          code: "GT-001",
          name: "GT001",
          mechanic: "tap-select",
          layouts: ["grid"],
          ageMin: 3,
          ageMax: 6,
        })
        .returning();
    }
    return tpl;
  }

  async function getUniqueLevelCode(prefix: string) {
    const db = getOwnerDb();
    while (true) {
      const num4 = Math.floor(Math.random() * 8999) + 1000;
      const candidate = `GL-C1-CNT-${prefix}-${num4}`;
      const [existing] = await db
        .select({ id: gameLevels.id })
        .from(gameLevels)
        .where(eq(gameLevels.code, candidate))
        .limit(1);
      if (!existing) {
        return candidate;
      }
    }
  }

  async function getUniqueCurriculumCode() {
    const db = getOwnerDb();
    while (true) {
      const num3 = Math.floor(Math.random() * 899) + 100;
      const candidate = `CUR-${num3}`;
      const [existing] = await db
        .select({ id: curricula.id })
        .from(curricula)
        .where(eq(curricula.code, candidate))
        .limit(1);
      if (!existing) {
        return candidate;
      }
    }
  }

  // --- 1. Content Review Queue (BR-CRQ-01..08, D-KK) ---
  it("Task 1: GET /api/managers/content/review-queue returns in_review items and filters out repo_seed published levels", async () => {
    const db = getOwnerDb();
    const tpl = await ensureTemplate();

    const inReviewCode = await getUniqueLevelCode("REV");
    const repoSeedCode = await getUniqueLevelCode("SED");

    // 1. studio item in_review
    await db.insert(gameLevels).values({
      entityId: Math.floor(Math.random() * 800_000 + 100_000),
      code: inReviewCode,
      contentVersion: 1,
      templateId: tpl.id,
      title: "Studio Review Queue Level",
      contentPack: VALID_CONTENT_PACK,
      difficultyParams: {},
      accessTier: "free",
      status: "in_review",
      authoredIn: "studio",
      ageMin: 3,
      ageMax: 6,
      difficulty: 1,
      createdByManagerId: testManagerId,
    });

    // 2. repo_seed item published (must NOT appear in queue)
    await db.insert(gameLevels).values({
      entityId: Math.floor(Math.random() * 800_000 + 100_000),
      code: repoSeedCode,
      contentVersion: 1,
      templateId: tpl.id,
      title: "Repo Seed Published Level",
      contentPack: VALID_CONTENT_PACK,
      difficultyParams: {},
      accessTier: "free",
      status: "published",
      authoredIn: "repo_seed",
      ageMin: 3,
      ageMax: 6,
      difficulty: 1,
    });

    const event = mockEvent({}, { entity_type: "game_level" });
    const res = (await reviewQueueHandler(event)) as any;

    expect(res.items).toBeDefined();
    expect(res.items.some((i: any) => i.code === inReviewCode)).toBe(true);
    expect(res.items.some((i: any) => i.code === repoSeedCode)).toBe(false);
  });

  it("Task 1: Review queue sorts by 4-tier priority (D-KK, BR-CRQ-08)", async () => {
    const db = getOwnerDb();
    const tpl = await ensureTemplate();

    const olderCode = await getUniqueLevelCode("OLD");
    const v2Code = await getUniqueLevelCode("VER");

    // v1 standalone older draft
    await db.insert(gameLevels).values({
      entityId: Math.floor(Math.random() * 800_000 + 100_000),
      code: olderCode,
      contentVersion: 1,
      templateId: tpl.id,
      title: "Older V1 Level",
      contentPack: VALID_CONTENT_PACK,
      difficultyParams: {},
      accessTier: "free",
      status: "in_review",
      authoredIn: "studio",
      ageMin: 3,
      ageMax: 6,
      difficulty: 1,
      createdByManagerId: testManagerId,
    });

    // v2 level (Tier 3 priority)
    await db.insert(gameLevels).values({
      entityId: Math.floor(Math.random() * 800_000 + 100_000),
      code: v2Code,
      contentVersion: 2,
      templateId: tpl.id,
      title: "Version 2 Level",
      contentPack: VALID_CONTENT_PACK,
      difficultyParams: {},
      accessTier: "free",
      status: "in_review",
      authoredIn: "studio",
      ageMin: 3,
      ageMax: 6,
      difficulty: 1,
      createdByManagerId: testManagerId,
    });

    const event = mockEvent({}, { entity_type: "game_level" });
    const res = (await reviewQueueHandler(event)) as any;

    const v2Item = res.items.find((i: any) => i.code === v2Code);
    const olderItem = res.items.find((i: any) => i.code === olderCode);

    expect(v2Item).toBeDefined();
    expect(olderItem).toBeDefined();
    expect(v2Item.priority_score).toBeGreaterThan(olderItem.priority_score);
  });

  // --- 2. Live Preview & Preview Token (D-KG, BR-CRQ-02) ---
  it("Task 2: GET /api/managers/levels/[code]/config delivers preview config with server-signed preview_token (D-KG, BR-CRQ-02)", async () => {
    const db = getOwnerDb();
    const tpl = await ensureTemplate();
    const code = await getUniqueLevelCode("TOK");

    await db.insert(gameLevels).values({
      entityId: Math.floor(Math.random() * 800_000 + 100_000),
      code,
      contentVersion: 1,
      templateId: tpl.id,
      title: "Preview Token Level",
      contentPack: VALID_CONTENT_PACK,
      difficultyParams: {},
      accessTier: "free",
      status: "in_review",
      authoredIn: "studio",
      ageMin: 3,
      ageMax: 6,
      difficulty: 1,
      createdByManagerId: testManagerId,
    });

    const event = mockEvent({ code }, { version: "1" });
    const configRes = (await levelConfigHandler(event)) as any;

    expect(configRes.preview_token).toBeDefined();
    expect(typeof configRes.preview_token).toBe("string");
  });

  it("Task 2: POST /api/managers/content/:type/:id/transition requires preview_token for approval (D-KG, BR-CRQ-02)", async () => {
    const db = getOwnerDb();
    const tpl = await ensureTemplate();
    const code = await getUniqueLevelCode("APV");

    const [lvl] = await db
      .insert(gameLevels)
      .values({
        entityId: Math.floor(Math.random() * 800_000 + 100_000),
        code,
        contentVersion: 1,
        templateId: tpl.id,
        title: "Approve Token Test",
        contentPack: VALID_CONTENT_PACK,
        difficultyParams: {},
        accessTier: "free",
        status: "in_review",
        authoredIn: "studio",
        ageMin: 3,
        ageMax: 6,
        difficulty: 1,
        createdByManagerId: testManagerId,
      })
      .returning();

    // 1. Negative test: Approve via curl without preview_token -> 422
    const badEvent = mockEvent(
      { type: "game_level", id: String(lvl.id) },
      {},
      {
        to_status: "approved",
        checklist: {
          pedagogy: true,
          content: true,
          language: true,
          imagery: true,
          safety: true,
          technical: true,
        },
      }
    );

    try {
      await transitionHandler(badEvent);
      expect.fail("Should throw 422 PREVIEW_TOKEN_REQUIRED");
    } catch (err: any) {
      expect(err.statusCode || err.status).toBe(422);
    }

    // 2. Positive test: Approve with valid server preview_token -> 200
    const validToken = issuePreviewToken({
      entityType: "game_level",
      id: lvl.id,
      version: 1,
      managerId: testManagerId,
    });

    const goodEvent = mockEvent(
      { type: "game_level", id: String(lvl.id) },
      {},
      {
        to_status: "approved",
        checklist: {
          pedagogy: true,
          content: true,
          language: true,
          imagery: true,
          safety: true,
          technical: true,
        },
        preview_token: validToken,
      }
    );

    const goodRes = (await transitionHandler(goodEvent)) as any;
    expect(goodRes.success).toBe(true);
    expect(goodRes.status).toBe("approved");
  });

  // --- 3. Review Decisions & Bulk Reject (BR-CRQ-03, D-KH) ---
  it("Task 3: POST /api/managers/content/review-queue/bulk-reject rejects author items and logs records (D-KH, BR-CRQ-03)", async () => {
    const db = getOwnerDb();
    const tpl = await ensureTemplate();
    const code = await getUniqueLevelCode("BLK");

    await db.insert(gameLevels).values({
      entityId: Math.floor(Math.random() * 800_000 + 100_000),
      code,
      contentVersion: 1,
      templateId: tpl.id,
      title: "Bulk Reject Target",
      contentPack: VALID_CONTENT_PACK,
      difficultyParams: {},
      accessTier: "free",
      status: "in_review",
      authoredIn: "studio",
      ageMin: 3,
      ageMax: 6,
      difficulty: 1,
      createdByManagerId: testManagerId,
    });

    const event = mockEvent(
      {},
      {},
      {
        created_by_manager_id: testManagerId,
        reason: "Nội dung sai mục tiêu sư phạm, yêu cầu soạn lại",
      }
    );

    const res = (await bulkRejectHandler(event)) as any;
    expect(res.success).toBe(true);
    expect(res.rejected_count).toBeGreaterThan(0);
  });

  // --- 4. Publish, Archive & Rollback (BR-PUB-01..08, D-KI) ---
  it("Task 4: Publish atomically archives existing published version (BR-PUB-02, D-KI)", async () => {
    const db = getOwnerDb();
    const tpl = await ensureTemplate();
    const code = await getUniqueLevelCode("PUB");

    // 1. v1 published
    const [v1] = await db
      .insert(gameLevels)
      .values({
        entityId: Math.floor(Math.random() * 800_000 + 100_000),
        code,
        contentVersion: 1,
        templateId: tpl.id,
        title: "Level V1 Published",
        contentPack: VALID_CONTENT_PACK,
        difficultyParams: {},
        accessTier: "free",
        status: "published",
        authoredIn: "studio",
        ageMin: 3,
        ageMax: 6,
        difficulty: 1,
      })
      .returning();

    await db.insert(contentSkillMap).values({
      entityType: "game_level",
      entityId: v1.id,
      skillId: testSkillId,
      weight: "1.0",
    });

    // 2. v2 approved
    const [v2] = await db
      .insert(gameLevels)
      .values({
        entityId: Math.floor(Math.random() * 800_000 + 100_000),
        code,
        contentVersion: 2,
        templateId: tpl.id,
        title: "Level V2 Approved",
        contentPack: VALID_CONTENT_PACK,
        difficultyParams: {},
        accessTier: "free",
        status: "approved",
        authoredIn: "studio",
        ageMin: 3,
        ageMax: 6,
        difficulty: 1,
      })
      .returning();

    await db.insert(contentSkillMap).values({
      entityType: "game_level",
      entityId: v2.id,
      skillId: testSkillId,
      weight: "1.0",
    });

    // 3. Publish v2
    const pubEvent = mockEvent(
      { type: "game_level", id: String(v2.id) },
      {},
      { to_status: "published" }
    );
    const pubRes = (await transitionHandler(pubEvent)) as any;
    expect(pubRes.status).toBe("published");

    // 4. Verify v1 is archived, v2 is published
    const [updatedV1] = await db
      .select()
      .from(gameLevels)
      .where(eq(gameLevels.id, v1.id));
    const [updatedV2] = await db
      .select()
      .from(gameLevels)
      .where(eq(gameLevels.id, v2.id));

    expect(updatedV1.status).toBe("archived");
    expect(updatedV2.status).toBe("published");
  });

  it("Task 4: content_reviewer cannot perform rollback (BR-PUB-03)", async () => {
    const db = getOwnerDb();
    const tpl = await ensureTemplate();
    const code = await getUniqueLevelCode("ROL");

    const [archivedLvl] = await db
      .insert(gameLevels)
      .values({
        entityId: Math.floor(Math.random() * 800_000 + 100_000),
        code,
        contentVersion: 1,
        templateId: tpl.id,
        title: "Archived Level",
        contentPack: VALID_CONTENT_PACK,
        difficultyParams: {},
        accessTier: "free",
        status: "archived",
        authoredIn: "studio",
        ageMin: 3,
        ageMax: 6,
        difficulty: 1,
      })
      .returning();

    // Rollback attempt with content_reviewer role -> 403
    const rollbackEvent = mockEvent(
      { type: "game_level", id: String(archivedLvl.id) },
      {},
      { to_status: "published" },
      "content_reviewer"
    );

    try {
      await transitionHandler(rollbackEvent);
      expect.fail("Should throw 403 INSUFFICIENT_ROLE");
    } catch (err: any) {
      expect(err.statusCode || err.status).toBe(403);
    }
  });

  it("Task 4: Archive level used in published curriculum returns 409 CONTENT_IN_USE (BR-PUB-05)", async () => {
    const db = getOwnerDb();
    const tpl = await ensureTemplate();
    const code = await getUniqueLevelCode("USE");

    const [lvl] = await db
      .insert(gameLevels)
      .values({
        entityId: Math.floor(Math.random() * 800_000 + 100_000),
        code,
        contentVersion: 1,
        templateId: tpl.id,
        title: "Level in Curriculum",
        contentPack: VALID_CONTENT_PACK,
        difficultyParams: {},
        accessTier: "free",
        status: "published",
        authoredIn: "studio",
        ageMin: 3,
        ageMax: 6,
        difficulty: 1,
      })
      .returning();

    const curCode = await getUniqueCurriculumCode();
    const [cur] = await db
      .insert(curricula)
      .values({
        entityId: Math.floor(Math.random() * 800_000 + 100_000),
        code: curCode,
        contentVersion: 1,
        title: "Chương Trình Mầm Non",
        accessTier: "free",
        status: "published",
      })
      .returning();

    await db.insert(curriculumItems).values({
      curriculumId: cur.id,
      weekNo: 1,
      sessionNo: 1,
      position: 1,
      entityType: "game_level",
      entityId: lvl.id,
    });

    const archiveEvent = mockEvent(
      { type: "game_level", id: String(lvl.id) },
      {},
      { to_status: "archived" }
    );

    try {
      await transitionHandler(archiveEvent);
      expect.fail("Should throw 409 CONTENT_IN_USE");
    } catch (err: any) {
      expect(err.statusCode || err.status).toBe(409);
    }
  });

  // --- 5. Version History (Task 5) ---
  it("Task 5: GET /api/managers/content/:type/:code/versions returns historical versions with play count and diffs", async () => {
    const db = getOwnerDb();
    const tpl = await ensureTemplate();
    const code = await getUniqueLevelCode("HST");

    const [lvl] = await db
      .insert(gameLevels)
      .values({
        entityId: Math.floor(Math.random() * 800_000 + 100_000),
        code,
        contentVersion: 1,
        templateId: tpl.id,
        title: "Version History Level",
        contentPack: VALID_CONTENT_PACK,
        difficultyParams: {},
        accessTier: "free",
        status: "published",
        ageMin: 3,
        ageMax: 6,
        difficulty: 1,
      })
      .returning();

    await db.insert(playSessions).values({
      sessionUuid: randomUUID(),
      guestDeviceId: "device-hist-123",
      gameLevelId: lvl.id,
      contentVersion: 1,
      templateId: tpl.id,
      status: "completed",
      completionStatus: "completed",
      accessTierAtStart: "free",
      startedAt: new Date(),
    });

    const event = mockEvent({ type: "game_level", code });
    const res = (await versionsHandler(event)) as any;

    expect(res.versions).toBeDefined();
    expect(res.versions.length).toBeGreaterThan(0);
    expect(res.versions[0].play_count).toBeGreaterThanOrEqual(1);
  });

  // --- 6. SEO Content Admin (BR-SEO-01..09, D-KL) ---
  it("Task 6: POST /api/managers/seo-pages creates SEO page and enforces legal slug prohibition (BR-SEO-09)", async () => {
    const badEvent = mockEvent(
      {},
      {},
      {
        slug: "terms",
        title: "Điều khoản",
        meta_description: "Trang điều khoản",
      }
    );

    try {
      await seoPagesPostHandler(badEvent);
      expect.fail("Should reject legal slug 'terms'");
    } catch (err: any) {
      expect(err.statusCode || err.status).toBe(422);
    }
  });

  it("Task 6: POST /api/managers/seo-pages rejects script injection with 422 (BR-SEO-02, D-KL)", async () => {
    const event = mockEvent(
      {},
      {},
      {
        slug: "tu-duy-toan-hoc-cho-tre",
        title: "Tư duy toán học",
        meta_description: "Mô tả chuẩn",
        body: "<p>Nội dung</p><script>alert(1)</script>",
      }
    );

    try {
      await seoPagesPostHandler(event);
      expect.fail("Should reject script in body");
    } catch (err: any) {
      expect(err.statusCode || err.status).toBe(422);
    }
  });

  it("Task 6: Changing slug of published SEO page triggers 301 redirect on guest access (BR-SEO-01)", async () => {
    const oldSlug = `toan-hoc-mam-non-${Date.now() % 9000}`;
    const newSlug = `phat-trien-tu-duy-${Date.now() % 9000}`;

    // 1. Create page
    const createEvt = mockEvent(
      {},
      {},
      {
        slug: oldSlug,
        page_type: "competency",
        title: "Toán Học Mầm Non",
        meta_description: "Phát triển tư duy cho trẻ 3-6 tuổi",
      }
    );
    const created = (await seoPagesPostHandler(createEvt)) as any;

    // 2. Publish page
    const db = getOwnerDb();
    await db
      .update(seoPages)
      .set({ status: "published" })
      .where(eq(seoPages.id, created.id));

    // 3. Patch with new slug
    const patchEvt = mockEvent(
      { slug: oldSlug, version: "1" },
      {},
      { new_slug: newSlug }
    );
    await seoPatchHandler(patchEvt);

    // 4. Guest access to old slug returns 301 redirect
    const guestEvt = mockGuestEvent({ slug: oldSlug });
    await guestSeoHandler(guestEvt);

    expect(guestEvt.node.res.statusCode).toBe(301);
  });

  it("Task 6: GET /api/managers/seo-pages/[slug]/preview generates structured data and snippet preview (BR-SEO-05, BR-SEO-06)", async () => {
    const slug = `tu-duy-khong-gian-${Date.now() % 9000}`;
    const createEvt = mockEvent(
      {},
      {},
      {
        slug,
        page_type: "competency",
        title: "Tư Duy Không Gian Cho Bé",
        meta_description: "Hướng dẫn hình học mầm non",
        faq_items: [{ q: "Bé mấy tuổi?", a: "Từ 3 tuổi." }],
      }
    );
    await seoPagesPostHandler(createEvt);

    const previewEvt = mockEvent({ slug });
    const preview = (await seoPreviewHandler(previewEvt)) as any;

    expect(preview.structured_data).toBeDefined();
    expect(preview.snippet_preview).toBeDefined();
    expect(preview.snippet_preview.url).toContain(slug);
  });

  it("Task 6: Curriculum appears in Review Queue and supports full lifecycle transition (BR-CRM-01..11, D-KK)", async () => {
    const db = getOwnerDb();
    const currCode = await getUniqueCurriculumCode();

    // 1. Insert draft curriculum
    const [cRow] = await db
      .insert(curricula)
      .values({
        entityId: Math.floor(Math.random() * 1_000_000) + 1,
        code: currCode,
        contentVersion: 1,
        programType: "age_based",
        durationWeeks: 8,
        sessionsPerWeek: 3,
        title: "Chương trình thử nghiệm duyệt",
        description: "Mô tả",
        accessTier: "standard",
        status: "in_review",
        authoredIn: "studio",
      })
      .returning();

    // 2. Fetch Review Queue with entity_type=curriculum
    const rqEvt = mockEvent({}, { entity_type: "curriculum" });
    const rqRes = (await reviewQueueHandler(rqEvt)) as any;
    const found = rqRes.items.find((i: any) => i.code === currCode);
    expect(found).toBeDefined();
    expect(found.entity_type).toBe("curriculum");

    // 3. Issue preview token
    const token = issuePreviewToken({
      entityType: "curriculum",
      id: cRow.id,
      version: 1,
      managerId: testManagerId,
    });

    // 4. Approve curriculum
    const approveEvt = mockEvent(
      { type: "curriculum", id: String(cRow.id) },
      {},
      {
        to_status: "approved",
        preview_token: token,
        checklist: {
          pedagogy: true,
          content: true,
          language: true,
          imagery: true,
          safety: true,
          technical: true,
        },
      }
    );
    const approveRes = (await transitionHandler(approveEvt)) as any;
    expect(approveRes.success).toBe(true);
    expect(approveRes.status).toBe("approved");
  });
});
