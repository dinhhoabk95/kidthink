import crypto from "node:crypto";
import { describe, expect, it } from "vitest";
import {
  decodeOAuthTicket,
  encodeOAuthTicket,
  type NormalizedProfile,
  OAUTH_TICKET_TTL_SECONDS,
} from "#src/index";

const SECRET = "ticket_secret_for_tests_0123456789abcdef";

const PROFILE: NormalizedProfile = {
  provider: "google",
  provider_user_id: "g-123",
  email_at_provider: "parent@example.com",
  email_verified_at_provider: true,
  display_name_at_provider: "Parent",
};

describe("UC-028 vé đăng ký MXH được ký và có hạn", () => {
  it("giải mã được vé hợp lệ trong hạn", () => {
    const now = Date.now();
    const token = encodeOAuthTicket(
      { profile: PROFILE, created_at: now },
      SECRET
    );
    const decoded = decodeOAuthTicket(token, SECRET, now + 1000);
    expect(decoded?.profile).toEqual(PROFILE);
  });

  it("từ chối cookie base64url(JSON) không ký (kịch bản giả mạo R3 G1)", () => {
    const forged = Buffer.from(
      JSON.stringify({
        profile: { ...PROFILE, email_at_provider: "victim@example.com" },
        created_at: Date.now(),
      }),
      "utf8"
    ).toString("base64url");
    expect(decodeOAuthTicket(forged, SECRET)).toBeNull();
  });

  it("từ chối vé bị sửa nội dung nhưng giữ chữ ký cũ", () => {
    const now = Date.now();
    const token = encodeOAuthTicket(
      { profile: PROFILE, created_at: now },
      SECRET
    );
    const signature = token.split(".")[1] ?? "";
    const tampered = Buffer.from(
      JSON.stringify({
        profile: { ...PROFILE, email_at_provider: "victim@example.com" },
        created_at: now,
      }),
      "utf8"
    ).toString("base64url");
    expect(decodeOAuthTicket(`${tampered}.${signature}`, SECRET)).toBeNull();
  });

  it("từ chối vé ký bằng khoá khác", () => {
    const now = Date.now();
    const token = encodeOAuthTicket(
      { profile: PROFILE, created_at: now },
      "other_secret"
    );
    expect(decodeOAuthTicket(token, SECRET, now)).toBeNull();
  });

  it("từ chối vé quá hạn 10 phút", () => {
    const now = Date.now();
    const token = encodeOAuthTicket(
      { profile: PROFILE, created_at: now },
      SECRET
    );
    const late = now + (OAUTH_TICKET_TTL_SECONDS + 1) * 1000;
    expect(decodeOAuthTicket(token, SECRET, late)).toBeNull();
  });

  it("từ chối vé có created_at ở tương lai", () => {
    const now = Date.now();
    const token = encodeOAuthTicket(
      { profile: PROFILE, created_at: now + 60_000 },
      SECRET
    );
    expect(decodeOAuthTicket(token, SECRET, now)).toBeNull();
  });

  it("từ chối vé ký đúng nhưng provider ngoài danh sách đóng", () => {
    const now = Date.now();
    const data = JSON.stringify({
      profile: { ...PROFILE, provider: "apple" },
      created_at: now,
    });
    const hmac = crypto
      .createHmac("sha256", SECRET)
      .update(data)
      .digest("base64url");
    const token = `${Buffer.from(data, "utf8").toString("base64url")}.${hmac}`;
    expect(decodeOAuthTicket(token, SECRET, now)).toBeNull();
  });
});
