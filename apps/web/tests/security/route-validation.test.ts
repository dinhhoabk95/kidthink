import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
  findUnvalidatedRoutes,
  stripCommentsAndStrings,
} from "./route-validation.ts";

describe("route-validation gate (BR-SEC-04)", () => {
  const tempDirs: string[] = [];

  function createTempApiRoot(): string {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "mindkid-route-val-"));
    tempDirs.push(dir);
    return dir;
  }

  afterEach(() => {
    for (const dir of tempDirs.splice(0, tempDirs.length)) {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it("pass 100% trên toàn bộ apps/web/server/api (body, query, params)", () => {
    expect(findUnvalidatedRoutes()).toEqual([]);
  });

  it("bắt vi phạm khi route đọc body mà không Zod parse (ca âm)", () => {
    const dir = createTempApiRoot();
    fs.writeFileSync(
      path.join(dir, "bad-body.post.ts"),
      `export default defineEventHandler(async (event) => {
        // .safeParse( trong comment không được tính
        const body = await readBody(event);
        return body;
      });`
    );

    const findings = findUnvalidatedRoutes([dir]);
    expect(findings).toHaveLength(1);
    expect(findings[0]?.reason).toContain("đọc body");
  });

  it("bắt vi phạm khi route đọc query mà không Zod parse (ca âm)", () => {
    const dir = createTempApiRoot();
    fs.writeFileSync(
      path.join(dir, "bad-query.get.ts"),
      `export default defineEventHandler(async (event) => {
        const query = getQuery(event);
        return { q: query.q };
      });`
    );

    const findings = findUnvalidatedRoutes([dir]);
    expect(findings).toHaveLength(1);
    expect(findings[0]?.reason).toContain("đọc query");
  });

  it("bắt vi phạm khi route đọc router params mà không validate (ca âm)", () => {
    const dir = createTempApiRoot();
    fs.writeFileSync(
      path.join(dir, "bad-param.get.ts"),
      `export default defineEventHandler(async (event) => {
        const id = getRouterParam(event, "id");
        return { id };
      });`
    );

    const findings = findUnvalidatedRoutes([dir]);
    expect(findings).toHaveLength(1);
    expect(findings[0]?.reason).toContain("đọc params");
  });

  it("stripCommentsAndStrings loại bỏ comment và string literal trước khi đo", () => {
    const stripped = stripCommentsAndStrings(
      `// .safeParse(foo)\nconst msg = ".safeParse(bar)";`
    );
    expect(stripped).not.toContain("safeParse");
  });
});
