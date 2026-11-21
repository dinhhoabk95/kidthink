import { describe, expect, it } from "vitest";
import {
  CurrentSessionReauthService,
  REAUTH_MAX_AGE_SECONDS,
  type SessionStorePort,
  verifyReauthWindow,
} from "#src/index";

describe("Reauth Window & SessionStorePort Verification (BR-AUT-13, BR-ADA-09)", () => {
  it("verifyReauthWindow enforces 5-minute window strictly", () => {
    const t0 = new Date("2026-10-14T08:00:00Z");
    expect(() =>
      verifyReauthWindow(t0, ["password"], new Date(t0.getTime() + 299_000))
    ).not.toThrow();
    expect(() =>
      verifyReauthWindow(t0, ["password"], new Date(t0.getTime() + 301_000))
    ).toThrowError(
      expect.objectContaining({ code: "REAUTH_REQUIRED", status: 428 })
    );
  });

  it("CurrentSessionReauthService tracks per-session reauth state independently across devices", async () => {
    const stateMap = new Map<string, Date | null>([
      ["sess-a", null],
      ["sess-b", null],
    ]);

    const fakeStore: SessionStorePort = {
      revokeSession: () => Promise.resolve(),
      revokeAll: () => Promise.resolve(),
      getReauthState: (sessionId) =>
        Promise.resolve(
          stateMap.has(sessionId)
            ? { reauth_at: stateMap.get(sessionId) ?? null }
            : null
        ),
      markReauthenticated: (sessionId, _account, at) => {
        stateMap.set(sessionId, at);
        return Promise.resolve();
      },
    };

    const service = new CurrentSessionReauthService(fakeStore, {
      getAvailableMethods: () => Promise.resolve(["password"]),
    });

    const t0 = new Date("2026-10-14T08:00:00Z");
    const eventA = {
      context: {
        user: { user_id: 1, display_name: "A", session_id: "sess-a" },
      },
    };
    const eventB = {
      context: {
        user: { user_id: 1, display_name: "A", session_id: "sess-b" },
      },
    };

    await expect(service.requireRecent(eventA, t0)).rejects.toThrow();
    await service.markCurrentSessionReauthenticated(eventA, t0);

    await expect(
      service.requireRecent(
        eventA,
        new Date(t0.getTime() + (REAUTH_MAX_AGE_SECONDS - 1) * 1000)
      )
    ).resolves.toBeUndefined();
    await expect(service.requireRecent(eventB, t0)).rejects.toThrow();
  });
});
