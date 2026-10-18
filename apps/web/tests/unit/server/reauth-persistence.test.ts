import {
  getBrowserSessionService,
  InMemoryRedisClient,
  setAuthRedisClient,
} from "@mindkid/auth";
import { ReauthRequiredError } from "@mindkid/errors/auth";
import type { H3Event } from "h3";
import { beforeEach, describe, expect, it } from "vitest";
import {
  markCurrentSessionReauthenticated,
  requireReauth,
} from "#server/utils/reauth-runtime";

function eventFrom(context: H3Event["context"]): H3Event {
  return { context } as H3Event;
}

describe("UC-004 BR-022 reauth_at bền giữa các request (R1 G2, R3 gap 1)", () => {
  beforeEach(() => {
    setAuthRedisClient(new InMemoryRedisClient());
  });

  it("reauth ở request 1 còn hiệu lực ở request 2 resolve lại từ Redis", async () => {
    const service = getBrowserSessionService();
    const created = await service.create({
      namespace: "user",
      accountId: 11,
      displayName: "U",
    });

    // Request 1: /api/users/auth/reauth
    const first = await service.resolve("user", created.sessionToken);
    const event1 = eventFrom({ user: first?.user });
    expect(() => requireReauth(event1)).toThrow(ReauthRequiredError);
    await markCurrentSessionReauthenticated(event1);

    // Request 2: đối tượng context mới, chỉ dữ liệu từ Redis.
    const second = await service.resolve("user", created.sessionToken);
    expect(() =>
      requireReauth(eventFrom({ user: second?.user }))
    ).not.toThrow();
  });

  it("reauth hết hiệu lực sau 5 phút", async () => {
    const service = getBrowserSessionService();
    const created = await service.create({
      namespace: "manager",
      accountId: 3,
      displayName: "M",
      role: "super_admin",
    });
    const mark = new Date("2026-10-14T08:00:00Z");
    const first = await service.resolve("manager", created.sessionToken);
    await markCurrentSessionReauthenticated(
      eventFrom({ manager: first?.manager }),
      mark
    );
    const next = await service.resolve("manager", created.sessionToken);
    const event = eventFrom({ manager: next?.manager });
    expect(() =>
      requireReauth(event, new Date(mark.getTime() + 299_000))
    ).not.toThrow();
    expect(() =>
      requireReauth(event, new Date(mark.getTime() + 301_000))
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
