import { describe, expect, it } from "vitest";
import {
  type ApiRoute,
  computeRouteClassCoverage,
  listApiRoutes,
} from "./rate-limit-coverage.ts";

const routes = listApiRoutes();

describe("BR-RTL-10: every API route resolves to a rate limit class", () => {
  it("finds the real route tree", () => {
    expect(routes.length).toBeGreaterThan(200);
  });

  it("no two route files claim the same method and path", () => {
    // Hai file cùng path thì Nitro chỉ đăng ký một, file kia là mã chết và
    // không ai biết handler nào đang chạy. `managers/audit-logs.get.ts` từng là
    // một shim re-export trùng path với `managers/audit-logs/index.get.ts`.
    const byKey = new Map<string, string[]>();
    for (const route of routes) {
      const key = `${route.method} ${route.path}`;
      byKey.set(key, [...(byKey.get(key) ?? []), route.file]);
    }
    const duplicates = [...byKey.entries()].filter(
      ([, files]) => files.length > 1
    );
    expect(duplicates).toEqual([]);
  });

  it("no route falls through to an unlimited branch", () => {
    const { resolutions } = computeRouteClassCoverage(routes);
    const unresolved = [...resolutions.entries()].filter(
      ([, resolution]) => resolution === undefined
    );
    expect(unresolved).toEqual([]);
    expect(resolutions.size).toBe(routes.length);
  });

  it("every route class in the registry has at least one real route", () => {
    const { deadClasses } = computeRouteClassCoverage(routes);
    expect(deadClasses).toEqual([]);
  });

  it("the eight classes that had zero call sites are now reachable", () => {
    const { coveredClasses } = computeRouteClassCoverage(routes);
    for (const className of [
      "auth:refresh",
      "payment:create",
      "payment:proof",
      "upload:image",
      "export:data",
      "play:events",
      "search",
      "read:public",
      "managers:*",
    ]) {
      expect(coveredClasses.has(className)).toBe(true);
    }
  });

  it("negative case — the gate reports a class no route reaches", () => {
    const onlyGuest: ApiRoute[] = [
      { file: "guest/home.get.ts", path: "/api/guest/home", method: "GET" },
    ];
    const { deadClasses } = computeRouteClassCoverage(onlyGuest);
    expect(deadClasses).toContain("payment:create");
    expect(deadClasses).toContain("export:data");
    expect(deadClasses).not.toContain("read:public");
  });

  it("exempt routes carry a reason from the closed list in §7.2", () => {
    const { resolutions } = computeRouteClassCoverage(routes);
    const allowed = new Set([
      "not-api",
      "provider-webhook",
      "health-probe",
      "unclassified-user-route",
    ]);
    for (const [key, resolution] of resolutions) {
      if (resolution.mode === "exempt") {
        expect(allowed.has(resolution.reason), key).toBe(true);
      }
    }
  });
});
