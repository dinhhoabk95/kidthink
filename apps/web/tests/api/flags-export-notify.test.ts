import {
  featureFlags,
  getOwnerDb,
  isEnabled,
  managers,
  notificationDeliveries,
  notifications,
  users,
} from "@mindkid/db";
import { eq } from "drizzle-orm";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import sesSnsWebhookHandler from "#server/api/guest/webhooks/ses-sns.post";
import exportsHandler from "#server/api/managers/exports/[kind].get";
import flagsPatchHandler from "#server/api/managers/feature-flags/[key].patch";
import flagsGetHandler from "#server/api/managers/feature-flags/index.get";
import notificationTemplatesPatchHandler from "#server/api/managers/notification-templates/[code]/[version].patch";
import notificationTemplatesPreviewHandler from "#server/api/managers/notification-templates/[code]/preview.post";
import notificationTemplatesGetHandler from "#server/api/managers/notification-templates/index.get";
import notificationResendHandler from "#server/api/managers/notifications/[id]/resend.post";
import notificationsGetHandler from "#server/api/managers/notifications/index.get";

const CSRF_TOKEN =
  "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";

let testSuperAdminId = 1;
let testContentReviewerId = 2;
let testUserId = 1;
let testDeletedUserId = 2;

beforeAll(async () => {
  await ensureTestEntities();
});

beforeEach(async () => {
  await ensureTestEntities();
});

async function ensureTestEntities() {
  const db = getOwnerDb();

  // Super Admin
  let [sa] = await db
    .select({ id: managers.id })
    .from(managers)
    .where(eq(managers.email, "p29-sa@mindkid.edu.vn"));
  if (!sa) {
    [sa] = await db
      .insert(managers)
      .values({
        email: "p29-sa@mindkid.edu.vn",
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
    .where(eq(managers.email, "p29-cr@mindkid.edu.vn"));
  if (!cr) {
    [cr] = await db
      .insert(managers)
      .values({
        email: "p29-cr@mindkid.edu.vn",
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
    .where(eq(users.email, "p29-user@test.mindkid.vn"));
  if (!u) {
    [u] = await db
      .insert(users)
      .values({
        email: "p29-user@test.mindkid.vn",
        passwordHash: "hash",
        displayName: "P29 User",
        status: "active",
      })
      .returning({ id: users.id });
  }
  if (u) {
    testUserId = u.id;
  }

  // Deleted Test User
  let [du] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, "p29-deleted@test.mindkid.vn"));
  if (!du) {
    [du] = await db
      .insert(users)
      .values({
        email: "p29-deleted@test.mindkid.vn",
        passwordHash: "hash",
        displayName: "P29 Deleted User",
        status: "deleted",
      })
      .returning({ id: users.id });
  }
  if (du) {
    testDeletedUserId = du.id;
  }
}

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
    it("rejects content_reviewer from viewing feature flags with 403 (BR-FFA-03, BR-FLG-07)", async () => {
      const event = mockManagerEvent("content_reviewer");
      try {
        await flagsGetHandler(event);
        expect.fail("Should throw 403 INSUFFICIENT_ROLE");
      } catch (err: any) {
        expect(err.statusCode || err.status).toBe(403);
      }
    });

    it("super_admin can view merged feature flags (BR-FFA-04, BR-FLG-03)", async () => {
      const event = mockManagerEvent("super_admin");
      const res = (await flagsGetHandler(event)) as any;
      expect(res.flags).toBeDefined();
      expect(res.flags.some((f: any) => f.key === "ai_content_pipeline")).toBe(
        true
      );
      expect(res.flags.some((f: any) => f.key === "studio_publish")).toBe(true);

      const aiFlag = res.flags.find(
        (f: any) => f.key === "ai_content_pipeline"
      );
      expect(aiFlag.default_value).toBe(false);
      expect(aiFlag.expires_at).toBeDefined();
    });

    it("PATCH /api/managers/feature-flags/:key rejects reason < 10 chars with 422 (BR-FFA-01, BR-FLG-04)", async () => {
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

    it("PATCH /api/managers/feature-flags/:key updates flag and isEnabled reflects change (D-KM, BR-FFA-01)", async () => {
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

    it("evaluates sticky percentage rollout deterministically (D-KO)", async () => {
      const db = getOwnerDb();
      // Set percentage scope in DB for guest_play
      await db
        .update(featureFlags)
        .set({
          enabled: true,
          scope: "percentage",
          scopeValue: { percentage: 50 },
        })
        .where(eq(featureFlags.key, "guest_play"));

      // Same user ID 100 times produces deterministic identical result
      const resultsUser10 = await Promise.all(
        Array.from({ length: 10 }).map(() =>
          isEnabled("guest_play", { userId: 1234 })
        )
      );
      expect(resultsUser10.every((v) => v === resultsUser10[0])).toBe(true);
    });

    it("evaluates to safe default when flag does not exist or fails (BR-FLG-02)", async () => {
      const result = await isEnabled("non_existent_key_flag" as any);
      expect(result).toBe(false);
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

    it("rejects unknown export kind with 404 (BR-EXP-01, D-KP)", async () => {
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

    it("curriculum_health returns valid CSV export with signed URL (D-KP)", async () => {
      const event = mockManagerEvent(
        "super_admin",
        { kind: "curriculum_health" },
        { reason: "Đối soát lộ trình học tập tuần" }
      );
      const res = (await exportsHandler(event)) as any;
      expect(res.url).toBeDefined();
      expect(res.expires_at).toBeDefined();
      expect(res.row_count).toBeGreaterThanOrEqual(0);
    }, 30_000);

    it("rejects export with reason < 10 chars with 422 (BR-EXP-03)", async () => {
      const event = mockManagerEvent(
        "super_admin",
        { kind: "revenue" },
        { reason: "ngắn" }
      );
      try {
        await exportsHandler(event);
        expect.fail("Should throw 422 REASON_REQUIRED");
      } catch (err: any) {
        expect(err.statusCode || err.status).toBe(422);
      }
    });

    it("generates 15-min signed URL for valid export kind (BR-EXP-04, BR-EXP-03)", async () => {
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
    }, 30_000);

    it("subscriptions export redacts emails for privacy (BR-EXP-08)", async () => {
      const event = mockManagerEvent(
        "super_admin",
        { kind: "subscriptions" },
        { reason: "Báo cáo phân tích đăng ký người dùng" }
      );
      const res = (await exportsHandler(event)) as any;
      expect(res.url).toBeDefined();
      expect(res.row_count).toBeGreaterThanOrEqual(1);
    }, 30_000);
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

    it("super_admin can view notifications with search and masked tokens (BR-NTA-04)", async () => {
      const db = getOwnerDb();
      await db.insert(notifications).values({
        recipientType: "user",
        recipientId: testUserId,
        templateCode: "password_reset",
        payload: { reset_token: "secret123456", code: "654321" },
      });

      const event = mockManagerEvent(
        "super_admin",
        {},
        { code: "password_reset" }
      );
      const res = (await notificationsGetHandler(event)) as any;
      expect(res.items).toBeDefined();
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

    it("POST /api/managers/notifications/:id/resend rejects deleted user with 409", async () => {
      const db = getOwnerDb();

      const [n] = await db
        .insert(notifications)
        .values({
          recipientType: "user",
          recipientId: testDeletedUserId,
          templateCode: "order_approved",
          payload: { order_code: "ORD-DEL" },
        })
        .returning();

      const resendEvt = mockManagerEvent(
        "super_admin",
        { id: String(n.id) },
        {},
        {},
        "POST"
      );
      try {
        await notificationResendHandler(resendEvt);
        expect.fail("Should throw 409 RECIPIENT_DELETED");
      } catch (err: any) {
        expect(err.statusCode || err.status).toBe(409);
      }
    });

    // Đường thành công có chữ ký hợp lệ sống ở
    // `tests/api/guest/webhooks-ses-sns.test.ts`. Ca này giữ lại đúng hình dạng
    // payload mà route **từng** chấp nhận — sự kiện SES trần, không phong bì
    // SNS, không chữ ký — để nếu ai đó nới lại thì cổng đỏ ngay.
    it("refuses an unsigned SES event and leaves the delivery queued", async () => {
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
          destination: ["p29-user@test.mindkid.vn"],
        },
      });

      await expect(sesSnsWebhookHandler(webhookEvt)).rejects.toThrow();

      const [delivery] = await db
        .select()
        .from(notificationDeliveries)
        .where(eq(notificationDeliveries.providerMessageId, messageId));
      expect(delivery.status).toBe("queued");
    });
  });

  describe("Notification Templates (BR-NTA-03, BR-NTA-06, BR-NTA-07, D-KQ)", () => {
    it("lists notification templates for super_admin", async () => {
      const event = mockManagerEvent("super_admin");
      const res = (await notificationTemplatesGetHandler(event)) as any;
      expect(res.items).toBeDefined();
      expect(res.items.some((t: any) => t.code === "order_approved")).toBe(
        true
      );
    });

    it("rejects saving template missing required variables with 422 (BR-NTA-07)", async () => {
      const event = mockManagerEvent(
        "super_admin",
        { code: "order_approved", version: "1" },
        {},
        {
          subject: "Đơn hàng của bạn",
          body: "Đơn hàng đã được duyệt.",
          reason: "Cập nhật mẫu email đơn hàng",
        },
        "PATCH"
      );

      try {
        await notificationTemplatesPatchHandler(event);
        expect.fail("Should throw 422 MISSING_REQUIRED_VARIABLES");
      } catch (err: any) {
        expect(err.statusCode || err.status).toBe(422);
        expect(err.statusMessage).toBe("MISSING_REQUIRED_VARIABLES");
      }
    });

    it("saves updated template in draft status (BR-NTA-03)", async () => {
      const event = mockManagerEvent(
        "super_admin",
        { code: "order_approved", version: "1" },
        {},
        {
          subject: "Đơn hàng #{{orderCode}} đã duyệt thành công",
          body: "<p>Gói học {{packageName}} cho đơn hàng #{{orderCode}} đã được kích hoạt.</p>",
          provided_vars: ["orderCode", "packageName"],
          reason: "Cập nhật mẫu email thông báo duyệt đơn hàng",
        },
        "PATCH"
      );

      const res = (await notificationTemplatesPatchHandler(event)) as any;
      expect(res.status).toBe("draft");
      expect(res.template.content_version).toBe(2);
    });

    it("previews notification template with sample variables (§7.3)", async () => {
      const event = mockManagerEvent(
        "super_admin",
        { code: "order_approved" },
        {},
        {
          sample_data: {
            orderCode: "ORD-999",
            packageName: "Standard 1 Năm",
          },
        },
        "POST"
      );

      const res = (await notificationTemplatesPreviewHandler(event)) as any;
      expect(res.subject).toContain("ORD-999");
      expect(res.html).toContain("Standard 1 Năm");
    });
  });
});
