import {
  entitlementKeys,
  entitlements,
  exportJobs,
  getOwnerDb,
  personalCurricula,
  personalCurriculumItems,
  users,
} from "@mindkid/db";
import { MONTHLY_PDF_EXPORT_QUOTA, processPdfRenderJob } from "@mindkid/export";
import { ENTITLEMENT_KEYS } from "@mindkid/shared";
import { beforeEach, describe, expect, it } from "vitest";
import getExportStatusHandler from "#server/api/users/exports/[uuid].get";
import postExportHandler from "#server/api/users/exports/index.post";
import { invalidateUserEntitlementsCache } from "#server/utils/entitlements-runtime";

function makeUserEvent(
  userId: number,
  routerParams: Record<string, string> = {},
  body?: Record<string, unknown>,
  method?: string
) {
  const resolvedMethod = method || (body ? "POST" : "GET");
  const csrfToken = "a".repeat(64);
  const responseHeaders: Record<string, string> = {};
  return {
    method: resolvedMethod,
    node: {
      req: {
        method: resolvedMethod,
        socket: { remoteAddress: "127.0.0.1" },
        headers: {
          "x-csrf-token": csrfToken,
          cookie: `tm_u_csrf=${csrfToken}`,
          "sec-fetch-site": "same-origin",
        },
        url: "/",
        originalUrl: "/",
      },
      res: {
        setHeader: (name: string, value: string) => {
          responseHeaders[name.toLowerCase()] = value;
        },
        getHeader: (name: string) => responseHeaders[name.toLowerCase()],
        statusCode: 200,
      },
    },
    context: {
      user: {
        user_id: String(userId),
        display_name: "Teacher User",
      },
      params: routerParams,
    },
    _body: body,
  } as any;
}

describe("Task P4.2 — PDF Export API (BR-PDF-01..09)", () => {
  const db = getOwnerDb();
  let user1Id: number;
  let user2Id: number;
  let plan1Uuid: string;

  beforeEach(async () => {
    const [u1] = await db
      .insert(users)
      .values({
        email: `u1-export-${Date.now()}@example.com`,
        passwordHash: "hash1",
        displayName: "Teacher U1",
      })
      .returning();
    user1Id = u1.id;

    const [u2] = await db
      .insert(users)
      .values({
        email: `u2-export-${Date.now()}@example.com`,
        passwordHash: "hash2",
        displayName: "Teacher U2",
      })
      .returning();
    user2Id = u2.id;

    invalidateUserEntitlementsCache(user1Id);
    invalidateUserEntitlementsCache(user2Id);
    for (const k of ENTITLEMENT_KEYS) {
      await db
        .insert(entitlementKeys)
        .values({
          key: k.key,
          group: k.group as any,
          label: k.label,
          isMvp: k.is_mvp,
        })
        .onConflictDoNothing();
    }

    // Grant u1 entitlements (create_custom_curriculum, export_pdf)
    await db.insert(entitlements).values([
      {
        userId: user1Id,
        entitlementKey: "create_custom_curriculum",
        source: "manual_grant",
        status: "active",
      },
      {
        userId: user1Id,
        entitlementKey: "export_pdf",
        source: "manual_grant",
        status: "active",
      },
    ]);

    // Create a personal curriculum for u1
    const [plan] = await db
      .insert(personalCurricula)
      .values({
        userId: user1Id,
        title: "Lộ trình xuất PDF kiểm thử",
        ageMin: 4,
        ageMax: 5,
        durationWeeks: 4,
        sessionsPerWeek: 3,
        version: 1,
      })
      .returning();
    plan1Uuid = plan.uuid;

    await db.insert(personalCurriculumItems).values({
      personalCurriculumId: plan.id,
      weekNo: 1,
      sessionNo: 1,
      position: 1,
      entityType: "game_level",
      entityId: 1,
      isRequired: true,
    });
  });

  it("[BR-PDF-01] POST /api/users/exports trả về 202 Accepted và tạo queued job", async () => {
    const event = makeUserEvent(
      user1Id,
      {},
      {
        kind: "curriculum_plan",
        ref_id: plan1Uuid,
      }
    );

    const res = await postExportHandler(event);
    expect(event.node.res.statusCode).toBe(202);
    expect(res.job_uuid).toBeDefined();
    expect(res.status).toBe("queued");
  });

  it("[BR-PDF-02] POST /api/users/exports trả về 403 khi chưa có entitlement export_pdf", async () => {
    // User 2 has no entitlements
    const event = makeUserEvent(
      user2Id,
      {},
      {
        kind: "curriculum_plan",
        ref_id: plan1Uuid,
      }
    );

    let error: any;
    try {
      await postExportHandler(event);
    } catch (e) {
      error = e;
    }
    expect(error).toBeDefined();
    expect(error.statusCode).toBe(403);
  });

  it("[BR-PDF-02] POST /api/users/exports trả về 402 khi vượt quota 20 lượt xuất/tháng", async () => {
    // Seed 20 completed export jobs
    for (let i = 0; i < MONTHLY_PDF_EXPORT_QUOTA; i++) {
      await db.insert(exportJobs).values({
        userId: user1Id,
        kind: "curriculum_plan",
        refId: plan1Uuid,
        status: "done",
        pageCount: 1,
        createdAt: new Date(),
      });
    }

    const event = makeUserEvent(
      user1Id,
      {},
      {
        kind: "curriculum_plan",
        ref_id: plan1Uuid,
      }
    );

    let error: any;
    try {
      await postExportHandler(event);
    } catch (e) {
      error = e;
    }
    expect(error).toBeDefined();
    expect(error.statusCode).toBe(402);
  });

  it("[BR-PDF-03] GET /api/users/exports/:uuid trả về trạng thái và signed URL khi done", async () => {
    const postEvent = makeUserEvent(
      user1Id,
      {},
      {
        kind: "curriculum_plan",
        ref_id: plan1Uuid,
      }
    );
    const postRes = await postExportHandler(postEvent);
    const jobUuid = postRes.job_uuid;

    // Run worker process
    await processPdfRenderJob(jobUuid);

    // Query status
    const getEvent = makeUserEvent(user1Id, { uuid: jobUuid });
    const getRes = await getExportStatusHandler(getEvent);

    expect(getRes.uuid).toBe(jobUuid);
    expect(getRes.status).toBe("done");
    expect(getRes.page_count).toBeGreaterThanOrEqual(1);
    expect(getRes.download_url).toBeDefined();
    expect(getRes.download_url).toContain("/private/exports%2F");
  });

  it("[BR-PDF-03] GET /api/users/exports/:uuid bảo vệ IDOR trả về 404 khi truy cập job của user khác", async () => {
    const postEvent = makeUserEvent(
      user1Id,
      {},
      {
        kind: "curriculum_plan",
        ref_id: plan1Uuid,
      }
    );
    const postRes = await postExportHandler(postEvent);
    const jobUuid = postRes.job_uuid;

    // User 2 queries User 1's job -> 404 NOT_FOUND
    const getEvent = makeUserEvent(user2Id, { uuid: jobUuid });
    let error: any;
    try {
      await getExportStatusHandler(getEvent);
    } catch (e) {
      error = e;
    }
    expect(error).toBeDefined();
    expect(error.statusCode).toBe(404);
  });
});
