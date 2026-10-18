import { encodeOAuthTicket, type NormalizedProfile } from "@mindkid/auth";
import type { H3Event } from "h3";
import { describe, expect, it } from "vitest";
import { readOAuthTicketProfile } from "#server/utils/oauth-ticket";

const SECRET = process.env.NUXT_SESSION_PASSWORD ?? "";

const PROFILE: NormalizedProfile = {
  provider: "google",
  provider_user_id: "g-1",
  email_at_provider: "victim@example.com",
  email_verified_at_provider: true,
  display_name_at_provider: "V",
};

function eventWithTicket(value: string): H3Event {
  const headers: Record<string, string> = {
    cookie: `tm_oauth_ticket=${value}`,
  };
  return { node: { req: { headers } }, context: {} } as H3Event;
}

describe("UC-028 vé đăng ký MXH (R3 G1)", () => {
  it("chấp nhận vé đã ký", () => {
    const token = encodeOAuthTicket(
      { profile: PROFILE, created_at: Date.now() },
      SECRET
    );
    expect(readOAuthTicketProfile(eventWithTicket(token))).toEqual(PROFILE);
  });

  it("từ chối cookie JSON base64url tự dựng, không có chữ ký", () => {
    const forged = Buffer.from(
      JSON.stringify({ profile: PROFILE, created_at: Date.now() }),
      "utf8"
    ).toString("base64url");
    expect(readOAuthTicketProfile(eventWithTicket(forged))).toBeNull();
  });

  it("từ chối vé đã quá hạn 10 phút", () => {
    const token = encodeOAuthTicket(
      { profile: PROFILE, created_at: Date.now() - 11 * 60 * 1000 },
      SECRET
    );
    expect(readOAuthTicketProfile(eventWithTicket(token))).toBeNull();
  });
});
