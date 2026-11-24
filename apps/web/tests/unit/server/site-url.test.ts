import { afterEach, describe, expect, it } from "vitest";
import { resolveSiteUrl } from "../../../server/utils/site-url.js";

const ORIGINAL = {
  SITE_URL: process.env.SITE_URL,
  NODE_ENV: process.env.NODE_ENV,
  MINDKID_RUNTIME: process.env.MINDKID_RUNTIME,
};

function restore(name: keyof typeof ORIGINAL): void {
  const value = ORIGINAL[name];
  if (value === undefined) {
    Reflect.deleteProperty(process.env, name);
  } else {
    process.env[name] = value;
  }
}

afterEach(() => {
  restore("SITE_URL");
  restore("NODE_ENV");
  restore("MINDKID_RUNTIME");
});

describe("BR-ENV-17 — SITE_URL không fallback localhost ở production/Cloudflare", () => {
  it("Cloudflare runtime thiếu SITE_URL thì ném lỗi rõ ràng", () => {
    Reflect.deleteProperty(process.env, "SITE_URL");
    process.env.MINDKID_RUNTIME = "cloudflare";
    expect(() => resolveSiteUrl()).toThrowError("SITE_URL");
  });

  it("NODE_ENV=production thiếu SITE_URL thì ném lỗi", () => {
    Reflect.deleteProperty(process.env, "SITE_URL");
    Reflect.deleteProperty(process.env, "MINDKID_RUNTIME");
    process.env.NODE_ENV = "production";
    expect(() => resolveSiteUrl()).toThrowError("SITE_URL");
  });

  it("dev/test thiếu SITE_URL vẫn dùng localhost", () => {
    Reflect.deleteProperty(process.env, "SITE_URL");
    Reflect.deleteProperty(process.env, "MINDKID_RUNTIME");
    process.env.NODE_ENV = "test";
    expect(resolveSiteUrl()).toBe("http://localhost:3000");
  });

  it("cắt dấu / cuối", () => {
    process.env.SITE_URL = "https://mindkid.test/";
    expect(resolveSiteUrl()).toBe("https://mindkid.test");
  });
});
