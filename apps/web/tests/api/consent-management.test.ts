import {
  auditLogs,
  consentLogs,
  consentRequirements,
  getOwnerDb,
  managers,
  users,
} from "@kidthink/db";
import { CONSENT_POLICY_MAP, type ConsentType } from "@kidthink/shared";
import { and, eq } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";
import getGuestConsentRequirementsHandler from "../../server/api/guest/consent-requirements/index.get";
import forceReconsentHandler from "../../server/api/managers/legal-consent-forces/index.post";
import getManagerConsentsHandler from "../../server/api/managers/legal-consents/index.get";
import getConsentsHandler from "../../server/api/users/consents/index.get";
import submitConsentHandler from "../../server/api/users/consents/index.post";
import withdrawConsentHandler from "../../server/api/users/consents/withdraw.post";
import dataExportHandler from "../../server/api/users/data-export/index.get";
import {
  assertUserTermsAndPrivacyConsent,
  isAllowedConsentExemptPath,
} from "../../server/utils/consent-guard";

const KEBAB_URL_REGEX = /^\/[a-z-]+$/;

function mockEvent(
  method: string,
  userId = 402,
  body: any = {},
  options: {
    reauthAt?: Date | null;
    isManager?: boolean;
    managerId?: number;
  } = {}
) {
  const responseHeaders: Record<string, string> = {};
  const csrfToken = "b".repeat(64);
  const now = new Date();
  const reauth = options.reauthAt === undefined ? now : options.reauthAt;

  const event: any = {
    method,
    node: {
      req: {
        headers: {
          "x-csrf-token": csrfToken,
          cookie: `tm_u_csrf=${csrfToken}; tm_m_csrf=${csrfToken}`,
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
    context: {},
    _body: body,
  };

  if (options.isManager) {
    const managerId = options.managerId || 101;
    event.context.manager = {
      manager_id: managerId,
      display_name: "Super Admin Tester",
      session_id: `sess_manager_${managerId}`,
      refresh_token_version: 1,
      role: "super_admin",
      reauth_at: reauth,
    };
    event.context.superadmin = event.context.manager;
  } else {
    event.context.user = {
      user_id: userId,
      display_name: "Test Parent",
      session_id: `sess_${userId}`,
      refresh_token_version: 0,
      reauth_at: reauth,
    };
  }

  event.context.reauth_at = reauth;
  event.context.body = body;

  return event;
}

describe("Consent Management — P1.14 & D12 (D-QV, D-QW, D-QX, D-QY, D-QZ)", () => {
  beforeEach(async () => {
    const db = getOwnerDb();
    await db.delete(consentRequirements);
  });

  describe("1. Singleton Consent Policy Map (D-QV)", () => {
    it("ensures all 3 consent types have title_vi and valid permanent slug", () => {
      const types: ConsentType[] = ["terms", "privacy", "child_data"];
      for (const type of types) {
        const meta = CONSENT_POLICY_MAP[type];
        expect(meta.titleVi).toBeDefined();
        expect(meta.slug).toBeDefined();
        expect(`/${meta.slug}`).toMatch(KEBAB_URL_REGEX);
        expect((meta as any).currentVersion).toBeUndefined();
      }
    });
  });

  describe("2. Public Guest Consent Requirements (D-QW, D-QZ)", () => {
    it("GET /api/guest/consent-requirements returns terms and privacy markers", async () => {
      const event = mockEvent("GET");
      const res = await getGuestConsentRequirementsHandler(event);

      expect(res).toHaveProperty("terms");
      expect(res).toHaveProperty("privacy");
      expect(res.terms).toHaveProperty("requirement_at");
      expect(res.privacy).toHaveProperty("requirement_at");
    });
  });

  describe("3. User Consents & Atomic Marker Acceptance (D-QW, D-QY, D-QZ)", () => {
    it("GET /api/users/consents returns 3 singletons with active/required status", async () => {
      const db = getOwnerDb();
      const [u] = await db
        .insert(users)
        .values({
          email: `get_consents_${Date.now()}_${Math.random()}@kidthink.test`,
          passwordHash: "hash123",
          displayName: "Get Consents Tester",
        })
        .returning();

      try {
        const event = mockEvent("GET", u.id);
        const res = await getConsentsHandler(event);

        expect(res.consents).toHaveLength(3);
        const types = res.consents.map((c) => c.consent_type);
        expect(types).toEqual(
          expect.arrayContaining(["terms", "privacy", "child_data"])
        );

        for (const c of res.consents) {
          expect(c.title_vi).toBeDefined();
          expect(c.document_url).toMatch(KEBAB_URL_REGEX);
          expect(["active", "required", "withdrawn"]).toContain(c.status);
        }
      } finally {
        await db
          .delete(users)
          .where(eq(users.id, u.id))
          .catch(() => null);
      }
    });

    it("POST /api/users/consents records accepted log", async () => {
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
          accept: true,
        });

        const res = await submitConsentHandler(event);
        expect(res.consent_type).toBe("child_data");
        expect(res.status).toBe("active");
        expect(res.accepted_at).toBeDefined();

        // Verify DB log is INSERT-only with action: 'accepted'
        const logs = await db
          .select()
          .from(consentLogs)
          .where(eq(consentLogs.userId, u.id));
        expect(logs).toHaveLength(1);
        expect(logs[0].action).toBe("accepted");
        expect(logs[0].consentType).toBe("child_data");
      } finally {
        await db
          .delete(users)
          .where(eq(users.id, u.id))
          .catch(() => null);
      }
    });

    it("POST /api/users/consents throws 409 CONSENT_REQUIREMENT_CHANGED on stale marker (D-QY)", async () => {
      const db = getOwnerDb();
      const [u] = await db
        .insert(users)
        .values({
          email: `consent_stale_${Date.now()}_${Math.random()}@kidthink.test`,
          passwordHash: "hash123",
          displayName: "Stale Marker Tester",
        })
        .returning();

      try {
        const event = mockEvent("POST", u.id, {
          consent_type: "terms",
          requirement_at: "2020-01-01T00:00:00.000Z", // Stale client timestamp
          accept: true,
        });

        await expect(submitConsentHandler(event)).rejects.toThrow();
      } finally {
        await db
          .delete(users)
          .where(eq(users.id, u.id))
          .catch(() => null);
      }
    });
  });

  describe("4. Superadmin Force Re-Consent & Audit Log (D-QW, D-QZ)", () => {
    it("POST /api/managers/legal-consent-forces updates requirement and writes audit log", async () => {
      const db = getOwnerDb();
      const [m] = await db
        .insert(managers)
        .values({
          email: `super_admin_${Date.now()}_${Math.random()}@kidthink.test`,
          passwordHash: "adminhash",
          displayName: "Super Admin Tester",
          role: "super_admin",
        })
        .returning();

      const [u] = await db
        .insert(users)
        .values({
          email: `forced_user_${Date.now()}_${Math.random()}@kidthink.test`,
          passwordHash: "hash123",
          displayName: "Forced User Tester",
        })
        .returning();

      try {
        // User accepts terms first
        await submitConsentHandler(
          mockEvent("POST", u.id, { consent_type: "terms", accept: true })
        );

        // Before force, user terms status is active
        const beforeRes = await getConsentsHandler(mockEvent("GET", u.id));
        const termsBefore = beforeRes.consents.find(
          (c) => c.consent_type === "terms"
        );
        expect(termsBefore?.status).toBe("active");

        // Superadmin forces re-consent on terms
        const forceEvent = mockEvent(
          "POST",
          undefined,
          {
            consent_type: "terms",
            notice_vi: "Cập nhật điều khoản thanh toán mới 2026",
            reason: "Quy định pháp lý mới",
          },
          { isManager: true, managerId: m.id }
        );

        const forceRes = await forceReconsentHandler(forceEvent);
        expect(forceRes.consent_type).toBe("terms");
        expect(forceRes.reconsent_required_at).toBeDefined();

        // Check audit log was written
        const audits = await db
          .select()
          .from(auditLogs)
          .where(
            and(
              eq(auditLogs.actorId, m.id),
              eq(auditLogs.action, "legal_reconsent_forced")
            )
          );
        expect(audits.length).toBeGreaterThanOrEqual(1);
        expect(audits[0].action).toBe("legal_reconsent_forced");

        // After force, user terms status becomes required!
        const afterRes = await getConsentsHandler(mockEvent("GET", u.id));
        const termsAfter = afterRes.consents.find(
          (c) => c.consent_type === "terms"
        );
        expect(termsAfter?.status).toBe("required");
        expect(termsAfter?.notice_vi).toBe(
          "Cập nhật điều khoản thanh toán mới 2026"
        );

        // Gated check throws 428
        await expect(assertUserTermsAndPrivacyConsent(u.id)).rejects.toThrow();

        // User re-consents with the new requirement marker
        const reconsentRes = await submitConsentHandler(
          mockEvent("POST", u.id, {
            consent_type: "terms",
            requirement_at: forceRes.reconsent_required_at,
            accept: true,
          })
        );
        expect(reconsentRes.status).toBe("active");

        // Now terms status is active again
        const recoveredRes = await getConsentsHandler(mockEvent("GET", u.id));
        const termsRecovered = recoveredRes.consents.find(
          (c) => c.consent_type === "terms"
        );
        expect(termsRecovered?.status).toBe("active");
      } finally {
        await db
          .delete(users)
          .where(eq(users.id, u.id))
          .catch(() => null);
        await db
          .delete(managers)
          .where(eq(managers.id, m.id))
          .catch(() => null);
      }
    });

    it("GET /api/managers/legal-consents lists all requirements", async () => {
      const event = mockEvent("GET", undefined, {}, { isManager: true });
      const res = await getManagerConsentsHandler(event);
      expect(res.requirements).toHaveLength(3);
    });
  });

  describe("5. Closed Allow-List Gating & Data Export (D-QX)", () => {
    it("isAllowedConsentExemptPath allows data-rights and auth routes", () => {
      expect(isAllowedConsentExemptPath("/api/users/consents")).toBe(true);
      expect(isAllowedConsentExemptPath("/api/users/consents/withdraw")).toBe(
        true
      );
      expect(isAllowedConsentExemptPath("/api/users/auth/reauth")).toBe(true);
      expect(isAllowedConsentExemptPath("/api/users/auth/logout")).toBe(true);
      expect(isAllowedConsentExemptPath("/api/users/auth/me")).toBe(true);
      expect(isAllowedConsentExemptPath("/api/users/data-export")).toBe(true);
      expect(isAllowedConsentExemptPath("/api/users/account/delete")).toBe(
        true
      );
      expect(
        isAllowedConsentExemptPath("/api/users/account/delete/cancel")
      ).toBe(true);

      // Product routes blocked
      expect(isAllowedConsentExemptPath("/api/users/children")).toBe(false);
      expect(isAllowedConsentExemptPath("/api/users/play-sessions")).toBe(
        false
      );
      expect(isAllowedConsentExemptPath("/api/users/levels")).toBe(false);
    });

    it("GET /api/users/data-export returns user data JSON export (D-QX)", async () => {
      const db = getOwnerDb();
      const [u] = await db
        .insert(users)
        .values({
          email: `export_user_${Date.now()}_${Math.random()}@kidthink.test`,
          passwordHash: "hash123",
          displayName: "Export Tester",
        })
        .returning();

      try {
        const event = mockEvent("GET", u.id);
        const res = await dataExportHandler(event);

        expect(res).toHaveProperty("exported_at");
        expect(res).toHaveProperty("user");
        expect(res.user.email).toBe(u.email);
        expect(res).toHaveProperty("child_profiles");
        expect(res).toHaveProperty("consents");
      } finally {
        await db
          .delete(users)
          .where(eq(users.id, u.id))
          .catch(() => null);
      }
    });
  });

  describe("6. Consent Withdrawal (BR-CSM-01, BR-CSM-06, BR-CSM-08, D-IG)", () => {
    it("POST /api/users/consents/withdraw requires reauth", async () => {
      const event = mockEvent(
        "POST",
        402,
        { consent_type: "child_data", confirm: true },
        { reauthAt: null }
      );
      await expect(withdrawConsentHandler(event)).rejects.toThrow();
    });

    it("terms withdrawal directs to account deletion", async () => {
      const db = getOwnerDb();
      const [u] = await db
        .insert(users)
        .values({
          email: `consent_terms_wd_${Date.now()}_${Math.random()}@kidthink.test`,
          passwordHash: "hash123",
          displayName: "Terms Withdraw Tester",
        })
        .returning();

      try {
        const event = mockEvent("POST", u.id, {
          consent_type: "terms",
          confirm: true,
        });

        const res = await withdrawConsentHandler(event);
        expect(res.status).toBe("withdrawn");
        expect(res.deletion_url).toBe("/me/settings/delete");
      } finally {
        await db
          .delete(users)
          .where(eq(users.id, u.id))
          .catch(() => null);
      }
    });
  });
});
