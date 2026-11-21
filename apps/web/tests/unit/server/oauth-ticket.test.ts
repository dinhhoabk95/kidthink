import {
  consumeSocialSignupConsentTicket,
  createSocialSignupConsentTicket,
  InMemoryRedisClient,
  SOCIAL_SIGNUP_CONSENT_COOKIE,
  setAuthRedisClient,
} from "@mindkid/auth";
import { createEvent, getResponseHeader } from "h3";
import { beforeEach, describe, expect, it } from "vitest";
import socialConsentHandler from "#server/api/guest/auth/users/social-consent.post";

describe("UC-028 vé đồng ý đăng ký MXH qua Better Auth (BR-SCL-01, BR-SCL-12)", () => {
  let redis: InMemoryRedisClient;

  beforeEach(() => {
    redis = new InMemoryRedisClient();
    setAuthRedisClient(redis);
  });

  it("chấp nhận vé hợp lệ đúng một lần duy nhất (one-time consume)", async () => {
    const token = await createSocialSignupConsentTicket(redis, {
      termsRequirementAt: null,
      privacyRequirementAt: null,
      ipAddress: "127.0.0.1",
      userAgent: "VitestBrowser/1.0",
    });

    const first = await consumeSocialSignupConsentTicket(redis, token);
    expect(first).toEqual({
      termsRequirementAt: null,
      privacyRequirementAt: null,
      ipAddress: "127.0.0.1",
      userAgent: "VitestBrowser/1.0",
    });

    const second = await consumeSocialSignupConsentTicket(redis, token);
    expect(second).toBeNull();
  });

  it("từ chối vé giả mạo hoặc rỗng", async () => {
    expect(await consumeSocialSignupConsentTicket(redis, null)).toBeNull();
    expect(
      await consumeSocialSignupConsentTicket(redis, "forged-token-value")
    ).toBeNull();
  });

  it("POST /api/guest/auth/users/social-consent cấp cookie HttpOnly tm_ba_signup_consent", async () => {
    const resHeaders = new Map<string, string | string[]>();
    const body = {
      accept_terms: true,
      accept_privacy: true,
      terms_requirement_at: null,
      privacy_requirement_at: null,
    };
    const event = createEvent(
      {
        method: "POST",
        url: "/api/guest/auth/users/social-consent",
        headers: {
          host: "localhost:3000",
          origin: "http://localhost:3000",
          "user-agent": "VitestBrowser/1.0",
        },
        socket: { remoteAddress: "127.0.0.1" },
      } as never,
      {
        statusCode: 200,
        getHeader: (k: string) => resHeaders.get(k.toLowerCase()),
        setHeader: (k: string, v: string | string[]) => {
          resHeaders.set(k.toLowerCase(), v);
        },
        removeHeader: (k: string) => resHeaders.delete(k.toLowerCase()),
      } as never
    );
    event.context.body = body;

    const res = await socialConsentHandler(event);
    expect(res).toEqual({ ok: true });

    const setCookie = String(getResponseHeader(event, "set-cookie") ?? "");
    expect(setCookie).toContain(`${SOCIAL_SIGNUP_CONSENT_COOKIE}=`);
    expect(setCookie).toContain("HttpOnly");
  });
});
