import { repoPath } from "@mindkid/config/paths";
import { describe, expect, it } from "vitest";
import {
  evaluateContentContractRoundTrip,
  loadRoundTripSeedFixtures,
} from "#src/gates/content-contract-roundtrip";
import { ALL_SEED_LEVELS } from "#src/index";
import { VALID_GAME_LEVEL_SEED } from "./fixtures/eight-gates-fixtures.js";

const INVALID_FIXTURE_REPO_PATH =
  "packages/content-build/tests/gates/fixtures/content-contract-roundtrip-invalid.json";

describe("Cổng round-trip content_pack × content_contract (BR-GTC-10, Task #305 S8)", () => {
  it("BR-GTC-10: 100% level đã seed trong ALL_SEED_LEVELS (kể cả rounds) parse và round-trip thành công qua content_contract", () => {
    expect(ALL_SEED_LEVELS.length).toBeGreaterThan(0);

    const report = evaluateContentContractRoundTrip(ALL_SEED_LEVELS);
    expect(report.passed).toBe(true);
    expect(report.failedLevels).toBe(0);
    expect(report.issues).toEqual([]);
    expect(report.passedLevels).toBe(ALL_SEED_LEVELS.length);
    expect(report.totalPacksChecked).toBeGreaterThanOrEqual(
      ALL_SEED_LEVELS.length
    );
  });

  it("BR-GTC-10 (ca âm): fixture level lệch content_contract nạp qua repoPath() bị chặn và báo đúng mã level", () => {
    const resolvedPath = repoPath(INVALID_FIXTURE_REPO_PATH);
    expect(resolvedPath.endsWith(INVALID_FIXTURE_REPO_PATH)).toBe(true);

    const brokenSeeds = loadRoundTripSeedFixtures(INVALID_FIXTURE_REPO_PATH);
    expect(brokenSeeds.length).toBe(2);

    const report = evaluateContentContractRoundTrip(brokenSeeds);
    expect(report.passed).toBe(false);
    expect(report.failedLevels).toBe(2);
    expect(
      report.issues.some((i) => i.levelCode === "GL-C1-CNT-FAIL-0001")
    ).toBe(true);
    expect(
      report.issues.some((i) => i.levelCode === "GL-C4-CLS-FAIL-0002")
    ).toBe(true);
  });

  it("BR-GTC-10 (ca âm): round phụ trong multi-round level lệch content_contract cũng làm cổng đỏ", () => {
    const multiRoundWithBrokenRound = {
      ...VALID_GAME_LEVEL_SEED,
      header: {
        ...VALID_GAME_LEVEL_SEED.header,
        code: "GL-C1-CNT-ROUND-FAIL-0003",
      },
      rounds: [
        {
          instruction: "Vòng 1 hợp lệ",
          content_pack: VALID_GAME_LEVEL_SEED.content_pack,
          difficulty_params: VALID_GAME_LEVEL_SEED.difficulty_params,
          difficulty: 1,
        },
        {
          instruction: "Vòng 2 hỏng content_pack",
          content_pack: { prompt: "", options: [] },
          difficulty_params: VALID_GAME_LEVEL_SEED.difficulty_params,
          difficulty: 2,
        },
      ],
    };

    const report = evaluateContentContractRoundTrip([
      multiRoundWithBrokenRound,
    ]);
    expect(report.passed).toBe(false);
    expect(report.failedLevels).toBe(1);
    expect(
      report.issues.some(
        (i) =>
          i.levelCode === "GL-C1-CNT-ROUND-FAIL-0003" &&
          i.target === "rounds[1].content_pack"
      )
    ).toBe(true);
  });
});
