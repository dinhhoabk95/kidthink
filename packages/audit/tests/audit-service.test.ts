import { auditLogs, getOwnerDb, hardPurgeUser } from "@mindkid/db";
import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { AuditError, writeAudit, writeAuditBatch } from "../src/index.js";

describe("Task 3 & 4 — writeAudit service (BR-AUD-02..08, D-EU..EW)", () => {
  it("BR-AUD-02: rolls back transaction if writeAudit fails", async () => {
    const db = getOwnerDb();
    const testEntityId = `TEST_ENTITY_${Date.now()}`;

    try {
      await db.transaction(async (tx) => {
        // Write audit with invalid payload (secret) to fail
        await writeAudit(tx, {
          actor_type: "manager",
          actor_id: 1,
          action: "user_suspended",
          entity_type: "user",
          entity_id: testEntityId,
          reason: "Violated TOS",
          after_data: { password_hash: "hashed_secret_123" }, // Should fail BR-AUD-06
        });
      });
    } catch (err) {
      expect(err).toBeInstanceOf(AuditError);
    }

    // Verify nothing persisted
    const rows = await db
      .select()
      .from(auditLogs)
      .where(eq(auditLogs.entityId, testEntityId));
    expect(rows).toHaveLength(0);
  });

  it("BR-AUD-07: writeAuditBatch creates one row per entity id", async () => {
    const db = getOwnerDb();
    const entityIds = Array.from(
      { length: 5 },
      (_, i) => `LEVEL_${Date.now()}_${i}`
    );

    await db.transaction(async (tx) => {
      await writeAuditBatch(
        tx,
        entityIds.map((id) => ({
          actor_type: "manager" as const,
          actor_id: 1,
          action: "content_archived" as const,
          entity_type: "game_level",
          entity_id: id,
        }))
      );
    });

    for (const id of entityIds) {
      const rows = await db
        .select()
        .from(auditLogs)
        .where(eq(auditLogs.entityId, id));
      expect(rows).toHaveLength(1);
      expect(rows[0]?.entityId).toBe(id);
    }
  });

  it("BR-AUD-05: blocks child PII in before_data / after_data at runtime", async () => {
    const db = getOwnerDb();

    await expect(
      db.transaction(async (tx) => {
        await writeAudit(tx, {
          actor_type: "manager",
          actor_id: 1,
          action: "child_profile_archived",
          entity_type: "child",
          entity_id: "c_123",
          before_data: { display_name: "Little Johnny" },
        });
      })
    ).rejects.toThrow("BR-AUD-05");
  });

  it("BR-AUD-06: blocks secrets and password hashes at runtime", async () => {
    const db = getOwnerDb();

    await expect(
      db.transaction(async (tx) => {
        await writeAudit(tx, {
          actor_type: "user",
          actor_id: 10,
          action: "user_suspended",
          entity_type: "user",
          entity_id: "u_123",
          reason: "Security flag",
          after_data: { token_hash: "abcd1234efgh5678" },
        });
      })
    ).rejects.toThrow("BR-AUD-06");
  });

  it("BR-AUD-03: enforces reason requirement at runtime if missing", async () => {
    const db = getOwnerDb();

    await expect(
      db.transaction(async (tx) => {
        // @ts-expect-error - testing runtime fallback when missing reason
        await writeAudit(tx, {
          actor_type: "manager",
          actor_id: 1,
          action: "user_suspended",
          entity_type: "user",
          entity_id: "u_456",
        });
      })
    ).rejects.toThrow("requires a non-empty reason");
  });

  it("BR-AUD-08: hardPurgeUser keeps audit_logs intact", async () => {
    const db = getOwnerDb();
    const testEntityId = `USER_PURGED_${Date.now()}`;

    let logId = 0;
    await db.transaction(async (tx) => {
      const row = await writeAudit(tx, {
        actor_type: "user",
        actor_id: 9999,
        action: "consent_withdrawn",
        entity_type: "user",
        entity_id: testEntityId,
      });
      logId = row.id;
    });

    // Run hard purge
    await hardPurgeUser(
      db,
      9999,
      new Date("2026-09-01"),
      new Date("2026-08-01")
    );

    // Verify audit log row still exists
    const rows = await db
      .select()
      .from(auditLogs)
      .where(eq(auditLogs.id, logId));
    expect(rows).toHaveLength(1);
    expect(rows[0]?.entityId).toBe(testEntityId);
  });
});
