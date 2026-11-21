import { InMemoryRedisClient, setAuthRedisClient } from "@mindkid/auth";
import { ReauthRequiredError } from "@mindkid/errors/auth";
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

function eventFrom(context: H3Event["context"]): H3Event {
  return { context } as H3Event;
}

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

describe("UC-004 BR-022 reauth_at bền giữa các request qua Better Auth + Valkey", () => {
  beforeEach(() => {
    setAuthRedisClient(new InMemoryRedisClient());
    resetBetterAuthInstancesForTests();
  });

  it("reauth ở request 1 còn hiệu lực ở request 2 resolve lại từ Better Auth & hết hạn sau 5 phút", async () => {
    const email = `reauth-persist-${Date.now()}-${Math.floor(Math.random() * 100_000)}@mindkid.test`;
    const signUpRes = await getUserAuth().handler(
      new Request("http://localhost:3000/api/auth/users/sign-up/email", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          origin: "http://localhost:3000",
        },
        body: JSON.stringify({
          name: "Reauth User",
          email,
          password: "StrongPassword123!",
          accept_terms: true,
          accept_privacy: true,
        }),
      })
    );
    const cookie = signUpRes.headers
      .getSetCookie()
      .map((raw) => raw.split(";")[0]?.trim() ?? "")
      .filter(Boolean)
      .join("; ");

    const req1 = eventWithCookie(cookie);
    const resolved1 = await resolveBetterAuthUserSession(req1);
    expect(resolved1).not.toBeNull();

    const mark = new Date("2026-10-14T08:00:00Z");
    await markCurrentSessionReauthenticated(req1, mark);

    const req2 = eventWithCookie(cookie);
    await resolveBetterAuthUserSession(req2);

    expect(() =>
      requireReauth(req2, new Date(mark.getTime() + 299_000))
    ).not.toThrow();
    expect(() =>
      requireReauth(req2, new Date(mark.getTime() + 301_000))
    ).toThrow(ReauthRequiredError);
  });

  it("không tin giá trị tự nhét vào event.context cấp cao nhất", () => {
    const event = eventFrom({
      user: { user_id: 1, display_name: "U", session_id: "s" },
    });
    Object.assign(event.context, { reauth_at: new Date() });
    expect(() => requireReauth(event)).toThrow(ReauthRequiredError);
  });
});
