import fs from "node:fs";
import { describe, expect, it } from "vitest";
import {
  type ApiSurfaceSource,
  collectApiSurfaceCounts,
  findApiSurfaceRegressions,
} from "./check-api-surface.ts";

const API_SURFACE_COMMAND = /^pnpm check:api-surface &$/m;
const API_SURFACE_WIRING = [
  API_SURFACE_COMMAND,
  /^PID_API_SURFACE=\$!$/m,
  /^if ! wait \$PID_API_SURFACE; then$/m,
] as const;

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
  it("makes the gate red for a route whose handler requires more body size than guards limit", () => {
    const counts = collectApiSurfaceCounts([
      {
        route: {
          file: "users/custom-upload.post.ts",
          path: "/api/users/custom-upload",
          method: "POST",
        },
        source:
          "if (file.length > PROOF_MAX_IMAGE_SIZE_BYTES) throw new PayloadTooLargeError();",
      },
    ]);

    expect(counts.body_size_missing["users/custom-upload.post.ts"]).toBe(1);
  });

  it("passes when route has appropriate pattern limit matching handler requirement", () => {
    const counts = collectApiSurfaceCounts([
      {
        route: {
          file: "users/orders/[uuid]/proof.post.ts",
          path: "/api/users/orders/[uuid]/proof",
          method: "POST",
        },
        source:
          "if (proofFile.data.length > PROOF_MAX_IMAGE_SIZE_BYTES) throw new PayloadTooLargeError();",
      },
    ]);

    expect(counts.body_size_missing).toEqual({});
  });

  it("detects body reads for raw_read_body metric", () => {
    const counts = collectApiSurfaceCounts([
      source("const body = await readBody(requestEvent);"),
    ]);

    expect(counts.raw_read_body["guest/fixture.post.ts"]).toBe(1);
  });

  it("keeps provider webhooks outside the generic body-size metric", () => {
    const counts = collectApiSurfaceCounts([
      {
        route: {
          file: "guest/webhooks/provider.post.ts",
          path: "/api/guest/webhooks/provider",
          method: "POST",
        },
        source: "const body = await readRequestBody(event);",
      },
    ]);

    expect(counts.body_size_missing).toEqual({});
  });

  it("makes the gate red for an in-route same-origin guard", () => {
    const counts = collectApiSurfaceCounts([
      source("assertSameOriginRequest(event);"),
    ]);

    expect(findApiSurfaceRegressions(counts, emptyBaseline())).toEqual([
      "same_origin_in_route · guest/fixture.post.ts: 0 → 1",
    ]);
  });

  it("makes the gate red for a raw schema parse", () => {
    const counts = collectApiSurfaceCounts([
      source("const value = InputSchema.parse(await readBody(event));"),
    ]);

    expect(findApiSurfaceRegressions(counts, emptyBaseline())).toContain(
      "raw_zod_parse · guest/fixture.post.ts: 0 → 1"
    );
  });

  it("makes the gate red for a manager remote-IP call", () => {
    const counts = collectApiSurfaceCounts([
      source("const ip = getManagerRemoteIp(event);"),
    ]);

    expect(findApiSurfaceRegressions(counts, emptyBaseline())).toEqual([
      "manager_remote_ip · guest/fixture.post.ts: 0 → 1",
    ]);
  });

  it("makes the gate red for a raw readBody call", () => {
    const counts = collectApiSurfaceCounts([
      source("const body = await readBody(event);", "GET"),
    ]);

    expect(findApiSurfaceRegressions(counts, emptyBaseline())).toEqual([
      "raw_read_body · guest/fixture.post.ts: 0 → 1",
    ]);
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

  it("allows debt to fall but rejects new files and per-file increases", () => {
    const baseline = emptyBaseline();
    baseline.raw_zod_parse = {
      "guest/existing.post.ts": 2,
    };
    const reduced = emptyBaseline();
    reduced.raw_zod_parse = {
      "guest/existing.post.ts": 1,
    };
    const increased = emptyBaseline();
    increased.raw_zod_parse = {
      "guest/existing.post.ts": 3,
      "guest/new.post.ts": 1,
    };

    expect(findApiSurfaceRegressions(reduced, baseline)).toEqual([]);
    expect(findApiSurfaceRegressions(increased, baseline)).toEqual([
      "raw_zod_parse · guest/existing.post.ts: 2 → 3",
      "raw_zod_parse · guest/new.post.ts: 0 → 1",
    ]);
  });

  it("keeps the gate wired into check.sh", () => {
    const checkScript = fs.readFileSync("scripts/check.sh", "utf8");
    const withoutInvocation = checkScript.replace(
      API_SURFACE_COMMAND,
      "# check:api-surface removed"
    );

    expect(hasApiSurfaceWiring(checkScript)).toBe(true);
    expect(hasApiSurfaceWiring(withoutInvocation)).toBe(false);
  });

  it("makes the gate red for a route not on defineApiRoute factory", () => {
    const counts = collectApiSurfaceCounts([
      source("export default defineEventHandler(async () => {});"),
    ]);

    const zeroBaseline = collectApiSurfaceCounts([]);
    expect(findApiSurfaceRegressions(counts, zeroBaseline)).toEqual([
      "not_on_factory · guest/fixture.post.ts: 0 → 1",
    ]);
  });
});

function emptyBaseline(): ReturnType<typeof collectApiSurfaceCounts> {
  const base = collectApiSurfaceCounts([]);
  base.not_on_factory["guest/fixture.post.ts"] = 1;
  return base;
}

function hasApiSurfaceWiring(checkScript: string): boolean {
  return API_SURFACE_WIRING.every((pattern) => pattern.test(checkScript));
}
