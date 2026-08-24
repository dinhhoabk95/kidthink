import {
  auditLogs,
  errorLogs,
  getOwnerDb,
  managers,
  users,
  writeAudit,
} from "@mindkid/db";
import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";
import clientErrorsPostHandler from "#server/api/guest/client-errors.post";
import auditLogsExportGetHandler from "#server/api/managers/audit-logs/export.get";
import auditLogsGetHandler from "#server/api/managers/audit-logs/index.get";
import errorLogsPatchHandler from "#server/api/managers/error-logs/[fingerprint].patch";
import errorLogsGetHandler from "#server/api/managers/error-logs/index.get";
import systemStatusGetHandler from "#server/api/managers/system/status.get";

const CSRF_TOKEN =
  "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";

let testSuperAdminId = 1;
let testContentReviewerId = 2;
let _testUserId = 1;

beforeEach(async () => {
  const db = getOwnerDb();

  // Super Admin
  let [sa] = await db
    .select({ id: managers.id })
    .from(managers)
    .where(eq(managers.email, "p210-sa@mindkid.edu.vn"));
  if (!sa) {
    [sa] = await db
      .insert(managers)
      .values({
        email: "p210-sa@mindkid.edu.vn",
        passwordHash: "hash",
        displayName: "P210 Super Admin",
        role: "super_admin",
        isActive: true,
      })
      .returning({ id: managers.id });
  }
  if (sa) {
    testSuperAdminId = sa.id;
  }

  // Content Reviewer
  let [cr] = await db
    .select({ id: managers.id })
    .from(managers)
    .where(eq(managers.email, "p210-cr@mindkid.edu.vn"));
  if (!cr) {
    [cr] = await db
      .insert(managers)
      .values({
        email: "p210-cr@mindkid.edu.vn",
        passwordHash: "hash",
        displayName: "P210 Reviewer",
        role: "content_reviewer",
        isActive: true,
      })
      .returning({ id: managers.id });
  }
  if (cr) {
    testContentReviewerId = cr.id;
  }

  // Test User
  let [u] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, "p210-user@test.mindkid.vn"));
  if (!u) {
    [u] = await db
      .insert(users)
      .values({
        email: "p210-user@test.mindkid.vn",
        passwordHash: "hash",
        displayName: "P210 User",
        status: "active",
      })
      .returning({ id: users.id });
  }
  if (u) {
    _testUserId = u.id;
  }
});

function mockManagerEvent(
  role: "super_admin" | "content_reviewer",
  params: Record<string, string> = {},
  query: Record<string, string> = {},
  body?: unknown,
  method = body ? "POST" : "GET"
) {
  const managerId =
    role === "super_admin" ? testSuperAdminId : testContentReviewerId;
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
        setHeader: () => {
          /* mock */
        },
      },
    },
    context: {
      manager: {
        manager_id: managerId,
        display_name: `Manager ${role}`,
        session_id: "sess_p210_mgr",
        role,
      },
      params,
      body,
    },
    _query: query,
    _body: body,
  } as any;
}

function mockClientEvent(body: unknown, ip = "127.0.0.1") {
  return {
    method: "POST",
    node: {
      req: {
        method: "POST",
        url: "/api/guest/client-errors",
        headers: {
          "user-agent": "TabletBrowser/1.0",
          "x-forwarded-for": ip,
        },
      },
      res: {},
    },
    context: {
      body,
    },
    _body: body,
  } as any;
}

describe("Log Viewers: Audit, Error, System Status (P2.10)", () => {
  describe("Audit Log Viewer (BR-ALV-01 - BR-ALV-07)", () => {
    it("rejects content_reviewer from audit logs with 403 (BR-ALV-02)", async () => {
      const event = mockManagerEvent("content_reviewer");
      try {
        await auditLogsGetHandler(event);
        expect.fail("Should throw 403 INSUFFICIENT_ROLE");
      } catch (err: any) {
        expect(err.statusCode || err.status).toBe(403);
      }
    });

    it("rejects date range > 90 days with 422 (BR-ALV-03)", async () => {
      const event = mockManagerEvent(
        "super_admin",
        {},
        {
          from: "2026-01-01",
          to: "2026-06-01", // ~150 days
        }
      );

      try {
        await auditLogsGetHandler(event);
        expect.fail("Should throw 422 TIME_RANGE_TOO_LARGE");
      } catch (err: any) {
        expect(err.statusCode || err.status).toBe(422);
      }
    });

    it("caps limit at 200 rows per request (BR-ALV-03)", async () => {
      const event = mockManagerEvent("super_admin", {}, { limit: "5000" });
      const res = (await auditLogsGetHandler(event)) as any;
      expect(res.limit).toBe(200);
      expect(res.items.length).toBeLessThanOrEqual(200);
    });

    it("returns formatted diff data for super_admin (BR-ALV-04)", async () => {
      const db = getOwnerDb();
      await writeAudit(db, {
        actor_type: "manager",
        actor_id: testSuperAdminId,
        action: "content_published",
        reason: "Xuất bản bài học tuần 1",
        entity_type: "lesson",
        entity_id: "LES-TEST-001",
        before_data: { status: "draft" },
        after_data: { status: "published" },
      });

      const event = mockManagerEvent(
        "super_admin",
        {},
        { entity_type: "lesson" }
      );
      const res = (await auditLogsGetHandler(event)) as any;
      expect(res.items).toBeDefined();
      expect(res.items.length).toBeGreaterThan(0);
      expect(res.items[0].before_data).toEqual({ status: "draft" });
      expect(res.items[0].after_data).toEqual({ status: "published" });
    });

    it("exports CSV and logs data_exported action (BR-ALV-06)", async () => {
      const event = mockManagerEvent(
        "super_admin",
        {},
        { reason: "Xuất dữ liệu kiểm toán định kỳ" }
      );
      const csvRes = (await auditLogsExportGetHandler(event)) as string;
      expect(typeof csvRes).toBe("string");
      expect(csvRes).toContain("ID,UUID,Thời gian");

      const db = getOwnerDb();
      const [exportedAudit] = await db
        .select()
        .from(auditLogs)
        .where(eq(auditLogs.action, "data_exported"))
        .orderBy(auditLogs.id);

      expect(exportedAudit).toBeDefined();
    });
  });

  describe("Error Log Viewer & Ingestion (BR-ELV-01 - BR-ELV-07)", () => {
    it("ingests client error and strips unauthorized context fields (BR-ELV-03)", async () => {
      const event = mockClientEvent({
        code: "ENGINE_RENDER_FAIL",
        message: "Canvas context lost during animation",
        fingerprint: "fp_engine_render_fail_001",
        context: {
          route: "/play/gameboard",
          app_version: "2.0.0",
          child_display_name: "Bé An", // Must be stripped! (BR-ELV-03)
          child_birth_year: 2021, // Must be stripped!
        },
      });

      const res = (await clientErrorsPostHandler(event)) as any;
      expect(res.status).toBe("accepted");

      const db = getOwnerDb();
      const [saved] = await db
        .select()
        .from(errorLogs)
        .where(eq(errorLogs.fingerprint, "fp_engine_render_fail_001"));

      expect(saved).toBeDefined();
      expect((saved.context as any)?.child_display_name).toBeUndefined();
      expect((saved.context as any)?.route).toBe("/play/gameboard");
    });

    it("rate limits client error reporting to 10/min/IP (BR-ELV-05)", async () => {
      const ip = "192.168.1.99";
      for (let i = 0; i < 10; i++) {
        const event = mockClientEvent(
          {
            code: "ENGINE_WARN",
            message: "Frame dropped",
            fingerprint: `fp_frame_drop_${i}`,
          },
          ip
        );
        await clientErrorsPostHandler(event);
      }

      const rateLimitEvent = mockClientEvent(
        {
          code: "ENGINE_WARN",
          message: "Frame dropped",
          fingerprint: "fp_frame_drop_11",
        },
        ip
      );

      try {
        await clientErrorsPostHandler(rateLimitEvent);
        expect.fail("Should throw 429 RATE_LIMIT_EXCEEDED");
      } catch (err: any) {
        expect(err.statusCode || err.status).toBe(429);
      }
    });

    it("groups errors by fingerprint and counts occurrences (BR-ELV-01, BR-ELV-02)", async () => {
      const event = mockManagerEvent("super_admin");
      const res = (await errorLogsGetHandler(event)) as any;
      expect(res.groups).toBeDefined();

      const group = res.groups.find(
        (g: any) => g.fingerprint === "fp_engine_render_fail_001"
      );
      expect(group).toBeDefined();
      expect(group.total_occurrences).toBeGreaterThanOrEqual(1);
    });

    it("PATCH /api/managers/error-logs/:fingerprint resolves error group (BR-ELV-07)", async () => {
      const event = mockManagerEvent(
        "super_admin",
        { fingerprint: "fp_engine_render_fail_001" },
        {},
        {
          status: "resolved",
          notes: "Đã khắc phục qua bản vá phục hồi WebGL context",
        },
        "PATCH"
      );

      const res = (await errorLogsPatchHandler(event)) as any;
      expect(res.success).toBe(true);
      expect(res.status).toBe("resolved");

      const db = getOwnerDb();
      const [updated] = await db
        .select()
        .from(errorLogs)
        .where(eq(errorLogs.fingerprint, "fp_engine_render_fail_001"));
      expect(updated.status).toBe("resolved");
    });
  });

  describe("System Activity & Health Status (BR-SYS-01 - BR-SYS-06)", () => {
    it("rejects content_reviewer with 403 (BR-SYS-05)", async () => {
      const event = mockManagerEvent("content_reviewer");
      try {
        await systemStatusGetHandler(event);
        expect.fail("Should throw 403 INSUFFICIENT_ROLE");
      } catch (err: any) {
        expect(err.statusCode || err.status).toBe(403);
      }
    });

    it("returns 4 system groups with runbook links and no secrets (BR-SYS-03, BR-SYS-04, D-KT)", async () => {
      const event = mockManagerEvent("super_admin");
      const res = (await systemStatusGetHandler(event)) as any;

      expect(res.as_of).toBeDefined();
      expect(res.services).toBeDefined();
      expect(["ok", "unknown", "bad"]).toContain(res.services.postgres.status);
      expect(res.services.postgres.runbook_url).toBeDefined();
      expect(res.jobs).toBeDefined();
      expect(["ok", "unknown", "bad"]).toContain(res.jobs.status);
      expect(res.backups).toBeDefined();
      expect(["ok", "unknown", "bad"]).toContain(res.backups.status);
      expect(res.errors).toBeDefined();
      expect(["ok", "unknown", "bad"]).toContain(res.errors.status);

      // BR-SYS-04: No connection strings, secret tokens, or env dumps
      const jsonStr = JSON.stringify(res);
      expect(jsonStr).not.toContain("postgres://");
      expect(jsonStr).not.toContain("SECRET");
      expect(jsonStr).not.toContain("PASSWORD");
    });
  });
});
