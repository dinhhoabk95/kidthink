import { InMemoryRedisClient, setAuthRedisClient } from "@mindkid/auth";
import { getOwnerDb, hardPurgeUser, users } from "@mindkid/db";
import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import deleteAccountHandler from "#server/api/users/account/delete.post";
import deleteSummaryHandler from "#server/api/users/account/delete-summary.get";
import {
  getUserAuth,
  resetBetterAuthInstancesForTests,
} from "#server/utils/better-auth";

function collectCookie(res: Response): string {
  return res.headers
    .getSetCookie()
    .map((raw) => raw.split(";")[0]?.trim() ?? "")
    .filter((pair) => pair.length > 0 && !pair.endsWith("="))
    .join("; ");
}

function mockEvent(
  method: string,
  userId = 403,
  body: Record<string, string | number | boolean> = {},
  options: { reauthAt?: Date | null; sessionId?: string } = {}
) {
  const responseHeaders: Record<string, string | string[]> = {};
  return {
    method,
    node: {
      req: {
        headers: {
          host: "localhost:3000",
          origin: "http://localhost:3000",
          "sec-fetch-site": "same-origin",
        },
        socket: {
          remoteAddress: "127.0.0.1",
        },
        url: "/",
        originalUrl: "/",
      },
      res: {
        setHeader: (name: string, value: string | string[]) => {
          responseHeaders[name.toLowerCase()] = value;
        },
        getHeader: (name: string) => responseHeaders[name.toLowerCase()],
        removeHeader: (name: string) => {
          delete responseHeaders[name.toLowerCase()];
        },
        appendHeader: (name: string, value: string) => {
          const current = responseHeaders[name.toLowerCase()];
          responseHeaders[name.toLowerCase()] = current
            ? [...(Array.isArray(current) ? current : [current]), value]
            : value;
        },
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

    it("BR-ADL-01: revokes all Redis sessions when account deletion is requested", async () => {
      setAuthRedisClient(new InMemoryRedisClient());
      resetBetterAuthInstancesForTests();

      const db = getOwnerDb();
      const email = `del-sess-${Date.now()}-${Math.floor(Math.random() * 10_000)}@example.com`;
      const password = "DeleteSessionPass123!";

      const signUpRes = await getUserAuth().handler(
        new Request("http://localhost:3000/api/auth/users/sign-up/email", {
          method: "POST",
          headers: {
            "content-type": "application/json",
            origin: "http://localhost:3000",
          },
          body: JSON.stringify({
            name: "Delete Session User",
            email,
            password,
            accept_terms: true,
            accept_privacy: true,
          }),
        })
      );
      expect(signUpRes.status).toBe(200);
      const sessionCookie = collectCookie(signUpRes);

      const [u] = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.email, email))
        .limit(1);
      if (!u) {
        throw new Error("Failed to insert test user");
      }

      const resolvedBefore = await getUserAuth().api.getSession({
        headers: new Headers({ cookie: sessionCookie }),
      });
      expect(Number(resolvedBefore?.user?.id)).toBe(u.id);

      const event = mockEvent(
        "POST",
        u.id,
        {},
        {
          reauthAt: new Date(),
          sessionId: String(resolvedBefore?.session?.id ?? "1"),
        }
      );
      const res = await deleteAccountHandler(event);
      expect(res.grace_period_days).toBe(30);

      const resolvedAfter = await getUserAuth().api.getSession({
        headers: new Headers({ cookie: sessionCookie }),
      });
      expect(resolvedAfter).toBeNull();
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
