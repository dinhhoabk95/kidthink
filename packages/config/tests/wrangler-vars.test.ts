import { describe, expect, it } from "vitest";
import { ENV_REGISTRY } from "../src/env-contract.js";
import {
  applyWranglerVars,
  collectWranglerVars,
  runtimeVarNames,
} from "../src/wrangler-vars.js";

const WRANGLER = `{
  "name": "x",
  "vars": {
    "MINDKID_RUNTIME": "cloudflare",
    "SITE_URL": "http://old"
  },
  "d1_databases": []
}`;

describe("BR-ENV-18 — biến không bí mật vào wrangler vars", () => {
  it("không bao giờ gồm biến secret", () => {
    const secrets = new Set(
      ENV_REGISTRY.filter((d) => d.secret).map((d) => d.name)
    );
    for (const app of ["web", "worker"] as const) {
      for (const name of runtimeVarNames(app)) {
        expect(secrets.has(name)).toBe(false);
      }
    }
  });

  it("web gồm các biến runtime cốt lõi", () => {
    const names = runtimeVarNames("web");
    for (const name of [
      "SITE_URL",
      "NUXT_ALLOWED_ORIGINS",
      "STORAGE_BASE_URL",
      "PAYMENT_MODE",
      "PAYMENT_MERCHANT_ID",
      "VIETQR_BANK_ID",
    ]) {
      expect(names).toContain(name);
    }
    expect(names).not.toContain("NODE_ENV");
    expect(names).not.toContain("NUXT_SESSION_PASSWORD");
  });

  it("chỉ lấy biến có giá trị, bỏ chuỗi rỗng và biến lạ", () => {
    const vars = collectWranglerVars("web", {
      SITE_URL: " https://mindkid.vn ",
      PAYMENT_MODE: "",
      NUXT_SESSION_PASSWORD: "leak",
      RANDOM: "x",
    });
    expect(vars).toEqual({ SITE_URL: "https://mindkid.vn" });
  });

  it("gộp vào khối vars, giữ biến cũ và ghi đè trùng tên", () => {
    const out = applyWranglerVars(WRANGLER, { SITE_URL: "https://new" });
    const parsed = JSON.parse(out) as { vars: Record<string, string> };
    expect(parsed.vars).toEqual({
      MINDKID_RUNTIME: "cloudflare",
      SITE_URL: "https://new",
    });
    expect(JSON.parse(out)).toHaveProperty("d1_databases");
  });

  it("thiếu khối vars thì ném lỗi", () => {
    expect(() => applyWranglerVars("{}", { A: "b" })).toThrowError("vars");
  });
});
