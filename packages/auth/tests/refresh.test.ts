import { describe, expect, it, vi } from "vitest";
import type {
  AccountReference,
  RotateSessionInput,
  RotateSessionResult,
  SessionRecord,
  SessionStorePort,
} from "../src/ports";
import {
  generateOpaqueRefreshToken,
  hashRefreshToken,
  RefreshService,
} from "../src/refresh";

class InMemorySessionStore implements SessionStorePort {
  private readonly sessions = new Map<string, SessionRecord>();

  constructor(initialSessions: SessionRecord[] = []) {
    for (const s of initialSessions) {
      this.sessions.set(s.session_id, s);
    }
  }

  async findByRefreshTokenHash(hash: string): Promise<SessionRecord | null> {
    await Promise.resolve();
    for (const s of this.sessions.values()) {
      if (s.refresh_token_hash === hash) {
        return s;
      }
    }
    return null;
  }

  async rotate(input: RotateSessionInput): Promise<RotateSessionResult> {
    await Promise.resolve();
    let target: SessionRecord | undefined;
    for (const s of this.sessions.values()) {
      if (s.session_id === input.session_id) {
        target = s;
        break;
      }
    }

    if (!target) {
      return { outcome: "not_found" };
    }

    if (target.refresh_token_hash !== input.current_refresh_token_hash) {
      // Reuse detected!
      return {
        outcome: "reused",
        account: {
          account_type: target.account_type,
          account_id: target.account_id,
        },
      };
    }

    const updated: SessionRecord = {
      ...target,
      refresh_token_hash: input.next_refresh_token_hash,
      expires_at: input.next_expires_at,
    };
    this.sessions.set(target.session_id, updated);

    return { outcome: "rotated", session: updated };
  }

  async revokeSession(sessionId: string): Promise<void> {
    await Promise.resolve();
    this.sessions.delete(sessionId);
  }

  async revokeAll(account: AccountReference): Promise<void> {
    await Promise.resolve();
    for (const [id, s] of this.sessions.entries()) {
      if (
        s.account_type === account.account_type &&
        s.account_id === account.account_id
      ) {
        this.sessions.delete(id);
      }
    }
  }

  async markReauthenticated(sessionId: string, at: Date): Promise<void> {
    await Promise.resolve();
    const s = this.sessions.get(sessionId);
    if (s) {
      this.sessions.set(sessionId, { ...s, reauth_at: at });
    }
  }

  getSessionsCount(): number {
    return this.sessions.size;
  }
}

const JWT_SECRET = "super-secret-jwt-key-at-least-32-chars-long!!";

describe("Refresh token rotation and revocation semantics", () => {
  it("hashes refresh tokens deterministically using sha256", () => {
    const rawToken = "raw-token-abc123xyz";
    const hash1 = hashRefreshToken(rawToken);
    const hash2 = hashRefreshToken(rawToken);

    expect(hash1).toBe(hash2);
    expect(hash1.length).toBe(64); // hex sha256
    expect(hash1).not.toBe(rawToken);
  });

  it("generates 32-byte opaque random refresh tokens", () => {
    const token1 = generateOpaqueRefreshToken();
    const token2 = generateOpaqueRefreshToken();

    expect(token1).not.toBe(token2);
    expect(token1.length).toBeGreaterThanOrEqual(32);
  });

  it("rotates valid refresh token and returns new token pair", async () => {
    const rawToken = "current-refresh-token-123";
    const currentHash = hashRefreshToken(rawToken);
    const initialSession: SessionRecord = {
      session_id: "sess-1",
      account_type: "user",
      account_id: 101,
      refresh_token_hash: currentHash,
      refresh_token_version: 1,
      auth_method: "password",
      reauth_at: null,
      expires_at: new Date(Date.now() + 86_400_000),
    };

    const store = new InMemorySessionStore([initialSession]);
    const service = new RefreshService(store, {
      jwtSecret: JWT_SECRET,
      jwtAudience: "kidthink-web",
    });

    const result = await service.rotateRefreshToken({
      sessionId: "sess-1",
      currentRefreshToken: rawToken,
      displayName: "Phụ huynh An",
    });

    expect(result.accessToken).toBeDefined();
    expect(result.nextRefreshToken).toBeDefined();
    expect(result.nextRefreshToken).not.toBe(rawToken);

    // Old token should no longer match current hash in store
    const oldTokenCheck = await store.findByRefreshTokenHash(currentHash);
    expect(oldTokenCheck).toBeNull();
  });

  it("detects reuse of old refresh token and revokes ALL sessions for account", async () => {
    const rawTokenV1 = "token-version-1";

    const session1: SessionRecord = {
      session_id: "sess-1",
      account_type: "user",
      account_id: 101,
      refresh_token_hash: "hash-already-rotated-to-v2",
      refresh_token_version: 2,
      auth_method: "password",
      reauth_at: null,
      expires_at: new Date(Date.now() + 86_400_000),
    };

    const session2: SessionRecord = {
      session_id: "sess-2",
      account_type: "user",
      account_id: 101,
      refresh_token_hash: "another-device-token",
      refresh_token_version: 2,
      auth_method: "password",
      reauth_at: null,
      expires_at: new Date(Date.now() + 86_400_000),
    };

    const store = new InMemorySessionStore([session1, session2]);
    const revokeAllSpy = vi.spyOn(store, "revokeAll");

    const service = new RefreshService(store, {
      jwtSecret: JWT_SECRET,
      jwtAudience: "kidthink-web",
    });

    // Attempting to rotate sess-1 using old v1 token when store already moved to v2
    await expect(
      service.rotateRefreshToken({
        sessionId: "sess-1",
        currentRefreshToken: rawTokenV1,
        displayName: "Phụ huynh An",
      })
    ).rejects.toThrowError(
      expect.objectContaining({ code: "SESSION_REVOKED", status: 401 })
    );

    expect(revokeAllSpy).toHaveBeenCalledWith({
      account_type: "user",
      account_id: 101,
    });
    expect(store.getSessionsCount()).toBe(0); // all sessions revoked
  });

  it("property check: a single refresh token succeeds at most once", async () => {
    const rawToken = "single-use-token-xyz";
    const hash = hashRefreshToken(rawToken);

    const initialSession: SessionRecord = {
      session_id: "sess-100",
      account_type: "user",
      account_id: 200,
      refresh_token_hash: hash,
      refresh_token_version: 1,
      auth_method: "password",
      reauth_at: null,
      expires_at: new Date(Date.now() + 86_400_000),
    };

    const store = new InMemorySessionStore([initialSession]);
    const service = new RefreshService(store, {
      jwtSecret: JWT_SECRET,
      jwtAudience: "kidthink-web",
    });

    // First rotation succeeds
    const firstResult = await service.rotateRefreshToken({
      sessionId: "sess-100",
      currentRefreshToken: rawToken,
      displayName: "User",
    });
    expect(firstResult.nextRefreshToken).toBeDefined();

    // Second rotation with same token fails
    await expect(
      service.rotateRefreshToken({
        sessionId: "sess-100",
        currentRefreshToken: rawToken,
        displayName: "User",
      })
    ).rejects.toThrowError(
      expect.objectContaining({ code: "SESSION_REVOKED", status: 401 })
    );
  });
});
