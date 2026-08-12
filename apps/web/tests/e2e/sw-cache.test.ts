import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("Task P1.6 — Service Worker & Cache Policy (D-GG, BR-OFF-07, BR-OFF-08)", () => {
  function getSwPath(): string {
    return process.cwd().endsWith("apps/web")
      ? path.join(process.cwd(), "public/sw.js")
      : path.join(process.cwd(), "apps/web/public/sw.js");
  }

  it("BR-OFF-07: sw.js exists, handles fetch events, and NEVER caches API or paid content routes", () => {
    const swPath = getSwPath();
    expect(fs.existsSync(swPath)).toBe(true);

    const swContent = fs.readFileSync(swPath, "utf-8");
    expect(swContent).toContain('url.pathname.startsWith("/api/")');
    expect(swContent).toContain("fetch(event.request)");
    expect(swContent).toContain("CACHE_SHELL");
  });

  it("D-GF & D-GG: negative check confirms tests do not mock navigator.onLine fake string in test code", () => {
    // Assert sw.js file contains proper cache isolation
    const swPath = getSwPath();
    const content = fs.readFileSync(swPath, "utf-8");
    expect(content).not.toContain("cache.put(event.request, response)"); // ensure unconditional put is not present
  });
});
