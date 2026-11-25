import { describe, expect, it } from "vitest";
import {
  LOGIN_FAILED_MESSAGE,
  mapLoginError,
  validateEmailField,
  validatePasswordField,
  validateRegisterForm,
} from "../../app/utils/auth-form";

describe("auth-form (BR-LGN-14, BR-REG-12)", () => {
  it("map lỗi thông tin đăng nhập sang tiếng Việt, không lộ tiếng Anh", () => {
    expect(mapLoginError({ code: "INVALID_EMAIL_OR_PASSWORD" })).toBe(
      LOGIN_FAILED_MESSAGE
    );
    expect(mapLoginError({ code: "USER_NOT_FOUND" })).toBe(
      LOGIN_FAILED_MESSAGE
    );
    expect(mapLoginError(null)).toBe(LOGIN_FAILED_MESSAGE);
    expect(mapLoginError({ status: 429 })).toContain("quá nhiều lần");
    expect(mapLoginError({ code: "EMAIL_NOT_VERIFIED" })).toContain("xác minh");
  });

  it("kiểm email và mật khẩu", () => {
    expect(validateEmailField("")).toContain("nhập email");
    expect(validateEmailField("abc")).toContain("định dạng");
    expect(validateEmailField("a@b.co")).toBe("");
    expect(validatePasswordField("", false)).toContain("nhập mật khẩu");
    expect(validatePasswordField("short", true)).toContain("8 ký tự");
    expect(validatePasswordField("short", false)).toBe("");
  });

  it("form đăng ký trống chỉ ra đủ năm trường", () => {
    const errors = validateRegisterForm({
      name: "",
      email: "",
      password: "",
      acceptTerms: false,
      acceptPrivacy: false,
    });
    expect(Object.keys(errors).sort()).toEqual([
      "acceptPrivacy",
      "acceptTerms",
      "email",
      "name",
      "password",
    ]);
    expect(
      validateRegisterForm({
        name: "Mẹ Bơ",
        email: "a@b.co",
        password: "12345678",
        acceptTerms: true,
        acceptPrivacy: true,
      })
    ).toEqual({});
  });
});
