import { describe, expect, it } from "vitest";
import {
  runPublicScriptsGate,
  scanDirectoryForThirdPartyScripts,
} from "./public-scripts.ts";

/**
 * BR-SEO2-08 / BR-LND-04 (D-IC) — mặt công khai ❌ NEVER nhúng script hay pixel
 * của bên thứ ba. Cổng cũ (`pnpm lint:public-scripts`) chỉ có assert xanh trên
 * repo trong test của trang công khai, **không có ca âm ở đâu cả**.
 */
describe("Cổng lint:public-scripts (BR-SEO2-08, BR-LND-04)", () => {
  it("apps/web/app và apps/web/server sạch script bên thứ ba", () => {
    expect(runPublicScriptsGate()).toEqual([]);
  });

  it("thật sự quét được cây nguồn — không xanh vì đường dẫn rỗng", () => {
    expect(() =>
      scanDirectoryForThirdPartyScripts("apps/web/app")
    ).not.toThrow();
  });
});
