import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { describe, expect, it } from "vitest";
import {
  cancelUserDeletion,
  hardPurgeUser,
  requestUserDeletion,
} from "../../src/purge.ts";
import { socialIdentities, users } from "../../src/schema/identity.ts";

interface Captured {
  values: Record<string, Date | string | null | object>[];
  deletedTables: object[];
  updatedTables: object[];
}

function fakeDb(captured: Captured): PostgresJsDatabase {
  const db = {
    select: () => ({
      from: () => ({
        where: () =>
          Promise.resolve([
            { id: 101, uuid: "00000000-0000-4000-8000-000000000101" },
          ]),
      }),
    }),
    update: (table: object) => ({
      set: (values: Record<string, Date | string | null | object>) => {
        captured.updatedTables.push(table);
        captured.values.push(values);
        return { where: () => Promise.resolve() };
      },
    }),
    delete: (table: object) => {
      captured.deletedTables.push(table);
      return { where: () => Promise.resolve() };
    },
  };
  return db as never;
}

describe("UC-027 BR-001/BR-002/BR-ADL-09/BR-ADL-10: users.purge_at & hardPurgeUser", () => {
  it("requestUserDeletion ghi purge_at = D+30 cho users", async () => {
    const captured: Captured = {
      values: [],
      deletedTables: [],
      updatedTables: [],
    };
    const base = new Date("2026-08-01T00:00:00Z");

    const { scheduledPurgeAt } = await requestUserDeletion(
      fakeDb(captured),
      7,
      base
    );

    const userUpdate = captured.values[0];
    expect(userUpdate?.status).toBe("deleted");
    expect(userUpdate?.purgeAt).toEqual(scheduledPurgeAt);
    expect(scheduledPurgeAt.toISOString()).toBe("2026-08-31T00:00:00.000Z");
  });

  it("cancelUserDeletion xoá purge_at", async () => {
    const captured: Captured = {
      values: [],
      deletedTables: [],
      updatedTables: [],
    };

    await cancelUserDeletion(fakeDb(captured), 7);

    expect(captured.values[0]?.status).toBe("active");
    expect(captured.values[0]?.purgeAt).toBeNull();
  });

  it("hardPurgeUser xoá cứng social_identities và ẩn danh users PII + đặt purge_at = null (BR-ADL-09, BR-ADL-10)", async () => {
    const captured: Captured = {
      values: [],
      deletedTables: [],
      updatedTables: [],
    };
    const scheduled = new Date("2026-08-31T00:00:00Z");
    const now = new Date("2026-09-01T00:00:00Z");

    const res = await hardPurgeUser(fakeDb(captured), 7, now, scheduled);
    expect(res.purged).toBe(true);

    expect(captured.deletedTables).toContain(socialIdentities);
    expect(captured.updatedTables).toContain(users);

    const userAnonymizeValues = captured.values.at(-1);
    expect(userAnonymizeValues?.displayName).toBe("Đã xoá");
    expect(userAnonymizeValues?.passwordHash).toBeNull();
    expect(userAnonymizeValues?.purgeAt).toBeNull();
    expect(userAnonymizeValues?.status).toBe("deleted");
  });
});
