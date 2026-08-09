import fc from "fast-check";
import { decodeJwt } from "jose";
import { describe, expect, it, vi } from "vitest";
import type {
  AccountReference,
  RotateSessionInput,
  RotateSessionResult,
  SessionRecord,
  SessionStorePort,
} from "../src/ports";
import {
  createRefreshToken,
  hashRefreshToken,
  RefreshService,
} from "../src/refresh";

class InMemorySessionStore implements SessionStorePort {
  private readonly sessions = new Map<string, SessionRecord>();
  private readonly accountVersions = new Map<string, number>();

  constructor(initialSessions: SessionRecord[] = []) {
    for (const session of initialSessions) {
      this.sessions.set(session.session_id, session);
      this.accountVersions.set(
        this.accountKey(session),
        session.refresh_token_version
      );
    }
  }

  rotate(input: RotateSessionInput): Promise<RotateSessionResult> {
    const target = this.sessions.get(input.session_id);
    if (!target || target.account_type !== input.account_type) {
      return Promise.resolve({ outcome: "not_found" });
    }

    const accountKey = this.accountKey(target);
    const currentVersion = this.accountVersions.get(accountKey);
    if (
      target.expires_at <= input.used_at ||
      target.refresh_token_version !== input.refresh_token_version ||
      currentVersion !== input.refresh_token_version
    ) {
      return Promise.resolve({ outcome: "revoked" });
    }

    if (target.refresh_token_hash !== input.current_refresh_token_hash) {
      this.accountVersions.set(accountKey, input.refresh_token_version + 1);
      this.deleteAccountSessions(target);
      return Promise.resolve({ outcome: "reused" });
    }

    const updated = {
      ...target,
      refresh_token_hash: input.next_refresh_token_hash,
      expires_at: input.next_expires_at,
    } satisfies SessionRecord;
    this.sessions.set(target.session_id, updated);
    return Promise.resolve({ outcome: "rotated", session: updated });
  }

  revokeSession(sessionId: string, account: AccountReference): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (
      session?.account_type === account.account_type &&
      session.account_id === account.account_id
    ) {
      this.sessions.delete(sessionId);
    }
    return Promise.resolve();
  }

  revokeAll(account: AccountReference): Promise<void> {
    const key = this.accountKey(account);
    this.accountVersions.set(key, (this.accountVersions.get(key) ?? 0) + 1);
    this.deleteAccountSessions(account);
    return Promise.resolve();
  }

  getReauthState(
    sessionId: string,
    account: AccountReference
  ): Promise<{ readonly reauth_at: Date | null } | null> {
    const session = this.sessions.get(sessionId);
    if (
      session?.account_type !== account.account_type ||
      session.account_id !== account.account_id
    ) {
      return Promise.resolve(null);
    }
    return Promise.resolve({ reauth_at: session.reauth_at });
  }

  markReauthenticated(
    sessionId: string,
    account: AccountReference,
    at: Date
  ): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (
      session?.account_type === account.account_type &&
      session.account_id === account.account_id
    ) {
      this.sessions.set(sessionId, { ...session, reauth_at: at });
    }
    return Promise.resolve();
  }

  getSessionsCount(): number {
    return this.sessions.size;
  }

  getAccountVersion(account: AccountReference): number | undefined {
    return this.accountVersions.get(this.accountKey(account));
  }

  private accountKey(account: AccountReference): string {
    return `${account.account_type}:${account.account_id}`;
  }

  private deleteAccountSessions(account: AccountReference): void {
    for (const [id, session] of this.sessions) {
      if (
        session.account_type === account.account_type &&
        session.account_id === account.account_id
      ) {
        this.sessions.delete(id);
      }
    }
  }
}

const USER_SECRET = "user-refresh-service-secret-at-least-32-bytes";
const MANAGER_SECRET = "manager-refresh-service-secret-at-least-32-bytes";

function createUserFixture(version = 0) {
  const rawToken = createRefreshToken({
    namespace: "user",
    sessionId: "session_user_101",
    refreshTokenVersion: version,
    secret: USER_SECRET,
  });
  const session: SessionRecord = {
    session_id: "session_user_101",
    account_type: "user",
    account_id: 101,
    display_name: "Tên tin cậy từ DB",
    refresh_token_hash: hashRefreshToken(rawToken),
    refresh_token_version: version,
    auth_method: "password",
    reauth_at: null,
    expires_at: new Date(Date.now() + 86_400_000),
  };
  return { rawToken, session };
}

describe("Refresh token rotation and revocation semantics", () => {
  it("rotates using only the raw envelope and signs trusted principal data returned by the store", async () => {
    const { rawToken, session } = createUserFixture();
    const store = new InMemorySessionStore([session]);
    const service = new RefreshService(store, {
      namespace: "user",
      jwtSecret: USER_SECRET,
    });

    const result = await service.rotateRefreshToken({
      refreshToken: rawToken,
      activeChildCandidateId: 301,
    });

    expect(result.nextRefreshToken).not.toBe(rawToken);
    expect(result.session).toEqual({
      user_id: 101,
      display_name: "Tên tin cậy từ DB",
      session_id: "session_user_101",
      refresh_token_version: 0,
      active_child_id: 301,
    });
    expect(decodeJwt(result.accessToken)).toMatchObject({
      sub: "101",
      name: "Tên tin cậy từ DB",
      sid: "session_user_101",
      ver: 0,
      active_child_id: 301,
      aud: "kidthink:user",
      iss: "kidthink:web",
    });
  });

  it("rejects a forged envelope before querying or revoking any account", async () => {
    const { rawToken, session } = createUserFixture();
    const store = new InMemorySessionStore([session]);
    const rotateSpy = vi.spyOn(store, "rotate");
    const service = new RefreshService(store, {
      namespace: "user",
      jwtSecret: USER_SECRET,
    });

    await expect(
      service.rotateRefreshToken({ refreshToken: `${rawToken}tampered` })
    ).rejects.toThrowError(
      expect.objectContaining({ code: "SESSION_REVOKED", status: 401 })
    );
    expect(rotateSpy).not.toHaveBeenCalled();
    expect(store.getSessionsCount()).toBe(1);
  });

  it("detects a MAC-valid old token reuse and atomically revokes every account session", async () => {
    const { rawToken, session } = createUserFixture(2);
    const otherSession: SessionRecord = {
      ...session,
      session_id: "session_user_other",
      refresh_token_hash: "other-device-hash",
    };
    const store = new InMemorySessionStore([session, otherSession]);
    const service = new RefreshService(store, {
      namespace: "user",
      jwtSecret: USER_SECRET,
    });

    await service.rotateRefreshToken({ refreshToken: rawToken });
    await expect(
      service.rotateRefreshToken({ refreshToken: rawToken })
    ).rejects.toThrowError(
      expect.objectContaining({ code: "SESSION_REVOKED", status: 401 })
    );

    expect(store.getSessionsCount()).toBe(0);
    expect(
      store.getAccountVersion({ account_type: "user", account_id: 101 })
    ).toBe(3);
  });

  it("signs Manager role and display name only from the trusted store result", async () => {
    const rawToken = createRefreshToken({
      namespace: "manager",
      sessionId: "session_manager_201",
      refreshTokenVersion: 0,
      secret: MANAGER_SECRET,
    });
    const session: SessionRecord = {
      session_id: "session_manager_201",
      account_type: "manager",
      account_id: 201,
      display_name: "Reviewer từ DB",
      role: "content_reviewer",
      refresh_token_hash: hashRefreshToken(rawToken),
      refresh_token_version: 0,
      auth_method: "password",
      reauth_at: null,
      expires_at: new Date(Date.now() + 86_400_000),
    };
    const service = new RefreshService(new InMemorySessionStore([session]), {
      namespace: "manager",
      jwtSecret: MANAGER_SECRET,
    });

    const result = await service.rotateRefreshToken({ refreshToken: rawToken });

    expect(decodeJwt(result.accessToken)).toMatchObject({
      sub: "201",
      name: "Reviewer từ DB",
      role: "content_reviewer",
      aud: "kidthink:manager",
      iss: "kidthink:admin",
    });
  });

  it("logout-all increments the account version and deletes only that account's sessions", async () => {
    const { session } = createUserFixture(4);
    const otherAccount: SessionRecord = {
      ...session,
      session_id: "session_user_202",
      account_id: 202,
      refresh_token_hash: "other-account-hash",
    };
    const store = new InMemorySessionStore([session, otherAccount]);
    const service = new RefreshService(store, {
      namespace: "user",
      jwtSecret: USER_SECRET,
    });

    await service.logoutAll("user", 101);

    expect(store.getSessionsCount()).toBe(1);
    expect(
      store.getAccountVersion({ account_type: "user", account_id: 101 })
    ).toBe(5);
  });

  it("property: one MAC-valid token succeeds at most once", async () => {
    await fc.assert(
      fc.asyncProperty(fc.integer({ min: 2, max: 12 }), async (attempts) => {
        const { rawToken, session } = createUserFixture();
        const service = new RefreshService(
          new InMemorySessionStore([session]),
          { namespace: "user", jwtSecret: USER_SECRET }
        );
        let successes = 0;

        for (let attempt = 0; attempt < attempts; attempt += 1) {
          try {
            await service.rotateRefreshToken({ refreshToken: rawToken });
            successes += 1;
          } catch {
            // Expected after the first successful rotation.
          }
        }

        expect(successes).toBeLessThanOrEqual(1);
      }),
      { numRuns: 25 }
    );
  });

  it("rejects non-positive integer active child candidate before querying or rotating", async () => {
    const { rawToken, session } = createUserFixture();
    const store = new InMemorySessionStore([session]);
    const service = new RefreshService(store, {
      namespace: "user",
      jwtSecret: USER_SECRET,
    });

    await expect(
      service.rotateRefreshToken({
        refreshToken: rawToken,
        activeChildCandidateId: -5,
      })
    ).rejects.toThrowError(
      expect.objectContaining({ code: "UNAUTHENTICATED", status: 401 })
    );

    expect(store.getSessionsCount()).toBe(1);
  });

  it("revokes session if access token signing fails after store rotation", async () => {
    const { rawToken, session } = createUserFixture();
    const store = new InMemorySessionStore([session]);
    const userSessionModule = await import("../src/user-session");
    const spy = vi
      .spyOn(userSessionModule, "createWebUserToken")
      .mockRejectedValueOnce(new Error("Signing failed"));

    const service = new RefreshService(store, {
      namespace: "user",
      jwtSecret: USER_SECRET,
    });

    await expect(
      service.rotateRefreshToken({
        refreshToken: rawToken,
      })
    ).rejects.toThrow("Signing failed");

    expect(store.getSessionsCount()).toBe(0);
    spy.mockRestore();
  });
});
