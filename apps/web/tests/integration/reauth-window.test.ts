import { InMemoryRedisClient, setAuthRedisClient } from "@mindkid/auth";
import { getOwnerDb, userSessions, users } from "@mindkid/db";
import { ReauthRequiredError } from "@mindkid/errors/auth";
import { eq } from "drizzle-orm";
import { createEvent, type H3Event } from "h3";
import { beforeEach, describe, expect, it } from "vitest";
import {
  getUserAuth,
  resetBetterAuthInstancesForTests,
  resolveBetterAuthUserSession,
} from "#server/utils/better-auth";
import {
  markCurrentSessionReauthenticated,
  requireReauth,
} from "#server/utils/reauth-runtime";

const PASSWORD = "StrongPassword123!";
const AUTH_BASE = "http://localhost:3000/api/auth/users";

function eventWithCookie(cookie: string): H3Event {
  return createEvent(
    {
      method: "GET",
      url: "/api/users/password",
      headers: { cookie },
    } as never,
    {
      getHeader: () => undefined,
      setHeader: () => undefined,
    } as never
  );
}

function cookieFrom(res: Response): string {
  return res.headers
    .getSetCookie()
    .map((raw) => raw.split(";")[0]?.trim() ?? "")
    .filter(Boolean)
    .join("; ");
}

async function postAuth(path: string, body: Record<string, string | boolean>) {
  return await getUserAuth().handler(
    new Request(`${AUTH_BASE}${path}`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        origin: "http://localhost:3000",
      },
      body: JSON.stringify(body),
    })
  );
}

async function signUp(email: string): Promise<string> {
  const res = await postAuth("/sign-up/email", {
    name: "Reauth Window",
    email,
    password: PASSWORD,
    accept_terms: true,
    accept_privacy: true,
  });
  return cookieFrom(res);
}

describe("BR-AUT-13/34 — cửa sổ reauth không được suy ra từ createdAt", () => {
  beforeEach(() => {
    setAuthRedisClient(new InMemoryRedisClient());
    resetBetterAuthInstancesForTests();
  });

  it("session khôi phục không có reauthAt phải bị yêu cầu reauth, rồi qua sau khi mark", async () => {
    const email = `reauth-window-${Date.now()}-${Math.floor(Math.random() * 100_000)}@mindkid.test`;
    const cookie = await signUp(email);
    // Mô phỏng session khôi phục: không còn dấu mốc reauth nào.
    const db = getOwnerDb();
    const [owner] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);
    expect(owner).toBeDefined();
    await db
      .update(userSessions)
      .set({ reauthAt: null })
      .where(eq(userSessions.userId, owner?.id ?? -1));
    // Xoá cache session ở secondary storage để buộc đọc lại từ DB.
    setAuthRedisClient(new InMemoryRedisClient());
    resetBetterAuthInstancesForTests();

    const event = eventWithCookie(cookie);
    const resolved = await resolveBetterAuthUserSession(event);
    expect(resolved).not.toBeNull();
    expect(resolved?.reauth_at).toBeUndefined();
    expect(() => requireReauth(event)).toThrow(ReauthRequiredError);

    await markCurrentSessionReauthenticated(event);
    expect(() => requireReauth(event)).not.toThrow();
  });

  it("session tạo bởi sign-up/email và sign-in/email là fresh", async () => {
    const email = `reauth-window-fresh-${Date.now()}-${Math.floor(Math.random() * 100_000)}@mindkid.test`;
    const signUpCookie = await signUp(email);
    const signUpEvent = eventWithCookie(signUpCookie);
    await resolveBetterAuthUserSession(signUpEvent);
    expect(() => requireReauth(signUpEvent)).not.toThrow();

    const signInRes = await postAuth("/sign-in/email", {
      email,
      password: PASSWORD,
    });
    const signInEvent = eventWithCookie(cookieFrom(signInRes));
    await resolveBetterAuthUserSession(signInEvent);
    expect(() => requireReauth(signInEvent)).not.toThrow();
  });
});
