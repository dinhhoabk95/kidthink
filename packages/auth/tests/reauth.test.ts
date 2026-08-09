import { describe, expect, it, vi } from "vitest";
import { createAuthContext } from "../src/contracts";
import type {
  AccountReference,
  ReauthMethodAvailabilityPort,
  RotateSessionInput,
  RotateSessionResult,
  SessionStorePort,
} from "../src/ports";
import {
  CurrentSessionReauthService,
  REAUTH_MAX_AGE_SECONDS,
  verifyReauthWindow,
} from "../src/reauth";

class ReauthSessionStore implements SessionStorePort {
  readonly states = new Map<string, Date | null>();
  readonly marked: Array<{
    sessionId: string;
    account: AccountReference;
    at: Date;
  }> = [];

  rotate(_input: RotateSessionInput): Promise<RotateSessionResult> {
    return Promise.resolve({ outcome: "not_found" });
  }

  revokeSession(): Promise<void> {
    return Promise.resolve();
  }

  revokeAll(): Promise<void> {
    return Promise.resolve();
  }

  getReauthState(
    sessionId: string,
    _account: AccountReference
  ): Promise<{ readonly reauth_at: Date | null } | null> {
    if (!this.states.has(sessionId)) {
      return Promise.resolve(null);
    }
    return Promise.resolve({ reauth_at: this.states.get(sessionId) ?? null });
  }

  markReauthenticated(
    sessionId: string,
    account: AccountReference,
    at: Date
  ): Promise<void> {
    this.states.set(sessionId, at);
    this.marked.push({ sessionId, account, at });
    return Promise.resolve();
  }
}

const userEvent = {
  context: createAuthContext({
    user: {
      user_id: 101,
      display_name: "Phụ huynh An",
      session_id: "session-a",
      refresh_token_version: 0,
    },
  }),
};

describe("Current-session reauth window and methods", () => {
  it("allows exactly the 5-minute boundary and rejects older or future timestamps", () => {
    const now = new Date("2026-08-09T12:00:00.000Z");
    const boundary = new Date(now.getTime() - REAUTH_MAX_AGE_SECONDS * 1000);
    expect(() => verifyReauthWindow(boundary, ["social"], now)).not.toThrow();

    expect(() =>
      verifyReauthWindow(
        new Date(boundary.getTime() - 1),
        ["social", "totp"],
        now
      )
    ).toThrowError(
      expect.objectContaining({
        code: "REAUTH_REQUIRED",
        status: 428,
        details: { methods: ["social", "totp"] },
      })
    );
    expect(() =>
      verifyReauthWindow(new Date(now.getTime() + 1), ["totp"], now)
    ).toThrowError(expect.objectContaining({ code: "REAUTH_REQUIRED" }));
  });

  it("derives account and session from AuthEvent and reports only available methods", async () => {
    const store = new ReauthSessionStore();
    store.states.set("session-a", null);
    const availability: ReauthMethodAvailabilityPort = {
      getAvailableMethods: vi.fn().mockResolvedValue(["social", "totp"]),
    };
    const service = new CurrentSessionReauthService(store, availability);

    await expect(service.requireRecent(userEvent)).rejects.toThrowError(
      expect.objectContaining({
        code: "REAUTH_REQUIRED",
        details: { methods: ["social", "totp"] },
      })
    );
    expect(availability.getAvailableMethods).toHaveBeenCalledWith({
      account_type: "user",
      account_id: 101,
    });
  });

  it("updates only the authenticated current session after a verifier succeeds", async () => {
    const store = new ReauthSessionStore();
    store.states.set("session-a", null);
    store.states.set("session-b", null);
    const availability: ReauthMethodAvailabilityPort = {
      getAvailableMethods() {
        return Promise.resolve(["password"]);
      },
    };
    const service = new CurrentSessionReauthService(store, availability);
    const at = new Date("2026-08-09T12:00:00.000Z");

    await service.markCurrentSessionReauthenticated(userEvent, at);

    expect(store.marked).toEqual([
      {
        sessionId: "session-a",
        account: { account_type: "user", account_id: 101 },
        at,
      },
    ]);
    expect(store.states.get("session-b")).toBeNull();
  });

  it("returns SESSION_REVOKED when the authenticated session no longer exists", async () => {
    const service = new CurrentSessionReauthService(new ReauthSessionStore(), {
      getAvailableMethods() {
        return Promise.resolve(["password"]);
      },
    });

    await expect(service.requireRecent(userEvent)).rejects.toThrowError(
      expect.objectContaining({ code: "SESSION_REVOKED", status: 401 })
    );
  });
});
