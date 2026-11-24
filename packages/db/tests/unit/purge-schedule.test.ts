import type { SQL } from "drizzle-orm";
import { SQLiteDialect } from "drizzle-orm/sqlite-core";
import { describe, expect, it } from "vitest";
import type { DbExecutor } from "#src/client";
import { CHILD_STATUS, USER_STATUS } from "#src/constants/identity-enums";
import {
  cancelUserDeletion,
  hardPurgeUser,
  requestUserDeletion,
} from "#src/purge";
import { childProfiles } from "#src/schema/child";
import { userAccounts, users } from "#src/schema/identity";

const PURGE_AT_IS_NULL_REGEX = /"purge_at"\s+is\s+null/i;

interface CapturedUpdate {
  table: object;
  values: Record<string, Date | number | string | null | object>;
  whereClause?: SQL;
}

interface Captured {
  values: Record<string, Date | number | string | null | object>[];
  updates: CapturedUpdate[];
  deletedTables: object[];
  updatedTables: object[];
}

interface FakeDbOptions {
  emailVerified?: boolean;
  userFound?: boolean;
}

function fakeDb(captured: Captured, options: FakeDbOptions = {}): DbExecutor {
  const emailVerified = options.emailVerified ?? true;
  const userFound = options.userFound ?? true;
  const db = {
    query: {
      users: {
        findFirst: () => Promise.resolve({ email: "purged@mindkid.test" }),
      },
      childProfiles: {
        findMany: () =>
          Promise.resolve([
            { id: 101, uuid: "00000000-0000-4000-8000-000000000101" },
          ]),
      },
    },
    select: () => ({
      from: () => ({
        where: () =>
          Promise.resolve(
            userFound
              ? [
                  {
                    id: 101,
                    uuid: "00000000-0000-4000-8000-000000000101",
                    emailVerified,
                  },
                ]
              : []
          ),
      }),
    }),
    update: (table: object) => ({
      set: (values: Record<string, Date | number | string | null | object>) => {
        captured.updatedTables.push(table);
        captured.values.push(values);
        return {
          where: (whereClause?: SQL) => {
            captured.updates.push({ table, values, whereClause });
            return Promise.resolve();
          },
        };
      },
    }),
    delete: (table: object) => {
      captured.deletedTables.push(table);
      return { where: () => Promise.resolve() };
    },
    transaction: async (callback: (tx: DbExecutor) => Promise<void>) =>
      await callback(db as never),
  };
  return db as never;
}

describe("UC-027 BR-001/BR-002/BR-ADL-09/BR-ADL-10: users.purge_at & hardPurgeUser", () => {
  it("requestUserDeletion ghi purge_at = D+30 cho users", async () => {
    const captured: Captured = {
      values: [],
      updates: [],
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
    expect(userUpdate?.status).toBe(USER_STATUS.DELETED);
    expect(userUpdate?.purgeAt).toEqual(scheduledPurgeAt);
    expect(scheduledPurgeAt.toISOString()).toBe("2026-08-31T00:00:00.000Z");
  });

  it("cancelUserDeletion khôi phục USER_STATUS.ACTIVE và xoá purge_at khi emailVerified = true", async () => {
    const captured: Captured = {
      values: [],
      updates: [],
      deletedTables: [],
      updatedTables: [],
    };

    await cancelUserDeletion(fakeDb(captured, { emailVerified: true }), 7);

    expect(captured.values[0]?.status).toBe(USER_STATUS.ACTIVE);
    expect(captured.values[0]?.purgeAt).toBeNull();
  });

  it("cancelUserDeletion khôi phục USER_STATUS.PENDING_VERIFICATION khi emailVerified = false (không leo quyền lên ACTIVE)", async () => {
    const captured: Captured = {
      values: [],
      updates: [],
      deletedTables: [],
      updatedTables: [],
    };

    await cancelUserDeletion(fakeDb(captured, { emailVerified: false }), 7);

    expect(captured.values[0]?.status).toBe(USER_STATUS.PENDING_VERIFICATION);
    expect(captured.values[0]?.status).not.toBe(USER_STATUS.ACTIVE);
    expect(captured.values[0]?.purgeAt).toBeNull();
  });

  it("cancelUserDeletion lọc purge_at IS NULL khi hồi sinh child_profiles để không hồi sinh trẻ xoá riêng lẻ", async () => {
    const captured: Captured = {
      values: [],
      updates: [],
      deletedTables: [],
      updatedTables: [],
    };

    await cancelUserDeletion(fakeDb(captured, { emailVerified: true }), 7);

    const childUpdate = captured.updates.find(
      (entry) => entry.table === childProfiles
    );
    expect(childUpdate).toBeDefined();
    expect(childUpdate?.values.status).toBe(CHILD_STATUS.ACTIVE);
    expect(childUpdate?.values.purgeAt).toBeNull();
    if (!childUpdate?.whereClause) {
      throw new Error("Expected child_profiles update to carry a WHERE clause");
    }
    const dialect = new SQLiteDialect();
    const compiled = dialect.sqlToQuery(childUpdate.whereClause);
    expect(compiled.sql).toMatch(PURGE_AT_IS_NULL_REGEX);
    expect(compiled.params).toContain(CHILD_STATUS.PENDING_DELETION);
  });

  it("hardPurgeUser xoá cứng social_identities và ẩn danh users PII + đặt purge_at = null (BR-ADL-09, BR-ADL-10)", async () => {
    const captured: Captured = {
      values: [],
      updates: [],
      deletedTables: [],
      updatedTables: [],
    };
    const scheduled = new Date("2026-08-31T00:00:00Z");
    const now = new Date("2026-09-01T00:00:00Z");

    const res = await hardPurgeUser(fakeDb(captured), 7, now, scheduled);
    expect(res.purged).toBe(true);

    expect(captured.deletedTables).toContain(userAccounts);
    expect(captured.updatedTables).toContain(users);

    const userAnonymizeValues = captured.values.at(-1);
    expect(userAnonymizeValues?.displayName).toBe("Đã xoá");
    expect(userAnonymizeValues?.passwordHash).toBeNull();
    expect(userAnonymizeValues?.purgeAt).toBeNull();
    expect(userAnonymizeValues?.status).toBe(USER_STATUS.DELETED);
  });
});
