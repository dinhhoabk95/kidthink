import { describe, expect, it } from "vitest";
import { formatSecurityAuthMethod } from "~/utils/security-session-format";

describe("formatSecurityAuthMethod (BR-LGN-10)", () => {
  it("nhận enum số từ cột auth_method mà không ném lỗi", () => {
    expect(formatSecurityAuthMethod({ id: "a", authMethod: 1 })).toBe(
      "Mật khẩu"
    );
    expect(formatSecurityAuthMethod({ id: "b", authMethod: 2 })).toBe(
      "Mạng xã hội"
    );
    expect(formatSecurityAuthMethod({ id: "c", auth_method: 3 })).toBe(
      "Passkey"
    );
  });

  it("vẫn nhận chuỗi và mặc định Mật khẩu khi thiếu", () => {
    expect(formatSecurityAuthMethod({ id: "d", authMethod: "Google" })).toBe(
      "Google"
    );
    expect(formatSecurityAuthMethod({ id: "e" })).toBe("Mật khẩu");
  });
});
