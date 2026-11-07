import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { FIXTURES_BY_CODE } from "../fixtures-map.js";
import { UNWINNABLE_GT019 } from "./fixtures/unwinnable-web-level.js";
import {
  type SolverFixture,
  solveWithWebGestures,
} from "./web-gesture-solver.js";

interface Baseline {
  readonly unsolved: readonly string[];
}

const baseline: Baseline = JSON.parse(
  readFileSync(new URL("./web-gesture-baseline.json", import.meta.url), "utf8")
);

describe("Gate web-gesture-reachability — level thắng được bằng gesture web (Task #313)", () => {
  it("không fixture nào mới trở nên không thắng được; mục đã giải phải gỡ khỏi sổ nợ", async () => {
    const unsolved: string[] = [];
    for (const [code, fixtures] of Object.entries(FIXTURES_BY_CODE)) {
      for (const [index, fixture] of (
        fixtures as readonly SolverFixture[]
      ).entries()) {
        if ((await solveWithWebGestures(code, fixture, index)) !== "won") {
          unsolved.push(`${code}#${index}`);
        }
      }
    }
    const added = unsolved.filter((id) => !baseline.unsolved.includes(id));
    const fixed = baseline.unsolved.filter((id) => !unsolved.includes(id));
    expect({ added, fixed }).toEqual({ added: [], fixed: [] });
  }, 120_000);

  it("ca âm: level GT-019 đòi lật mà allow_flip tắt bị solver báo kẹt", async () => {
    expect(await solveWithWebGestures("GT-019", UNWINNABLE_GT019, 0)).toBe(
      "stuck"
    );
  });

  it("ca dương: level GT-019 có nút lật thắng được bằng gesture web", async () => {
    const flipLevel = (
      FIXTURES_BY_CODE["GT-019"] as readonly SolverFixture[]
    )[2];
    if (!flipLevel) {
      throw new Error("Thiếu fixture");
    }
    expect(await solveWithWebGestures("GT-019", flipLevel, 2)).toBe("won");
  });
});
