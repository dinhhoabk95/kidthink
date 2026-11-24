import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  readSensitiveRoutes,
  SENSITIVE_ROUTES,
  scanReauthRoutes,
} from "./reauth-sensitive-routes.ts";

const FIXTURE_DIR = resolve(
  import.meta.dirname,
  "fixtures/reauth-sensitive-routes"
);

function fixtureSource(name: string, text: string | null) {
  return [
    {
      path: `apps/web/server/api/users/password.post.ts (${name})`,
      rule: "BR-ACS-01",
      text,
    },
  ];
}

describe("BR-AUT-13 — route nhạy cảm phải gọi requireReauth", () => {
  it("mọi route trong danh sách đều tồn tại và gọi requireReauth", () => {
    const sources = readSensitiveRoutes();
    expect(sources).toHaveLength(SENSITIVE_ROUTES.length);
    expect(scanReauthRoutes(sources)).toEqual([]);
  });

  it("ca âm: route thiếu requireReauth (chỉ nhắc trong comment) thì đỏ", () => {
    const text = readFileSync(`${FIXTURE_DIR}/missing-reauth.txt`, "utf8");
    const violations = scanReauthRoutes(fixtureSource("thiếu", text));
    expect(violations).toHaveLength(1);
    expect(violations[0]?.reason).toContain("BR-ACS-01");
  });

  it("ca dương: route có gọi requireReauth thì xanh", () => {
    const text = readFileSync(`${FIXTURE_DIR}/with-reauth.txt`, "utf8");
    expect(scanReauthRoutes(fixtureSource("đủ", text))).toEqual([]);
  });

  it("ca âm: route trong danh sách bị xoá/đổi tên thì đỏ, không xanh giả", () => {
    const violations = scanReauthRoutes(fixtureSource("mất", null));
    expect(violations).toHaveLength(1);
    expect(violations[0]?.reason).toContain("không còn tồn tại");
  });
});
