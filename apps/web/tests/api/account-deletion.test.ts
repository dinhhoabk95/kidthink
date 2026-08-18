import { hardPurgeUser } from "@mindkid/db";
import { describe, expect, it } from "vitest";
import deleteAccountHandler from "../../server/api/users/account/delete.post";
import deleteSummaryHandler from "../../server/api/users/account/delete-summary.get";

function mockEvent(
  method: string,
  userId = 403,
  body: any = {},
  options: { reauthAt?: Date | null; sessionId?: string } = {}
) {
  const responseHeaders: Record<string, string> = {};
  const csrfToken = "c".repeat(64);
  return {
    method,
    node: {
      req: {
        headers: {
          "x-csrf-token": csrfToken,
          cookie: `tm_u_csrf=${csrfToken}`,
          "sec-fetch-site": "same-origin",
        },
        socket: {
          remoteAddress: "127.0.0.1",
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
        user_id: userId,
        display_name: "Deletion Test User",
        session_id: options.sessionId || `sess_${userId}`,
        reauth_at:
          options.reauthAt === undefined ? new Date() : options.reauthAt,
      },
      reauth_at: options.reauthAt === undefined ? new Date() : options.reauthAt,
      body,
    },
    _body: body,
  } as any;
}

describe("Task 6 — Account Deletion & Purge Lifecycle (BR-ADL-01..10)", () => {
  describe("GET /api/users/account/delete-summary (BR-ADL-07)", () => {
    it("returns specific lost data items and legally retained items", async () => {
      const event = mockEvent("GET", 403);
      const res = await deleteSummaryHandler(event);

      expect(res.grace_period_days).toBe(30);
      expect(res.lost_data_items.length).toBeGreaterThan(0);
      expect(res.retained_legal_items.length).toBeGreaterThan(0);

      // Verify specific legal mentions (Accounting, Decree 13, Cybersecurity)
      const legalText = res.retained_legal_items.join(" ");
      expect(legalText).toContain("Kế toán");
      expect(legalText).toContain("Nghị định 13/2023");
      expect(legalText).toContain("An ninh mạng");
    });
  });

  describe("POST /api/users/account/delete (BR-ADL-01, BR-ADL-03)", () => {
    it("BR-ADL-03: requires fresh reauthentication before submitting deletion", async () => {
      const event = mockEvent("POST", 403, {}, { reauthAt: null });

      try {
        await deleteAccountHandler(event);
        expect.fail("Should have thrown 428 REAUTH_REQUIRED");
      } catch (err: any) {
        expect(err.statusCode || err.status).toBe(428);
      }
    });
  });

  describe("Hard Purge Logic & Grace Period Retention (BR-ADL-01..05, BR-ADL-09, BR-ADL-10)", () => {
    it("BR-ADL-01: hard purge does NOTHING if 30-day grace period is still active", async () => {
      const mockDb: any = {};
      const scheduledPurge = new Date("2026-09-14T00:00:00Z");
      const currentDay29 = new Date("2026-09-13T23:59:59Z");

      const result = await hardPurgeUser(
        mockDb,
        403,
        currentDay29,
        scheduledPurge
      );
      expect(result.purged).toBe(false);
      expect(result.reason).toBe("RETENTION_PERIOD_ACTIVE");
    });
  });
});
