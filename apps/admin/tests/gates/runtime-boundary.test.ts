import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  checkGlobalAuthGuard,
  scanRuntimeBoundary,
} from "./runtime-boundary.ts";

describe("Admin Runtime Boundary Gate (BR-ARB-04)", () => {
  it("passes on real apps/admin codebase without boundary violations", () => {
    const adminAppDir = path.resolve(import.meta.dirname, "../../app");
    const violations = scanRuntimeBoundary(adminAppDir);
    expect(violations).toEqual([]);
  });

  it("ca âm 1: detects direct fetch('/api/...')", () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "gate-test-1-"));
    const file = path.join(tempDir, "BadComponent.vue");
    fs.writeFileSync(
      file,
      `<script setup>\nconst data = await fetch("/api/managers/users");\n</script>`
    );

    const violations = scanRuntimeBoundary(tempDir);
    expect(violations.length).toBeGreaterThan(0);
    expect(violations[0].reason).toContain("Direct fetch to /api/ forbidden");
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it("ca âm 2: detects raw template literal URL in href without apiUrl()", () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "gate-test-2-"));
    const file = path.join(tempDir, "BadTemplate.vue");
    fs.writeFileSync(
      file,
      '<template><a :href="`/api/managers/export`">Export</a></template>'
    );

    const violations = scanRuntimeBoundary(tempDir);
    expect(violations.length).toBeGreaterThan(0);
    expect(violations[0].reason).toContain(
      "Direct /api/ URL in href/src forbidden"
    );
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it("ca âm 3: detects window.open with /api/ not wrapped in apiUrl()", () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "gate-test-3-"));
    const file = path.join(tempDir, "BadOpen.vue");
    fs.writeFileSync(
      file,
      "<button @click=\"window.open('/api/export')\">Export</button>"
    );

    const violations = scanRuntimeBoundary(tempDir);
    expect(violations.length).toBeGreaterThan(0);
    expect(violations[0].reason).toContain(
      "window.open with direct /api/ forbidden"
    );
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it("ca âm 4: detects interpolated api URL built by interpolation", () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "gate-test-4-"));
    fs.writeFileSync(
      path.join(tempDir, "Interpolated.vue"),
      [
        "<script setup>",
        "const u = `",
        "$",
        "{base}/api/managers/export`;",
        "</script>",
      ].join("")
    );

    const violations = scanRuntimeBoundary(tempDir);
    expect(violations.some((v) => v.reason.includes("nội suy"))).toBe(true);
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it("guard thật: apps/admin có middleware toàn cục đưa về /login", () => {
    const dir = path.resolve(import.meta.dirname, "../../app/middleware");
    expect(checkGlobalAuthGuard(dir).ok).toBe(true);
  });

  it("ca âm: không có middleware `.global.` nào → đỏ", () => {
    // Luật cũ kiểm `definePageMeta` trên từng trang — một mô hình app này không
    // dùng — và rút gọn thành luôn-đúng, nên nó Cấm — NEVER đỏ được.
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "gate-guard-"));
    fs.mkdirSync(path.join(tempDir, "middleware"), { recursive: true });
    fs.writeFileSync(
      path.join(tempDir, "middleware", "auth.ts"),
      "export default () => undefined;"
    );

    const result = checkGlobalAuthGuard(path.join(tempDir, "middleware"));
    expect(result.ok).toBe(false);
    expect(result.reason).toContain("global");
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it("ca âm: middleware toàn cục không chuyển hướng /login → đỏ", () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "gate-guard2-"));
    fs.mkdirSync(path.join(tempDir, "middleware"), { recursive: true });
    fs.writeFileSync(
      path.join(tempDir, "middleware", "noop.global.ts"),
      "export default () => undefined;"
    );

    const result = checkGlobalAuthGuard(path.join(tempDir, "middleware"));
    expect(result.ok).toBe(false);
    expect(result.reason).toContain("/login");
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it("ca âm 5: fails closed on empty directory", () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "gate-test-5-"));
    expect(() => scanRuntimeBoundary(tempDir)).toThrow(
      "Target directory is empty or contains no code files"
    );
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it("reports all matches instead of stopping at first match", () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "gate-test-multi-"));
    const file = path.join(tempDir, "MultipleBadCalls.vue");
    fs.writeFileSync(
      file,
      `<script setup>
const res1 = await fetch("/api/one");
const res2 = await fetch("/api/two");
window.open("/api/three");
</script>`
    );

    const violations = scanRuntimeBoundary(tempDir);
    expect(violations.length).toBe(3);
    fs.rmSync(tempDir, { recursive: true, force: true });
  });
});
