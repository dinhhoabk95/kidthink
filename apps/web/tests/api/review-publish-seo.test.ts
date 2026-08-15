import { gameLevels, gameTemplates, getOwnerDb, managers } from "@kidthink/db";
import { eq } from "drizzle-orm";
import { beforeAll, describe, expect, it } from "vitest";
import transitionHandler from "../../server/api/managers/content/[type]/[id]/transition.post.js";
import bulkRejectHandler from "../../server/api/managers/content/review-queue/bulk-reject.post.js";
import reviewQueueHandler from "../../server/api/managers/content/review-queue/index.get.js";
import seoPreviewHandler from "../../server/api/managers/seo-pages/[slug]/preview.get.js";
import seoPagesPostHandler from "../../server/api/managers/seo-pages/index.post.js";

const CSRF_TOKEN =
  "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";

let testManagerId = 1;

beforeAll(async () => {
  const db = getOwnerDb();
  let [mgr] = await db
    .select({ id: managers.id })
    .from(managers)
    .where(eq(managers.email, "review-tester@kidthink.edu.vn"));
  if (!mgr) {
    [mgr] = await db
      .insert(managers)
      .values({
        email: "review-tester@kidthink.edu.vn",
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
});

function mockEvent(
  params: Record<string, string> = {},
  query: Record<string, string> = {},
  body?: unknown,
  role: "super_admin" | "content_reviewer" = "super_admin",
  method = body ? "POST" : "GET"
) {
  const queryString = new URLSearchParams(query).toString();
  const url = queryString ? `/api/test?${queryString}` : "/api/test";

  return {
    method,
    node: {
      req: {
        method,
        url,
        headers: {
          "user-agent": "VitestTestRunner/1.0",
          "x-csrf-token": CSRF_TOKEN,
          cookie: `tm_m_csrf=${CSRF_TOKEN}`,
        },
      },
      res: {
        statusCode: 200,
      },
    },
    context: {
      manager: {
        manager_id: testManagerId,
        display_name: "Review Tester Manager",
        session_id: "sess_rev_123",
        refresh_token_version: 1,
        role,
      },
      params,
    },
    _body: body,
  } as any;
}

describe("Content Review, Publish & SEO Admin APIs (P2.8, BR-CRQ-*, BR-PUB-*, BR-SEO-*)", () => {
  it("GET /api/managers/content/review-queue returns queued in_review items", async () => {
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
          nameVi: "GT001",
          mechanic: "tap-select",
          layouts: ["grid"],
          ageMin: 3,
          ageMax: 6,
        })
        .returning();
    }

    const uniqueCode = `GL-C1-CNT-REV-${(1000 + (Date.now() % 8999)).toString()}`;
    await db.insert(gameLevels).values({
      entityId: Date.now() + 100,
      code: uniqueCode,
      contentVersion: 1,
      templateId: tpl.id,
      titleVi: "Review Queue Test Level",
      contentPack: { prompt: "Test prompt" },
      difficultyParams: {},
      accessTier: "free",
      status: "in_review",
      authoredIn: "studio",
      createdByManagerId: testManagerId,
    });

    const event = mockEvent({}, { entity_type: "game_level" });
    const res = (await reviewQueueHandler(event)) as any;
    expect(res.items).toBeDefined();
    expect(res.items.some((i: any) => i.code === uniqueCode)).toBe(true);
  });

  it("POST /api/managers/content/review-queue/bulk-reject rejects reason < 10 chars with 422 (BR-CRQ-03)", async () => {
    const event = mockEvent(
      {},
      {},
      {
        created_by_manager_id: testManagerId,
        reason: "quá ngắn",
      }
    );

    try {
      await bulkRejectHandler(event);
      expect.fail("Should throw 422 REJECTED_REASON_TOO_SHORT");
    } catch (err: any) {
      expect(err.statusCode || err.status).toBe(422);
    }
  });

  it("POST /api/managers/content/review-queue/bulk-reject rejects author items and logs records", async () => {
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
          nameVi: "GT001",
          mechanic: "tap-select",
          layouts: ["grid"],
          ageMin: 3,
          ageMax: 6,
        })
        .returning();
    }

    const uniqueCode = `GL-C1-CNT-BLK-${(1000 + (Date.now() % 8999)).toString()}`;
    await db.insert(gameLevels).values({
      entityId: Date.now() + 200,
      code: uniqueCode,
      contentVersion: 1,
      templateId: tpl.id,
      titleVi: "Bulk Reject Test Level",
      contentPack: { prompt: "Test prompt" },
      difficultyParams: {},
      accessTier: "free",
      status: "in_review",
      authoredIn: "studio",
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

  it("POST /api/managers/content/:type/:id/transition requires 6-group checklist for approval (BR-CRQ-07)", async () => {
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
          nameVi: "GT001",
          mechanic: "tap-select",
          layouts: ["grid"],
          ageMin: 3,
          ageMax: 6,
        })
        .returning();
    }

    const uniqueCode = `GL-C1-CNT-CHK-${(1000 + (Date.now() % 8999)).toString()}`;
    const [lvl] = await db
      .insert(gameLevels)
      .values({
        entityId: Date.now() + 300,
        code: uniqueCode,
        contentVersion: 1,
        templateId: tpl.id,
        titleVi: "Checklist Transition Level",
        contentPack: { prompt: "Test prompt" },
        difficultyParams: {},
        accessTier: "free",
        status: "in_review",
        authoredIn: "studio",
        createdByManagerId: testManagerId,
      })
      .returning();

    // 1. Incomplete checklist -> 422
    const badEvent = mockEvent(
      { type: "game_level", id: String(lvl.id) },
      {},
      {
        to_status: "approved",
        checklist: { pedagogy: true, content: true }, // missing 4 groups
      }
    );

    try {
      await transitionHandler(badEvent);
      expect.fail("Should throw 422 for incomplete checklist");
    } catch (err: any) {
      expect(err.statusCode || err.status).toBe(422);
    }

    // 2. Complete 6-group checklist -> 200 approved
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
      }
    );

    const goodRes = (await transitionHandler(goodEvent)) as any;
    expect(goodRes.success).toBe(true);
    expect(goodRes.status).toBe("approved");
  });

  it("POST /api/managers/seo-pages rejects legal slugs with 422 (BR-SEO-09)", async () => {
    const event = mockEvent(
      {},
      {},
      {
        slug: "terms",
        title: "Điều khoản",
        meta_description: "Trang điều khoản",
      }
    );

    try {
      await seoPagesPostHandler(event);
      expect.fail("Should reject legal slug 'terms'");
    } catch (err: any) {
      expect(err.statusCode || err.status).toBe(422);
    }
  });

  it("POST /api/managers/seo-pages rejects script injection with 422 (BR-SEO-02)", async () => {
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

  it("POST /api/managers/seo-pages creates SEO page and generates structured data in preview (BR-SEO-06)", async () => {
    const slug = `tu-duy-hinh-hoc-${Date.now().toString().slice(-4)}`;
    const createEvt = mockEvent(
      {},
      {},
      {
        slug,
        page_type: "competency",
        title: "Phát triển tư duy không gian cho trẻ mầm non",
        meta_description:
          "Hướng dẫn phát triển tư duy hình học và không gian cho trẻ từ 3 đến 6 tuổi.",
        faq_items: [
          {
            q: "Trẻ mấy tuổi học hình học?",
            a: "Trẻ có thể bắt đầu từ 3 tuổi.",
          },
        ],
      }
    );

    const created = (await seoPagesPostHandler(createEvt)) as any;
    expect(created.id).toBeDefined();
    expect(created.slug).toBe(slug);

    const previewEvt = mockEvent({ slug });
    const preview = (await seoPreviewHandler(previewEvt)) as any;
    expect(preview.title).toBe(created.title);
    expect(preview.structured_data).toBeDefined();
    expect(
      preview.structured_data.some((s: any) => s["@type"] === "Course")
    ).toBe(true);
    expect(
      preview.structured_data.some((s: any) => s["@type"] === "FAQPage")
    ).toBe(true);
  });
});
