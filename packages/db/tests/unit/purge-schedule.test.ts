import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { describe, expect, it } from "vitest";
import { cancelUserDeletion, requestUserDeletion } from "../../src/purge.ts";

interface Captured {
  values: Record<string, Date | string | null>[];
}

function fakeDb(
  captured: Captured
): PostgresJsDatabase<Record<string, unknown>> {
  const chain = {
    set: (values: Record<string, Date | string | null>) => {
      captured.values.push(values);
      return { where: () => Promise.resolve() };
    },
  };
  const db = { update: () => chain };
  return db as unknown as PostgresJsDatabase<Record<string, unknown>>;
}

describe("UC-027 BR-001/BR-002: users.purge_at", () => {
  it("requestUserDeletion ghi purge_at = D+30 cho users", async () => {
    const captured: Captured = { values: [] };
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
    const captured: Captured = { values: [] };

    await cancelUserDeletion(fakeDb(captured), 7);

    expect(captured.values[0]?.status).toBe("active");
    expect(captured.values[0]?.purgeAt).toBeNull();
  });
});
