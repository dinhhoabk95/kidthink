import { randomBytes } from "node:crypto";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  evaluateBundleBudgets,
  MAX_APP_SHELL_GZIP_BYTES,
  MAX_LEVEL_PAYLOAD_BYTES,
  MAX_PUBLIC_PAGE_GZIP_BYTES,
  MAX_TEMPLATE_CHUNK_GZIP_BYTES,
} from "./check-bundle.ts";

function makeIncompressibleBuffer(targetGzipBytes: number): Buffer {
  // Random hex strings compress at roughly ~0.55x; generate enough random bytes to exceed targetGzipBytes
  return randomBytes(Math.ceil(targetGzipBytes * 1.1));
}

describe("check:bundle — Performance Budgets Gate (BR-PRF-01, BR-ENG-17)", () => {
  it("exposes canonical budget constants matching performance-budgets.md §7.1", () => {
    expect(MAX_TEMPLATE_CHUNK_GZIP_BYTES).toBe(80 * 1024);
    expect(MAX_APP_SHELL_GZIP_BYTES).toBe(180 * 1024);
    expect(MAX_PUBLIC_PAGE_GZIP_BYTES).toBe(500 * 1024);
    expect(MAX_LEVEL_PAYLOAD_BYTES).toBe(200 * 1024);
  });

  it("passes when chunks, app shell, public page, and level payload are within budget", () => {
    const tempRoot = mkdtempSync(join(tmpdir(), "mk-bundle-ok-"));
    try {
      const webNuxt = join(tempRoot, "web/public/_nuxt");
      const adminNuxt = join(tempRoot, "admin/public/_nuxt");
      mkdirSync(webNuxt, { recursive: true });
      mkdirSync(adminNuxt, { recursive: true });

      writeFileSync(join(webNuxt, "entry.js"), "console.log('entry');");
      writeFileSync(join(webNuxt, "entry.css"), "body { margin: 0; }");
      writeFileSync(join(webNuxt, "gt-001.js"), "export const s = 1;");
      writeFileSync(join(adminNuxt, "entry.js"), "console.log('admin');");
      writeFileSync(
        join(tempRoot, "admin/public/index.html"),
        '<link rel="modulepreload" href="/_nuxt/entry.js">'
      );

      const report = evaluateBundleBudgets({
        webOutputDir: join(tempRoot, "web"),
        adminOutputDir: join(tempRoot, "admin"),
        precomputed: {
          entrypoints: ["entry"],
          dependencies: {
            entry: {
              preload: {
                e1: { file: "entry.js", resourceType: "script" },
                e2: { file: "entry.css", resourceType: "style" },
              },
            },
            "templates/GT-001/session.ts": {
              preload: {
                t1: { file: "gt-001.js", resourceType: "script" },
              },
            },
          },
        },
        levelPayloads: [
          {
            code: "GL-C1-CNT-0001",
            payload: { code: "GL-C1-CNT-0001", items: [1, 2, 3] },
          },
        ],
      });

      expect(report.passed).toBe(true);
      expect(report.violations).toEqual([]);
    } finally {
      rmSync(tempRoot, { recursive: true, force: true });
    }
  });

  it("negative test: fails when a template chunk or app shell or public page or level payload exceeds budget", () => {
    const tempRoot = mkdtempSync(join(tmpdir(), "mk-bundle-fail-"));
    try {
      const webNuxt = join(tempRoot, "web/public/_nuxt");
      mkdirSync(webNuxt, { recursive: true });

      // 1 chunk > 80 KB gzip, total > 500 KB gzip, shell > 180 KB gzip
      const chunkA = makeIncompressibleBuffer(95 * 1024);
      const chunkB = makeIncompressibleBuffer(95 * 1024);
      const styleC = makeIncompressibleBuffer(350 * 1024);

      writeFileSync(join(webNuxt, "entry-a.js"), chunkA);
      writeFileSync(join(webNuxt, "entry-b.js"), chunkB);
      writeFileSync(join(webNuxt, "entry.css"), styleC);

      const report = evaluateBundleBudgets({
        webOutputDir: join(tempRoot, "web"),
        adminOutputDir: join(tempRoot, "admin-missing"),
        precomputed: {
          entrypoints: ["entry"],
          dependencies: {
            entry: {
              preload: {
                a: { file: "entry-a.js" },
                b: { file: "entry-b.js" },
              },
            },
          },
        },
        levelPayloads: [
          {
            code: "GL-OVER-200KB",
            payload: "x".repeat(205 * 1024),
          },
        ],
      });

      expect(report.passed).toBe(false);
      const categories = new Set(report.violations.map((v) => v.category));
      expect(categories.has("template_chunk")).toBe(true);
      expect(categories.has("web_app_shell")).toBe(true);
      expect(categories.has("public_page")).toBe(true);
      expect(categories.has("level_payload")).toBe(true);
    } finally {
      rmSync(tempRoot, { recursive: true, force: true });
    }
  });
});
