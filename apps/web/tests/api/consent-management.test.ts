import { getOwnerDb, users } from "@kidthink/db";
import {
  CONSENT_POLICY_MAP,
  type ConsentType,
  validatePolicyVersionSummary,
} from "@kidthink/shared";
import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import getConsentsHandler from "../../server/api/users/consents/index.get";
import submitConsentHandler from "../../server/api/users/consents/index.post";
import withdrawConsentHandler from "../../server/api/users/consents/withdraw.post";
import { requireCurrentConsent } from "../../server/utils/consent-guard";

const DIH_VIOLATION_REGEX = /D-IH VIOLATION/;
const KEBAB_URL_REGEX = /^\/[a-z-]+$/;

function mockEvent(method: string, userId = 402, body: any = {}) {
  const responseHeaders: Record<string, string> = {};
  const csrfToken = "b".repeat(64);
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
        display_name: "Test Parent",
        session_id: `sess_${userId}`,
        refresh_token_version: 0,
      },
      body,
    },
    _body: body,
  } as any;
}

describe("Tasks 3 & 4 — Consent Management (BR-CSM-01..08, D-IH, D-II, D-IG)", () => {
  describe("D-IH: Mandatory summary_vi on All Policy Revisions", () => {
    it("ensures all consent types have non-empty summary_vi", () => {
      const types: ConsentType[] = ["terms", "privacy", "child_data"];
      for (const type of types) {
        const meta = CONSENT_POLICY_MAP[type];
        expect(meta.summaryVi).toBeDefined();
        expect(meta.summaryVi.trim().length).toBeGreaterThan(10);
        expect(() =>
          validatePolicyVersionSummary(type, meta.summaryVi)
        ).not.toThrow();
      }
    });

    it("D-IH negative: throws when summary_vi is missing or whitespace only", () => {
      expect(() => validatePolicyVersionSummary("terms", "")).toThrow(
        DIH_VIOLATION_REGEX
      );
      expect(() => validatePolicyVersionSummary("privacy", "   ")).toThrow(
        DIH_VIOLATION_REGEX
      );
    });
  });

  describe("GET /api/users/consents (BR-CSM-01, BR-CSM-03, BR-CSM-05)", () => {
    it("returns consent status with summary_vi and permanent links", async () => {
      const event = mockEvent("GET", 402);
      const res = await getConsentsHandler(event);

      expect(res.consents).toHaveLength(3);
      const types = res.consents.map((c) => c.consent_type);
      expect(types).toContain("terms");
      expect(types).toContain("privacy");
      expect(types).toContain("child_data");

      for (const c of res.consents) {
        expect(c.summary_vi).toBeDefined();
        expect(c.url).toMatch(KEBAB_URL_REGEX); // English kebab-case path
        expect(["active", "stale", "withdrawn", "unconsented"]).toContain(
          c.status
        );
      }
    });
  });

  describe("POST /api/users/consents (BR-CSM-01, BR-CSM-07)", () => {
    it("BR-CSM-01: rejects stale policy version submission with 409 CONSENT_VERSION_STALE", async () => {
      const event = mockEvent("POST", 402, {
        consent_type: "child_data",
        policy_version: "0.9", // Stale version
      });

      try {
        await submitConsentHandler(event);
        expect.fail("Should have rejected stale version");
      } catch (err: any) {
        expect(err.statusCode || err.status).toBe(409);
      }
    });

    it("records valid consent successfully", async () => {
      const db = getOwnerDb();
      const [u] = await db
        .insert(users)
        .values({
          email: `consent_user_${Date.now()}_${Math.random()}@kidthink.test`,
          passwordHash: "hash123",
          displayName: "Consent Tester",
        })
        .returning();

      try {
        const event = mockEvent("POST", u.id, {
          consent_type: "child_data",
          policy_version: CONSENT_POLICY_MAP.child_data.currentVersion,
        });

        const res = await submitConsentHandler(event);
        expect(res.ok).toBe(true);
        expect(res.consent_type).toBe("child_data");
      } finally {
        await db
          .delete(users)
          .where(eq(users.id, u.id))
          .catch(() => null);
      }
    });
  });

  describe("POST /api/users/consents/withdraw (BR-CSM-01, BR-CSM-06, BR-CSM-08, D-IG)", () => {
    it("BR-CSM-01: rejects terms or privacy withdrawal and directs to account deletion", async () => {
      const event = mockEvent("POST", 402, {
        consent_type: "terms",
        confirm: true,
      });

      try {
        await withdrawConsentHandler(event);
        expect.fail("Should have rejected terms withdrawal");
      } catch (err: any) {
        expect(err.statusCode || err.status).toBe(400);
        expect(err.data?.deletion_url).toBe("/me/settings/delete");
      }
    });

    it("BR-CSM-06 & BR-CSM-08: withdrawing child_data archives child profiles with 30-day grace period", async () => {
      const db = getOwnerDb();
      const [u] = await db
        .insert(users)
        .values({
          email: `consent_wd_user_${Date.now()}_${Math.random()}@kidthink.test`,
          passwordHash: "hash123",
          displayName: "Withdraw Tester",
        })
        .returning();

      try {
        const event = mockEvent("POST", u.id, {
          consent_type: "child_data",
          confirm: true,
        });

        const res = await withdrawConsentHandler(event);
        expect(res.status).toBe("withdrawn");
        expect(res.grace_period_days).toBe(30);
        expect(res.purge_at).toBeDefined();
      } finally {
        await db
          .delete(users)
          .where(eq(users.id, u.id))
          .catch(() => null);
      }
    });
  });

  describe("D-II: Consent Gating Only on Child Profile Creation", () => {
    it("requireCurrentConsent throws CONSENT_REQUIRED when user has not consented to current version", async () => {
      const unconsentedUserId = 999_999;
      await expect(
        requireCurrentConsent(unconsentedUserId, "child_data")
      ).rejects.toThrow();
    });
  });
});
