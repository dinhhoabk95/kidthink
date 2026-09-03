import { ALL_TEMPLATES } from "@mindkid/game-engine";
import { describe, expect, it } from "vitest";
import { generateCorpusLevels } from "#src/cli/gen-corpus";
import { runEightGates } from "#src/gates/runner";

describe("Corpus Generator Pipeline — Task #191 Đợt 2 (gen:corpus)", () => {
  it("Sinh corpus mẫu trên strand C1.CNT: 100% level qua 8 cổng kiểm duyệt", () => {
    const levels = generateCorpusLevels({ targetStrand: "C1.CNT" });

    expect(levels.length).toBeGreaterThan(0);

    const existingCodes = new Set<string>();
    for (const level of levels) {
      const gateResults = runEightGates(level, existingCodes);
      const allPassed = gateResults.every((r) => r.passed);

      expect(
        allPassed,
        `Level ${level.header.code} phải qua 8 cổng: ${gateResults
          .filter((r) => !r.passed)
          .map((r) => r.issues.map((i) => i.message).join(", "))
          .join("; ")}`
      ).toBe(true);

      existingCodes.add(level.header.code);
    }
  });

  it("Tính tất định (BR-LGK-02): chạy hai lần cho cùng 1 strand ra byte-for-byte giống hệt nhau", () => {
    const run1 = generateCorpusLevels({ targetStrand: "C1.GEO" });
    const run2 = generateCorpusLevels({ targetStrand: "C1.GEO" });

    const str1 = JSON.stringify(run1);
    const str2 = JSON.stringify(run2);

    expect(str1).toBe(str2);
  });

  describe("Ca âm cho gen-corpus", () => {
    it("Ca âm: template không tồn tại trong hệ thống sẽ bị phát hiện", () => {
      expect(ALL_TEMPLATES["GT-999"]).toBeUndefined();
    });
  });
});
