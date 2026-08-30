import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { scanRuntimeBoundary } from "./runtime-boundary.ts";

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

  it("ca âm 4: detects page outside login without auth middleware", () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "gate-test-4-"));
    const pagesDir = path.join(tempDir, "pages");
    fs.mkdirSync(pagesDir, { recursive: true });
    const file = path.join(pagesDir, "unprotected.vue");
    fs.writeFileSync(
      file,
      "<template><div>Secret Manager Page</div></template>"
    );

    const violations = scanRuntimeBoundary(tempDir);
    expect(violations.length).toBeGreaterThan(0);
    expect(violations[0].reason).toContain(
      "Admin pages outside login must define auth guard middleware"
    );
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
