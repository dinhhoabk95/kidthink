import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  AuditError,
  type AuditTx,
  assertCleanAuditPayload,
  writeAudit,
} from "#src/index";

const ROOT_DIR = path.resolve(import.meta.dirname, "../../../..");

function createTestTx() {
  const inserted: Record<string, string | number | null | object>[] = [];
  const tx: AuditTx = {
    insert() {
      return {
        values(vals) {
          const rows = Array.isArray(vals) ? vals : [vals];
          for (const row of rows) {
            inserted.push(
              row as Record<string, string | number | null | object>
            );
          }
          return {
            returning() {
              return Promise.resolve([{ id: inserted.length }]);
            },
          };
        },
      };
    },
  };
  return { tx, inserted };
}

describe("@mindkid/audit unit tests", () => {
  it("BR-AUD-05: blocks PII fields like display_name, phone, dob", () => {
    expect(() => {
      assertCleanAuditPayload({ display_name: "Bé An" }, "test");
    }).toThrow(AuditError);

    expect(() => {
      assertCleanAuditPayload({ phone_number: "0901234567" }, "test");
    }).toThrow(AuditError);
  });

  it("BR-AUD-06: blocks secrets like password, token, api_key", () => {
    expect(() => {
      assertCleanAuditPayload({ password_hash: "hash123" }, "test");
    }).toThrow(AuditError);

    expect(() => {
      assertCleanAuditPayload({ access_token: "secret_tok" }, "test");
    }).toThrow(AuditError);
  });

  it("BR-AUD-05 & BR-AUD-06 ([M-08]): recursively blocks PII and secrets inside arrays and nested arrays", () => {
    expect(() => {
      assertCleanAuditPayload(
        { items: [{ id: 1, display_name: "Bé An" }] },
        "before_data"
      );
    }).toThrow(AuditError);

    expect(() => {
      assertCleanAuditPayload(
        { matrix: [[{ password_hash: "$argon2id$secret" }]] },
        "after_data"
      );
    }).toThrow(AuditError);
  });

  it("allows clean non-PII, non-secret fields", () => {
    expect(() => {
      assertCleanAuditPayload(
        { child_uuid: "uuid-123", action_count: 5, status: "active" },
        "test"
      );
    }).not.toThrow();
  });

  it("BR-AUD-01 & BR-AUD-02 (#305 S2): routes user/child/order/entitlement mutations through writeAudit without direct auditLogs insert", () => {
    const auditedFiles = [
      "apps/web/server/api/managers/users/[uuid]/suspend.post.ts",
      "apps/web/server/api/managers/users/[uuid]/reactivate.post.ts",
      "apps/web/server/api/managers/children/[uuid]/archive.post.ts",
      "apps/web/server/api/users/children/[uuid]/archive.post.ts",
      "apps/web/server/api/users/children/[uuid]/index.delete.ts",
      "apps/web/server/api/users/account/delete.post.ts",
      "apps/web/server/api/managers/orders/[uuid]/approve.post.ts",
      "apps/web/server/api/managers/orders/[uuid]/reject.post.ts",
      "apps/web/server/utils/entitlements-runtime.ts",
      "apps/worker/src/consumers/account-purge.ts",
    ];

    const directInsertViolations: string[] = [];
    const combinedContent: string[] = [];

    for (const relPath of auditedFiles) {
      const content = fs.readFileSync(path.join(ROOT_DIR, relPath), "utf-8");
      combinedContent.push(content);
      if (content.includes(".insert(auditLogs)")) {
        directInsertViolations.push(relPath);
      }
      expect(content).toContain("writeAudit");
    }

    expect(directInsertViolations).toEqual([]);

    const joined = combinedContent.join("\n");
    const requiredActions = [
      "user_suspended",
      "user_reactivated",
      "child_profile_archived",
      "child_data_purged",
      "user_deleted",
      "bonus_days_granted",
      "quota_reset",
      "package_catalog_deployed",
    ];

    for (const action of requiredActions) {
      expect(joined).toContain(`"${action}"`);
    }
  });

  it("BR-AUD-03 & BR-AUD-05 (#305 S2): validates writeAudit payloads for all 8 newly wired actions", async () => {
    const { tx, inserted } = createTestTx();

    await writeAudit(tx, {
      actor_type: "manager",
      actor_id: 1,
      action: "user_suspended",
      entity_type: "user",
      entity_id: "u-1",
      before_data: { status: "active" },
      after_data: { status: "suspended" },
      reason: "Vi phạm điều khoản dịch vụ",
    });

    await writeAudit(tx, {
      actor_type: "manager",
      actor_id: 1,
      action: "user_reactivated",
      entity_type: "user",
      entity_id: "u-1",
      before_data: { status: "suspended" },
      after_data: { status: "active" },
      reason: "Đã xác minh tài khoản hợp lệ",
    });

    await writeAudit(tx, {
      actor_type: "user",
      actor_id: 10,
      action: "child_profile_archived",
      entity_type: "child_profile",
      entity_id: "c-uuid-1",
      before_data: { child_uuid: "c-uuid-1", status: "active" },
      after_data: { child_uuid: "c-uuid-1", status: "archived" },
    });

    await writeAudit(tx, {
      actor_type: "system",
      action: "child_data_purged",
      entity_type: "child_profile",
      entity_id: "c-uuid-1",
      after_data: {
        child_uuid: "c-uuid-1",
        purged: true,
        telemetry_anonymized: true,
      },
    });

    await writeAudit(tx, {
      actor_type: "user",
      actor_id: 10,
      action: "user_deleted",
      entity_type: "user",
      entity_id: "10",
      before_data: { status: "active" },
      after_data: { status: "deleted", purge_at: "2026-11-18T00:00:00.000Z" },
      reason: "Người dùng yêu cầu xoá tài khoản",
    });

    await writeAudit(tx, {
      actor_type: "manager",
      actor_id: 1,
      action: "bonus_days_granted",
      entity_type: "payment_order",
      entity_id: "ord-1",
      before_data: { bonus_days: 0 },
      after_data: { bonus_days: 7, user_id: 10 },
      reason: "Tặng thêm 7 ngày do duyệt chậm",
    });

    await writeAudit(tx, {
      actor_type: "manager",
      actor_id: 1,
      action: "quota_reset",
      entity_type: "quota_usage",
      entity_id: "10:ai_hints",
      before_data: { user_id: 10, quota_key: "ai_hints" },
      after_data: { user_id: 10, quota_key: "ai_hints", used: 0 },
      reason: "Reset hạn mức theo yêu cầu hỗ trợ",
    });

    await writeAudit(tx, {
      actor_type: "system",
      action: "package_catalog_deployed",
      entity_type: "package_catalog",
      entity_id: "PACKAGE_CATALOG",
      after_data: { deployed_codes: ["PKG-standard", "PKG-teacher-pro"] },
    });

    expect(inserted).toHaveLength(8);
  });
});
