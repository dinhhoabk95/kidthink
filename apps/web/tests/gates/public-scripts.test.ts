import { join } from "node:path";
import { REPO_ROOT } from "@mindkid/config/paths";
import { describe, expect, it } from "vitest";
import {
  runPublicScriptsGate,
  scanDirectoryForThirdPartyScripts,
} from "./public-scripts.ts";

const FIXTURE_DIR = join(
  REPO_ROOT,
  "apps/web/tests/gates/fixtures/public-scripts"
);

/**
 * BR-SEO2-08 / BR-LND-04 (D-IC) / BR-CDC-08 — mặt công khai ❌ NEVER nhúng script
 * hay pixel của bên thứ ba.
 */
describe("Cổng lint:public-scripts (BR-SEO2-08, BR-LND-04, BR-CDC-08)", () => {
  it("apps/web/app và apps/web/server sạch script bên thứ ba", () => {
    expect(runPublicScriptsGate()).toEqual([]);
  });

  it("thật sự quét được cây nguồn — không xanh vì đường dẫn rỗng", () => {
    expect(() =>
      scanDirectoryForThirdPartyScripts("apps/web/app")
    ).not.toThrow();
  });

  it("ca âm: script Google Analytics trong trang /play/ làm cổng đỏ", () => {
    const violations = scanDirectoryForThirdPartyScripts(FIXTURE_DIR);
    const reasons = violations.map((v) => v.reason);
    expect(reasons).toContain("External script tag");
    expect(reasons).toContain("Google Analytics / GTM tracking pixel");
  });
});
