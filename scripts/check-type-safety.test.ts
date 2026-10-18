import fs from "node:fs";
import path from "node:path";
import { repoPath } from "@mindkid/config/paths";
import { describe, expect, it } from "vitest";
import {
  scanRepoTypeSafety,
  scanTypeSafetyInSource,
  type TypeSafetyBaseline,
  verifyTypeSafetyAgainstBaseline,
} from "./check-type-safety.ts";

describe("Cổng check-type-safety (Task #310 S7, BR-TYP-01..08)", () => {
  it("Ca âm BR-TYP-01: phát hiện any tường minh và @ts-ignore / @ts-expect-error trong production code", () => {
    const sample = [
      "// @ts-ignore",
      "export function parseInput(payload: any): number {",
      "  /* @ts-expect-error legacy */",
      "  return Number(payload);",
      "}",
    ].join("\n");

    const res = scanTypeSafetyInSource(sample, "apps/web/server/sample.ts");
    expect(res.counts.tsDirectives).toBe(2);
    expect(res.counts.explicitAny).toBe(1);
    expect(res.issues.map((i) => i.rule)).toEqual([
      "BR-TYP-01",
      "BR-TYP-01",
      "BR-TYP-01",
    ]);
  });

  it("Ca âm BR-TYP-08: phát hiện any tường minh trong file test (*.test.ts)", () => {
    const sample = [
      'import { it } from "vitest";',
      "function helper(mock: any): void {",
      "  return void mock;",
      "}",
    ].join("\n");

    const res = scanTypeSafetyInSource(
      sample,
      "apps/web/tests/unit/sample.test.ts"
    );
    expect(res.counts.explicitAny).toBe(1);
    expect(res.issues[0]?.rule).toBe("BR-TYP-08");
    expect(res.issues[0]?.kind).toBe("test-any");
  });

  it("Ca âm BR-TYP-02 & BR-TYP-03: phân biệt ép kiểu 'as unknown as' và khai báo 'unknown' mới", () => {
    const sample = [
      "export function handle(input: unknown): string {",
      "  const casted = input as unknown as string;",
      "  try {",
      "    return casted;",
      "  } catch (err) {",
      '    return "fallback";',
      "  }",
      "}",
    ].join("\n");

    const res = scanTypeSafetyInSource(sample, "packages/shared/src/sample.ts");
    expect(res.counts.unknownDeclarations).toBe(1);
    expect(res.counts.asUnknownAs).toBe(1);
    expect(res.issues.find((i) => i.kind === "unknown-declaration")?.rule).toBe(
      "BR-TYP-03"
    );
    expect(res.issues.find((i) => i.kind === "as-unknown-as")?.rule).toBe(
      "BR-TYP-02"
    );
  });

  it("BR-TYP-05: 'as const', chuỗi literal, comment thường và z.unknown() không bị tính là vi phạm", () => {
    const sample = [
      "// Comment nhắc tới any và unknown không phải directive",
      'const label = "any unknown as unknown as string";',
      "const roles = ['admin', 'editor'] as const;",
      "const schema = z.unknown();",
    ].join("\n");

    const res = scanTypeSafetyInSource(sample, "packages/shared/src/clean.ts");
    expect(res.counts).toEqual({
      tsDirectives: 0,
      explicitAny: 0,
      asUnknownAs: 0,
      unknownDeclarations: 0,
    });
    expect(res.asConstCount).toBe(1);
    expect(res.issues).toEqual([]);
  });

  it("Ca âm BR-TYP-07: verifyTypeSafetyAgainstBaseline từ chối khi file mới thêm vi phạm hoặc file cũ tăng nợ", () => {
    const baseline: TypeSafetyBaseline = {
      totals: {
        tsDirectives: 0,
        explicitAny: 2,
        asUnknownAs: 1,
        unknownDeclarations: 3,
      },
      files: {
        "apps/web/tests/legacy.test.ts": {
          tsDirectives: 0,
          explicitAny: 2,
          asUnknownAs: 1,
          unknownDeclarations: 3,
        },
      },
    };

    const worsened = verifyTypeSafetyAgainstBaseline(baseline, {
      "apps/web/tests/legacy.test.ts": {
        tsDirectives: 0,
        explicitAny: 3,
        asUnknownAs: 1,
        unknownDeclarations: 3,
      },
      "apps/web/server/new-route.ts": {
        tsDirectives: 0,
        explicitAny: 0,
        asUnknownAs: 0,
        unknownDeclarations: 1,
      },
    });

    expect(worsened.ok).toBe(false);
    expect(worsened.regressions).toHaveLength(2);
    expect(worsened.regressions.join(" ")).toContain("BR-TYP-08");
    expect(worsened.regressions.join(" ")).toContain("BR-TYP-03");

    const improved = verifyTypeSafetyAgainstBaseline(baseline, {
      "apps/web/tests/legacy.test.ts": {
        tsDirectives: 0,
        explicitAny: 1,
        asUnknownAs: 0,
        unknownDeclarations: 2,
      },
    });
    expect(improved.ok).toBe(true);
    expect(improved.regressions).toEqual([]);
  });

  it("BR-TYP-01..08: toàn bộ packages/ và apps/ không vượt ngưỡng type-safety-baseline.json", () => {
    const baselinePath = path.join(
      repoPath(),
      "scripts/type-safety-baseline.json"
    );
    expect(fs.existsSync(baselinePath)).toBe(true);

    const baseline = JSON.parse(
      fs.readFileSync(baselinePath, "utf8")
    ) as TypeSafetyBaseline;
    const scanned = scanRepoTypeSafety();
    const verdict = verifyTypeSafetyAgainstBaseline(baseline, scanned.files);

    expect(verdict.regressions).toEqual([]);
    expect(verdict.ok).toBe(true);
  }, 15_000);
});
