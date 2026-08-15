import {
  getOwnerDb,
  isEnabled,
  managers,
  notificationDeliveries,
  notifications,
  users,
} from "@kidthink/db";
import { eq } from "drizzle-orm";
import { beforeAll, describe, expect, it } from "vitest";
import sesSnsWebhookHandler from "../../server/api/guest/webhooks/ses-sns.post.js";
import exportsHandler from "../../server/api/managers/exports/[kind].get.js";
import flagsPatchHandler from "../../server/api/managers/feature-flags/[key].patch.js";
import flagsGetHandler from "../../server/api/managers/feature-flags/index.get.js";
import notificationResendHandler from "../../server/api/managers/notifications/[id]/resend.post.js";
import notificationsGetHandler from "../../server/api/managers/notifications/index.get.js";

const CSRF_TOKEN =
  "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";

let testSuperAdminId = 1;
let testContentReviewerId = 2;
let testUserId = 1;

beforeAll(async () => {
  const db = getOwnerDb();

  // Super Admin
  let [sa] = await db
    .select({ id: managers.id })
    .from(managers)
    .where(eq(managers.email, "p29-sa@kidthink.edu.vn"));
  if (!sa) {
    [sa] = await db
      .insert(managers)
      .values({
        email: "p29-sa@kidthink.edu.vn",
        passwordHash: "hash",
        displayName: "P29 Super Admin",
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
    .where(eq(managers.email, "p29-cr@kidthink.edu.vn"));
  if (!cr) {
    [cr] = await db
      .insert(managers)
      .values({
        email: "p29-cr@kidthink.edu.vn",
        passwordHash: "hash",
        displayName: "P29 Reviewer",
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
    .where(eq(users.email, "p29-user@test.kidthink.vn"));
  if (!u) {
    [u] = await db
      .insert(users)
      .values({
        email: "p29-user@test.kidthink.vn",
        passwordHash: "hash",
        displayName: "P29 User",
        status: "active",
      })
      .returning({ id: users.id });
  }
  if (u) {
    testUserId = u.id;
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
      },
    },
    context: {
      manager: {
        manager_id: managerId,
        display_name: `Manager ${role}`,
        session_id: "sess_p29_mgr",
        refresh_token_version: 1,
        role,
      },
      params,
      body,
    },
    _query: query,
    _body: body,
  } as any;
}

function mockWebhookEvent(body: unknown) {
  return {
    method: "POST",
    node: {
      req: {
        method: "POST",
        url: "/api/guest/webhooks/ses-sns",
        headers: {
          "user-agent": "Amazon Simple Notification Service Agent",
          "content-type": "application/json",
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

describe("Feature Flags, Data Export & Notification Admin (P2.9)", () => {
  describe("Feature Flags (BR-FFA-01 - BR-FFA-06, BR-FLG-01 - BR-FLG-07)", () => {
    it("rejects content_reviewer from viewing feature flags with 403 (BR-FFA-03)", async () => {
      const event = mockManagerEvent("content_reviewer");
      try {
        await flagsGetHandler(event);
        expect.fail("Should throw 403 INSUFFICIENT_ROLE");
      } catch (err: any) {
        expect(err.statusCode || err.status).toBe(403);
      }
    });

    it("super_admin can view merged feature flags", async () => {
      const event = mockManagerEvent("super_admin");
      const res = (await flagsGetHandler(event)) as any;
      expect(res.flags).toBeDefined();
      expect(res.flags.some((f: any) => f.key === "ai_content_pipeline")).toBe(
        true
      );
      expect(res.flags.some((f: any) => f.key === "studio_publish")).toBe(true);
    });

    it("PATCH /api/managers/feature-flags/:key rejects reason < 10 chars with 422 (BR-FFA-01)", async () => {
      const event = mockManagerEvent(
        "super_admin",
        { key: "ai_content_pipeline" },
        {},
        {
          enabled: true,
          reason: "ngắn",
        },
        "PATCH"
      );

      try {
        await flagsPatchHandler(event);
        expect.fail("Should throw 422 REASON_REQUIRED");
      } catch (err: any) {
        expect(err.statusCode || err.status).toBe(422);
      }
    });

    it("PATCH /api/managers/feature-flags/:key updates flag and isEnabled reflects change", async () => {
      const event = mockManagerEvent(
        "super_admin",
        { key: "ai_content_pipeline" },
        {},
        {
          enabled: true,
          scope: "global",
          reason: "Bật thử nghiệm pipeline AI cho đội ngũ biên tập",
        },
        "PATCH"
      );

      const res = (await flagsPatchHandler(event)) as any;
      expect(res.enabled).toBe(true);

      const enabled = await isEnabled("ai_content_pipeline");
      expect(enabled).toBe(true);
    });
  });

  describe("Data Export (BR-EXP-01 - BR-EXP-08)", () => {
    it("rejects content_reviewer with 403 (BR-EXP-06)", async () => {
      const event = mockManagerEvent(
        "content_reviewer",
        { kind: "revenue" },
        { reason: "Báo cáo doanh thu" }
      );
      try {
        await exportsHandler(event);
        expect.fail("Should throw 403 INSUFFICIENT_ROLE");
      } catch (err: any) {
        expect(err.statusCode || err.status).toBe(403);
      }
    });

    it("rejects unknown export kind with 404 (BR-EXP-01)", async () => {
      const event = mockManagerEvent(
        "super_admin",
        { kind: "arbitrary_sql_dump" },
        { reason: "Xuất dữ liệu lạ" }
      );
      try {
        await exportsHandler(event);
        expect.fail("Should throw 404 EXPORT_KIND_NOT_FOUND");
      } catch (err: any) {
        expect(err.statusCode || err.status).toBe(404);
      }
    });

    it("generates 15-min signed URL for valid export kind (BR-EXP-04)", async () => {
      const event = mockManagerEvent(
        "super_admin",
        { kind: "revenue" },
        { reason: "Đối soát kế toán tháng 8/2026" }
      );
      const res = (await exportsHandler(event)) as any;
      expect(res.url).toBeDefined();
      expect(res.url).toContain("expires=");
      expect(res.url).toContain("signature=");
      expect(res.expires_at).toBeDefined();
    });
  });

  describe("Notifications Admin & Resend (BR-NTA-01 - BR-NTA-05)", () => {
    it("rejects content_reviewer from notifications log with 403 (BR-NTA-05)", async () => {
      const event = mockManagerEvent("content_reviewer");
      try {
        await notificationsGetHandler(event);
        expect.fail("Should throw 403 INSUFFICIENT_ROLE");
      } catch (err: any) {
        expect(err.statusCode || err.status).toBe(403);
      }
    });

    it("POST /api/managers/notifications/:id/resend creates a NEW row (BR-NTA-01)", async () => {
      const db = getOwnerDb();

      // Create a failed notification
      const [n] = await db
        .insert(notifications)
        .values({
          recipientType: "user",
          recipientId: testUserId,
          templateCode: "order_approved",
          payload: { order_code: "ORD-123" },
        })
        .returning();

      await db.insert(notificationDeliveries).values({
        notificationId: n.id,
        channel: "email",
        status: "failed",
        error: "SMTP connection timeout",
      });

      const resendEvt = mockManagerEvent(
        "super_admin",
        { id: String(n.id) },
        {},
        {},
        "POST"
      );
      const res = (await notificationResendHandler(resendEvt)) as any;
      expect(res.success).toBe(true);
      expect(res.new_notification_id).toBeDefined();
      expect(res.new_notification_id).not.toBe(n.id);
    });

    it("handles SES SNS webhook events", async () => {
      const db = getOwnerDb();
      const messageId = `msg-ses-${Date.now()}`;

      const [n] = await db
        .insert(notifications)
        .values({
          recipientType: "user",
          recipientId: testUserId,
          templateCode: "welcome_user",
        })
        .returning();

      await db.insert(notificationDeliveries).values({
        notificationId: n.id,
        channel: "email",
        status: "queued",
        providerMessageId: messageId,
      });

      const webhookEvt = mockWebhookEvent({
        notificationType: "Delivery",
        mail: {
          messageId,
          destination: ["p29-user@test.kidthink.vn"],
        },
      });

      const res = (await sesSnsWebhookHandler(webhookEvt)) as any;
      expect(res.status).toBe("processed");

      const [delivery] = await db
        .select()
        .from(notificationDeliveries)
        .where(eq(notificationDeliveries.providerMessageId, messageId));
      expect(delivery.status).toBe("dispatched");
    });
  });
});
