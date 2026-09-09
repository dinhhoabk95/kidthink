import fs from "node:fs";
import { describe, expect, it } from "vitest";
import {
  type ApiSurfaceSource,
  collectApiSurfaceCounts,
} from "./check-api-surface.ts";

function source(
  body: string,
  method: "GET" | "POST" = "POST"
): ApiSurfaceSource {
  return {
    route: {
      file: "guest/fixture.post.ts",
      path: "/api/guest/fixture",
      method,
    },
    source: body,
  };
}

describe("check:api-surface", () => {
  it("reports a mutating route that reads a body without a size guard", () => {
    const counts = collectApiSurfaceCounts([
      source(
        "export default defineEventHandler(async (event) => readBody(event));"
      ),
    ]);

    expect(counts.body_size_missing["guest/fixture.post.ts"]).toBe(1);
  });

  it("reports a raw schema parse", () => {
    const counts = collectApiSurfaceCounts([
      source("const value = InputSchema.parse(await readBody(event));"),
    ]);

    expect(counts.raw_zod_parse["guest/fixture.post.ts"]).toBe(1);
  });

  it("reports manager remote IP call sites", () => {
    const counts = collectApiSurfaceCounts([
      source("const ip = getManagerRemoteIp(event);"),
    ]);

    expect(counts.manager_remote_ip["guest/fixture.post.ts"]).toBe(1);
  });

  it("does not treat comments as body-guard evidence", () => {
    const withoutComment = collectApiSurfaceCounts([
      source("const body = await readBody(event);"),
    ]);
    const withComment = collectApiSurfaceCounts([
      source(
        "// assertRequestBodySize(event)\nconst body = await readBody(event);"
      ),
    ]);

    expect(withComment.body_size_missing).toEqual(
      withoutComment.body_size_missing
    );
  });

  it("keeps the gate wired into check.sh", () => {
    const checkScript = fs.readFileSync("scripts/check.sh", "utf8");

    expect(checkScript).toContain("check:api-surface");
  });
});
